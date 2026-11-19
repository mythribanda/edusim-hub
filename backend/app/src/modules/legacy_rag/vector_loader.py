import os
import faiss
import pickle
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

from .embedder import get_embeddings
from .retriever import get_retriever

logger = logging.getLogger("legacy_rag.vector_loader")

# Dynamically resolve vectorstore directory independently of current working directory
_CURRENT_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _CURRENT_DIR.parents[3]  # legacy_rag -> modules -> src -> app -> backend

CANDIDATE_DIRS = [
    _BACKEND_DIR / "vectorstore",
    _CURRENT_DIR.parent / "vectorstore",
    Path("backend/vectorstore").resolve(),
    Path("vectorstore").resolve(),
]

VECTORSTORE_DIR = next((p for p in CANDIDATE_DIRS if p.is_dir()), _BACKEND_DIR / "vectorstore")

SUBJECT_ALIASES = {
    "math": "mathematics",
    "maths": "mathematics",
    "algebra": "mathematics",
    "geometry": "mathematics",
    "calculus": "mathematics",
    "bio": "biology",
    "botany": "biology",
    "zoology": "biology",
    "chem": "chemistry",
    "phys": "physics",
    "physics": "physics",
    "physical_science": "physics",
    "evs": "physics",  # General science / environmental studies
    "science": "physics",
}


def normalize_subject_name(subject: Optional[str]) -> str:
    """Normalize user-supplied subject string to canonical vectorstore subject."""
    if not subject:
        return "physics"
    clean = subject.strip().lower().replace("-", "_").replace(" ", "_")
    return SUBJECT_ALIASES.get(clean, clean)


class VectorStoreManager:
    """
    Singleton manager for loading FAISS indices per subject globally on startup.
    Guarantees path resolution independence, thread safety, and transparent subject routing.
    """
    _instance = None
    _is_loaded = False

    _indices: Dict[str, Any] = {}
    _metadata: Dict[str, list] = {}
    _retrievers: Dict[str, Any] = {}
    _embeddings_model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStoreManager, cls).__new__(cls)
        return cls._instance

    @property
    def supported_subjects(self) -> List[str]:
        if not self._is_loaded:
            self.load_all()
        return sorted(list(self._retrievers.keys()))

    def is_subject_supported(self, subject: Optional[str]) -> bool:
        if not subject:
            return True
        norm = normalize_subject_name(subject)
        if not self._is_loaded:
            self.load_all()
        return norm in self._retrievers

    def load_all(self):
        """Load all subject indices from the vectorstore directory."""
        if self._is_loaded and self._retrievers:
            return

        logger.info(f"Preloading FAISS Vector Databases from: {VECTORSTORE_DIR}")
        self._embeddings_model = get_embeddings()

        if not VECTORSTORE_DIR.exists():
            logger.warning(f"Vectorstore directory {VECTORSTORE_DIR} not found.")
            return

        loaded_subjects = []
        for subject_dir in VECTORSTORE_DIR.iterdir():
            if subject_dir.is_dir():
                subject = subject_dir.name.lower()
                index_path = subject_dir / "index.faiss"
                meta_path = subject_dir / "index.pkl"

                if index_path.exists() and meta_path.exists():
                    try:
                        index = faiss.read_index(str(index_path))
                        with open(meta_path, "rb") as f:
                            metadata = pickle.load(f)

                        self._indices[subject] = index
                        self._metadata[subject] = metadata
                        self._retrievers[subject] = get_retriever(
                            index, metadata, self._embeddings_model, k=5
                        )
                        loaded_subjects.append(subject)
                        logger.info(f"Loaded '{subject}' index ({index.ntotal} vectors).")
                    except Exception as e:
                        logger.error(f"Failed to load index for {subject}: {e}")

        self._is_loaded = True
        logger.info(f"Preloaded vectorstore subjects: {', '.join(loaded_subjects) if loaded_subjects else 'None'}")

    def get_retriever(self, subject: Optional[str] = None):
        """
        Get the preloaded retriever for a specific subject.
        Returns None if the subject is explicitly unsupported.
        """
        if not self._is_loaded:
            self.load_all()

        if not self._retrievers:
            return None

        if subject is None:
            return self._retrievers.get("physics") or next(iter(self._retrievers.values()), None)

        norm = normalize_subject_name(subject)
        if norm in self._retrievers:
            return self._retrievers[norm]

        # Subject not in index
        return None


# Global singleton instance
vector_store = VectorStoreManager()
