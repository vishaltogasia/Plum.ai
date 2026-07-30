import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> list[str]:
    """
    Split a large block of text into smaller overlapping chunks.
    Ensures that paragraph boundaries are respected if possible.
    """
    if not text:
        return []
        
    # Replace multiple newlines or spaces
    normalized_text = " ".join(text.split())
    
    chunks = []
    start = 0
    text_len = len(normalized_text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        
        # If we are not at the end of the text, try to find a natural sentence boundary (., !, ?) or space
        if end < text_len:
            # Look back up to 20% of the chunk size to find a period or space
            lookback_limit = max(start, end - int(chunk_size * 0.2))
            boundary_found = False
            
            for i in range(end, lookback_limit, -1):
                if normalized_text[i] in [".", "!", "?", "\n"]:
                    end = i + 1  # Include the punctuation
                    boundary_found = True
                    break
            
            # If no sentence boundary, look for a space
            if not boundary_found:
                for i in range(end, lookback_limit, -1):
                    if normalized_text[i] == " ":
                        end = i
                        break
                        
        chunk = normalized_text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # Move forward by step size (size - overlap)
        step = chunk_size - chunk_overlap
        start = start + step if start + step < end else end
        
    return chunks


def split_text_with_metadata(
    pages: List[tuple[int, str]],
    document_id: int,
    filename: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> List[Dict[str, Any]]:
    """
    Split page-level text into overlapping chunks with rich metadata.
    
    Args:
        pages: List of (page_number, page_text) tuples.
        document_id: Database ID of the document.
        filename: Original filename.
        chunk_size: Maximum characters per chunk.
        chunk_overlap: Overlap characters between consecutive chunks.
    
    Returns:
        List of dicts with keys: 'text', 'metadata'.
        Metadata contains: chunk_id, document_id, filename, page_number, chunk_index, upload_time.
    """
    if not pages:
        return []

    upload_time = datetime.now(timezone.utc).isoformat()
    all_chunks: List[Dict[str, Any]] = []
    global_chunk_idx = 0

    for page_num, page_text in pages:
        page_chunks = split_text(page_text, chunk_size, chunk_overlap)

        for chunk_text in page_chunks:
            chunk_id = str(uuid.uuid4())[:8]
            all_chunks.append({
                "text": chunk_text,
                "metadata": {
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "filename": filename,
                    "page_number": page_num,
                    "chunk_index": global_chunk_idx,
                    "upload_time": upload_time,
                },
            })
            global_chunk_idx += 1

    return all_chunks
