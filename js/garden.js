'use strict';

// Each blossom is a separate sprite, with its own wind, depth and release time.
function createFlowerCurtain(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  let width = 1, height = 1, progress = 0, active = false, paused = false;
  let frame = null, previous = 0, clock = 0;
  const narrow = matchMedia('(max-width: 700px)').matches;
  const count = narrow ? 150 : 300;
  let seed = 42;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const blossoms = Array.from({ length: count }, (_, i) => ({
    u: (i + random()) / count, v: random(), depth: .55 + random() * .65,
    phase: random() * Math.PI * 2, spin: (random() - .5) * 14,
    drift: (random() - .5) * 1.5, variant: i % 4, jitter: random()
  }));
  const sprites = ['#f3bfd5', '#e9a5c7', '#f8dce9', '#dca2c8'].map(color => {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 144;
    const c = tile.getContext('2d');
    c.translate(72, 72);
    for (let petal = 0; petal < 5; petal++) {
      c.save(); c.rotate(petal * Math.PI * 2 / 5);
      const gradient = c.createRadialGradient(-5, -38, 1, 0, -20, 40);
      gradient.addColorStop(0, '#fff9fc'); gradient.addColorStop(.5, color); gradient.addColorStop(1, '#bc699b');
      c.fillStyle = gradient; c.strokeStyle = '#fff1f8bb'; c.lineWidth = .7;
      c.beginPath(); c.moveTo(0, 5); c.bezierCurveTo(-31, -12, -30, -45, -9, -51);
      c.lineTo(0, -44); c.lineTo(9, -51); c.bezierCurveTo(30, -45, 31, -12, 0, 5);
      c.fill(); c.stroke();
      c.strokeStyle = '#bd71a045'; c.beginPath(); c.moveTo(0, -3); c.quadraticCurveTo(-4, -23, -8, -38); c.stroke();
      c.restore();
    }
    c.fillStyle = '#b66d8b'; c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 9; i++) {
      const a = i * Math.PI * 2 / 9, x = Math.cos(a) * 13, y = Math.sin(a) * 13;
      c.strokeStyle = '#b08865'; c.beginPath(); c.moveTo(0, 0); c.lineTo(x, y); c.stroke();
      c.fillStyle = '#efd393'; c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fill();
    }
    return tile;
  });
  const clamp = value => Math.max(0, Math.min(1, value));
  function render(time) {
    frame = null;
    if (!active || document.hidden) { previous = 0; return; }
    if (!paused && time - previous < 32) { schedule(); return; }
    if (!paused) clock += Math.min(64, time - (previous || time)) / 1000;
    previous = time;
    context.clearRect(0, 0, width, height);
    const columns = Math.ceil(Math.sqrt(count * width / height));
    const rows = Math.ceil(count / columns);
    blossoms.forEach((b, i) => {
      const u = (i % columns + .15 + b.jitter * .7) / columns;
      const v = (Math.floor(i / columns) + .1 + b.v * .8) / rows;
      const delay = Math.min(.25, Math.hypot(u - .5, v - .45) * .28 + b.jitter * .04);
      const t = clamp((progress - delay) / (1 - delay));
      const release = t * t * (3 - 2 * t);
      const wind = Math.sin(clock * .8 + b.phase);
      const flutter = paused ? 0 : wind * (2 + release * 12);
      const x = u * width + release * (b.drift * width * .7 + Math.sin(t * 5 + b.phase) * width * .15) + flutter;
      const y = v * height + release * (height * (1.2 + b.depth) + Math.cos(t * 4 + b.phase) * 65);
      const size = (narrow ? 47 : 65) * b.depth * (1 - release * .35);
      const alpha = 1 - Math.pow(t, 2.4);
      if (alpha < .01) return;
      context.save(); context.globalAlpha = alpha;
      context.translate(x, y); context.rotate(b.phase + release * b.spin + (paused ? 0 : wind * .06));
      context.scale(Math.max(.18, Math.abs(Math.cos(release * 5 + b.phase)) * .55 + .45), 1);
      context.drawImage(sprites[b.variant], -size / 2, -size / 2, size, size);
      context.restore();
    });
    if (!paused && progress < 1) schedule();
  }
  function schedule() { if (frame === null && active && !document.hidden) frame = requestAnimationFrame(render); }
  return {
    resize() {
      const rect = canvas.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0); schedule();
    },
    update(value, visible, stopped) {
      progress = value; active = visible; paused = stopped;
      if ((!active || document.hidden) && frame !== null) { cancelAnimationFrame(frame); frame = null; previous = 0; }
      schedule();
    }
  };
}

(() => {
  const gallery = document.querySelector('#galeria');
  const curtain = gallery.querySelector('.garden-curtain');
  const openButton = document.querySelector('#open-garden');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const painter = createFlowerCurtain(document.querySelector('#blossom-canvas'));
  const track = document.createElement('div'); track.className = 'gallery-pin-track'; gallery.before(track); track.append(gallery);
  let forcedOpen = false, inView = false, pending = null;
  let distance = Math.max(1, innerHeight * .95);
  function measure() {
    distance = Math.max(1, innerHeight * .95);
    const heading = gallery.querySelector('.section-heading');
    gallery.style.setProperty('--garden-top', `${Math.max(0, heading.offsetTop + heading.offsetHeight + 18)}px`);
    track.style.height = reduced.matches ? 'auto' : `${gallery.offsetHeight + distance}px`;
    painter?.resize();
  }
  function draw() {
    pending = null;
    const progress = forcedOpen || reduced.matches ? 1 : Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
    curtain.style.setProperty('--curtain-opacity', String(Math.pow(1 - progress, 1.7)));
    curtain.style.setProperty('--invitation-opacity', String(Math.max(0, 1 - progress * 2.5)));
    gallery.classList.toggle('garden-open', progress >= 1); openButton.disabled = progress >= 1;
    painter?.update(progress, inView && progress < 1 && !reduced.matches, gallery.classList.contains('petals-paused'));
  }
  function schedule() { if (pending === null) pending = requestAnimationFrame(draw); }
  function skip() {
    forcedOpen = true;
    if (!reduced.matches) { const top = track.getBoundingClientRect().top; if (top > -distance) window.scrollTo({ top: scrollY + top + distance, behavior: 'instant' }); }
    draw();
  }
  openButton.addEventListener('click', () => { skip(); gallery.querySelector('[data-filter]').focus({ preventScroll: true }); });
  gallery.addEventListener('focusin', event => { if (!curtain.contains(event.target) && !forcedOpen) skip(); });
  gallery.querySelector('#petals-toggle').addEventListener('click', schedule);
  addEventListener('scroll', () => { if (inView) schedule(); }, { passive: true });
  addEventListener('resize', () => { measure(); schedule(); }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => { measure(); schedule(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); schedule(); }).observe(gallery);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }).observe(track);
  else inView = true;
  gallery.classList.add('garden-ready'); measure(); draw();
  document.fonts?.ready.then(() => { measure(); schedule(); });
})();
