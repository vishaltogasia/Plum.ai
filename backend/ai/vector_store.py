import chromadb
import logging
from typing import List, Dict, Any
from backend.utils.config import settings
from backend.ai.embeddings import embedding_engine

logger = logging.getLogger("plum.ai.vector_store")

class VectorStore:
    def __init__(self):
        self.client = None

    def _init_client(self):
        """Lazy initialize ChromaDB client."""
        if self.client is None:
            logger.info(f"Connecting to persistent ChromaDB at: {settings.CHROMA_PERSIST_DIRECTORY}")
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)

    def _get_collection_name(self, business_id: int) -> str:
        """Construct isolated collection name per tenant (business)."""
        return f"business_{business_id}"

    def _get_or_create_collection(self, business_id: int):
        self._init_client()
        name = self._get_collection_name(business_id)
        # Note: ChromaDB requires collection names to be between 3 and 63 characters,
        # contain only alphanumeric characters, underscores or hyphens, etc.
        return self.client.get_or_create_collection(name=name)

    def add_document_chunks(self, business_id: int, document_id: int, filename: str, chunks: List[str]):
        """Generate embeddings and index document text chunks into the business's isolated collection."""
        if not chunks:
            return
            
        collection = self._get_or_create_collection(business_id)
        
        # Generate embeddings
        embeddings = embedding_engine.get_embeddings(chunks)
        
        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"document_id": document_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
        
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=chunks
        )
        logger.info(f"Successfully indexed {len(chunks)} chunks for document {document_id} in business {business_id} collection.")

    def add_chunks_with_metadata(self, business_id: int, chunks_with_meta: List[Dict[str, Any]]):
        """Index document chunks with pre-built rich metadata (page_number, chunk_index, upload_time).
        
        Args:
            business_id: The business tenant ID.
            chunks_with_meta: List of dicts with keys 'text' and 'metadata'.
        """
        if not chunks_with_meta:
            return

        collection = self._get_or_create_collection(business_id)

        texts = [c["text"] for c in chunks_with_meta]
        metadatas = [c["metadata"] for c in chunks_with_meta]
        doc_id = metadatas[0].get("document_id", 0) if metadatas else 0
        ids = [f"doc_{doc_id}_{c['metadata'].get('chunk_id', c['metadata']['chunk_index'])}" for c in chunks_with_meta]

        # Generate embeddings
        embeddings = embedding_engine.get_embeddings(texts)

        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=texts,
        )
        logger.info(f"Indexed {len(chunks_with_meta)} enriched chunks for document {doc_id} "
                    f"in business {business_id} collection.")

    def delete_document_vectors(self, business_id: int, document_id: int):
        """Delete all indexed chunks for a specific document."""
        self._init_client()
        collection_name = self._get_collection_name(business_id)
        try:
            collection = self.client.get_collection(name=collection_name)
            # Find and delete items by metadata filter
            collection.delete(where={"document_id": document_id})
            logger.info(f"Deleted vectors for document {document_id} from business {business_id} collection.")
        except Exception as e:
            logger.warning(f"Failed to delete vectors for document {document_id} (it may not exist): {str(e)}")

    def delete_business_collection(self, business_id: int):
        """Delete the entire collection for a business workspace (tenant)."""
        self._init_client()
        name = self._get_collection_name(business_id)
        try:
            self.client.delete_collection(name=name)
            logger.info(f"Deleted collection {name} for business {business_id}.")
        except Exception as e:
            logger.warning(f"Could not delete collection {name}: {str(e)}")

    def search_similar_chunks(self, business_id: int, query: str, limit: int | None = None) -> List[Dict[str, Any]]:
        """Retrieve most semantically relevant text chunks from the isolated tenant collection."""
        self._init_client()
        collection_name = self._get_collection_name(business_id)
        n_results = limit if limit is not None else settings.TOP_K
        
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception as e:
            logger.warning(f"Collection for business {business_id} does not exist. Returning empty search results: {str(e)}")
            return []
            
        # Generate query embedding
        query_embedding = embedding_engine.get_embedding(query)
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        formatted_results = []
        if results and results.get("documents") and len(results["documents"][0]) > 0:
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(documents)
            
            for doc, meta, dist in zip(documents, metadatas, distances):
                formatted_results.append({
                    "content": doc,
                    "metadata": meta,
                    "distance": dist
                })
                
        return formatted_results

vector_store = VectorStore()
