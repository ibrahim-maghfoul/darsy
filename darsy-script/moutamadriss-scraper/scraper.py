"""
moutamadris_scraper.py
======================
Scrapes https://moutamadris.ma/ for school news and vacation lists.
Specifically targets the '.dev.inside-article' container for structured extraction.

Outputs:
  moutamadris_content.json  — structured data
  moutamadris_content.xlsx  — formatted workbook
"""

import requests, json, csv, time, re, sys
from bs4 import BeautifulSoup
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from urllib.parse import urljoin
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
BASE_URL = "https://moutamadris.ma/"
TARGET_URL = "https://moutamadris.ma/%d9%84%d8%a7%d8%a6%d8%ad%d8%a9-%d8%a7%d9%84%d8%b9%d8%b7%d9%84-%d8%a7%d9%84%d9%85%d8%af%d8%b1%d8%b3%d9%8a%d8%a9-%d8%a8%d8%a7%d9%84%d9%85%d8%ba%d8%b1%d8%a8/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7",
}

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def fetch(url: str) -> BeautifulSoup | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        r.encoding = "utf-8"
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  [!] Failed: {url}  ({e})", file=sys.stderr)
        return None

def _get_styles(tag) -> dict:
    styles = {}
    if tag.name in ["strong", "b", "h1", "h2", "h3", "h4", "h5", "h6"]:
        styles["is_bold"] = True
    
    style_attr = tag.get("style", "").lower()
    
    # Text Alignment
    align_match = re.search(r"text-align:\s*([a-z]+)", style_attr)
    if align_match:
        styles["align"] = align_match.group(1).strip()
    elif tag.get("align"):
        styles["align"] = tag.get("align").lower()

    # Color extraction (simplified normalization)
    color_match = re.search(r"color:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|[a-zA-Z]+)", style_attr)
    if color_match:
        styles["color"] = color_match.group(1).strip()
    
    return styles

def _process_content(tag) -> str:
    # Replace <br> with \n to preserve line skipping
    for br in tag.find_all("br"):
        br.replace_with("\n")
    return tag.get_text(strip=False).strip()

def _extract_list(list_tag) -> dict:
    items = []
    for li in list_tag.find_all("li", recursive=False):
        text = _process_content(li)
        items.append({
            "text": text,
            "is_arabic": bool(re.search(r'[\u0600-\u06FF]', text)),
            "style": _get_styles(li)
        })
    return {
        "type": "list",
        "subtype": list_tag.name,
        "items": items,
        "style": _get_styles(list_tag)
    }

def _extract_table(table_tag) -> dict:
    rows = []
    for tr in table_tag.find_all("tr"):
        row_data = []
        for td in tr.find_all(["td", "th"]):
            row_data.append({
                "text": _process_content(td),
                "is_header": td.name == "th",
                "style": _get_styles(td)
            })
        if row_data:
            rows.append(row_data)
    return {
        "type": "table",
        "rows": rows,
        "style": _get_styles(table_tag)
    }

# Domains/patterns to identify attachment/download links
ATTACHMENT_PATTERNS = [
    r"\.pdf($|\?)",
    r"drive\.google\.com/file/",
    r"docs\.google\.com/",
    r"\.docx?($|\?)",
    r"\.xlsx?($|\?)",
    r"\.pptx?($|\?)",
    r"\.zip($|\?)",
]
ATTACHMENT_RE = re.compile("|".join(ATTACHMENT_PATTERNS), re.I)

def is_attachment(url: str) -> bool:
    return bool(ATTACHMENT_RE.search(url or ""))

# ─────────────────────────────────────────────────────────────────────────────
# SCRAPING
# ─────────────────────────────────────────────────────────────────────────────

