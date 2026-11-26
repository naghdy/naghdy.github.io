# Working on naghdy.com

Static site, no build step. GitHub Pages publishes `main` to https://naghdy.com (custom domain set by `CNAME`; don't remove it). Anything pushed to `main` goes live within a minute or two, so work on a branch and merge only when the owner says to publish.

## Layout
- `index.html`: single page. Experience is hand-written HTML. Icons come from the inline SVG sprite at the top of `<body>` (`<use href="#id">`).
- `assets/site.css`: hand-written CSS with light/dark tokens on `:root` and `:root[data-theme="dark"]`.
- `assets/site.js`: theme toggle, tabs, footer dates, and the three feeds.
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.*`, `apple-touch-icon.png`, `images/og-image.png`: SEO and sharing.
- `_config.yml`: Jekyll settings; underscore folders and the files listed under `exclude` are not published.
- `_tools/`: Python/JS/PowerShell scripts and Goodreads export CSVs used once to download covers. Run them from the repo root after copying the CSV they expect there.

## Content that updates without code changes
`assets/site.js` reads three Google Sheets published as CSV (URLs in `FEEDS`):
- **Bookshelf**: a Goodreads export (columns by header name: Title, Author, ISBN, ISBN13, Original Publication Year, Date Read, Date Added, Exclusive Shelf). Only rows on the `read` shelf show, grouped by year read.
- **Patents**: columns ID, Title, Date, URL (header row optional).
- **Essays**: columns URL, Title, Author, Date (header row required).

Covers try `images/covers/<ISBN10 or ISBN13>.jpg` first, then Open Library, then Google Books. Add a local JPG named by ISBN to fix a missing or wrong cover.

## When editing
- Keep facts to what the owner has written; don't invent bios, titles or dates.
- When the page changes, bump `dateModified` in the JSON-LD and `<lastmod>` in `sitemap.xml`.
- If you change the name, role or description, update the matching `<title>`, meta description, Open Graph tags and `images/og-image.png`.
- Escape anything rendered from the sheets (`escapeHtml`, `safeUrl` in `site.js`).
