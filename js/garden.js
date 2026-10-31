'use strict';
(() => {
  const gallery = document.querySelector('#galeria');
  const curtain = gallery.querySelector('.garden-curtain');
  const openButton = document.querySelector('#open-garden');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const track = document.createElement('div');
  track.className = 'gallery-pin-track';
  gallery.before(track);
  track.append(gallery);
  let forcedOpen = false;
  let inView = false;
  let pending = null;
  let distance = Math.max(1, innerHeight * .95);

  function measure() {
    distance = Math.max(1, innerHeight * .95);
    const heading = gallery.querySelector('.section-heading');
    const top = Math.max(0, heading.offsetTop + heading.offsetHeight + 18);
    gallery.style.setProperty('--garden-top', `${top}px`);
    // The extra track holds the *real* gallery in place until the reveal ends.
    track.style.height = reduced.matches ? 'auto' : `${gallery.offsetHeight + distance}px`;
  }
  function draw() {
    pending = null;
    const progress = forcedOpen || reduced.matches ? 1 : Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
    const eased = progress * progress * (3 - 2 * progress);
    curtain.style.setProperty('--wing-x', `${-eased * 105}vw`);
    curtain.style.setProperty('--wing-y', `${eased * 12}vh`);
    curtain.style.setProperty('--wing-angle', `${-eased * 18}deg`);
    curtain.style.setProperty('--curtain-opacity', String(1 - eased));
    curtain.style.setProperty('--invitation-opacity', String(Math.max(0, 1 - progress * 2.5)));
    gallery.classList.toggle('garden-open', progress >= 1);
    openButton.disabled = progress >= 1;
  }
  function schedule() {
    if (pending === null) pending = requestAnimationFrame(draw);
  }
  function skip() {
    forcedOpen = true;
    // Move past only the reserved reveal distance, keeping the gallery aligned.
    if (!reduced.matches) {
      const top = track.getBoundingClientRect().top;
      if (top > -distance) window.scrollTo({ top: scrollY + top + distance, behavior: 'instant' });
    }
    draw();
  }
  openButton.addEventListener('click', () => {
    skip();
    gallery.querySelector('[data-filter]').focus({ preventScroll: true });
  });
  gallery.addEventListener('focusin', event => {
    if (!curtain.contains(event.target) && !forcedOpen) skip();
  });
  addEventListener('scroll', () => { if (inView) schedule(); }, { passive: true });
  addEventListener('resize', () => { measure(); schedule(); }, { passive: true });
  reduced.addEventListener('change', () => { measure(); schedule(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); schedule(); }).observe(gallery);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) schedule();
    }).observe(track);
  } else { inView = true; }
  gallery.classList.add('garden-ready');
  measure();
  draw();
  document.fonts?.ready.then(() => { measure(); schedule(); });
})();