def scrape_article(url: str) -> dict:
    print(f"🔎 Scraping: {url}")
    soup = fetch(url)
    if not soup: return {}

    title = soup.find("h1").get_text(strip=True) if soup.find("h1") else "Moutamadris Article"
    
    # Target container
    content = soup.select_one(".dev.inside-article") or soup.find("article") or soup.body
    
    content_blocks = []
    processed_tags = set()

    # Sequential extraction
    for tag in content.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table", "img", "figure", "a"]):
        if tag in processed_tags: continue
        
        if tag.name in ["ul", "ol"]:
            content_blocks.append(_extract_list(tag))
        elif tag.name == "table":
            content_blocks.append(_extract_table(tag))
        elif tag.name in ["img", "figure"]:
            img = tag if tag.name == "img" else tag.find("img")
            if not img:
                processed_tags.add(tag)
                continue
                
            parent_a = img.find_parent("a", href=True)
            # Handle lazy loading attributes common in WordPress
            src = img.get("src", "") or img.get("data-src", "") or img.get("data-lazy-src", "")
            if src:
                full_src = urljoin(BASE_URL, src)
                link_url = None
                if parent_a:
                    link_url = urljoin(BASE_URL, parent_a["href"])
                
                content_blocks.append({
                    "type": "image",
                    "src": full_src,
                    "alt": img.get("alt", "").strip(),
                    "link": link_url
                })
        elif tag.name == "a":
            href = tag.get("href", "")
            label = _process_content(tag)
            # Only add as a standalone block if it's an attachment and not already processed
            if is_attachment(href) and label:
                content_blocks.append({
                    "type": "link",
                    "subtype": "attachment",
                    "text": label,
                    "url": urljoin(BASE_URL, href)
                })
        elif tag.name in ["p", "h1", "h2", "h3", "h4", "h5", "h6"]:
            text = _process_content(tag)
            if not text:
                processed_tags.add(tag)
                continue
                
            # Extract link if the tag is a link or contains one
            a_tag = tag if tag.name == "a" else tag.find("a", href=True)
            link_url = urljoin(BASE_URL, a_tag["href"]) if a_tag else None

            content_blocks.append({
                "type": "text",
                "subtype": tag.name,
                "text": text,
                "link": link_url,
                "is_arabic": bool(re.search(r'[\u0600-\u06FF]', text)),
                "style": _get_styles(tag)
            })
            
            # Extract links from this tag as separate blocks if they are attachments 
            # or if the user specifically wants titles-as-links emphasized
            for a in tag.find_all("a", href=True):
                a_href = a["href"]
                a_text = _process_content(a)
                if is_attachment(a_href) and a_text:
                    content_blocks.append({
                        "type": "link",
                        "subtype": "attachment",
                        "text": a_text,
                        "url": urljoin(BASE_URL, a_href)
                    })
                # Mark these inner links as processed so they aren't added again
                processed_tags.add(a)
        
        processed_tags.add(tag)
        # Also mark all children as processed to avoid duplicates from flat find_all
        for child in tag.find_all(True):
            processed_tags.add(child)

    return {
        "title": title,
        "url": url,
        "scraped_at": datetime.now().isoformat(),
        "content_blocks": content_blocks
    }

def save_outputs(data: dict):
    # JSON
    with open("moutamadris_content.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Simple Excel summary
    wb = Workbook()
    ws = wb.active
    ws.title = "Content Blocks"
    ws.append(["Type", "Subtype/Details", "Content"])
    
    for block in data.get("content_blocks", []):
        b_type = block.get("type")
        if b_type == "text":
            ws.append([b_type, block.get("subtype"), block.get("text")])
        elif b_type == "list":
            items_str = "\n".join([f"• {i['text']}" for i in block.get("items", [])])
            ws.append([b_type, block.get("subtype"), items_str])
        elif b_type == "table":
            ws.append([b_type, "Table", "[Table Data - see JSON for full structure]"])
        elif b_type == "image":
            ws.append([b_type, "Image", block.get("src")])

    wb.save("moutamadris_content.xlsx")
    print("✅ Saved to moutamadris_content.json and moutamadris_content.xlsx")

def run():
    article_data = scrape_article(TARGET_URL)
    if article_data:
        save_outputs(article_data)

if __name__ == "__main__":
    run()
