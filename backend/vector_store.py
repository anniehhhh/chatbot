import os
import uuid
from typing import List, Dict, Optional
from datetime import datetime, timezone
import chromadb
from chromadb.config import Settings

class VectorStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize ChromaDB vector store.
        
        Args:
            persist_directory: Directory to persist the database
        """
        self.persist_directory = persist_directory
        
        # Create directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection for documents
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
    
    def add_document(
        self, 
        doc_id: str, 
        chunks: List[str], 
        embeddings: List[List[float]], 
        metadata: Dict
    ) -> bool:
        """
        Add a document's chunks to the vector store.
        
        Args:
            doc_id: Unique document identifier
            chunks: List of text chunks
            embeddings: List of embedding vectors
            metadata: Document metadata (filename, upload_date, etc.)
            
        Returns:
            True if successful
        """
        try:
            # Create unique IDs for each chunk
            chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            
            # Create metadata for each chunk
            chunk_metadata = [
                {
                    "doc_id": doc_id,
                    "chunk_index": i,
                    "filename": metadata.get("filename", "unknown"),
                    "upload_date": metadata.get("upload_date", datetime.now(timezone.utc).isoformat()),
                    "total_chunks": len(chunks)
                }
                for i in range(len(chunks))
            ]
            
            # Add to collection
            self.collection.add(
                ids=chunk_ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=chunk_metadata
            )
            
            return True
        
        except Exception as e:
            raise Exception(f"Error adding document to vector store: {str(e)}")
    
    def query(
        self, 
        query_embedding: List[float], 
        top_k: int = 5,
        doc_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Query the vector store for similar chunks.
        
        Args:
            query_embedding: Embedding vector for the query
            top_k: Number of results to return
            doc_id: Optional document ID to filter results
            
        Returns:
            List of dictionaries containing chunks and metadata
        """
        try:
            # Build where clause if filtering by doc_id
            where_clause = {"doc_id": doc_id} if doc_id else None
            
            # Query the collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            if results and results['documents'] and len(results['documents']) > 0:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "chunk": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i] if 'distances' in results else None
                    })
            
            return formatted_results
        
        except Exception as e:
            raise Exception(f"Error querying vector store: {str(e)}")
    
    def hybrid_query(
        self, 
        query_embedding: List[float],
        query_text: str,
        top_k: int = 5,
        doc_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Hybrid query combining semantic similarity and keyword matching.
        Better for finding specific mid-page content.
        
        Args:
            query_embedding: Embedding vector for the query
            query_text: Original query text for keyword matching
            top_k: Number of results to return
            doc_id: Optional document ID to filter results
            
        Returns:
            List of dictionaries containing chunks and metadata, reranked
        """
        try:
            import re
            
            # Get more candidates for reranking (2x top_k)
            candidates = self.query(query_embedding, top_k=top_k * 2, doc_id=doc_id)
            
            if not candidates:
                return []
            
            # Extract keywords from query (simple tokenization)
            query_keywords = set(re.findall(r'\w+', query_text.lower()))
            # Remove common stop words
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'what', 'how', 'when', 'where', 'why'}
            query_keywords = query_keywords - stop_words
            
            # Rerank based on semantic + keyword scores
            scored_results = []
            for result in candidates:
                chunk_text = result['chunk'].lower()
                chunk_keywords = set(re.findall(r'\w+', chunk_text))
                
                # Calculate keyword overlap
                keyword_overlap = len(query_keywords & chunk_keywords)
                keyword_score = keyword_overlap / max(len(query_keywords), 1)
                
                # Combine scores (cosine distance is 0-2, where lower is better)
                # Convert to similarity (higher is better)
                semantic_score = 1 - (result['distance'] / 2) if result['distance'] is not None else 0.5
                
                # Weighted combination: 70% semantic, 30% keyword
                combined_score = (0.7 * semantic_score) + (0.3 * keyword_score)
                
                scored_results.append((combined_score, result))
            
            # Sort by combined score (descending) and take top_k
            scored_results.sort(key=lambda x: x[0], reverse=True)
            final_results = [result for score, result in scored_results[:top_k]]
            
            return final_results
        
        except Exception as e:
            # Fallback to regular semantic search
            return self.query(query_embedding, top_k=top_k, doc_id=doc_id)
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete all chunks belonging to a document.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            True if successful
        """
        try:
            # Get all chunk IDs for this document
            results = self.collection.get(
                where={"doc_id": doc_id}
            )
            
            if results and results['ids']:
                # Delete all chunks
                self.collection.delete(ids=results['ids'])
                return True
            
            return False
        
        except Exception as e:
            raise Exception(f"Error deleting document from vector store: {str(e)}")
    
    def list_documents(self) -> List[Dict]:
        """
        Get list of all unique documents in the store.
        
        Returns:
            List of document metadata
        """
        try:
            # Get all items from collection
            results = self.collection.get()
            
            if not results or not results['metadatas']:
                return []
            
            # Extract unique documents
            docs_dict = {}
            for metadata in results['metadatas']:
                doc_id = metadata.get('doc_id')
                if doc_id and doc_id not in docs_dict:
                    docs_dict[doc_id] = {
                        "doc_id": doc_id,
                        "filename": metadata.get('filename', 'unknown'),
                        "upload_date": metadata.get('upload_date'),
                        "total_chunks": metadata.get('total_chunks', 0)
                    }
            
            # Convert to list and sort by upload date
            docs_list = list(docs_dict.values())
            docs_list.sort(key=lambda x: x.get('upload_date', ''), reverse=True)
            
            return docs_list
        
        except Exception as e:
            raise Exception(f"Error listing documents: {str(e)}")
    
    def document_exists(self, doc_id: str) -> bool:
        """
        Check if a document exists in the store.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            True if document exists
        """
        try:
            results = self.collection.get(where={"doc_id": doc_id})
            return bool(results and results['ids'])
        except Exception:
            return False
    
    def get_document_count(self) -> int:
        """
        Get total number of unique documents.
        
        Returns:
            Number of documents
        """
        return len(self.list_documents())
    
    def reset(self) -> bool:
        """
        Delete all documents from the store. Use with caution!
        
        Returns:
            True if successful
        """
        try:
            self.client.delete_collection("documents")
            self.collection = self.client.get_or_create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            return True
        except Exception as e:
            raise Exception(f"Error resetting vector store: {str(e)}")
