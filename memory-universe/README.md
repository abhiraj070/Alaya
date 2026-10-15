# Alaya Memory Universe

An interactive 3D celestial visualization of user knowledge stored in Alaya. Each star represents an individual knowledge chunk positioned in 3D Euclidean space using UMAP dimensionality reduction over 1,536-dimensional vector embeddings.

## Project Structure

```
memory-universe/
├── frontend/   # 3D Celestial Engine (React 19 + Vite + Three.js / React Three Fiber)
└── backend/    # Dedicated Coordinate & Projection Service (FastAPI + UMAP + SQLAlchemy)
```

## Quick Start

### 1. Run the Backend
```bash
cd memory-universe/backend
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

### 2. Run the Frontend
```bash
cd memory-universe/frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** to explore your Memory Universe!
