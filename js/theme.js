'use strict';
(() => {
  const root = document.documentElement;
  // Every opening begins in light mode; the visitor can switch during the visit.
  let theme = 'light';
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
      apply();
    });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  addEventListener('pageshow',event=>{if(event.persisted){theme='light';apply();}});
})();
