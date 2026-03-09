"""
download_courses.py - Download all PDFs from the database organized by school/level/guidance/subject/lesson.

Folder structure:
    darsy-data/{schoolTitle}/{levelTitle}/{guidanceTitle}/{subjectTitle}/{lessonTitle}/{docTitle}_{docId}.pdf

Run:
    python download_courses.py          # Test mode (5 files)
    python download_courses.py --full   # Download all
"""

import os
import sys
import re
import time
import shutil
import requests
import json
from bson import json_util
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

def fix_arabic(text: str) -> str:
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except ImportError:
        return text

# Output base folder
OUTPUT_BASE = Path(__file__).resolve().parent.parent.parent / 'darsy-data'

# Resource fields that contain PDFs
PDF_FIELDS = ['coursesPdf', 'exercices', 'exams']

# Test mode
TEST_MODE = '--full' not in sys.argv

# Colors
GREEN = '\033[92m'
BOLD = '\033[1m'
DIM = '\033[2m'
RESET = '\033[0m'
CYAN = '\033[96m'
YELLOW = '\033[93m'
RED = '\033[91m'

# Thread-safe counter
counter_lock = threading.Lock()
completed_count = 0
total_pdfs = 0

def sanitize_filename(name: str) -> str:
    """Remove or replace characters that are invalid in file/folder names."""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = name.strip('. ')
    return name or 'untitled'


def format_size(size_bytes: int) -> str:
    """Format byte count into human-readable size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def format_time(seconds: float) -> str:
    """Format seconds into mm:ss or hh:mm:ss."""
    if seconds < 0 or seconds > 86400:
        return "--:--"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def download_file_task(url: str, dest_path: Path, title: str) -> tuple:
    """Download a file gracefully in a thread."""
    global completed_count, total_pdfs
    start_time = time.time()
    try:
        response = requests.get(url, timeout=60, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        downloaded = 0
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=32768):
                f.write(chunk)
                downloaded += len(chunk)
        
        elapsed = time.time() - start_time
        
        with counter_lock:
            completed_count += 1
            current = completed_count
            
        display_title = fix_arabic(title)
        
        print(f"  {GREEN}✅{RESET} {YELLOW}[{current}/{total_pdfs}]{RESET} {BOLD}{display_title}{RESET} {DIM}({format_size(total_size)}, {format_time(elapsed)}){RESET}")
        return (True, None)

    except Exception as e:
        with counter_lock:
            completed_count += 1
            current = completed_count
        display_title = fix_arabic(title)
        print(f"  {RED}❌{RESET} {YELLOW}[{current}/{total_pdfs}]{RESET} {BOLD}{display_title}{RESET}: {e}")
        return (False, str(e))


def main():
    global total_pdfs
    if TEST_MODE:
        print(f"{YELLOW}🧪 TEST MODE: Will download only 5 files. Use --full to download all.{RESET}")
    else:
        print(f"{GREEN}📥 FULL MODE: Downloading all PDFs.{RESET}")

    print(f"{DIM}📂 Loading database JSON files...{RESET}")
    db_data_dir = OUTPUT_BASE / 'database data'
    
    def load_json(name: str) -> list:
        json_path = db_data_dir / f"{name}.json"
        if not json_path.exists():
            print(f"❌ Could not find {json_path}. Please run download_db_to_json.py first.")
            sys.exit(1)
        with open(json_path, 'r', encoding='utf-8') as f:
            return json_util.loads(f.read())

    # Fetch all hierarchy data
    schools_data = load_json('schools')
    levels_data = load_json('levels')
    guidances_data = load_json('guidances')
    subjects_cursor = load_json('subjects')
    lessons_cursor = load_json('lessons')

    schools = {s['_id']: s.get('title', 'Unknown Title') for s in schools_data}
    levels = {l['_id']: {'title': l.get('title', 'Unknown Title'), 'schoolId': l.get('schoolId')} for l in levels_data}
    guidances = {g['_id']: {'title': g.get('title', 'Unknown Title'), 'levelId': g.get('levelId')} for g in guidances_data}

    print(f"📚 {len(schools)} schools, {len(levels)} levels, {len(guidances)} guidances, {len(subjects_cursor)} subjects, {len(lessons_cursor)} lessons")

    # Build lookup
    subject_map = {}
    for s in subjects_cursor:
        subject_map[s['_id']] = {
            'title': s['title'],
            'guidanceId': s['guidanceId']
        }

    download_tasks = []
    skip_count = 0

    for lesson in lessons_cursor:
        lesson_title = lesson.get('title', 'Unknown Lesson')
        subject_id = lesson.get('subjectId', '')

        subject_info = subject_map.get(subject_id)
        if not subject_info:
            continue

        guidance_info = guidances.get(subject_info['guidanceId'])
        if not guidance_info:
            continue

        level_info = levels.get(guidance_info['levelId'])
        if not level_info:
            continue

        school_title = schools.get(level_info['schoolId'], 'Unknown School')
        level_title = level_info['title']
        guidance_title = guidance_info['title']
        subject_title = subject_info['title']

        # Build folder path: school/level/guidance/subject/lesson
        safe_school = sanitize_filename(school_title)
        safe_level = sanitize_filename(level_title)
        safe_guidance = sanitize_filename(guidance_title)
        safe_subject = sanitize_filename(subject_title)
        safe_lesson = sanitize_filename(lesson_title)
        folder_path = OUTPUT_BASE / safe_school / safe_level / safe_guidance / safe_subject / safe_lesson

        for field in PDF_FIELDS:
            field_folder = field
            if field == 'coursesPdf':
                field_folder = 'Courses'
            elif field == 'exercices':
                field_folder = 'Exercices'
            elif field == 'exams':
                field_folder = 'Exams'

            field_path = folder_path / field_folder

            resources = lesson.get(field, [])
            for resource in resources:
                url = resource.get('url', '')
                title = resource.get('title', 'untitled')
                doc_id = resource.get('docId', 'noid')

                if not url:
                    continue

                safe_title = sanitize_filename(title)
                filename = f"{safe_title}_{doc_id}.pdf"
                dest = field_path / filename

                if dest.exists():
                    skip_count += 1
                    continue

                download_tasks.append({
                    'url': url,
                    'dest': dest,
                    'title': title
                })

    if TEST_MODE:
        download_tasks = download_tasks[:5]

    total_pdfs = len(download_tasks)
    print(f"📄 {total_pdfs} PDF resources to download (Skipped {skip_count} already existing)\n")

    download_count = 0
    fail_count = 0

    if total_pdfs > 0:
        # Use ThreadPoolExecutor to speed up downloads
        max_workers = min(20, total_pdfs)  # Use up to 20 threads for massive speedup
        print(f"🚀 Starting download with {max_workers} threads...")
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(download_file_task, task['url'], task['dest'], task['title'])
                for task in download_tasks
            ]
            for future in as_completed(futures):
                success, err = future.result()
                if success:
                    download_count += 1
                else:
                    fail_count += 1

    print(f"\n{GREEN}{'═' * 50}{RESET}")
    print(f"{BOLD}📊 Summary:{RESET}")
    print(f"   {GREEN}Downloaded: {download_count}{RESET}")
    print(f"   {CYAN}Skipped (already exist): {skip_count}{RESET}")
    if fail_count:
        print(f"   {RED}Failed: {fail_count}{RESET}")
    print(f"   {DIM}Output: {OUTPUT_BASE}{RESET}")

    # Finished iterating.
    print(f"{GREEN}✅ Done!{RESET}")


if __name__ == '__main__':
    main()
