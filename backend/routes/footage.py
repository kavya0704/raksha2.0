"""
On-Demand Full Footage Retrieval API.
Allows Command HQ to request high-resolution raw footage segments from the local Edge Unit.
Demonstrates the tactical architecture where high-res video is preserved at the outpost and
only lightweight metadata + short clips are synchronized over constrained tactical links.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/footage", tags=["Footage Retrieval"])

class FootageRequest(BaseModel):
    alert_id: str
    camera_id: str
    bop_id: str
    start_time_iso: str
    duration_seconds: int = 120
    requested_by: str

@router.post("/request")
def request_full_footage(req: FootageRequest):
    # Simulates dispatching an on-demand retrieval job to the Edge Unit
    job_id = f"JOB-RET-{int(time.time()*1000)%10000:04d}"
    return {
        "status": "QUEUED",
        "job_id": job_id,
        "message": f"Full resolution archive request dispatched to {req.bop_id} for {req.camera_id}.",
        "bandwidth_mode": "THROTTLED_BANDWIDTH_SAFE",
        "estimated_arrival": "45 seconds",
        "metadata": req.dict()
    }
