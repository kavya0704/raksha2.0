"""
FastAPI Server & Command Center HQ Entrypoint for Raksha AI.
"""
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import HQDatabase
from backend.websocket_manager import ws_manager
from backend.mqtt_subscriber import HQMQTTSubscriber
from backend.routes.alerts import router as alerts_router
from backend.routes.cameras import router as cameras_router, set_edge_unit
from backend.routes.zones import router as zones_router
from backend.routes.analytics import router as analytics_router
from backend.routes.footage import router as footage_router
from backend.routes.ai_briefing import router as ai_router

from broker.embedded_broker import SimpleMQTTBroker
from edge.edge_service import EdgeUnit

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RakshaBackend")

db = HQDatabase()
broker = None
subscriber = None
edge_unit = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global broker, subscriber, edge_unit
    logger.info("=======================================================")
    logger.info("🚀 INITIALIZING RAKSHA AI TACTICAL COMMAND PLATFORM")
    logger.info("=======================================================")

    # 1. Start Embedded MQTT Broker (if local Mosquitto is not already running on port 1883)
    broker = SimpleMQTTBroker(port=1883)
    broker.start()

    # 2. Start HQ MQTT Subscriber
    loop = asyncio.get_running_loop()
    subscriber = HQMQTTSubscriber(db=db, broker_host="127.0.0.1", broker_port=1883, loop=loop)
    subscriber.start()

    # 3. Start Edge Sentinel Unit (CAM-01 / BOP Nathu La)
    demo_video = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo_assets", "border_patrol.mp4"))
    default_src = demo_video if os.path.exists(demo_video) else "0"
    edge_unit = EdgeUnit(bop_id="BOP-01-NATHULA", video_source=default_src, camera_id="CAM-01")
    try:
        edge_unit.start()
        set_edge_unit(edge_unit, "CAM-01")
    except Exception as e:
        logger.warning(f"Could not initialize Edge Unit immediately: {e}")

    yield

    logger.info("Shutting down Raksha AI services...")
    if edge_unit:
        edge_unit.stop()
    if subscriber:
        subscriber.stop()
    if broker:
        broker.stop()

app = FastAPI(
    title="Raksha AI - Border Intelligent Video Analytics Platform",
    description="Intelligent Software-Only Retrofit Video Analytics Platform for Border Surveillance",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST Routers
app.include_router(alerts_router)
app.include_router(cameras_router)
app.include_router(zones_router)
app.include_router(analytics_router)
app.include_router(footage_router)
app.include_router(ai_router)

# Mount Edge Snapshots Directory
edge_storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "edge_storage"))
os.makedirs(os.path.join(edge_storage_dir, "snapshots"), exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=os.path.join(edge_storage_dir, "snapshots")), name="snapshots")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/api/health")
def health_check():
    return {
        "status": "OPERATIONAL",
        "system": "Raksha AI Command Center HQ",
        "mqtt_broker": "ACTIVE",
        "groq_tactical_ai": "ENABLED",
        "edge_sentinels_connected": 1
    }

# Mount React Production Build if exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="static_assets")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api") or full_path.startswith("snapshots") or full_path.startswith("ws"):
            return None
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Raksha AI Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
