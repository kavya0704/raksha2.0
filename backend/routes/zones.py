"""
Perimeter Zone and Virtual Tripwire Configuration Endpoints.
Allows operators to configure and fine-tune tripwires, sterile zones, and trigger classes per camera.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Optional
from edge.config import DEFAULT_ZONES

router = APIRouter(prefix="/api/zones", tags=["Zones"])

# In-memory zone configuration store
ZONE_CONFIGS = {
    "CAM-01": list(DEFAULT_ZONES),
    "CAM-02": [
        {
            "id": "zone-ridge-sterile",
            "name": "Ridge Pass Infiltration Funnel",
            "type": "polygon",
            "severity": "CRITICAL",
            "coordinates": [(80, 160), (560, 160), (600, 330), (50, 330)]
        }
    ]
}

class ZoneItem(BaseModel):
    id: str
    name: str
    type: str # "polygon" or "tripwire"
    severity: str # "CRITICAL", "HIGH", "MEDIUM"
    coordinates: List[Tuple[int, int]]
    direction: Optional[str] = "inbound"

@router.get("/{camera_id}")
def get_camera_zones(camera_id: str):
    return ZONE_CONFIGS.get(camera_id, [])

@router.post("/{camera_id}")
def save_camera_zones(camera_id: str, zones: List[ZoneItem]):
    ZONE_CONFIGS[camera_id] = [z.dict() for z in zones]
    return {"status": "SUCCESS", "camera_id": camera_id, "zone_count": len(zones)}
