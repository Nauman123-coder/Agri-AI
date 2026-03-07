"""
KhetAI Backend - Farm-to-Fork Autonomous Negotiator
FastAPI application for Pakistani farmers
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from routers import diagnose, negotiate, economics, logistics, insurance, market, chat
from core.database import engine, Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🌾 KhetAI Server Starting...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created")
    yield
    # Shutdown
    logger.info("KhetAI Server Shutting Down")


app = FastAPI(
    title="KhetAI API",
    description="Farm-to-Fork Autonomous Negotiator for Pakistani Farmers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(diagnose.router, prefix="/api/diagnose", tags=["Diagnosis"])
app.include_router(negotiate.router, prefix="/api/negotiate", tags=["Negotiation"])
app.include_router(economics.router, prefix="/api/economics", tags=["Economics"])
app.include_router(logistics.router, prefix="/api/logistics", tags=["Logistics"])
app.include_router(insurance.router, prefix="/api/insurance", tags=["Insurance"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])


@app.get("/")
async def root():
    return {
        "app": "KhetAI",
        "tagline": "کھیت سے دستر خوان تک",
        "status": "operational",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "khetai-backend"}