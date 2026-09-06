"""
Camera Management & Live Multi-Sector MJPEG Video Feeds.
Supports multi-BOP camera status, health metrics, and on-the-fly Fog Enhancement toggle.
Channels:
- CAM-01: Live Infiltration / Webcam Option (Sikkim North Perimeter)
- CAM-02: Thar Desert Sector (Jaisalmer) - Grazing Livestock & Camel Suppression
- CAM-03: Eastern Ladakh Pass (Chushul) - Atmospheric Fog Defile & CLAHE Clearing
- CAM-04: Doklam Buffer Zone - Sterile Perimeter Corridor
"""
import os
import time
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])

# Master Camera Registry across Border Outposts
CAMERA_REGISTRY = [
    {
        "id": "CAM-01",
        "name": "BOP Nathu La — Perimeter North Fence",
        "bop_id": "BOP-01-NATHULA",
        "sector": "Sikkim Border Sector",
        "location": {"lat": 27.3866, "lng": 88.8310},
        "status": "ONLINE",
        "resolution": "1080p Full HD",
        "fps": 28.5,
        "fog_enhancer_active": False,
        "stream_type": "PRIMARY_PATROL",
        "scenario": "Sikkim Mountain Infiltration / Live Sentinel"
    },
    {
        "id": "CAM-02",
        "name": "BOP Longewala — Thar Desert Dune Sector",
        "bop_id": "BOP-04-LONGEWALA",
        "sector": "Thar Desert Sector (Rajasthan)",
        "location": {"lat": 27.5244, "lng": 70.1558},
        "status": "ONLINE",
        "resolution": "1080p Full HD",
        "fps": 29.0,
        "fog_enhancer_active": False,
        "stream_type": "DESERT_WILDLIFE",
        "scenario": "Livestock & Camel Grazing (Suppressed Alarms)"
    },
    {
        "id": "CAM-03",
        "name": "BOP Chushul — Mountain Ridge (Heavy Fog)",
        "bop_id": "BOP-03-CHUSHUL",
        "sector": "Eastern Ladakh Sector",
        "location": {"lat": 33.5850, "lng": 78.6500},
        "status": "ONLINE",
        "resolution": "1080p Full HD",
        "fps": 28.0,
        "fog_enhancer_active": True,
        "stream_type": "ALL_WEATHER_DEFILE",
        "scenario": "Low Visibility Defile (CLAHE Atmospheric Filter)"
    },
    {
        "id": "CAM-04",
        "name": "BOP Doklam Track — Sterile Buffer Zone",
        "bop_id": "BOP-02-DOKLAM",
        "sector": "Tri-Junction Sector",
        "location": {"lat": 27.3100, "lng": 88.9200},
        "status": "ONLINE",
        "resolution": "1080p Full HD",
        "fps": 30.0,
        "fog_enhancer_active": False,
        "stream_type": "STERILE_ZONE",
        "scenario": "Dense Forest Restricted Corridor"
    }
]

# Global reference to running EdgeUnits
edge_unit_instances = {}

def set_edge_unit(edge_unit, cam_id="CAM-01"):
    global edge_unit_instances
    edge_unit_instances[cam_id] = edge_unit

class FogToggleRequest(BaseModel):
    enabled: bool

class SourceChangeRequest(BaseModel):
    source: str # "0" for webcam, or "demo" / file path

@router.post("/{camera_id}/source")
def switch_camera_source(camera_id: str, req: SourceChangeRequest):
    unit = edge_unit_instances.get(camera_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Camera Edge unit not active")

    target_src = req.source
    if req.source in ["demo", "close", "stop", "off", "reset"]:
        target_src = VIDEO_MAP.get(camera_id, VIDEO_MAP["CAM-01"])
    elif req.source == "webcam":
        target_src = "0"

    unit.set_video_source(target_src)
    return {
        "status": "SUCCESS",
        "camera_id": camera_id,
        "active_source": target_src,
        "is_webcam": target_src == "0"
    }

@router.get("")
def get_cameras():
    for cam in CAMERA_REGISTRY:
        unit = edge_unit_instances.get(cam["id"])
        if unit:
            cam["fog_enhancer_active"] = unit.enhance_fog
            cam["fps"] = round(unit.fps, 1) or 28.5
    return CAMERA_REGISTRY

@router.post("/{camera_id}/fog-enhancer")
def toggle_fog_enhancer(camera_id: str, req: FogToggleRequest):
    found = False
    for cam in CAMERA_REGISTRY:
        if cam["id"] == camera_id:
            cam["fog_enhancer_active"] = req.enabled
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Camera not found")

    unit = edge_unit_instances.get(camera_id)
    if unit:
        unit.set_fog_enhancement(req.enabled)

    return {"status": "SUCCESS", "camera_id": camera_id, "fog_enhancer_active": req.enabled}

# Video asset path helpers for background streaming
ASSETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "demo_assets"))
VIDEO_MAP = {
    "CAM-01": os.path.join(ASSETS_DIR, "border_patrol.mp4"),
    "CAM-02": os.path.join(ASSETS_DIR, "border_desert_wildlife.mp4"),
    "CAM-03": os.path.join(ASSETS_DIR, "border_fog.mp4"),
    "CAM-04": os.path.join(ASSETS_DIR, "border_doklam_sterile.mp4"),
}

def mjpeg_generator(camera_id: str):
    unit = edge_unit_instances.get(camera_id)
    if unit:
        while True:
            frame_bytes = unit.get_jpeg_frame(annotated=True)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.033)
    else:
        # Stream from corresponding scenario file with on-screen tactical overlay
        vid_path = VIDEO_MAP.get(camera_id, VIDEO_MAP["CAM-01"])
        cap = cv2.VideoCapture(vid_path)
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            frame = cv2.resize(frame, (640, 360))
            h, w = frame.shape[:2]

            # Scenario Annotations
            if camera_id == "CAM-02":
                # Emerald Green Bounding Box on Livestock
                cv2.rectangle(frame, (230, 180), (390, 310), (0, 255, 0), 2)
                cv2.rectangle(frame, (230, 155), (480, 180), (0, 100, 0), -1)
                cv2.putText(frame, "ID:4120 Safe — Animal (Livestock), Suppressed", (235, 172),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                cv2.putText(frame, "NO ALARM TRIGGERED", (235, 300),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 0), 1)

            elif camera_id == "CAM-03":
                # Low-visibility defile corridor
                cv2.line(frame, (0, 220), (640, 220), (0, 140, 255), 2)
                cv2.putText(frame, "TRIPWIRE: Chushul Pass Corridors", (20, 210),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 140, 255), 1)

            elif camera_id == "CAM-04":
                # Sterile zone polygon
                pts = np.array([[40, 140], [580, 140], [620, 340], [30, 340]], np.int32).reshape((-1, 1, 2))
                cv2.polylines(frame, [pts], isClosed=True, color=(0, 215, 255), thickness=1)
                cv2.putText(frame, "Doklam Buffer Zone (Restricted)", (50, 160),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 215, 255), 1)

            # Top HUD Bar
            cv2.rectangle(frame, (0, 0), (w, 24), (15, 23, 42), -1)
            cv2.putText(frame, f"{camera_id} | REAL-TIME TACTICAL FEED", (10, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 215, 255), 1)
            cv2.putText(frame, "LIVE EDGE SENTINEL", (w - 170, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 128), 1)

            _, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            frame_bytes = buf.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.04) # ~25 FPS

@router.get("/{camera_id}/stream")
def get_camera_stream(camera_id: str):
    return StreamingResponse(
        mjpeg_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

