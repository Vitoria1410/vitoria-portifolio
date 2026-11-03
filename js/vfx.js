'use strict';
// Camada de efeitos: progresso da página, texto que acende ao rolar, odômetro,
// bolhas de luz, botões magnéticos e indicador de seções.
// Nada aqui é essencial: sem JavaScript ou com movimento reduzido o site continua completo.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));

  /* ---------- Barra de progresso ---------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i></i>';
  document.body.append(bar);

  /* ---------- Texto que acende palavra por palavra ---------- */
  const lit = [];
  function splitWords(root) {
    const words = [];
    (function walk(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
            const word = document.createElement('span');
            word.className = 'w';
            word.textContent = part;
            fragment.append(word);
            words.push(word);
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
    return words;
  }
  if (!reduced.matches) {
    document.querySelectorAll('.about-copy p, .journey-intro, .gallery-intro p, #universo .section-heading > p, #atelie .section-heading p').forEach(element => {
      const words = splitWords(element);
      if (!words.length) return;
      element.classList.add('wl');
      lit.push({ element, words, shown: 0 });
    });
  }
  function updateWords() {
    const height = innerHeight;
    lit.forEach(item => {
      const rect = item.element.getBoundingClientRect();
      const progress = clamp((height * .9 - rect.top) / (height * .38 + rect.height * .6));
      const count = Math.round(progress * (item.words.length + 1));
      if (count === item.shown) return;
      item.words.forEach((word, index) => word.classList.toggle('on', index < count));
      item.shown = count;
    });
  }

  /* ---------- Odômetro com números reais do próprio portfólio ---------- */
  const counts = {
    fotos: document.querySelectorAll('.photo-card:not(.video-card)').length,
    videos: document.querySelectorAll('.photo-card.video-card').length,
    criacoes: document.querySelectorAll('.line-item').length
  };
  const numbers = document.querySelector('.numbers');
  if (numbers) {
    const columns = [];
    numbers.querySelectorAll('[data-count]').forEach(dd => {
      const value = counts[dd.dataset.count];
      if (!Number.isFinite(value) || value <= 0) return;
      const text = String(value);
      dd.textContent = '';
      const spoken = document.createElement('span');
      spoken.className = 'sr-only';
      spoken.textContent = text;
      const odometer = document.createElement('span');
      odometer.className = 'odo';
      odometer.setAttribute('aria-hidden', 'true');
      [...text].forEach((digit, index) => {
        const cell = document.createElement('span');
        cell.className = 'odo-digit';
        const column = document.createElement('span');
        column.className = 'odo-col';
        column.style.setProperty('--d', `${index * 160}ms`);
        column.dataset.n = digit;
        for (let n = 0; n < 10; n++) { const line = document.createElement('span'); line.textContent = n; column.append(line); }
        cell.append(column);
        odometer.append(cell);
        columns.push(column);
      });
      dd.append(spoken, odometer);
    });
    const roll = () => columns.forEach(column => column.style.setProperty('--n', column.dataset.n));
    if (reduced.matches || !('IntersectionObserver' in window)) roll();
    else {
      const watcher = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { roll(); watcher.disconnect(); }
      }, { threshold: .5 });
      watcher.observe(numbers);
    }
  }

  /* ---------- Bolhas de luz (bokeh) ---------- */
  const journey = document.querySelector('.journey');
  if (journey && !reduced.matches) {
    const orbs = document.createElement('div');
    orbs.className = 'orbs';
    orbs.setAttribute('aria-hidden', 'true');
    const colors = ['238 178 208', '196 216 230', '244 220 163'];
    let seed = 7;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const total = matchMedia('(max-width: 700px)').matches ? 5 : 9;
    for (let i = 0; i < total; i++) {
      const orb = document.createElement('i');
      orb.className = 'orb';
      const size = 40 + random() * 150;
      orb.style.cssText = `--x:${(random() * 96).toFixed(1)}%;--y:${(random() * 92).toFixed(1)}%;--s:${size.toFixed(0)}px;` +
        `--c:${colors[i % 3]};--b:${(2 + random() * 8).toFixed(1)}px;--t:${(11 + random() * 13).toFixed(1)}s;` +
        `--d:${(-random() * 14).toFixed(1)}s;--dx:${((random() - .5) * 120).toFixed(0)}px;--dy:${((random() - .5) * 140).toFixed(0)}px`;
      orbs.append(orb);
    }
    journey.prepend(orbs);
  }

  /* ---------- Botões magnéticos (só mouse) ---------- */
  if (!reduced.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.hero-actions a, .nav-cta, .gallery-end a, .atelier-bottom a').forEach(element => {
      element.addEventListener('pointermove', event => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
        const y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
        element.style.translate = `${(x * 14).toFixed(1)}px ${(y * 10).toFixed(1)}px`;
      });
      element.addEventListener('pointerleave', () => {
        const from = getComputedStyle(element).translate;
        element.style.translate = '';
        if (from && from !== 'none') element.animate([{ translate: from }, { translate: '0 0' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.3,1)' });
      });
    });
  }

  /* ---------- Indicador de seções ---------- */
  const sections = [['sobre', 'quem sou'], ['universo', 'meu universo'], ['galeria', 'fotografias'], ['atelie', 'criações'], ['caminho', 'meu caminho'], ['arte', 'deixe um traço'], ['contato', 'contato']]
    .filter(([id]) => document.getElementById(id));
  const hud = document.createElement('nav');
  hud.className = 'hud';
  hud.setAttribute('aria-label', 'Atalhos de seção');
  sections.forEach(([id, label]) => {
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.innerHTML = `<span>${label}</span>`;
    link.setAttribute('aria-label', label);
    hud.append(link);
  });
  document.body.append(hud);
  if ('IntersectionObserver' in window) {
    const links = new Map([...hud.querySelectorAll('a')].map(link => [link.getAttribute('href').slice(1), link]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.removeAttribute('aria-current'));
        links.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => observer.observe(document.getElementById(id)));
  }

  /* ---------- Um único laço de rolagem para tudo ---------- */
  let waiting = false;
  function update() {
    waiting = false;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    bar.style.setProperty('--progress', clamp(scrollY / max).toFixed(4));
    hud.classList.toggle('is-on', scrollY > innerHeight * .6);
    updateWords();
  }
  const schedule = () => { if (!waiting) { waiting = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  document.fonts?.ready.then(schedule);
  update();
})();
