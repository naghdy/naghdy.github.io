# _tools (not published)

One-off helpers from December 2025 used to build `images/covers/`. They expect to run from the repo root with the CSV they name next to them; copy it out of `data/` first.

- `data/books.csv`, `data/books_updated.csv`, `data/updated_books.csv`: Goodreads exports (three versions)
- `fetch_isbns.py`, `find_missing_isbns.py`, `update_csv*.py`: fill in missing ISBNs
- `download_covers.*`: fetch covers into `images/covers/`
