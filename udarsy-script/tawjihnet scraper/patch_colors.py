import json
import re

JSON_FILE = "tawjihnet_full.json"
DARSY_GREEN = "#3aaa6a"

# Colors to replace: user provided + some common variations
COLORS_TO_REPLACE = [
    r'#e4fca2', r'#f5ffd9', r'#d6e9ff', r'#ebffd6', r'#e8fcca', r'#e3efff', r'#f6facf', r'#e8faca', r'#fffed4',
    r'#ffff00', r'#fffede', r'#f3fccc', r'rgb\(255,\s*254,\s*212\)'
]

def main():
    print(f"Loading {JSON_FILE}...")
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: {JSON_FILE} not found.")
        return

    original_length = len(content)
    
    # We will use regex to do a case-insensitive replacement of all these colors
    print("Replacing colors with Darsy Green...")
    for color in COLORS_TO_REPLACE:
        # regex pattern to match the color case-insensitively
        pattern = re.compile(color, re.IGNORECASE)
        # Count matches just to report
        matches = len(pattern.findall(content))
        if matches > 0:
            print(f"  Found {matches} instances of {color}")
            content = pattern.sub(DARSY_GREEN, content)

    if len(content) != original_length:
         print("Length changed unexpectedly!") # Should just be replacing 7 chars with 7 chars mostly
         
    print(f"Saving updated {JSON_FILE}...")
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Done! The JSON has been updated. You can now re-upload it via the Admin panel.")

if __name__ == "__main__":
    main()
