"""
database_docsId.py - Add unique docId to every resource child in the lessons collection.

Covers: coursesPdf, exercices, exams, videos, resourses

Run: python database_docsId.py
"""

import os
import sys
import uuid
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load .env from darsy-backend
env_path = Path(__file__).resolve().parent.parent.parent / 'darsy-backend' / '.env'
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("❌ MONGODB_URI not found in .env")
    sys.exit(1)

ALL_FIELDS = ['coursesPdf', 'exercices', 'exams', 'videos', 'resourses']


def generate_doc_id():
    """Generate a short unique docId using UUID4 hex (first 12 chars)."""
    return uuid.uuid4().hex[:12]


def main():
    # Ask which fields to skip
    print("📋 Available resource fields:")
    for i, field in enumerate(ALL_FIELDS):
        print(f"   {i + 1}. {field}")

    skip_input = input("\n🔧 Enter numbers of fields to SKIP (comma-separated, e.g. '1,2'), or press Enter to process all: ").strip()

    fields_to_process = list(ALL_FIELDS)
    if skip_input:
        try:
            skip_indices = [int(x.strip()) - 1 for x in skip_input.split(',')]
            skipped = [ALL_FIELDS[i] for i in skip_indices if 0 <= i < len(ALL_FIELDS)]
            fields_to_process = [f for f in ALL_FIELDS if f not in skipped]
            print(f"⏭️  Skipping: {', '.join(skipped)}")
        except (ValueError, IndexError):
            print("⚠️  Invalid input, processing all fields.")

    print(f"✅ Will process: {', '.join(fields_to_process)}")

    print("\n🔌 Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    lessons_col = db['lessons']

    total_updated = 0
    total_docs_added = 0

    lessons = list(lessons_col.find({}))
    print(f"📚 Found {len(lessons)} lessons to process\n")

    for lesson in lessons:
        lesson_id = lesson['_id']
        lesson_title = lesson.get('title', 'Unknown')
        update_ops = {}
        docs_added_this_lesson = 0

        for field in fields_to_process:
            resources = lesson.get(field, [])
            if not resources:
                continue

            updated_resources = []
            field_changed = False

            for resource in resources:
                if not resource.get('docId'):
                    resource['docId'] = generate_doc_id()
                    field_changed = True
                    docs_added_this_lesson += 1
                updated_resources.append(resource)

            if field_changed:
                update_ops[field] = updated_resources

        if update_ops:
            lessons_col.update_one(
                {'_id': lesson_id},
                {'$set': update_ops}
            )
            total_updated += 1
            total_docs_added += docs_added_this_lesson
            print(f"  ✅ {lesson_title}: added {docs_added_this_lesson} docIds")

    print(f"\n📊 Summary:")
    print(f"   Lessons updated: {total_updated}/{len(lessons)}")
    print(f"   DocIds added: {total_docs_added}")

    client.close()
    print("✅ Done!")


if __name__ == '__main__':
    main()
