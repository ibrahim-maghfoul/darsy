"""
download_db_to_json.py - Download MongoDB collections as JSON files.
"""

import os
import sys
import json
from bson import json_util
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

# Output directory: darsy-data/database data
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / 'darsy-data' / 'database data'

def main():
    print("🔌 Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()

    collections = db.list_collection_names()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for coll_name in collections:
        print(f"📥 Downloading collection: {coll_name}...")
        data = list(db[coll_name].find({}))
        
        out_path = OUTPUT_DIR / f"{coll_name}.json"
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(json_util.dumps(data, indent=2))
        
        print(f"✅ Saved {len(data)} documents to {out_path}")

    client.close()
    print("🎉 All done!")

if __name__ == '__main__':
    main()
