import logging
from typing import List
from backend.utils.config import settings

logger = logging.getLogger("plum.ai.embeddings")

class EmbeddingEngine:
    def __init__(self):
        self.model = None

    def _lazy_init(self):
        """Lazy load SentenceTransformers to keep API startup instantaneous."""
        if self.model is None:
            logger.info(f"Loading local embedding model: {settings.EMBEDDING_MODEL}")
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info("Embedding model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load sentence-transformers model: {str(e)}")
                raise e

    def get_embedding(self, text: str) -> List[float]:
        """Generate a single embedding vector for the input text."""
        self._lazy_init()
        try:
            vector = self.model.encode(text, convert_to_numpy=True)
            return vector.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            # Fallback to zero-vector or raise
            raise e

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate list of embedding vectors for multiple chunks."""
        if not texts:
            return []
        self._lazy_init()
        try:
            vectors = self.model.encode(texts, convert_to_numpy=True)
            return [v.tolist() for v in vectors]
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            raise e

embedding_engine = EmbeddingEngine()
