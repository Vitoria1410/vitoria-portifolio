'use strict';

(() => {
  // Progressive enhancement: content remains visible when JS is unavailable.
  if ('IntersectionObserver' in window) {
    const elements = document.querySelectorAll('.about h2, .about-copy, .section-heading, .scrap, .little-things, .journey-grid > div, .puzzle-note, .contact-link');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    elements.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      if (element.classList.contains('scrap')) element.style.setProperty('--reveal-delay', `${index % 3 * 90}ms`);
      observer.observe(element);
    });
    document.documentElement.classList.add('motion-enabled');
  }

  const section = document.querySelector('.daydream');
  const canvas = document.querySelector('#daydream-canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const caption = section.querySelector('.particle-caption');
  const progressBar = section.querySelector('.daydream-progress span');
  const toggle = section.querySelector('#motion-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = matchMedia('(max-width: 700px)');
  let width = 1;
  let height = 1;
  let frame = null;
  let visible = false;
  let paused = false;
  let progress = 0;
  let lastFrame = 0;
  let clock = 0;
  const pointer = { x: -1000, y: -1000 };
  let seed = 2107;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const count = narrowScreen.matches ? 650 : 1200;
  const particles = Array.from({ length: count }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    // Overlapping ellipses make a soft, voluminous cloud silhouette.
    const lobes = [[-.22, .04, .18, .13], [-.08, -.04, .20, .19], [.1, -.06, .20, .20], [.27, .05, .17, .12]];
    const lobe = lobes[Math.floor(random() * lobes.length)];
    const cloud = { x: lobe[0] + Math.cos(angle) * radius * lobe[2], y: lobe[1] + Math.sin(angle) * radius * lobe[3] };
    const t = index / (count - 1);
    const wave = { x: (t - .5) * .92, y: Math.sin(t * Math.PI * 3.4) * .12 + (random() - .5) * .07 };
    let flower;
    if (t < .75) {
      const a = t / .75 * Math.PI * 2;
      const r = .19 + .065 * Math.cos(5 * a);
      flower = { x: Math.cos(a) * r, y: Math.sin(a) * r - .08 };
    } else if (t < .9) {
      const u = (t - .75) / .15;
      flower = { x: Math.sin(u * Math.PI) * .025, y: .04 + u * .36 };
    } else {
      const a = (t - .9) / .1 * Math.PI * 2;
      flower = { x: .065 + Math.cos(a) * .08, y: .24 + Math.sin(a) * .035 + Math.cos(a) * -.05 };
    }
    flower.x += (random() - .5) * .012;
    flower.y += (random() - .5) * .012;
    return { cloud, wave, flower, phase: random() * Math.PI * 2, size: .5 + random() * 1.1, alpha: .25 + random() * .6, blue: index % 5 === 0 };
  });
  const smooth = value => value * value * (3 - 2 * value);
  function updateProgress() {
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    progress = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, -rect.top / travel));
    progressBar.style.transform = `scaleX(${progress})`;
    caption.textContent = progress < .34 ? '01 / CABEÇA NAS NUVENS' : progress < .7 ? '02 / NO RITMO DO MAR' : '03 / A IDEIA VIROU TRAÇO';
  }
  function render(time) {
    frame = null;
    if (!visible || document.hidden) { lastFrame = 0; return; }
    const moving = !paused && !reducedMotion.matches;
    // Limit animation to about 30fps; avoid work while the section is offscreen.
    if (moving && time - lastFrame < 32) { schedule(); return; }
    if (moving) clock += Math.min(time - (lastFrame || time), 64) / 1000;
    lastFrame = time;
    context.clearRect(0, 0, width, height);
    const phase = progress < .5 ? 0 : 1;
    const blend = smooth(phase === 0 ? progress * 2 : (progress - .5) * 2);
    const scale = Math.min(width * .95, height * 1.3);
    for (const p of particles) {
      const from = phase === 0 ? p.cloud : p.wave;
      const to = phase === 0 ? p.wave : p.flower;
      let x = width / 2 + (from.x + (to.x - from.x) * blend) * scale;
      let y = height * .46 + (from.y + (to.y - from.y) * blend) * scale;
      if (moving) {
        const amplitude = 2.5 + Math.sin(progress * Math.PI) * 5;
        x += Math.sin(clock * .65 + p.phase) * amplitude;
        y += Math.cos(clock * .5 + p.phase) * amplitude;
        const dx = x - pointer.x, dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 75) {
          const force = (1 - distance / 75) * 23;
          x += dx / distance * force;
          y += dy / distance * force;
        }
      }
      context.globalAlpha = p.alpha;
      context.fillStyle = p.blue ? '#65879c' : '#454942';
      context.beginPath();
      context.arc(x, y, p.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (moving) schedule();
  }
  function schedule() {
    if (frame === null && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateProgress();
    schedule();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'retomar movimento ▷' : 'pausar movimento ⏸';
    schedule();
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  });
  canvas.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1000; });
  addEventListener('scroll', () => { if (visible) { updateProgress(); schedule(); } }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => { lastFrame = 0; schedule(); });
  reducedMotion.addEventListener('change', () => {
    toggle.hidden = reducedMotion.matches;
    updateProgress();
    schedule();
  });
  toggle.hidden = reducedMotion.matches;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) { updateProgress(); schedule(); }
      else if (frame !== null) { cancelAnimationFrame(frame); frame = null; lastFrame = 0; }
    }).observe(section);
  } else { visible = true; }
  resize();
})();
