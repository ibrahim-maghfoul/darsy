import json, requests, re, time
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://www.tawjihnet.net"
CATEGORY_URL = "https://www.tawjihnet.net/category/etudiant/"
JSON_FILE = "tawjihnet_full.json"

def fetch(url):
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        r.raise_for_status()
        r.encoding = "utf-8"
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"Failed {url}: {e}")
        return None

def extract_valid_url(img):
    if not img: return ""
    raw_src = (img.get("data-src", "") or img.get("data-lazy-src", "") or img.get("src", "")).strip()
    if not raw_src: return ""
    if raw_src.startswith("/"):
        raw_src = urljoin(BASE_URL, raw_src)
    return re.sub(r'-\d+x\d+(?=\.(jpg|jpeg|png|gif|webp)$)', '', raw_src, flags=re.I)

def main():
    print("Loading existing JSON...")
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    articles = data.get("articles", data) if isinstance(data, dict) else data
    if not articles:
        print("No articles found.")
        return

    print("Mapping URLs to exact image sources...")
    url_to_image = {}
    
    # We only need to scrape pages until we cover enough articles.
    # We'll just scrape the first few pages and match urls.
    # Currently the JSON might have 500 articles. Let's do a fast scrape of all 24 pages.
    MAX_PAGES = 25
    for page in range(1, MAX_PAGES + 1):
        url = CATEGORY_URL if page == 1 else f"{CATEGORY_URL}page/{page}/"
        print(f"Scraping category page {page}...")
        soup = fetch(url)
        if not soup: break
        
        found = 0
        for h2 in soup.select("h2 a[href]"):
            href = h2.get("href", "").strip()
            if not href or BASE_URL not in href: continue
            
            img = h2.find_previous("img") or h2.find_next("img")
            img_src = extract_valid_url(img)
            
            if img_src and "data:image" not in img_src:
                url_to_image[href] = img_src
                found += 1
                
        if found == 0: break
        time.sleep(0.5)

    print(f"Found {len(url_to_image)} valid cover images.")
    
    # Patch articles
    patched = 0
    for art in articles:
        url = art.get("url")
        if url in url_to_image:
            art["imageUrl"] = url_to_image[url]
            patched += 1
            
    print(f"Patched {patched} articles in JSON.")
    
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("JSON saved. You can now re-upload via the Admin Panel!")

if __name__ == "__main__":
    main()
