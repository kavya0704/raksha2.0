"""
Alert Management REST Endpoints.
Supports listing, filtering, acknowledging, escalating, marking false-positive, and operator audit trail.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from backend.database import HQDatabase
from backend.websocket_manager import ws_manager

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])
db = HQDatabase()

class AlertActionRequest(BaseModel):
    operator_id: str
    action: str # "ACKNOWLEDGE", "ESCALATE", "MARK_FALSE_POSITIVE", "RESOLVE", "DISMISS"
    notes: Optional[str] = ""

@router.get("")
def get_alerts(limit: int = 50, status: Optional[str] = None):
    return db.get_alerts(limit=limit, status=status)

@router.post("/{alert_id}/action")
async def take_alert_action(alert_id: str, req: AlertActionRequest):
    valid_actions = {
        "ACKNOWLEDGE": "ACKNOWLEDGED",
        "ESCALATE": "ESCALATED",
        "MARK_FALSE_POSITIVE": "FALSE_POSITIVE",
        "RESOLVE": "RESOLVED",
        "DISMISS": "DISMISSED"
    }
    
    if req.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action: {req.action}")

    target_status = valid_actions[req.action]
    success = db.update_alert_status(alert_id, target_status, req.operator_id, notes=req.notes)
    
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Broadcast updated alert status to WebSockets
    await ws_manager.broadcast({
        "type": "ALERT_STATUS_UPDATED",
        "data": {
            "id": alert_id,
            "status": target_status,
            "operator_id": req.operator_id,
            "notes": req.notes
        }
    })

    return {"status": "SUCCESS", "alert_id": alert_id, "new_status": target_status}

@router.get("/audit-trail")
def get_audit_trail(limit: int = 100):
    return db.get_audit_trail(limit=limit)
