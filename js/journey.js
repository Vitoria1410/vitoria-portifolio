'use strict';

(() => {
  const section = document.querySelector('#caminho');
  if (!section) return;

  const tabs = [...section.querySelectorAll('.journey-tab-btn')];
  const panels = [...section.querySelectorAll('.journey-panel')];
  const jumpBtn = section.querySelector('#jump-to-gamejam');

  function switchTab(targetId) {
    tabs.forEach(tab => {
      const match = tab.getAttribute('aria-controls') === targetId;
      tab.classList.toggle('is-active', match);
      tab.setAttribute('aria-selected', String(match));
      tab.tabIndex = match ? 0 : -1;
    });

    panels.forEach(panel => {
      const match = panel.id === targetId;
      panel.classList.toggle('is-active', match);
      panel.hidden = !match;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('aria-controls');
      switchTab(targetId);
    });

    tab.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const nextIndex = event.key === 'ArrowRight'
          ? (index + 1) % tabs.length
          : (index - 1 + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        nextTab.focus();
        switchTab(nextTab.getAttribute('aria-controls'));
      }
    });
  });

  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      switchTab('panel-gamejam');
      const gamejamTab = document.querySelector('#tab-gamejam');
      gamejamTab?.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
