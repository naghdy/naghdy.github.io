import csv
import re
import json
import time
import urllib.request
import urllib.parse

def is_valid_isbn13(isbn):
    if not isbn:
        return False
    isbn = re.sub(r'[^0-9X]', '', str(isbn))
    return len(isbn) == 13

def clean_author(author):
    # Remove extra roles or weird formatting if necessary
    if ',' in author:
        parts = author.split(',')
        if len(parts) >= 2:
             return f"{parts[1].strip()} {parts[0].strip()}"
    return author

def fetch_isbn_openlibrary(title, author):
    # Basic cleanup
    title_clean = title.split(':')[0].strip() # Use main title
    author_clean = clean_author(author)
    
    query = urllib.parse.urlencode({'title': title_clean, 'author': author_clean})
    url = f"https://openlibrary.org/search.json?{query}"
    
    try:
        with urllib.request.urlopen(url) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                if data['numFound'] > 0:
                    # Iterate through docs to find a valid ISBN13
                    for doc in data['docs']:
                        if 'isbn' in doc:
                            for isbn in doc['isbn']:
                                if len(isbn) == 13:
                                    return isbn
    except Exception as e:
        print(f"Error fetching for {title}: {e}")
    return None

def process_csv(input_csv, output_csv):
    updated_rows = []
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
        
    print(f"Processing {len(rows)} books...")
    
    count_updated = 0
    for row in rows:
        isbn13 = row.get('ISBN13')
        if not is_valid_isbn13(isbn13):
            print(f"Fetching ISBN for: {row['Title']}")
            new_isbn = fetch_isbn_openlibrary(row['Title'], row['Author'])
            if new_isbn:
                row['ISBN13'] = new_isbn
                # Also try to set ISBN10 if empty, but primary goal is ISBN13
                print(f"  Found: {new_isbn}")
                count_updated += 1
            else:
                print(f"  Not found.")
            time.sleep(0.5) # Be nice to the API
        updated_rows.append(row)
        
    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
        
    print(f"Finished. Updated {count_updated} books.")

if __name__ == "__main__":
    process_csv('books.csv', 'books_updated.csv')
