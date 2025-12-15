import csv

def verify(csv_path):
    print(f"Verifying {csv_path}...")
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        total = 0
        missing = 0
        examples = []
        for row in reader:
            isbn13 = row.get('ISBN13', '').strip()
            if not isbn13 or isbn13 == '0' or len(isbn13) < 10:
                missing += 1
                if len(examples) < 5:
                    examples.append(row['Title'])
            total += 1
            
    print(f"Total rows: {total}")
    print(f"Missing ISBN13: {missing}")
    if missing > 0:
        print("Examples of missing:")
        for e in examples:
            print(f"- {e}")

if __name__ == "__main__":
    verify('books_updated.csv')
