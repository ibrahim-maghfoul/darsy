import json
import traceback

JSON_FILE = "tawjihnet_full.json"

def main():
    print(f"Loading {JSON_FILE} to patch the missing categories...")
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        articles = data.get("articles", []) if isinstance(data, dict) else data
        
        patched_count = 0
        for article in articles:
            url = article.get("url", "").lower()
            original_cat = article.get("category")
            
            # Infer category from URL
            if "category/bac" in url:
                article["category"] = "Bac"
            elif "category/etudiant" in url:
                article["category"] = "Etudiant"
            elif "category/3college-tc-bac" in url:
                article["category"] = "College"
            else:
                article["category"] = "Etudiant" # Fallback if URL is weird
                
            if original_cat != article["category"]:
                patched_count += 1

        print(f"Patched {patched_count} articles with missing categories.")
        
        print(f"Saving updated {JSON_FILE}...")
        with open(JSON_FILE, "w", encoding="utf-8") as f:
            if isinstance(data, dict):
                data["articles"] = articles
                json.dump(data, f, ensure_ascii=False, indent=2)
            else:
                json.dump(articles, f, ensure_ascii=False, indent=2)
                
        print("Done! You can now re-upload the JSON in the Admin panel.")
            
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
