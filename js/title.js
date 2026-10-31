'use strict';
(() => {
  const title = document.querySelector('#hero-title');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const label = 'entre códigos e rabiscos.';
  title.setAttribute('aria-label', label);
  function split(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      for (const word of node.textContent.split(/(\s+)/)) {
        if (!word) continue;
        if (/^\s+$/.test(word)) { fragment.append(document.createTextNode(word)); continue; }
        const group = document.createElement('span');
        group.className = 'title-word';
        group.setAttribute('aria-hidden', 'true');
        for (const character of Array.from(word)) {
          const letter = document.createElement('span');
          letter.className = 'title-letter';
          letter.textContent = character;
          group.append(letter);
        }
        fragment.append(group);
      }
      node.replaceWith(fragment);
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('title-star')) {
      [...node.childNodes].forEach(split);
    }
  }
  [...title.childNodes].forEach(split);
  const letters = [...title.querySelectorAll('.title-letter')].map(element => ({ element, x: 0, y: 0, vx: 0, vy: 0, angle: 0, targetX: 0, targetY: 0, targetAngle: 0, cx: 0, cy: 0 }));
  let frame = null;
  let previousTime = 0;
  function measure() {
    const origin = title.getBoundingClientRect();
    letters.forEach(p => {
      const rect = p.element.getBoundingClientRect();
      p.cx = rect.left + rect.width / 2 - origin.left - p.x;
      p.cy = rect.top + rect.height / 2 - origin.top - p.y;
    });
  }
  function reset() {
    letters.forEach(p => {
      p.x = p.y = p.vx = p.vy = p.angle = p.targetX = p.targetY = p.targetAngle = 0;
      p.element.style.removeProperty('transform');
    });
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
    title.classList.remove('title-playing');
  }
  function tick(time) {
    frame = null;
    if (reduced.matches || document.hidden) { reset(); return; }
    const dt = Math.max(.5, Math.min(2, (time - (previousTime || time - 16.67)) / 16.67));
    previousTime = time;
    let active = false;
    for (const p of letters) {
      p.vx = (p.vx + (p.targetX - p.x) * .15 * dt) * Math.pow(.73, dt);
      p.vy = (p.vy + (p.targetY - p.y) * .15 * dt) * Math.pow(.73, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += (p.targetAngle - p.angle) * Math.min(1, .16 * dt);
      p.element.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) rotate(${p.angle.toFixed(2)}deg)`;
      if (Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.targetX - p.x) + Math.abs(p.targetY - p.y) + Math.abs(p.targetAngle - p.angle) > .05) active = true;
    }
    if (active) frame = requestAnimationFrame(tick);
    else { previousTime = 0; title.classList.remove('title-playing'); }
  }
  function schedule() {
    if (reduced.matches || document.hidden) return;
    title.classList.add('title-playing');
    if (frame === null) frame = requestAnimationFrame(tick);
  }
  function react(event) {
    if (reduced.matches) return;
    const rect = title.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const radius = Math.min(180, rect.width * .35);
    letters.forEach(p => {
      const dx = p.cx - x, dy = p.cy - y;
      const strength = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
      p.targetX = strength * dx * .09;
      p.targetY = -strength * 23;
      p.targetAngle = strength * dx * .13;
    });
    schedule();
  }
  function release() {
    letters.forEach(p => { p.targetX = p.targetY = p.targetAngle = 0; });
    schedule();
  }
  title.addEventListener('pointerenter', measure);
  title.addEventListener('pointermove', react);
  title.addEventListener('pointerdown', event => { measure(); react(event); });
  title.addEventListener('pointerleave', release);
  title.addEventListener('pointercancel', release);
  title.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') release(); });
  addEventListener('resize', () => { reset(); measure(); }, { passive: true });
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  document.fonts?.ready.then(measure);
  measure();
})();
