
import csv
import os
import time
import urllib.request
import urllib.error
import json
import ssl

# Ignore SSL errors for simplicity (not recommended for production, but fine for local tool)
ssl._create_default_https_context = ssl._create_unverified_context

LOCAL_CSV_PATH = 'updated_books.csv'
OUTPUT_DIR = 'images/covers'

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

print(f"Reading local CSV: {LOCAL_CSV_PATH}...")

def download_file(url, filepath):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                return False
            data = response.read()
            # OpenLibrary 1x1 GIF check (43 bytes)
            if len(data) < 100:
                return False
            
            with open(filepath, 'wb') as f:
                f.write(data)
            return True
    except Exception as e:
        return False

def get_google_books_link(isbn):
    try:
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            if 'items' in data and len(data['items']) > 0:
                link = data['items'][0].get('volumeInfo', {}).get('imageLinks', {}).get('thumbnail')
                if link:
                    return link.replace('http:', 'https:')
    except:
        pass
    return None

def download_cover(isbn):
    filename = os.path.join(OUTPUT_DIR, f"{isbn}.jpg")
    if os.path.exists(filename):
        # print(f"  -> Exists: {isbn}")
        return

    print(f"  -> Downloading {isbn}...")
    
    # Try OpenLibrary
    ol_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg"
    if download_file(ol_url, filename):
        print("     [OK] OpenLibrary")
        return

    # Try Google Books
    gb_link = get_google_books_link(isbn)
    if gb_link and download_file(gb_link, filename):
        print("     [OK] GoogleBooks")
        return

    print("     [FAIL] No cover found")

def run():
    if not os.path.exists(LOCAL_CSV_PATH):
        print(f"File not found: {LOCAL_CSV_PATH}")
        return

    count = 0
    with open(LOCAL_CSV_PATH, 'r', encoding='utf-8') as f:
        # Handle simple CSV parsing manually or via csv module
        # The file might have complex quoting, use csv module
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return

        # Find columns
        # Expected: Index 5 (ISBN), Index 6 (ISBN13)
        # But let's verify headers if possible? 
        # User said "ISBN" and "ISBN13".
        # Based on previous `view_file`:
        # "Book Id,Title,Author... ISBN,ISBN13..." -> Indices match 5 and 6 (0-based)
        
        for row in reader:
            if not row: continue
            if len(row) < 7: continue

            title = row[1]
            raw_isbn = row[5].replace('=', '').replace('"', '').strip()
            raw_isbn13 = row[6].replace('=', '').replace('"', '').strip()
            
            # Clean non-numeric/X
            clean_isbn = "".join(c for c in raw_isbn if c.isdigit() or c.upper() == 'X')
            clean_isbn13 = "".join(c for c in raw_isbn13 if c.isdigit() or c.upper() == 'X')

            isbns_to_try = set()
            if len(clean_isbn) >= 10: isbns_to_try.add(clean_isbn)
            if len(clean_isbn13) >= 10: isbns_to_try.add(clean_isbn13)

            if isbns_to_try:
                try:
                    print(f"Processing {title}...")
                except UnicodeEncodeError:
                    print(f"Processing {title.encode('ascii', 'replace').decode()}...")

                for isbn in isbns_to_try:
                    download_cover(isbn)
                count += 1
                # time.sleep(0.1) # Be nice to APIs

    print(f"Processed {count} books.")

if __name__ == "__main__":
    run()
