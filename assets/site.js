/* naghdy.com: theme toggle, header shadow and bookshelf filter. */

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

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeader();
    initShelfFilter();
  });
})();
