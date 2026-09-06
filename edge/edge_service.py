"""
Edge Unit Main Process (BOP Local AI Sentinel).
Runs local video stream ingestion, all-weather atmospheric de-noising toggle,
YOLOv8 + ByteTrack object tracking, animal suppression, tripwire analysis,
encrypted local SQLite logging, and background MQTT sync.
"""
import cv2
import time
import threading
import numpy as np
import logging
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from edge.fog_enhancer import FogEnhancer
from edge.animal_filter import ClassificationFilter
from edge.zone_analytics import ZoneAnalytics
from edge.storage import EdgeStorage
from edge.mqtt_sync import EdgeMQTTSync
from edge.config import BOP_ID, MQTT_BROKER_HOST, MQTT_BROKER_PORT, DEFAULT_ZONES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EdgeService")

class EdgeUnit:
    def __init__(self, bop_id: str = BOP_ID, video_source: str = "0", camera_id: str = "CAM-01"):
        self.bop_id = bop_id
        self.camera_id = camera_id
        self.video_source = video_source
        self.enhance_fog = False  # Toggleable atmospheric de-noiser

        # AI & Processing components
        self.fog_enhancer = FogEnhancer()
        self.classifier = ClassificationFilter(confidence_threshold=0.35)
        self.zone_analytics = ZoneAnalytics(confirmation_frames=3)
        self.storage = EdgeStorage()
        self.mqtt_sync = EdgeMQTTSync(
            storage=self.storage,
            bop_id=self.bop_id,
            broker_host=MQTT_BROKER_HOST,
            broker_port=MQTT_BROKER_PORT
        )

        self.zones = DEFAULT_ZONES
        self.detector = None  # Lazy loaded on start to save memory
        self.latest_frame = None
        self.latest_annotated_frame = None
        self.running = False
        self.lock = threading.Lock()
        
        # Telemetry metrics
        self.fps = 0.0
        self.active_tracks_count = 0
        self.last_alert_time = None

    def start(self):
        from edge.detector import TargetDetector
        logger.info(f"Loading YOLOv8 nano detector on Edge Unit ({self.bop_id})...")
        self.detector = TargetDetector(model_name="yolov8n.pt", conf_thresh=0.30)
        
        self.running = True
        self.mqtt_sync.start()
        
        # Start capture thread
        self.capture_thread = threading.Thread(target=self._video_loop, daemon=True)
        self.capture_thread.start()
        logger.info(f"Edge Unit {self.bop_id} / {self.camera_id} started on source: {self.video_source}")

    def stop(self):
        self.running = False
        self.mqtt_sync.stop()

    def set_fog_enhancement(self, enabled: bool):
        self.enhance_fog = enabled
        logger.info(f"[{self.camera_id}] All-Weather Fog Enhancement set to: {enabled}")

    def set_video_source(self, new_source: str):
        logger.info(f"[{self.camera_id}] Switching video source to: {new_source}")
        self.video_source = new_source

    def _video_loop(self):
        current_src = None
        cap = None
        
        frame_count = 0
        start_time = time.time()

        while self.running:
            # Reopen capture if source changed
            if self.video_source != current_src:
                if cap is not None:
                    cap.release()
                current_src = self.video_source
                if str(current_src).isdigit():
                    src = int(current_src)
                    cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
                    if not cap.isOpened():
                        cap = cv2.VideoCapture(src)
                else:
                    src = current_src
                    cap = cv2.VideoCapture(src)
                logger.info(f"[{self.camera_id}] Opened video source: {src} (isOpened: {cap.isOpened()})")

            ret, frame = cap.read()
            if not ret:
                # Loop video file if ended
                if not str(current_src).isdigit():
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    time.sleep(0.03)
                    continue
                else:
                    time.sleep(0.1)
                    continue

            frame = cv2.resize(frame, (640, 360))
            raw_frame = frame.copy()

            # Optional Pre-Detection Stage: Fog Enhancement
            if self.enhance_fog:
                processed_input = self.fog_enhancer.enhance(frame)
            else:
                processed_input = frame

            # Run YOLOv8 + ByteTrack on processed input
            detections = self.detector.process_frame(processed_input)
            
            # Annotated canvas
            display_frame = processed_input.copy()
            
            # Draw Zones & Tripwires
            self._draw_zones(display_frame)

            active_tids = set()
            
            for det in detections:
                tid = det['track_id']
                cname = det['class_name']
                conf = det['confidence']
                x1, y1, x2, y2 = det['bbox']
                cx, cy = det['center']
                active_tids.add(tid)

                # Classification & Suppression check
                eval_res = self.classifier.evaluate(cname, conf)
                if eval_res['action'] == 'IGNORE':
                    continue

                color = eval_res.get('color', (255, 255, 255))
                label = eval_res.get('label', f"{cname}")

                # Draw bounding box & track ID
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.circle(display_frame, (cx, cy), 4, color, -1)
                
                # Bounding label background
                (lw, lh), _ = cv2.getTextSize(f"ID:{tid} {label}", cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(display_frame, (x1, y1 - lh - 6), (x1 + lw + 6, y1), color, -1)
                cv2.putText(display_frame, f"ID:{tid} {label}", (x1 + 3, y1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0) if eval_res['action'] == 'SUPPRESS' else (255, 255, 255), 1)

                # If tactical threat, check tripwire / zone incursion
                if eval_res['is_alert']:
                    triggered_events = self.zone_analytics.update(tid, (cx, cy), self.zones)
                    for event in triggered_events:
                        self._trigger_alert(event, det, eval_res, raw_frame)

            self.zone_analytics.cleanup(active_tids)
            self.active_tracks_count = len(active_tids)

            # Draw HUD Status Bar on top
            self._draw_hud(display_frame)

            with self.lock:
                self.latest_frame = raw_frame
                self.latest_annotated_frame = display_frame

            frame_count += 1
            elapsed = time.time() - start_time
            if elapsed >= 1.0:
                self.fps = frame_count / elapsed
                frame_count = 0
                start_time = time.time()

            time.sleep(0.015) # Target ~30 FPS

        cap.release()

    def _draw_zones(self, frame):
        for z in self.zones:
            ztype = z.get('type', 'polygon')
            coords = z.get('coordinates', [])
            name = z.get('name', 'Zone')
            if ztype == 'polygon' and len(coords) >= 3:
                pts = np.array(coords, np.int32).reshape((-1, 1, 2))
                cv2.polylines(frame, [pts], isClosed=True, color=(0, 215, 255), thickness=1)
                # Fill with transparent overlay
                overlay = frame.copy()
                cv2.fillPoly(overlay, [pts], (0, 165, 255))
                cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)
                cv2.putText(frame, name, (coords[0][0] + 5, coords[0][1] + 15),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 215, 255), 1)
            elif ztype == 'tripwire' and len(coords) >= 2:
                p1, p2 = tuple(coords[0]), tuple(coords[1])
                cv2.line(frame, p1, p2, (0, 0, 255), 2)
                cv2.putText(frame, f"TRIPWIRE: {name}", (p1[0] + 5, p1[1] - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

    def _draw_hud(self, frame):
        # Top banner
        h, w = frame.shape[:2]
        cv2.rectangle(frame, (0, 0), (w, 24), (15, 23, 42), -1)
        
        # Fog status
        fog_txt = "ALL-WEATHER ENHANCE: ON" if self.enhance_fog else "ALL-WEATHER ENHANCE: OFF"
        fog_color = (0, 255, 200) if self.enhance_fog else (150, 150, 150)
        cv2.putText(frame, fog_txt, (10, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.4, fog_color, 1)

        # Unsynced queue counter (demonstrates offline storage)
        unsynced_count = self.storage.get_unsynced_count()
        q_color = (0, 255, 0) if unsynced_count == 0 else (0, 165, 255)
        cv2.putText(frame, f"QUEUED (UNSYNCED): {unsynced_count}", (260, 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, q_color, 1)

        # FPS & Cam info
        cv2.putText(frame, f"{self.camera_id} | {self.fps:.1f} FPS", (w - 150, 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

    def _trigger_alert(self, event_meta: dict, detection: dict, eval_meta: dict, full_frame: np.ndarray):
        alert_id = f"ALT-{self.bop_id[-4:]}-{int(time.time()*1000)%100000:05d}"
        now = time.time()
        
        cx, cy = detection['center']
        x1, y1, x2, y2 = detection['bbox']

        alert_payload = {
            "id": alert_id,
            "camera_id": self.camera_id,
            "bop_id": self.bop_id,
            "object_type": str(detection['class_name']),
            "confidence": float(round(detection['confidence'], 2)),
            "incursion_type": str(event_meta['incursion_type']),
            "zone_name": str(event_meta['zone_name']),
            "severity": str(event_meta['severity']),
            "timestamp": float(now),
            "track_id": int(detection['track_id']),
            "center": [int(cx), int(cy)],
            "bbox": [int(x1), int(y1), int(x2), int(y2)]
        }

        # Save to encrypted SQLite database first (Zero alert loss)
        self.storage.record_alert(alert_payload, snapshot_img=full_frame)
        self.last_alert_time = now
        logger.info(f"🚨 [EDGE ALERT LOGGED] {alert_id} - {detection['class_name'].upper()} breached {event_meta['zone_name']}")

    def get_jpeg_frame(self, annotated: bool = True) -> bytes:
        with self.lock:
            frame = self.latest_annotated_frame if annotated else self.latest_frame
            if frame is None:
                # Return placeholder black frame
                frame = np.zeros((360, 640, 3), dtype=np.uint8)
                cv2.putText(frame, "INITIALIZING CAMERA FEED...", (160, 180),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 200), 2)
            
            _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            return buffer.tobytes()
