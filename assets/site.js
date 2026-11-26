/* naghdy.com: theme toggle, header shadow, bookshelf filter, and a temporary
   fallback that loads Patents/Essays from the old Google Sheets while their
   _data files are still empty. */

(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);

  function initTheme() {
    const btn = $('#theme-toggle');
    if (!btn) return;
    const apply = (t) => {
      document.documentElement.dataset.theme = t;
      btn.setAttribute('aria-pressed', String(t === 'dark'));
    };
    apply(document.documentElement.dataset.theme || 'light');
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('theme', next); } catch { /* storage blocked */ }
    });
  }

  function initHeader() {
    const h = $('.site-header');
    if (!h) return;
    const on = () => h.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', on, { passive: true });
    on();
  }

  function initShelfFilter() {
    const shelf = $('#bookshelf');
    const chips = document.querySelectorAll('.chip[data-shelf]');
    if (!shelf || !chips.length) return;
    const set = (mode, push) => {
      shelf.classList.toggle('only-favs', mode === 'favourites');
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.shelf === mode)));
      if (push) {
        const url = new URL(location.href);
        if (mode === 'favourites') url.searchParams.set('shelf', 'favourites'); else url.searchParams.delete('shelf');
        history.replaceState(null, '', url);
      }
    };
    chips.forEach((c) => c.addEventListener('click', () => set(c.dataset.shelf, true)));
    set(new URLSearchParams(location.search).get('shelf') === 'favourites' ? 'favourites' : 'all');
  }

  /* ---- Temporary Sheets fallback (remove once _data/patents.yml and essays.yml are filled) ---- */

  const SHEETS = {
    patents: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT1ZBRf3DbG5b4x0ohqVapw-Y0U_nK5iIPcLp4MLMopcdmp9V5mXWXzKsp21jB7aJ4rorZStDjYOgBw/pub?gid=0&single=true&output=csv',
    essays: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAQvVVzKKsq3ucgsBlTIeKYZPjXYtWUL3zTj0lsccneaDxCfOE04tRjkT1rr21Cftxate6hNy0TQ1b/pub?gid=0&single=true&output=csv'
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
  const toDate = (s) => { const d = new Date(String(s || '').trim().replace(/-/g, '/')); return isNaN(d) ? null : d; };

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  async function loadFallback(el) {
    const feed = el.dataset.feed;
    if (!SHEETS[feed]) return;
    try {
      const res = await fetch(SHEETS[feed]);
      if (!res.ok) throw new Error(res.status);
      let rows = parseCSV(await res.text());
      if (rows.length && /title|date|url/i.test(rows[0].join(','))) rows = rows.slice(1);
      const items = rows.map((r) => feed === 'patents'
        ? { id: r[0], title: r[1], date: r[2], url: r[3] }
        : { url: r[0], title: r[1], author: r[2], date: r[3] })
        .sort((a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0));
      if (!items.length) { el.innerHTML = '<p class="muted small">Nothing here yet.</p>'; return; }
      el.innerHTML = `<ul class="entries">${items.map((it) => {
        const d = toDate(it.date);
        const label = d ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : esc(it.date);
        const href = safeUrl(it.url);
        const title = href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(it.title || 'Untitled')}</a>` : `<span>${esc(it.title || 'Untitled')}</span>`;
        return `<li class="entry">${d ? `<time datetime="${d.toISOString().slice(0, 10)}">${label}</time>` : `<span class="date">${label}</span>`}<div>${title}${it.author ? `<span class="entry-meta">${esc(it.author)}</span>` : ''}${it.id ? `<span class="entry-tag">${esc(it.id)}</span>` : ''}</div></li>`;
      }).join('')}</ul>`;
    } catch {
      el.closest('.section')?.setAttribute('hidden', '');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeader();
    initShelfFilter();
    document.querySelectorAll('.entries-fallback[data-feed]').forEach(loadFallback);
  });
})();
