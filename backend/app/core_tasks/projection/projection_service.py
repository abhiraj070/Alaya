from typing import Any, Dict
import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.model.chat import Embedding, EmbeddingKind, Knowledge
from app.db.model.universe import KnowledgeCoordinate


def compute_fallback_coordinates(n: int) -> np.ndarray:
    """Deterministic geometric fallback coordinates for small datasets (N < 5)
    where UMAP's fuzzy simplicial neighborhood graph cannot be constructed reliably.
    """
    if n == 1:
        return np.array([[0.0, 0.0, 0.0]], dtype=np.float32)
    elif n == 2:
        return np.array([[-15.0, 0.0, 0.0], [15.0, 0.0, 0.0]], dtype=np.float32)
    elif n == 3:
        return np.array(
            [
                [0.0, 15.0, 0.0],
                [-13.0, -7.5, 0.0],
                [13.0, -7.5, 0.0],
            ],
            dtype=np.float32,
        )
    elif n == 4:
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
    db: Session,
) -> Dict[str, Any]:
    """Retrieve 1,536-D embedding vectors for a single user, compute 3D UMAP
    coordinates and semantic clusters, and persist them in knowledge_coordinates.
    Never exposes raw embedding vectors.
    """
    try:
        stmt = (
            select(Knowledge.id, Embedding.vector)
            .join(Embedding, Embedding.knowledge_id == Knowledge.id)
            .where(
                Knowledge.user_id == user_id,
                Embedding.kind == EmbeddingKind.KNOWLEDGE,
            )
            # One coordinate per knowledge chunk, even when it has multiple embeddings.
            .distinct(Knowledge.id)
            .order_by(Knowledge.id.asc(), Embedding.seq.asc(), Embedding.id.asc())
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

        vectors = np.array([row[1] for row in rows], dtype=np.float32)

        if n_samples < 5:
            coords = compute_fallback_coordinates(n_samples)
            cluster_ids = list(range(n_samples))
            cluster_names = [f"Sector {i}" for i in cluster_ids]
        else:
            import umap
            from sklearn.cluster import KMeans

            n_neighbors = min(15, max(2, n_samples - 1))

            reducer = umap.UMAP(
                n_components=3,
                n_neighbors=n_neighbors,
                min_dist=0.15,
                metric="cosine",
                random_state=42,
            )
            raw_coords = reducer.fit_transform(vectors)

            centered = raw_coords - np.mean(raw_coords, axis=0)

            max_dist = np.max(np.linalg.norm(centered, axis=1))
            if max_dist > 1e-6:
                coords = (centered / max_dist) * 24.0
            else:
                coords = centered

            n_clusters = min(5, max(2, int(np.sqrt(n_samples))))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_ids = kmeans.fit_predict(vectors).tolist()
            cluster_names = [f"Sector {c}" for c in cluster_ids]

        existing_coords_stmt = select(KnowledgeCoordinate).where(
            KnowledgeCoordinate.knowledge_id.in_(knowledge_ids)
        )
        existing_map = {
            c.knowledge_id: c
            for c in db.execute(existing_coords_stmt).scalars().all()
        }

        for i, k_id in enumerate(knowledge_ids):
            x = float(coords[i][0])
            y = float(coords[i][1])
            z = float(coords[i][2])
            c_id = int(cluster_ids[i])
            c_name = str(cluster_names[i])

            if k_id in existing_map:
                coord_record = existing_map[k_id]
                coord_record.x = x
                coord_record.y = y
                coord_record.z = z
                coord_record.cluster_id = c_id
                coord_record.cluster_name = c_name
            else:
                coord_record = KnowledgeCoordinate(
                    knowledge_id=k_id,
                    x=x,
                    y=y,
                    z=z,
                    cluster_id=c_id,
                    cluster_name=c_name,
                )
                db.add(coord_record)

        db.commit()

        return {
            "status": "success",
            "count": n_samples,
            "user_id": user_id,
            "message": f"Successfully projected {n_samples} knowledge nodes to 3D celestial coordinates.",
        }

    except Exception as exc:
        db.rollback()
        raise RuntimeError(f"Error computing UMAP projection for user {user_id}: {exc}") from exc
