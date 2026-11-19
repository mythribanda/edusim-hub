import logging
from typing import List, Dict, Any, Optional
import faiss
import numpy as np

logger = logging.getLogger("legacy_rag.retriever")


def get_retriever(index, metadata, embeddings_model, k: int = 5, min_score: float = 0.28):
    """
    Creates a retrieval closure that queries the FAISS index using cosine similarity.
    Because the FAISS index is IndexFlatIP and both indexed vectors and query vectors
    are L2-normalized, the inner product strictly equals cosine similarity in [-1.0, 1.0].
    """
    def retrieve(query: str, top_k: Optional[int] = None, threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        effective_k = top_k or k
        effective_threshold = threshold if threshold is not None else min_score

        try:
            if not query or not query.strip():
                return []

            # Generate query embedding
            query_embedding = embeddings_model.encode(
                query,
                convert_to_numpy=True,
                normalize_embeddings=True,
            )

            query_embedding = query_embedding.astype(np.float32).reshape(1, -1)
            faiss.normalize_L2(query_embedding)

            # Search FAISS index (Inner Product on L2-normalized vectors == Cosine Similarity)
            distances, indices = index.search(query_embedding, effective_k)

            results: List[Dict[str, Any]] = []
            seen_texts = set()

            for i, idx in enumerate(indices[0]):
                if 0 <= idx < len(metadata):
                    score = float(distances[0][i])

                    # Filter weak matches based on cosine similarity threshold
                    if score < effective_threshold:
                        continue

                    chunk_meta = metadata[idx].copy()
                    raw_text = chunk_meta.get("text", "").strip()

                    # Deduplicate identical or near-identical text chunks
                    text_fingerprint = raw_text[:120].lower()
                    if text_fingerprint in seen_texts:
                        continue
                    seen_texts.add(text_fingerprint)

                    chunk_meta["score"] = round(score, 4)
                    results.append(chunk_meta)

            return results

        except Exception as e:
            logger.error(f"Error retrieving documents for query '{query[:60]}': {e}")
            return []

    return retrieve
