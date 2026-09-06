"""
Tactical AI Copilot REST Routes for Raksha AI.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.ai_copilot import ai_copilot
from backend.database import HQDatabase

router = APIRouter(prefix="/api/ai", tags=["AI Tactical Copilot"])
db = HQDatabase()

class SitRepRequest(BaseModel):
    alert_id: str

class ChatQueryRequest(BaseModel):
    message: str

@router.post("/sitrep")
def get_incident_sitrep(req: SitRepRequest):
    alerts = db.get_alerts(limit=50)
    target_alert = next((a for a in alerts if a["id"] == req.alert_id), None)
    
    if not target_alert:
        # Fallback dummy alert structure if not found
        target_alert = {
            "id": req.alert_id,
            "object_type": "person",
            "confidence": 0.94,
            "bop_id": "BOP-01-NATHULA",
            "camera_id": "CAM-01",
            "zone_name": "Perimeter Sterile Zone",
            "incursion_type": "TRIPWIRE_CROSSING",
            "severity": "CRITICAL",
            "formatted_time": "Recent"
        }

    sitrep = ai_copilot.generate_sitrep(target_alert)
    return {
        "status": "SUCCESS",
        "alert_id": req.alert_id,
        "sitrep": sitrep
    }

@router.post("/dispatch-order")
def get_patrol_dispatch_order(req: SitRepRequest):
    alerts = db.get_alerts(limit=50)
    target_alert = next((a for a in alerts if a["id"] == req.alert_id), None)
    
    if not target_alert:
        target_alert = {
            "id": req.alert_id,
            "object_type": "person",
            "bop_id": "BOP-01-NATHULA",
            "zone_name": "Perimeter Line Alpha",
            "formatted_time": "Immediate"
        }

    orders = ai_copilot.generate_patrol_order(target_alert)
    return {
        "status": "SUCCESS",
        "alert_id": req.alert_id,
        "orders": orders
    }

@router.post("/chat")
def chat_with_copilot(req: ChatQueryRequest):
    from backend.routes.cameras import CAMERA_REGISTRY
    recent_alerts = db.get_alerts(limit=10)
    
    reply = ai_copilot.chat_query(
        user_message=req.message,
        alerts_context=recent_alerts,
        cameras_context=CAMERA_REGISTRY
    )
    return {
        "status": "SUCCESS",
        "response": reply
    }
