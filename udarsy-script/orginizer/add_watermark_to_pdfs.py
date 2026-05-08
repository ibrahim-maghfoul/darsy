"""
add_watermark_to_pdfs.py - Adds a logo watermark to all downloaded PDFs.

Requirements:
    pip install PyMuPDF Pillow

Run:
    python add_watermark_to_pdfs.py
"""

import os
import sys
import fitz  # PyMuPDF
from PIL import Image
import io
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / 'darsy-data'
LOGO_DIR = BASE_DIR / 'darsy-assets' / 'logo'

# Colors for terminal
GREEN = '\033[92m'
BOLD = '\033[1m'
DIM = '\033[2m'
RESET = '\033[0m'
CYAN = '\033[96m'
YELLOW = '\033[93m'
RED = '\033[91m'

counter_lock = threading.Lock()
completed_count = 0
total_pdfs = 0

def find_logo():
    if not LOGO_DIR.exists():
        return None
    for ext in ['*.png', '*.jpg', '*.jpeg']:
        for file in LOGO_DIR.glob(ext):
            return file
    return None

def prepare_watermark_image(image_path, opacity=0.4):
    """Load image, apply opacity, return bytes"""
    img = Image.open(image_path).convert("RGBA")
    # Apply opacity to alpha channel
    alpha = img.split()[3]
    alpha = list(alpha.getdata())
    # The Pillow point() method only takes integers, so mapping with lambda needs care. 
    # For safety, let's map pixels directly or use point with int()
    alpha = img.split()[3].point(lambda p: int(p * opacity))
    img.putalpha(alpha)
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    return img_byte_arr.getvalue()

def process_pdf(pdf_path, watermark_bytes):
    global completed_count, total_pdfs
    temp_path = str(pdf_path) + ".tmp"
    try:
        doc = fitz.open(pdf_path)
        
        for page in doc:
            rect = page.rect
            # Place the logo at the top-left corner
            # Let's say width is 15% of page width, up to a max of 80px
            w = min(80, rect.width * 0.15)
            h = w # assume square logo roughly
            
            x0 = 20
            y0 = 20
            x1 = x0 + w
            y1 = y0 + h
            
            image_rect = fitz.Rect(x0, y0, x1, y1)
            # insert_image takes stream (bytes) and rect
            page.insert_image(image_rect, stream=watermark_bytes, keep_proportion=True)
            
        doc.save(temp_path, garbage=4, deflate=True)
        doc.close()
        
        # Replace original file
        os.replace(temp_path, pdf_path)
        
        with counter_lock:
            completed_count += 1
            current = completed_count
            
        print(f"  {GREEN}✅{RESET} {YELLOW}[{current}/{total_pdfs}]{RESET} {DIM}Processed:{RESET} {pdf_path.name}")
        return True
    except Exception as e:
        with counter_lock:
            completed_count += 1
            current = completed_count
        print(f"  {RED}❌{RESET} {YELLOW}[{current}/{total_pdfs}]{RESET} {DIM}Failed:{RESET} {pdf_path.name} - {e}")
        # Clean up temp if exists
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except:
            pass
        return False

def main():
    global total_pdfs
    print(f"{GREEN}🌊 Starting PDF Watermarking...{RESET}")
    
    logo_path = find_logo()
    if not logo_path:
        print(f"❌ Could not find any logo image in {LOGO_DIR}")
        print("Please create the folder 'darsy-assets/logo' and place an image inside it.")
        sys.exit(1)
        
    print(f"{DIM}🔍 Found logo:{RESET} {logo_path.name}")
    print(f"{DIM}🎨 Preparing watermark image with 40% opacity...{RESET}")
    
    try:
        watermark_bytes = prepare_watermark_image(logo_path, opacity=0.4)
    except Exception as e:
        print(f"❌ Failed to process logo image: {e}")
        sys.exit(1)
    
    print(f"{DIM}📂 Searching for PDFs in {DATA_DIR}...{RESET}")
    
    pdf_files = list(DATA_DIR.rglob("*.pdf"))
    total_pdfs = len(pdf_files)
    
    if total_pdfs == 0:
        print("⚠️ No PDFs found in the data directory. Exiting.")
        sys.exit(0)
        
    print(f"📄 Found {total_pdfs} PDF files to process.\n")
    
    success_count = 0
    fail_count = 0
    
    max_workers = min(15, total_pdfs)
    print(f"🚀 Starting watermarking with {max_workers} threads...")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_pdf, pdf, watermark_bytes)
            for pdf in pdf_files
        ]
        for future in as_completed(futures):
            if future.result():
                success_count += 1
            else:
                fail_count += 1

    print(f"\n{GREEN}{'═' * 50}{RESET}")
    print(f"{BOLD}📊 Summary:{RESET}")
    print(f"   {GREEN}Watermarked: {success_count}{RESET}")
    if fail_count:
        print(f"   {RED}Failed: {fail_count}{RESET}")
    print(f"{GREEN}✅ Done!{RESET}")

if __name__ == '__main__':
    main()
