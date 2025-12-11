import os
from typing import List, Dict
import PyPDF2
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

class PDFProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize PDF processor with chunking parameters.
        
        Args:
            chunk_size: Maximum size of each text chunk
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
            keep_separator=True
        )
        # Initialize embedding model (using a lightweight model)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text as a string
            
        Raises:
            Exception: If PDF cannot be read or processed
        """
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract text from all pages
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n--- Page {page_num + 1} ---\n"
                        text += page_text
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            return text.strip()
        
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks for embedding.
        
        Args:
            text: Text to be chunked
            
        Returns:
            List of text chunks
        """
        if not text or not text.strip():
            return []
        
        chunks = self.text_splitter.split_text(text)
        return chunks
    
    def create_embeddings(self, chunks: List[str]) -> List[List[float]]:
        """
        Generate embeddings for text chunks.
        
        Args:
            chunks: List of text chunks
            
        Returns:
            List of embedding vectors
        """
        if not chunks:
            return []
        
        # Generate embeddings using sentence-transformers
        embeddings = self.embedding_model.encode(chunks, show_progress_bar=False)
        
        # Convert to list of lists for compatibility
        return embeddings.tolist()
    
    def process_pdf(self, file_path: str) -> Dict:
        """
        Complete PDF processing pipeline: extract, chunk, and embed.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Dictionary containing chunks and embeddings
        """
        # Extract text
        text = self.extract_text_from_pdf(file_path)
        
        # Chunk text
        chunks = self.chunk_text(text)
        
        # Create embeddings
        embeddings = self.create_embeddings(chunks)
        
        return {
            "text": text,
            "chunks": chunks,
            "embeddings": embeddings,
            "num_chunks": len(chunks)
        }
    
    def create_query_embedding(self, query: str) -> List[float]:
        """
        Create embedding for a query string.
        
        Args:
            query: Query text
            
        Returns:
            Embedding vector
        """
        embedding = self.embedding_model.encode([query], show_progress_bar=False)
        return embedding[0].tolist()
