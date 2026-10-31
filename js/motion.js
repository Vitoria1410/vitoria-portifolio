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
  const layout = section.querySelector('.daydream-layout');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  let width = 1, height = 1, frame = null, visible = false, paused = false;
  let progress = 0, lastFrame = 0, clock = 0;
  const pointer = { x: -1000, y: -1000 };
  let seed = 2107;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => value * value * (3 - 2 * value);
  // Filled wing surfaces, central body and curved antennae, rather than an outline.
  function wingPoint() {
    const side = random() < .5 ? -1 : 1;
    const type = random();
    if (type < .08) return { x: (random() - .5) * .035, y: random() * 1.01 - .48, side: 0, edge: true };
    if (type < .11) {
      const t = random();
      return { x: side * (.016 + Math.sin(t * 1.8) * .13), y: -.44 - t * .23, side: 0, edge: true };
    }
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random());
    const upper = type < .68;
    let x = upper ? .32 + Math.cos(a) * r * .32 : .22 + Math.cos(a) * r * .22;
    let y = upper ? -.2 + Math.sin(a) * r * .4 : .29 + Math.sin(a) * r * .27;
    // Sweep the upper wings toward the tips and pinch the waist.
    if (upper) x += Math.max(0, -y) * .2;
    return { x: side * x, y, side, edge: r > .91 || Math.abs(Math.sin(a * 4)) < .11 };
  }
  const butterflies = [
    { size: 1, phase: 0, points: mobile.matches ? 850 : 1650 },
    { size: .46, phase: 2.3, points: mobile.matches ? 320 : 650 },
    { size: .32, phase: 4.6, points: mobile.matches ? 220 : 420 }
  ].map(b => ({ ...b, particles: Array.from({ length: b.points }, () => ({ ...wingPoint(), phase: random() * Math.PI * 2, size: .5 + random() * .9, alpha: .45 + random() * .5, tint: random() })) }));
  const sparkles = Array.from({ length: mobile.matches ? 35 : 75 }, () => ({ x: random(), y: random(), phase: random() * Math.PI * 2, size: .4 + random() * .9 }));
  const sprites = ['#fff1fb','#f4a8d4','#b6d7ef','#8d446f','#b75e8b','#537b96'].map(color => {
    const tile = document.createElement('canvas'); tile.width = tile.height = 24;
    const c = tile.getContext('2d'), g = c.createRadialGradient(12,12,0,12,12,12);
    g.addColorStop(0,color);g.addColorStop(.2,color);g.addColorStop(.5,color+'88');g.addColorStop(1,color+'00');
    c.fillStyle=g;c.fillRect(0,0,24,24);return tile;
  });
  function updateProgress() {
    const rect = section.getBoundingClientRect();
    progress = reduced.matches ? 1 : clamp(-rect.top / Math.max(1,section.offsetHeight-innerHeight));
    const align = smooth(clamp(progress / .72));
    layout.style.setProperty('--copy-left', `${mobile.matches ? 50 : 50 * (1-align)}%`);
    layout.style.setProperty('--copy-anchor', `${mobile.matches ? -50 : -50 * (1-align)}%`);
    layout.style.setProperty('--copy-top', `${mobile.matches ? 43 - align * 20 : 50}%`);
    progressBar.style.transform = `scaleX(${progress})`;
    caption.textContent = progress < .35 ? '01 / DEIXAR A CURIOSIDADE VOAR' : progress < .75 ? '02 / ENCONTRAR NOVOS CAMINHOS' : '03 / SEGUIR O QUE ME MOVE';
  }
  function render(time) {
    frame = null;
    if (!visible || document.hidden) {lastFrame=0;return;}
    const moving = !paused && !reduced.matches;
    if (moving && time-lastFrame < 32) {schedule();return;}
    if (moving) clock += Math.min(time-(lastFrame||time),64)/1000;
    lastFrame=time;context.clearRect(0,0,width,height);
    const dark=document.documentElement.dataset.theme==='dark';
    const align=smooth(clamp(progress/.72));
    // Smaller butterflies are painted first, adding depth without a heavy 3D library.
    for(let index=butterflies.length-1;index>=0;index--){
      const b=butterflies[index],t=clock;
      let cx,cy;
      if(index===0){cx=width*(mobile.matches?.56:.72)+Math.sin(t*.34)*width*.045;cy=height*(mobile.matches?.72:.49)+Math.cos(t*.41)*height*.06;}
      else if(index===1){cx=width*(mobile.matches?.19:.15+align*.35)+Math.sin(t*.25+b.phase)*width*.07;cy=height*(mobile.matches?.48:.23)+Math.cos(t*.3+b.phase)*height*.055;}
      else{cx=width*(mobile.matches?.85:.88)+Math.sin(t*.3+b.phase)*width*.06;cy=height*(mobile.matches?.78:.84)+Math.cos(t*.25+b.phase)*height*.04;}
      const scale=Math.min(width*(mobile.matches?.42:.24),height*.64)*b.size;
      const flap=.45+Math.sin(t*3.8+b.phase)*.65;
      const yaw=Math.sin(t*.4+b.phase)*.34;
      const roll=Math.sin(t*.32+b.phase)*.18+(index===0?-.12:.22);
      const cr=Math.cos(roll),sr=Math.sin(roll),cyaw=Math.cos(yaw),syaw=Math.sin(yaw),cf=Math.cos(flap),sf=Math.sin(flap);
      for(const p of b.particles){
        const wx=p.side?p.x*cf:p.x;
        const z=p.side?Math.abs(p.x)*sf:0;
        const rx=wx*cyaw+z*syaw,rz=z*cyaw-wx*syaw;
        const perspective=1/(1-rz*.4);
        let x=cx+(rx*cr-p.y*sr)*scale*perspective;
        let y=cy+(rx*sr+p.y*cr)*scale*perspective;
        if(moving){const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);if(d>0&&d<95){x+=dx/d*(1-d/95)*16;y+=dy/d*(1-d/95)*16;}}
        const shimmer=moving?.78+Math.sin(t*1.4+p.phase)*.22:1;
        context.globalAlpha=p.alpha*shimmer*(p.edge?1:.68);
        const tint=p.tint<.15?2:p.edge?0:1;
        const radius=(p.size+(p.edge?.35:0))*Math.max(.8,b.size)*perspective;
        context.drawImage(sprites[tint+(dark?0:3)],x-radius*3,y-radius*3,radius*6,radius*6);
      }
    }
    for(const p of sparkles){
      const x=p.x*width+Math.sin(clock*.3+p.phase)*12,y=((p.y-clock*.012)%1+1)%1*height;
      context.globalAlpha=.15+Math.sin(clock+p.phase)**2*.3;
      context.drawImage(sprites[dark?1:4],x-3,y-3,6*p.size,6*p.size);
    }
    context.globalAlpha=1;if(moving)schedule();
  }
  function schedule(){if(frame===null&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);updateProgress();schedule();}
  toggle.addEventListener('click',()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'retomar movimento ▷':'pausar movimento ⏸';schedule();});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;});
  canvas.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;});
  addEventListener('scroll',()=>{if(visible){updateProgress();schedule();}},{passive:true});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{lastFrame=0;schedule();});
  // A paused scene also needs repainting when its palette changes.
  document.querySelector('#theme-toggle')?.addEventListener('click',schedule);
  reduced.addEventListener('change',()=>{toggle.hidden=reduced.matches;updateProgress();schedule();});
  toggle.hidden=reduced.matches;
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){updateProgress();schedule();}else if(frame!==null){cancelAnimationFrame(frame);frame=null;lastFrame=0;}}).observe(section);else visible=true;
  resize();
})();
