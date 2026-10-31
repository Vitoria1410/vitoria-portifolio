'use strict';
(() => {
  const gallery = document.querySelector('#galeria');
  const layer = gallery.querySelector('.gallery-petals');
  const canvas = document.createElement('canvas');
  canvas.className = 'gallery-trail';
  canvas.setAttribute('aria-hidden', 'true');
  layer.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const points = [];
  let frame = null, previous = null, width = 1, height = 1;
  const lifetime = 1100;
  function resize() {
    const rect = layer.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    // Diffuse paint needs no high-resolution framebuffer.
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clear();
  }
  function clear() {
    points.length = 0; previous = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; ctx.clearRect(0, 0, width, height);
    gallery.classList.remove('trail-active');
  }
  function render(now) {
    frame = null;
    if (document.hidden || reduced.matches || !finePointer.matches) { clear(); return; }
    while (points.length && now - points[0].born >= lifetime) points.shift();
    ctx.clearRect(0, 0, width, height);
    for (const point of points) {
      const age = (now - point.born) / lifetime;
      const radius = 38 + age * 52;
      const alpha = (1 - age) ** 2 * .22;
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, `rgba(216,112,168,${alpha})`);
      gradient.addColorStop(.45, `rgba(231,151,187,${alpha * .65})`);
      gradient.addColorStop(1, 'rgba(244,190,212,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    }
    if (points.length) frame = requestAnimationFrame(render);
  }
  gallery.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches || !finePointer.matches) return;
    if (event.target.closest('a,button,input,video,canvas,.photo-card,.gallery-controls,.garden-curtain')) {
      previous = null; gallery.classList.remove('trail-active'); return;
    }
    const rect = layer.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, born: performance.now() };
    if (point.y < 0 || point.y > height || point.x < 0 || point.x > width) return;
    gallery.classList.add('trail-active');
    const start = previous || point;
    const steps = Math.min(8, Math.max(1, Math.ceil(Math.hypot(point.x - start.x, point.y - start.y) / 14)));
    for (let i = 1; i <= steps; i++) points.push({ x: start.x + (point.x - start.x) * i / steps, y: start.y + (point.y - start.y) * i / steps, born: point.born });
    if (points.length > 80) points.splice(0, points.length - 80);
    previous = point;
    if (frame === null) frame = requestAnimationFrame(render);
  });
  gallery.addEventListener('pointerleave', () => { previous = null; gallery.classList.remove('trail-active'); });
  addEventListener('scroll', () => { previous = null; }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  reduced.addEventListener('change', clear); finePointer.addEventListener('change', clear);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(layer);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { if (!entries[0].isIntersecting) clear(); }).observe(gallery);
  resize();
})();
