import csv
import urllib.request
import json
import os

CSV_FILE = 'c:/Users/naghd/Documents/Naghdy/books.csv'
UPDATED_CSV = 'c:/Users/naghd/Documents/Naghdy/updated_books.csv'
FOUND_TXT = 'c:/Users/naghd/Documents/Naghdy/found.txt'

def load_found_isbns():
    found = {}
    if os.path.exists(FOUND_TXT):
        # file might be utf-16le because of powershell redirection
        try:
            with open(FOUND_TXT, 'r', encoding='utf-16') as f:
                content = f.read()
        except UnicodeError:
            with open(FOUND_TXT, 'r', encoding='utf-8') as f:
                content = f.read()
                
        for line in content.splitlines():
            if not line.strip(): continue
            parts = line.strip().split('|')
            if len(parts) >= 2:
                title = parts[0].strip()
                isbn = parts[1].strip()
                if isbn != "N/A":
                    found[title] = isbn
    return found

def update_csv():
    found_map = load_found_isbns()
    updated_rows = []
    
    # Pre-process found_map keys for easier matching
    # We want to match if 'Found Title' is inside 'CSV Title'
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            title = row.get('Title', '')
            isbn = row.get('ISBN', '').replace('=', '').replace('"', '').strip()
            isbn13 = row.get('ISBN13', '').replace('=', '').replace('"', '').strip()
            
            if not isbn and not isbn13:
                match_found = False
                for found_title, found_isbn in found_map.items():
                    # Check if found_title is a substring of row title (case insensitive)
                    if found_title.lower() in title.lower():
                        row['ISBN13'] = f'="{found_isbn}"'
                        row['ISBN'] = f'="{found_isbn}"'
                        print(f"Updated '{title}' with {found_isbn}")
                        match_found = True
                        break
                
                if not match_found:
                    print(f"Warning: No found ISBN for '{title}'")
            
            updated_rows.append(row)
            
    with open(UPDATED_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
        
    print(f"Saved updated CSV to {UPDATED_CSV}")

if __name__ == "__main__":
    update_csv()
