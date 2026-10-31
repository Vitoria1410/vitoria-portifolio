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
  // A swallowtail silhouette: swept forewings, scalloped hindwings and two tails.
  const wingBoundary = [{ x: .015, y: -.42 }];
  const curves = [
    [.17,-.59,.57,-.78,.78,-.65], [.81,-.27,.64,-.05,.43,.08],
    [.64,.18,.58,.39,.4,.49], [.36,.65,.34,.83,.28,.94],
    [.25,.75,.23,.58,.19,.49], [.07,.5,.015,.31,.015,.12],
    [.005,-.08,.01,-.28,.015,-.42]
  ];
  for (const c of curves) {
    const start = wingBoundary[wingBoundary.length-1];
    for (let step=1; step<=14; step++) {
      const t=step/14,u=1-t;
      wingBoundary.push({x:u*u*u*start.x+3*u*u*t*c[0]+3*u*t*t*c[2]+t*t*t*c[4],y:u*u*u*start.y+3*u*u*t*c[1]+3*u*t*t*c[3]+t*t*t*c[5]});
    }
  }
  function insideWing(x,y) {
    let inside=false;
    for(let i=0,j=wingBoundary.length-1;i<wingBoundary.length;j=i++) {
      const a=wingBoundary[i],b=wingBoundary[j];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }
  function wingPoint() {
    const side = random()<.5?-1:1,type=random();
    if(type<.07)return{x:(random()-.5)*.035,y:random()*1.03-.43,side:0,edge:true};
    if(type<.1){const t=random();return{x:side*(.016+Math.sin(t*1.8)*.13),y:-.44-t*.23,side:0,edge:true};}
    let x,y;do{x=random()*.81;y=random()*1.72-.78;}while(!insideWing(x,y));
    const edge=wingBoundary.some(p=>Math.hypot(p.x-x,p.y-y)<.025)||Math.abs(Math.sin(Math.atan2(y+.1,x)*9))<.11;
    return{x:side*x,y,side,edge,eye:Math.abs(Math.hypot(x-.39,y-.29)-.06)<.023};
  }
  let particleIndex=0;
  const butterflies = [
    {size:1,phase:0,points:mobile.matches?1100:2200},
    {size:.46,phase:2.3,points:mobile.matches?450:900},
    {size:.32,phase:4.6,points:mobile.matches?240:450}
  ].map(b=>({...b,particles:Array.from({length:b.points},()=>({...wingPoint(),index:particleIndex++,phase:random()*Math.PI*2,size:.5+random()*.9,alpha:.45+random()*.5,tint:random(),dx:0,dy:0,vx:0,vy:0,energy:0}))}));
  const textParticleCount=butterflies[0].points+butterflies[1].points;
  const title=section.querySelector('#daydream-title');
  let textTargets=[];
  function sampleTitle() {
    const box=title.getBoundingClientRect(),style=getComputedStyle(title),emStyle=getComputedStyle(title.querySelector('em'));
    const size=parseFloat(style.fontSize),line=parseFloat(style.lineHeight)||size*1.04;
    const mask=document.createElement('canvas');mask.width=Math.max(1,Math.ceil(box.width+8));mask.height=Math.max(1,Math.ceil(box.height+12));
    const c=mask.getContext('2d');c.fillStyle='#fff';c.textBaseline='alphabetic';
    c.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;c.letterSpacing=style.letterSpacing;
    c.fillText('Tudo começa',0,size*.82);
    c.fillText('com um ',0,line+size*.82);
    const prefixWidth=c.measureText('com um ').width;
    c.font=`${emStyle.fontStyle} ${emStyle.fontWeight} ${emStyle.fontSize} ${emStyle.fontFamily}`;c.letterSpacing=emStyle.letterSpacing;
    c.fillText('olhar.',prefixWidth,line+size*.82);
    const pixels=c.getImageData(0,0,mask.width,mask.height).data,targets=[];
    for(let y=0;y<mask.height;y+=2)for(let x=0;x<mask.width;x+=2)if(pixels[(y*mask.width+x)*4+3]>120)targets.push({x,y});
    // A stable shuffle makes the shapes dissolve into the entire phrase together.
    for(let i=targets.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[targets[i],targets[j]]=[targets[j],targets[i]];}
    textTargets=targets;
  }
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
    const align = smooth(clamp((progress - .72) / .28));
    layout.style.setProperty('--copy-left', `${mobile.matches ? 50 : 50 * (1-align)}%`);
    layout.style.setProperty('--copy-anchor', `${mobile.matches ? -50 : -50 * (1-align)}%`);
    layout.style.setProperty('--copy-top', `${mobile.matches ? 43 - align * 20 : 50}%`);
    progressBar.style.transform = `scaleX(${progress})`;
    layout.style.setProperty('--title-opacity', String(smooth(clamp((progress-.67)/.18))));
    layout.style.setProperty('--story-opacity', String(smooth(clamp((progress-.79)/.16))));
    caption.textContent = progress < .2 ? '01 / DEIXAR A CURIOSIDADE VOAR' : progress < .72 ? '02 / IDEIAS QUE VIRAM PALAVRAS' : '03 / SEGUIR O QUE ME MOVE';
  }
  function render(time) {
    frame = null;
    if (!visible || document.hidden) {lastFrame=0;return;}
    const moving = !paused && !reduced.matches;
    if (moving && time-lastFrame < 32) {schedule();return;}
    if (moving) clock += Math.min(time-(lastFrame||time),64)/1000;
    const dt=Math.min(2,Math.max(.5,(time-(lastFrame||time-33))/33));
    lastFrame=time;context.clearRect(0,0,width,height);
    const dark=document.documentElement.dataset.theme==='dark';
    const align=smooth(clamp((progress-.72)/.28));
    const titleRect=title.getBoundingClientRect(),canvasRect=canvas.getBoundingClientRect();
    const morph=smooth(clamp((progress-.2)/.44));
    const textFade=1-smooth(clamp((progress-.72)/.16));
    // Smaller butterflies are painted first, adding depth without a heavy 3D library.
    for(let index=butterflies.length-1;index>=0;index--){
      const b=butterflies[index],t=clock;
      let cx,cy;
      if(index===0){cx=width*(mobile.matches?.56:.72)+Math.sin(t*.34)*width*.045;cy=height*(mobile.matches?.72:.46)+Math.cos(t*.41)*height*.06;}
      else if(index===1){cx=width*(mobile.matches?.19:.15+align*.35)+Math.sin(t*.25+b.phase)*width*.07;cy=height*(mobile.matches?.48:.23)+Math.cos(t*.3+b.phase)*height*.055;}
      else{cx=width*(mobile.matches?.85:.88)+Math.sin(t*.3+b.phase)*width*.06;cy=height*(mobile.matches?.78:.84)+Math.cos(t*.25+b.phase)*height*.04;}
      const scale=Math.min(width*(mobile.matches?.42:.22),height*.64)*b.size;
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
        if(index<2&&textTargets.length){
          const target=textTargets[Math.min(textTargets.length-1,Math.floor(p.index/textParticleCount*textTargets.length))];
          const tx=titleRect.left-canvasRect.left+target.x,ty=titleRect.top-canvasRect.top+target.y;
          const swirl=Math.sin(morph*Math.PI)*(mobile.matches?40:85);
          x=x*(1-morph)+tx*morph+Math.cos(p.phase+morph*5)*swirl;
          y=y*(1-morph)+ty*morph+Math.sin(p.phase+morph*5)*swirl;
        }
        if(moving){
          const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy),influence=clamp(1-d/135);
          const push=Math.pow(influence,1.8)*(24+(Math.sin(p.phase)+1)*16);
          const angle=Math.atan2(dy,dx)+Math.sin(p.phase)*influence*.75;
          const tx=Math.cos(angle)*push,ty=Math.sin(angle)*push;
          p.vx=(p.vx+(tx-p.dx)*.12*dt)*Math.pow(.74,dt);
          p.vy=(p.vy+(ty-p.dy)*.12*dt)*Math.pow(.74,dt);
          p.dx+=p.vx*dt;p.dy+=p.vy*dt;
          p.energy+=(influence-p.energy)*(influence>p.energy?.32:.08)*dt;
        }
        x+=p.dx;y+=p.dy;
        const shimmer=moving?.78+Math.sin(t*1.4+p.phase)*.22:1;
        const fade=index<2?textFade:1;
        const alpha=Math.min(1,p.alpha*shimmer*(p.edge?1:.75)+p.energy*.65)*fade;
        const tint=p.eye||p.tint<.15?2:p.edge?0:1;
        const radius=(p.size+(p.edge?.35:0))*Math.max(.8,b.size)*perspective*(1+p.energy*.9);
        context.globalAlpha=alpha;
        context.drawImage(sprites[tint+(dark?0:3)],x-radius*3,y-radius*3,radius*6,radius*6);
        if(p.energy>.015&&fade>.01){
          context.globalCompositeOperation=dark?'lighter':'source-over';
          context.globalAlpha=p.energy*.26*fade;
          const halo=radius*(10+p.energy*9);
          context.drawImage(sprites[1],x-halo/2,y-halo/2,halo,halo);
          context.globalAlpha=Math.min(1,p.energy*1.15)*fade;
          context.drawImage(sprites[0],x-radius*2,y-radius*2,radius*4,radius*4);
          context.globalCompositeOperation='source-over';
        }
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
  function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);updateProgress();sampleTitle();schedule();}
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
  section.classList.add('butterfly-story');
  document.fonts?.ready.then(()=>{sampleTitle();schedule();});
  resize();
})();
