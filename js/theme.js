'use strict';
(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let saved = null;
  try { saved = localStorage.getItem('vitoria-theme'); } catch { /* Use the system preference if storage is unavailable. */ }
  if (saved !== 'dark' && saved !== 'light') saved = null;
  let theme = saved || (system.matches ? 'dark' : 'light');
  let button = null;
  function apply() {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17171a' : '#f5f2eb');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
      button.textContent = dark ? '☼ claro' : '☾ escuro';
    }
  }
  apply(); // Before the stylesheet loads, avoiding a flash of the wrong theme.
  function initialize() {
    button = document.querySelector('#theme-toggle');
    if (!button) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      saved = theme;
      try { localStorage.setItem('vitoria-theme', theme); } catch { /* Theme still works for this visit. */ }
      apply();
    });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  system.addEventListener('change', event => { if (!saved) { theme = event.matches ? 'dark' : 'light'; apply(); } });
})();
