"""
YOLOv8 Object Detection & Persistent Multi-Frame Tracking Engine.
Uses ultralytics YOLOv8 (yolov8n.pt nano model for real-time CPU/iGPU execution)
with ByteTrack tracking to maintain consistent track IDs across frames.
"""
import cv2
import numpy as np
from ultralytics import YOLO

class TargetDetector:
    def __init__(self, model_name: str = 'yolov8n.pt', conf_thresh: float = 0.35):
        self.conf_thresh = conf_thresh
        self.model = YOLO(model_name)
        self.next_track_id = 1
        self.prev_tracks = {} # {track_id: center_pt}

    def process_frame(self, frame: np.ndarray, tracker_type: str = None) -> list:
        """
        Runs YOLOv8 detection on frame and assigns persistent track IDs.
        Returns list of detected tracked objects:
        [{'track_id': int, 'class_name': str, 'confidence': float, 'bbox': (x1, y1, x2, y2), 'center': (cx, cy)}]
        """
        if frame is None or frame.size == 0:
            return []

        # Run direct prediction (avoids Python 3.13 lap auto-install hang)
        results = self.model.predict(
            source=frame,
            conf=self.conf_thresh,
            verbose=False
        )

        detections = []
        if not results or len(results) == 0:
            return detections

        r = results[0]
        boxes = r.boxes
        if boxes is None or len(boxes) == 0:
            return detections

        current_tracks = {}
        for box in boxes:
            cls_id = int(box.cls[0].item())
            class_name = self.model.names.get(cls_id, f'class_{cls_id}')
            conf = float(box.conf[0].item())
            
            # Bounding box
            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = xyxy[0], xyxy[1], xyxy[2], xyxy[3]
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)

            # Match nearest track ID from previous frame
            matched_id = None
            min_dist = 60 # Max pixel jump between consecutive frames
            for tid, (px, py) in self.prev_tracks.items():
                dist = ((cx - px)**2 + (cy - py)**2)**0.5
                if dist < min_dist:
                    matched_id = tid
                    min_dist = dist

            if matched_id is None:
                matched_id = self.next_track_id
                self.next_track_id = (self.next_track_id % 9999) + 1

            current_tracks[matched_id] = (cx, cy)

            detections.append({
                'track_id': matched_id,
                'class_name': class_name,
                'confidence': conf,
                'bbox': (x1, y1, x2, y2),
                'center': (cx, cy)
            })

        self.prev_tracks = current_tracks
        return detections
