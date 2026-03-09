# Moutamadris Scraper

A Python-based scraper designed to extract structured content from [Moutamadris.ma](https://moutamadris.ma/).

## Features
- **Targeted Extraction**: Specifically scrapes content from the `.dev.inside-article` container.
- **Structured Content**: Extracts headers, paragraphs, lists, and images as "content blocks".
- **Style Awareness**: Detects bold text and other basic styles.
- **Multi-Format Output**: Generates both `moutamadris_content.json` and `moutamadris_content.xlsx`.

## Requirements
```bash
pip install requests beautifulsoup4 openpyxl
```

## Usage
Run the scraper from the terminal:
```bash
python scraper.py
```

## Output
- `moutamadris_content.json`: Full structured data including all content blocks and metadata.
- `moutamadris_content.xlsx`: A summary spreadsheet for easy viewing of the extracted content.
