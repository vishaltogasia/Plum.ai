import requests
import logging
from typing import Optional, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import time

logger = logging.getLogger("plum.ai.scraper")

class URLScraper:
    """Web scraper for ingesting content from URLs into knowledge base."""
    
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_url(self, url: str) -> Optional[Tuple[str, str]]:
        """
        Scrape content from a URL.
        
        Returns:
            Tuple of (title, content) or None if scraping failed
        """
        try:
            # Validate and normalize URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            # Fetch the page
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Extract title
            title = soup.find('title')
            page_title = title.string if title else urlparse(url).netloc
            
            # Extract main content
            content = self._extract_main_content(soup)
            
            if not content:
                logger.warning(f"No content found at {url}")
                return None
            
            logger.info(f"Successfully scraped {url} - {len(content)} characters")
            return (page_title, content)
        
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return None
    
    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract main content from parsed HTML."""
        # Try to find main content containers
        content_selectors = [
            'main',
            'article',
            'div[role="main"]',
            '.content',
            '.main-content',
            '.post-content',
            '#content',
            '#main'
        ]
        
        content = None
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                content = element
                break
        
        # Fallback to body
        if not content:
            content = soup.find('body') or soup
        
        # Get text
        text = content.get_text(separator='\n', strip=True)
        
        # Clean up whitespace
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        return '\n'.join(lines)
    
    def scrape_multiple_urls(self, urls: list[str], delay: float = 0.5) -> list[Tuple[str, str]]:
        """
        Scrape multiple URLs with delay between requests.
        
        Args:
            urls: List of URLs to scrape
            delay: Delay in seconds between requests (to be respectful to servers)
        
        Returns:
            List of (title, content) tuples
        """
        results = []
        for url in urls:
            result = self.scrape_url(url)
            if result:
                results.append(result)
            time.sleep(delay)
        
        return results
    
    def is_valid_url(self, url: str) -> bool:
        """Check if URL is valid."""
        try:
            result = urlparse(url)
            return all([result.scheme or 'https', result.netloc])
        except Exception:
            return False

# Global scraper instance
url_scraper = URLScraper()
