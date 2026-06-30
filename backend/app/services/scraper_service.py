import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re
import urllib3

# Disable SSL certificate verification warnings for robust scraping of misconfigured servers
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive"
}


def extract_articles_from_url(url: str) -> list[dict]:
    # verify=False bypasses SSL handshake issues on pages with invalid/expired certificates
    resp = requests.get(url, headers=HEADERS, timeout=15, verify=False)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    articles = []
    
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        text = tag.get_text(strip=True)
        if not text or len(text) < 30:
            continue
        if href.startswith("/"):
            parsed = urlparse(url)
            href = f"{parsed.scheme}://{parsed.netloc}{href}"
        elif not href.startswith("http"):
            continue
        articles.append({"title": text, "url": href})
    
    seen = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)
            
    # Fallback: if no link list is found, treat the URL itself as the news article
    if not unique:
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else "Scraped News Article"
        if len(title) > 150:
            title = title[:147] + "..."
        unique.append({"title": title, "url": url})
        
    # Limit to 5 articles to prevent request timeouts (FastAPI <-> Frontend 20s limit)
    # and to avoid exceeding AI API rate limits.
    return unique[:5]


def fetch_article_content(url: str) -> str:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, verify=False)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return re.sub(r"\s+", " ", text)[:5000]
    except Exception:
        return ""

