import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure root backend dir is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.database.db import init_db
from app.api.endpoints import router as api_router
from ml.predict import get_predictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables and preload ML artifacts
    init_db()
    try:
        predictor = get_predictor()
        if predictor.is_ready():
            print("Dhanrakshak AI Engine loaded successfully.")
    except Exception as e:
        print(f"Warning: Model not ready at startup: {e}")
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Protection. Instant Decisions. Production-grade financial fraud detection engine API.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration for secure local and local network (Wi-Fi) development
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS.split(","):
        cleaned_origin = origin.strip().rstrip("/")
        if cleaned_origin and cleaned_origin not in cors_origins:
            cors_origins.append(cleaned_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "Intelligent Protection. Instant Decisions.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Safe error response avoiding raw stack trace leakage
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing the fraud detection request."}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

