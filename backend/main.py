"""
Axon by NeuroVexon - FastAPI Main Entry Point

Agentic AI - ohne Kontrollverlust.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from core.config import settings
from db.database import init_db
from api import chat, audit, settings as settings_api, tools, memory, skills, agents, scheduler, workflows, mcp, analytics, upload

# Logging setup
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    await init_db()
    logger.info("Database initialized")

    # Create default agents
    from db.database import async_session
    from agent.agent_manager import AgentManager
    async with async_session() as db:
        agent_mgr = AgentManager(db)
        await agent_mgr.ensure_defaults()

    # Start task scheduler
    from agent.scheduler import task_scheduler
    task_scheduler.start()
    await task_scheduler.sync_tasks()
    logger.info("TaskScheduler gestartet")

    # Create outputs directory
    os.makedirs(settings.outputs_dir, exist_ok=True)

    yield

    # Shutdown
    from agent.scheduler import task_scheduler as ts
    ts.stop()
    logger.info("Shutting down Axon")


app = FastAPI(
    title=settings.app_name,
    description="Agentic AI - ohne Kontrollverlust. Open Source KI-Assistent mit kontrollierten Agent-Fähigkeiten.",
    version=settings.app_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chat.router, prefix="/api/v1")
app.include_router(tools.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(settings_api.router, prefix="/api/v1")
app.include_router(memory.router, prefix="/api/v1")
app.include_router(skills.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(scheduler.router, prefix="/api/v1")
app.include_router(workflows.router, prefix="/api/v1")
app.include_router(mcp.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "tagline": "Agentic AI - ohne Kontrollverlust.",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.app_version}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
