# Working on naghdy.com

Jekyll site built by GitHub Pages from `main` and served at https://naghdy.com (custom domain set by `CNAME`; don't remove it). There is no local build step to run: GitHub builds on push. Anything pushed to `main` goes live within a minute or two, so work on a branch and merge only when the owner says to publish.

## Layout
- `index.html`: home page (intro, work, books, patents, essays, contact).
- `books.html`: the full bookshelf at `/books/`, grouped by year, with an All / Favourites filter (`?shelf=favourites`).
- `now.md`: a `/now` page drafted with placeholders. It has `published: false`, so it isn't built. Fill in the bracketed parts and delete that line to publish it; the nav link appears automatically.
- `_layouts/`: `default.html` (header, footer) and `page.html` (prose pages).
- `_includes/`: `head.html` (meta, Open Graph, JSON-LD), `icons.html` (SVG sprite, used as `<use href="#id">`), `book.html`, `entries.html`.
- `assets/site.css`: hand-written CSS with light/dark tokens on `:root` and `:root[data-theme="dark"]`. The palette comes from the portrait.
- `assets/site.js`: theme toggle, header shadow and bookshelf filter.
- `images/portrait/`: web-sized square crops of the portrait (192/384/768, webp and jpg). The original photo is not in the repo.
- `images/covers/<ISBN>.jpg`: local book covers. `images/og-card.png`: the share card.
- `404.html`, `robots.txt`, `sitemap.xml` (generated from the pages), `site.webmanifest`, `favicon.*`, `apple-touch-icon.png`.

## Content lives in `_data/`
- `experience.yml`: roles, newest first. The first entry feeds the JSON-LD job title.
- `links.yml`: profile links shown in the hero and contact section, and used as JSON-LD `sameAs`.
- `books.json`: books read, newest first. Fields: `title`, `author`, `published`, `read` (YYYY-MM-DD), `isbn`, `cover` (path or null), `goodreads` (book URL), `favourite` (true = shown with a star). Migrated from a Goodreads export dated Dec 2025; add newer books at the top.
- `patents.yml`: `id`, `title`, `date`, `url`.
- `essays.yml`: `title`, `author`, `date`, `url`.

## When editing
- Keep facts to what the owner has written; don't invent bios, titles or dates.
- If the name, role or description changes, update `_config.yml`, the hero in `index.html` and `images/og-card.png`.
