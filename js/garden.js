'use strict';

// A veil of mist and drifting fairy dust opens from the center with scroll.
function createFairyVeil(canvas) {
 const c=canvas.getContext('2d');if(!c)return null;
 let width=1,height=1,progress=0,active=false,paused=false,frame=null,last=0,clock=0,seed=42;
 const narrow=matchMedia('(max-width: 700px)').matches;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const motes=Array.from({length:narrow?180:360},()=>({x:random(),y:random(),phase:random()*6.28,depth:.4+random(),size:1+random()*3}));
 const sprites=['#ffe4a0','#c3f6df','#efbfdd'].map(color=>{const tile=document.createElement('canvas');tile.width=tile.height=40;const t=tile.getContext('2d'),g=t.createRadialGradient(20,20,0,20,20,20);g.addColorStop(0,'#fffdf0');g.addColorStop(.12,color);g.addColorStop(.4,color+'66');g.addColorStop(1,color+'00');t.fillStyle=g;t.fillRect(0,0,40,40);return tile;});
 function schedule(){if(frame===null&&active&&!document.hidden)frame=requestAnimationFrame(render)}
 function render(time){
  frame=null;if(!active||document.hidden){last=0;return}
  if(!paused&&time-last<32){schedule();return}
  if(!paused)clock+=Math.min(64,time-(last||time))/1000;last=time;c.clearRect(0,0,width,height);
  const release=progress*progress*(3-2*progress);
  motes.forEach((p,i)=>{
   const dx=(p.x-.5)*width,dy=(p.y-.5)*height,a=Math.atan2(dy,dx)+release*.9;
   const radius=Math.hypot(dx,dy)+release*Math.max(width,height)*(.3+p.depth*.3);
   const x=width*.5+Math.cos(a)*radius+Math.sin(clock*.7+p.phase)*8,y=height*.45+Math.sin(a)*radius+Math.cos(clock*.5+p.phase)*9;
   const size=p.size*(i%9===0?9:4)*(1+release*.5);
   c.globalAlpha=(1-release)*(.35+Math.sin(clock+p.phase)**2*.65);
   c.drawImage(sprites[i%3],x-size/2,y-size/2,size,size);
  });
  c.globalAlpha=1;if(!paused&&progress<1)schedule();
 }
 return{
  resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);c.setTransform(dpr,0,0,dpr,0,0);schedule()},
  update(value,visible,stopped){progress=value;active=visible;paused=stopped;if((!active||document.hidden)&&frame!==null){cancelAnimationFrame(frame);frame=null;last=0}schedule()}
 };
}

(() => {
  const gallery = document.querySelector('#galeria');
  const curtain = gallery.querySelector('.garden-curtain');
  const openButton = document.querySelector('#open-garden');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const painter = createFairyVeil(document.querySelector('#blossom-canvas'));
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
    curtain.style.setProperty('--veil-hole',`${progress*150}%`);
    curtain.style.setProperty('--veil-feather',`${progress*150+18}%`);
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
