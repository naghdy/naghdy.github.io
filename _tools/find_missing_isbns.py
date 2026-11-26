import csv
import re

def is_valid_isbn13(isbn):
    if not isbn:
        return False
    isbn = re.sub(r'[^0-9X]', '', str(isbn))
    return len(isbn) == 13

def find_missing_isbns(csv_path):
    missing_books = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            isbn = row.get('ISBN')
            isbn13 = row.get('ISBN13')
            
            # Check if ISBN13 is missing or valid
            if not is_valid_isbn13(isbn13):
                 missing_books.append({
                    'Title': row.get('Title'),
                    'Author': row.get('Author'),
                    'Year': row.get('Year Published')
                 })
    return missing_books

if __name__ == "__main__":
    books = find_missing_isbns('books.csv')
    print(f"Found {len(books)} books with missing or invalid ISBN13s:")
    for b in books:
        print(f"- {b['Title']} by {b['Author']} ({b['Year']})")
