from typing import Any, Dict, List, Optional
import numpy as np
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.connect import SessionLocal
from app.db.model.chat import Embedding, EmbeddingKind, Knowledge, KnowledgeCoordinate


def compute_fallback_coordinates(n: int) -> np.ndarray:
    """Deterministic geometric fallback coordinates for small datasets (N < 5)

    where UMAP's fuzzy simplicial neighborhood graph cannot be constructed reliably.
    """
    if n == 1:
        return np.array([[0.0, 0.0, 0.0]], dtype=np.float32)
    elif n == 2:
        return np.array([[-15.0, 0.0, 0.0], [15.0, 0.0, 0.0]], dtype=np.float32)
    elif n == 3:
        # Equilateral triangle in XY plane
        return np.array(
            [
                [0.0, 15.0, 0.0],
                [-13.0, -7.5, 0.0],
                [13.0, -7.5, 0.0],
            ],
            dtype=np.float32,
        )
    elif n == 4:
        # Regular tetrahedron in 3D
        return np.array(
            [
                [12.0, 12.0, 12.0],
                [12.0, -12.0, -12.0],
                [-12.0, 12.0, -12.0],
                [-12.0, -12.0, 12.0],
            ],
            dtype=np.float32,
        )
    return np.zeros((n, 3), dtype=np.float32)


def project_user_knowledge(
    user_id: int,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Retrieve 1,536-D embedding vectors for a single user, compute 3D UMAP

    coordinates and semantic clusters, and persist them in knowledge_coordinates.
    Never exposes raw embedding vectors.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Query user's knowledge chunks and their corresponding embedding vectors
        stmt = (
            select(Knowledge.id, Embedding.vector)
            .join(Embedding, Embedding.knowledge_id == Knowledge.id)
            .where(
                Knowledge.user_id == user_id,
                Embedding.kind == EmbeddingKind.KNOWLEDGE,
            )
            .order_by(Knowledge.id.asc())
        )
        rows = db.execute(stmt).all()

        if not rows:
            return {
                "status": "empty",
                "count": 0,
                "user_id": user_id,
                "message": "No knowledge embeddings found for user",
            }

        knowledge_ids = [row[0] for row in rows]
        n_samples = len(knowledge_ids)

        # Convert vectors to float32 numpy array
        vectors = np.array([row[1] for row in rows], dtype=np.float32)

        # Compute 3D coordinates
        if n_samples < 5:
            coords = compute_fallback_coordinates(n_samples)
            cluster_ids = list(range(n_samples))
            cluster_names = [f"Origin {i + 1}" for i in range(n_samples)]
        else:
            import umap
            from sklearn.cluster import KMeans

            # Dynamic n_neighbors selection to adhere to UMAP constraints
            n_neighbors = min(15, max(2, n_samples - 1))

            reducer = umap.UMAP(
                n_components=3,
                n_neighbors=n_neighbors,
                min_dist=0.15,
                metric="cosine",
                random_state=42,
                transform_seed=42,
            )
            raw_coords = reducer.fit_transform(vectors)

            # Center coordinates around origin
            centered = raw_coords - np.mean(raw_coords, axis=0)

            # Scale to celestial cosmos radius (~40 units spread)
            max_norm = float(np.max(np.linalg.norm(centered, axis=1)))
            scale = 40.0 / max(max_norm, 1e-4)
            coords = centered * scale

            # Partition into semantic clusters for spectral star coloring
            n_clusters = min(6, max(2, int(np.sqrt(n_samples))))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
            cluster_ids = kmeans.fit_predict(coords).tolist()
            cluster_names = [f"Sector {cid + 1}" for cid in cluster_ids]

        # Persist coordinates transactionally
        for k_id, coord, c_id, c_name in zip(
            knowledge_ids, coords, cluster_ids, cluster_names
        ):
            x, y, z = float(coord[0]), float(coord[1]), float(coord[2])
            existing_coord = (
                db.query(KnowledgeCoordinate)
                .filter(KnowledgeCoordinate.knowledge_id == k_id)
                .first()
            )

            if existing_coord:
                existing_coord.x = x
                existing_coord.y = y
                existing_coord.z = z
                existing_coord.cluster_id = int(c_id)
                existing_coord.cluster_name = str(c_name)
                existing_coord.updated_at = func.now()
            else:
                new_coord = KnowledgeCoordinate(
                    knowledge_id=k_id,
                    x=x,
                    y=y,
                    z=z,
                    cluster_id=int(c_id),
                    cluster_name=str(c_name),
                )
                db.add(new_coord)

        # Prune orphan coordinates for this user
        user_k_ids = set(knowledge_ids)
        user_coords = (
            db.query(KnowledgeCoordinate)
            .join(Knowledge, Knowledge.id == KnowledgeCoordinate.knowledge_id)
            .filter(Knowledge.user_id == user_id)
            .all()
        )
        for uc in user_coords:
            if uc.knowledge_id not in user_k_ids:
                db.delete(uc)

        db.commit()

        return {
            "status": "completed",
            "count": n_samples,
            "user_id": user_id,
            "message": f"Successfully calculated 3D coordinates for {n_samples} stars",
        }

    except Exception:
        db.rollback()
        raise
    finally:
        if close_db:
            db.close()
