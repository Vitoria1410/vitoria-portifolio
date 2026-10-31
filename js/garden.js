'use strict';
(() => {
  const gallery = document.querySelector('#galeria');
  const curtain = gallery.querySelector('.garden-curtain');
  const openButton = document.querySelector('#open-garden');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let forcedOpen = false;
  let inView = false;
  let pending = null;
  function draw() {
    pending = null;
    const distance = Math.max(1, innerHeight * .8);
    const progress = forcedOpen || reduced.matches ? 1 : Math.max(0, Math.min(1, -gallery.getBoundingClientRect().top / distance));
    const eased = progress * progress * (3 - 2 * progress);
    curtain.style.setProperty('--wing-x', `${-eased * 105}vw`);
    curtain.style.setProperty('--wing-y', `${eased * 12}vh`);
    curtain.style.setProperty('--wing-angle', `${-eased * 18}deg`);
    curtain.style.setProperty('--curtain-opacity', String(1 - eased));
    curtain.style.setProperty('--invitation-opacity', String(Math.max(0, 1 - progress * 3)));
    gallery.classList.toggle('garden-open', progress >= 1);
    openButton.disabled = progress >= 1;
  }
  function schedule() {
    if (pending === null) pending = requestAnimationFrame(draw);
  }
  openButton.addEventListener('click', () => {
    forcedOpen = true;
    draw();
    const firstFilter = gallery.querySelector('[data-filter]');
    firstFilter.focus({ preventScroll: true });
  });
  // Keyboard users can explore normally without tabbing behind the flowers.
  gallery.addEventListener('focusin', event => {
    if (!curtain.contains(event.target)) { forcedOpen = true; draw(); }
  });
  addEventListener('scroll', () => { if (inView) schedule(); }, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) schedule();
    }).observe(gallery);
  } else { inView = true; }
  draw();
  gallery.classList.add('garden-ready');
})();
