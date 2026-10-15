# Alaya Memory Universe — Backend Service

A dedicated, standalone FastAPI backend service providing 3D celestial coordinate computation, UMAP manifold projection, and universe inspection APIs for Alaya's Memory Universe.

## Architecture

- **FastAPI**: Lightweight, asynchronous web framework exposing `/api/universe` endpoints.
- **UMAP (Uniform Manifold Approximation & Projection)**: High-dimensional dimensionality reduction projecting 1,536-D vector embeddings into 3D Cartesian coordinates.
- **KMeans**: Semantic sector and cluster identification.
- **SQLAlchemy 2.0 & PostgreSQL (pgvector)**: Direct, ACID-compliant persistence into `knowledge_coordinates` and source lineage tracking.
- **JWT Cookie Authentication**: Seamless single-sign-on using the existing Alaya authentication cookies.

## API Endpoints

- `GET /health` — Service health check
- `GET /api/universe/nodes` — Returns all 3D stars with coordinates, source metadata, and cluster sectors
- `GET /api/universe/chunks/{id}` — Returns complete verified chunk text, page number, and source lineage
- `POST /api/universe/recompute` — Triggers synchronous/asynchronous UMAP coordinate recalculation

## Setup & Running

```bash
# 1. Navigate to backend directory
cd memory-universe/backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Start the server (Port 8001 by default to avoid collision with Alaya on 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Running Tests

```bash
python -m unittest discover -s tests -p "test_*.py"
```
