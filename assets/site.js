/* naghdy.com: theme, tabs, and the Bookshelf / Patents / Essays feeds.
   Each feed is a Google Sheet published as CSV (File > Share > Publish to web). */

(() => {
  'use strict';

  const FEEDS = {
    books: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRO-DmKFr8w-VvQPBiQIuqGmHfDzDfCT6bjA63_0r2vkz8SOTv0t-cdw9PEDWzEpy08Vx9yUD_M6AiM/pub?gid=0&single=true&output=csv',
    essays: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAQvVVzKKsq3ucgsBlTIeKYZPjXYtWUL3zTj0lsccneaDxCfOE04tRjkT1rr21Cftxate6hNy0TQ1b/pub?gid=0&single=true&output=csv',
    patents: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT1ZBRf3DbG5b4x0ohqVapw-Y0U_nK5iIPcLp4MLMopcdmp9V5mXWXzKsp21jB7aJ4rorZStDjYOgBw/pub?gid=0&single=true&output=csv'
  };
  const CACHE_PREFIX = 'naghdy:feed:';
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- helpers ---------- */

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const safeUrl = (u) => {
    try {
      const url = new URL(String(u || '').trim());
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch { return null; }
  };

  // RFC 4180-ish CSV parser: handles quotes, escaped quotes and newlines inside cells.
  function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
        } else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  const parseDate = (s) => {
    if (!s) return null;
    const d = new Date(String(s).trim().replace(/-/g, '/'));
    return isNaN(d.getTime()) ? null : d;
  };
  const monthYear = (s) => {
    const d = parseDate(s);
    return d ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : (s || '');
  };
  const isoDate = (s) => {
    const d = parseDate(s);
    return d ? d.toISOString().slice(0, 10) : '';
  };

  function pastelFor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 45% 82%)`;
  }

  // Fetch a feed; show the cached copy first, then refresh it in the background.
  async function loadFeed(name, render, onError) {
    let cached = null;
    try { cached = localStorage.getItem(CACHE_PREFIX + name); } catch { /* storage blocked */ }
    if (cached) render(cached);
    try {
      const text = await fetchText(FEEDS[name]);
      if (text !== cached) {
        render(text);
        try { localStorage.setItem(CACHE_PREFIX + name, text); } catch { /* quota or blocked */ }
      }
    } catch (err) {
      if (!cached) onError(err);
    }
  }

  async function fetchText(url) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
      throw new Error(`HTTP ${res.status}`);
    } catch {
      // Fallback for networks that block Google's CSV redirect.
      const res = await fetch('https://corsproxy.io/?' + encodeURIComponent(url));
      if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
      return await res.text();
    }
  }

  const setCount = (tab, n) => {
    const el = $(`#tab-${tab} .count`);
    if (el) el.textContent = n ? String(n) : '';
  };

  /* ---------- theme ---------- */

  function initTheme() {
    const btn = $('#theme-toggle');
    if (!btn) return;
    const apply = (theme) => {
      document.documentElement.dataset.theme = theme;
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      const meta = $('meta[name="theme-color"]:not([media])');
      if (meta) meta.content = theme === 'dark' ? '#0e0e10' : '#ffffff';
    };
    apply(document.documentElement.dataset.theme || 'light');
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('theme', next); } catch { /* ignore */ }
    });
  }

  /* ---------- tabs ---------- */

  function initTabs() {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      history.replaceState(null, '', '#' + tab.dataset.hash);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
        else if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
    const fromHash = (scroll) => {
      const t = tabs.find((x) => '#' + x.dataset.hash === location.hash);
      if (!t) return;
      select(t);
      if (scroll) $('#shelf')?.scrollIntoView();
    };
    window.addEventListener('hashchange', () => fromHash(true));
    fromHash(true);
  }

  /* ---------- bookshelf ---------- */

  function parseBooks(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) return [];
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name, fallback) => { const i = head.indexOf(name); return i > -1 ? i : fallback; };
    const c = {
      title: col('title', 1), author: col('author', 2), isbn: col('isbn', 5), isbn13: col('isbn13', 6),
      year: col('original publication year', 13), read: col('date read', 14), added: col('date added', 15),
      shelf: col('exclusive shelf', 18)
    };
    const clean = (s) => String(s || '').replace(/[^0-9Xx]/g, '').toUpperCase();
    return rows.slice(1).map((r) => ({
      title: (r[c.title] || 'Untitled').trim(),
      author: (r[c.author] || '').trim(),
      isbn10: clean(r[c.isbn]),
      isbn13: clean(r[c.isbn13]),
      year: (r[c.year] || '').trim(),
      read: (r[c.read] || '').trim(),
      added: (r[c.added] || '').trim(),
      shelf: (r[c.shelf] || '').trim().toLowerCase()
    })).filter((b) => b.shelf === 'read');
  }

  function renderBooks(text) {
    const root = $('#books');
    const books = parseBooks(text);
    setCount('books', books.length);
    if (!books.length) { root.innerHTML = '<p class="status">No books yet.</p>'; return; }

    const yearOf = (b) => ((b.read || b.added).match(/\d{4}/) || ['Undated'])[0];
    const when = (b) => (parseDate(b.read) || parseDate(b.added) || new Date(0)).getTime();
    const groups = new Map();
    books.sort((a, b) => when(b) - when(a)).forEach((b) => {
      const y = yearOf(b);
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push(b);
    });

    root.innerHTML = '';
    Array.from(groups.keys()).sort((a, b) => (a === 'Undated') - (b === 'Undated') || b - a).forEach((year) => {
      const list = groups.get(year);
      const section = document.createElement('section');
      section.className = 'year';
      section.setAttribute('aria-labelledby', `year-${year}`);
      section.innerHTML = `<h3 class="year-title" id="year-${escapeHtml(year)}">${escapeHtml(year)}<span>${list.length} ${list.length === 1 ? 'book' : 'books'}</span></h3>`;
      const ul = document.createElement('ul');
      ul.className = 'covers';
      list.forEach((book) => {
        const li = document.createElement('li');
        li.innerHTML = `<button type="button" class="book" aria-label="${escapeHtml(book.title)}${book.author ? ' by ' + escapeHtml(book.author) : ''}">${coverHtml(book)}</button>`;
        li.firstElementChild.addEventListener('click', () => openBook(book));
        observeCover(li.querySelector('img'), book);
        ul.appendChild(li);
      });
      section.appendChild(ul);
      root.appendChild(section);
    });
  }

  const coverHtml = (book) => `
    <span class="cover">
      <span class="placeholder" style="background:${pastelFor(book.title)}" aria-hidden="true">${escapeHtml(book.title)}</span>
      <img alt="" decoding="async">
    </span>`;

  // Covers load only when they scroll near the viewport, so 200+ books don't fire 200+ lookups.
  const coverObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        coverObserver.unobserve(e.target);
        loadCover(e.target, e.target._book);
      });
    }, { rootMargin: '400px 0px' })
    : null;

  function observeCover(img, book) {
    if (!coverObserver) return loadCover(img, book);
    img._book = book;
    coverObserver.observe(img);
  }

  // Order: local ISBN-10, local ISBN-13, Open Library, Google Books by ISBN, Google Books by title.
  function loadCover(img, book) {
    const ids = [...new Set([book.isbn10, book.isbn13].filter((x) => x && x.length >= 10))];
    const steps = [
      ...ids.map((id) => () => `images/covers/${id}.jpg`),
      ...ids.map((id) => () => `https://covers.openlibrary.org/b/isbn/${id}-M.jpg?default=false`),
      ...ids.map((id) => () => googleBooks(`isbn:${id}`)),
      () => googleBooks(`intitle:${book.title}${book.author ? ` inauthor:${book.author}` : ''}`)
    ];
    let i = 0;
    const next = async () => {
      if (i >= steps.length) return; // keep the coloured placeholder
      let src = null;
      try { src = await steps[i++](); } catch { src = null; }
      if (!src) return next();
      img.onload = () => {
        if (img.naturalWidth > 1) { img.classList.add('is-loaded'); img.alt = `Cover of ${book.title}`; }
        else next();
      };
      img.onerror = () => next();
      img.src = src;
    };
    next();
  }

  async function googleBooks(q) {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?maxResults=1&q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const link = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    return link ? link.replace(/^http:/, 'https:') : null;
  }

  function openBook(book) {
    const dlg = $('#book-dialog');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const q = encodeURIComponent(book.isbn13 || book.isbn10 || book.title);
    $('#book-dialog-title').textContent = book.title;
    $('#book-dialog-author').textContent = book.author;
    const details = [];
    if (book.year) details.push(['Published', escapeHtml(book.year)]);
    if (book.read) details.push(['Read', escapeHtml(monthYear(book.read))]);
    $('#book-dialog-details').innerHTML = details.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#book-link-goodreads').href = `https://www.goodreads.com/search?q=${q}`;
    $('#book-link-amazon').href = `https://www.amazon.com/s?k=${q}`;
    $('#book-link-audible').href = `https://www.audible.com/search?keywords=${encodeURIComponent(book.title)}`;
    const holder = $('#book-dialog-cover');
    holder.innerHTML = coverHtml(book);
    loadCover(holder.querySelector('img'), book);
    dlg.showModal();
  }

  function initDialog() {
    const dlg = $('#book-dialog');
    if (!dlg) return;
    $('#book-dialog-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- essays & patents ---------- */

  function renderEssays(text) {
    const rows = parseCSV(text).slice(1); // first row is the header
    const items = rows.map((r) => ({ url: r[0], title: r[1] || 'Untitled', author: r[2] || '', date: r[3] || '' }))
      .sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
    setCount('essays', items.length);
    renderEntries($('#essays'), items, (it) => `${linkHtml(it.url, it.title)}${it.author ? `<span class="meta">by ${escapeHtml(it.author)}</span>` : ''}`);
  }

  function renderPatents(text) {
    let rows = parseCSV(text);
    if (rows.length && /title|date/i.test(rows[0].join(','))) rows = rows.slice(1);
    const items = rows.map((r) => ({ id: r[0] || '', title: r[1] || 'Untitled', date: r[2] || '', url: r[3] }))
      .sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
    setCount('patents', items.length);
    renderEntries($('#patents'), items, (it) => `${linkHtml(it.url, it.title)}${it.id ? `<span class="tag">${escapeHtml(it.id)}</span>` : ''}`);
  }

  const linkHtml = (url, text) => {
    const href = safeUrl(url);
    return href
      ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`
      : `<span>${escapeHtml(text)}</span>`;
  };

  function renderEntries(root, items, body) {
    if (!items.length) { root.innerHTML = '<p class="status">Nothing here yet.</p>'; return; }
    root.innerHTML = `<ul class="entries">${items.map((it) => {
      const iso = isoDate(it.date);
      const label = escapeHtml(monthYear(it.date));
      return `<li class="entry">${iso ? `<time datetime="${iso}">${label}</time>` : `<span class="date">${label}</span>`}<div>${body(it)}</div></li>`;
    }).join('')}</ul>`;
  }

  const failed = (sel, what) => () => {
    const el = $(sel);
    if (el) el.innerHTML = `<p class="status">Couldn't load ${what} right now. Try refreshing.</p>`;
  };

  /* ---------- chrome ---------- */

  function initHeader() {
    const header = $('.site-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initFooter() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
    // GitHub Pages sends Last-Modified, so this tracks the latest deploy without hand edits.
    const updated = $('#updated');
    const lm = new Date(document.lastModified);
    if (updated && !isNaN(lm) && Date.now() - lm.getTime() > 60 * 1000) {
      updated.dateTime = lm.toISOString().slice(0, 10);
      updated.textContent = lm.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      updated.parentElement.hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeader();
    initTabs();
    initDialog();
    initFooter();
    loadFeed('books', renderBooks, failed('#books', 'the bookshelf'));
    loadFeed('patents', renderPatents, failed('#patents', 'patents'));
    loadFeed('essays', renderEssays, failed('#essays', 'essays'));
  });
})();
