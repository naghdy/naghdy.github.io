import csv
import urllib.request
import json
import os

CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRO-DmKFr8w-VvQPBiQIuqGmHfDzDfCT6bjA63_0r2vkz8SOTv0t-cdw9PEDWzEpy08Vx9yUD_M6AiM/pub?gid=0&single=true&output=csv'
LOCAL_CSV = 'c:/Users/naghd/Documents/Naghdy/books.csv'
MISSING_JSON = 'c:/Users/naghd/Documents/Naghdy/missing_isbns.json'

def download_csv():
    print(f"Downloading CSV from {CSV_URL}...")
    try:
        urllib.request.urlretrieve(CSV_URL, LOCAL_CSV)
        print(f"Downloaded to {LOCAL_CSV}")
    except Exception as e:
        print(f"Error downloading: {e}")

def find_missing_isbns():
    missing = []
    with open(LOCAL_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            # Check for missing ISBN (both fields)
            # Goodreads export usually has 'ISBN' and 'ISBN13'
            # Sometimes they are formatted as ="012345" or just 012345
            
            isbn = row.get('ISBN', '').replace('=', '').replace('"', '').strip()
            isbn13 = row.get('ISBN13', '').replace('=', '').replace('"', '').strip()
            
            if not isbn and not isbn13:
                # Store enough info to find it
                missing.append({
                    'index': i, # To update later
                    'Title': row.get('Title'),
                    'Author': row.get('Author')
                })
    
    print(f"Found {len(missing)} books with missing ISBNs.")
    return missing

if __name__ == "__main__":
    download_csv()
    missing_list = find_missing_isbns()
    
    with open(MISSING_JSON, 'w', encoding='utf-8') as f:
        json.dump(missing_list, f, indent=2)
    
    print(f"Saved missing list to {MISSING_JSON}")
    for book in missing_list:
        print(f"- {book['Title']} by {book['Author']}")
