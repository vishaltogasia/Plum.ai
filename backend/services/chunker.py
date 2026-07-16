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
