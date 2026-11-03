'use strict';
// Navegação: cabeçalho que some ao rolar para baixo e volta ao subir,
// seção atual destacada no menu e menu do celular que fecha com Esc ou toque fora.
(() => {
  const header = document.querySelector('.header');
  const nav = document.querySelector('#navigation');
  const toggle = document.querySelector('.menu-toggle');
  if (!header || !nav || !toggle) return;

  function closeMenu(returnFocus) {
    if (!nav.classList.contains('open')) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'menu +';
    if (returnFocus) toggle.focus();
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) closeMenu(false); });

  // Cabeçalho fixo que se esconde ao descer e reaparece ao subir.
  let last = scrollY;
  let waiting = false;
  function update() {
    waiting = false;
    const y = scrollY;
    const delta = y - last;
    header.classList.toggle('is-stuck', y > 40);
    if (nav.classList.contains('open') || y < 120 || delta < -6) header.classList.remove('is-hidden');
    else if (delta > 8) header.classList.add('is-hidden');
    if (Math.abs(delta) > 6) last = y;
  }
  addEventListener('scroll', () => {
    if (!waiting) { waiting = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  // Destaca no menu a seção que está na tela.
  if ('IntersectionObserver' in window) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const byId = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const section = document.getElementById(id); if (section) observer.observe(section); });
  }
})();
