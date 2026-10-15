from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.universe import router as universe_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Alaya Memory Universe Backend",
    description="Dedicated 3D Celestial Coordinate & UMAP Projection API for Alaya Memory Universe",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration allowing Memory Universe frontend (5173) and Alaya frontend (3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include universe endpoints under /api
app.include_router(universe_router, prefix="/api")


@app.get("/health", tags=["system"])
async def health_check():
    """Health status endpoint."""
    return {
        "status": "healthy",
        "service": "memory-universe-backend",
        "version": "1.0.0",
    }
