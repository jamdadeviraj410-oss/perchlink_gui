"""
PerchLink Emergency SOS Relay - Central FastAPI Application
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.database.database import init_db
from app.routes import sos, status, health
from app.websocket.manager import ws_manager
from app.services.lora_service import lora_service
from app.services.transmission_queue import transmission_queue

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("perchlink.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing SQLite database...")
    init_db()

    logger.info("Starting LoRa service...")
    lora_service.start()

    logger.info("Starting emergency transmission queue...")
    transmission_queue.start()

    logger.info("Scanning for pending SOS records to recover...")
    transmission_queue.recover_pending_records()

    logger.info(f"PerchLink Backend v{settings.APP_VERSION} initialized successfully.")
    yield

    # Shutdown sequence
    transmission_queue.running = False
    logger.info("PerchLink backend shut down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
)

# CORS Middleware (Allows Vite dev server on port 5173 during development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API Routers under /api
app.include_router(sos.router, prefix=settings.API_PREFIX)
app.include_router(status.router, prefix=settings.API_PREFIX)
app.include_router(health.router, prefix=settings.API_PREFIX)

# WebSocket Endpoint: /ws/sos/{sos_id}
@app.websocket("/ws/sos/{sos_id}")
async def websocket_sos_endpoint(websocket: WebSocket, sos_id: str):
    await ws_manager.connect(sos_id, websocket)
    try:
        while True:
            # Keep connection alive; receive survivor client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(sos_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error on SOS {sos_id}: {e}")
        ws_manager.disconnect(sos_id, websocket)

# Check if React production build exists in ../frontend/dist
FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.exists(FRONTEND_DIST_DIR):
    logger.info(f"Serving compiled React frontend from {FRONTEND_DIST_DIR}")
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API or WS routes
        if full_path.startswith("api") or full_path.startswith("ws"):
            return None
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        return FileResponse(index_file)
else:
    logger.info(f"Frontend dist not found at {FRONTEND_DIST_DIR}. Running API server only.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
