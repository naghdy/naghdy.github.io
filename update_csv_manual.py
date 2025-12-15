import csv
import shutil

# Map of Title (or part of title) -> ISBN13
isbn_map = {
    "Economics in One Lesson": "9780517548233",
    "A Template for Understanding Big Debt Crises": "9781732689800",
    "The Silk Roads": "9781101912379",
    "Skunk Works": "9780316743006",
    "Bad Blood": "9780525431992",
    "21 Lessons for the 21st Century": "9780525512196",
    "Genghis Khan and the Making of the Modern World": "9780609610626",
    "Sapiens": "9780099590088",
    "A Life in Parts": "9781476793870",
    "The Internet of Money": "9781537000459",
    "Exponential Organizations": "9781626814233",
    "Tools of Titans": "9781328683786",
    "The Inevitable": "9780143110378",
    "Al Franken, Giant of the Senate": "9781455540419",
    "Love Does": "9781400203758",
    "Yes Please": "9780062268341",
    "Console Wars": "9780062276704",
    "Dark Money": "9780385535595",
    "Judgment Calls": "9781422158111",
    "The Design of Everyday Things": "9780465067107",
    "The Gene": "9781476733500",
    "Bossypants": "9780316056878",
    "Carra": "9780552157421",
    "Made to Stick": "9781400064281",
    "I Am Not A Salesperson": "9781500128418",
    "I am not a salesperson": "9781500128418", # Case sensitivity check
    "The Tipping Point": "9780316346627",
    "Predictably Irrational": "9780061353246",
    "How Google Works": "9781455582334"
}

input_csv = 'books.csv'
output_csv = 'books_updated.csv'

updated_count = 0

with open(input_csv, 'r', encoding='utf-8') as f_in, open(output_csv, 'w', encoding='utf-8', newline='') as f_out:
    reader = csv.DictReader(f_in)
    fieldnames = reader.fieldnames
    writer = csv.DictWriter(f_out, fieldnames=fieldnames)
    writer.writeheader()
    
    for row in reader:
        title = row['Title']
        # Check if we need to update
        current_isbn = row.get('ISBN13', '').strip()
        
        # Simple fuzzy match: check if map key is in title
        matched_isbn = None
        for key, val in isbn_map.items():
            if key in title:
                matched_isbn = val
                break
        
        if matched_isbn and (not current_isbn or current_isbn == '0' or len(current_isbn) < 10):
            row['ISBN13'] = matched_isbn
            if not row.get('ISBN'): # Also update ISBN10 column if empty, though we have 13 mainly
                # We can try to convert or just leave it. User asked for ISBN13.
                pass 
            updated_count += 1
            
        writer.writerow(row)

print(f"Updated {updated_count} rows in {output_csv}")
