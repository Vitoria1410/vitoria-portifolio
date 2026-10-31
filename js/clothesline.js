'use strict';

// Coupled damped springs: pulling one hanger transfers force to its neighbors.
class ClotheslinePhysics {
  constructor(count) {
    this.nodes = Array.from({ length: count }, (_, i) => ({ x:0,y:0,vx:0,vy:0,angle:0,spin:0,mass:1+(i%3)*.13 }));
    this.drag = null;
  }
  grab(index,x,y) { this.drag={index,x:Math.max(-85,Math.min(85,x)),y:Math.max(-65,Math.min(85,y))}; }
  release() { this.drag=null; }
  reset() { this.release();for(const n of this.nodes)for(const k of ['x','y','vx','vy','angle','spin'])n[k]=0; }
  step(delta,time=0) {
    const dt=Math.min(.033,Math.max(0,delta))/3;
    for(let sub=0;sub<3;sub++){
      const forces=this.nodes.map((n,i)=>{
        const left=this.nodes[i-1],right=this.nodes[i+1];
        const coupleX=(left?left.x-n.x:0)+(right?right.x-n.x:0);
        const coupleY=(left?left.y-n.y:0)+(right?right.y-n.y:0);
        return {x:(-30*n.x+7*coupleX+Math.sin(time*.9+i*1.7)*3)/n.mass,y:(-34*n.y+10*coupleY)/n.mass};
      });
      this.nodes.forEach((n,i)=>{
        if(this.drag?.index===i){
          n.vx=Math.max(-140,Math.min(140,(this.drag.x-n.x)*18));
          n.vy=Math.max(-140,Math.min(140,(this.drag.y-n.y)*18));
          n.x=this.drag.x;n.y=this.drag.y;
        }else{
          n.vx=(n.vx+forces[i].x*dt)*Math.exp(-4.5*dt);
          n.vy=(n.vy+forces[i].y*dt)*Math.exp(-4.5*dt);
          n.x+=n.vx*dt;n.y+=n.vy*dt;
        }
        const target=Math.max(-16,Math.min(16,-n.x*.14-n.vx*.11));
        n.spin=(n.spin+(target-n.angle)*23*dt)*Math.exp(-4*dt);
        n.angle=Math.max(-19,Math.min(19,n.angle+n.spin*dt));
      });
    }
  }
}

(() => {
  const section=document.querySelector('#atelie');
  const viewport=section.querySelector('.line-viewport');
  const track=section.querySelector('.line-track');
  const items=[...section.querySelectorAll('.line-item')];
  const links=items.map(item=>item.querySelector('.line-art'));
  const pins=items.map(item=>item.querySelector('.line-pin'));
  const rope=section.querySelector('.line-rope');
  const path=rope.querySelector('path');
  const toggle=section.querySelector('#line-motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndices=items.map((_,i)=>i);
  let visibleLinks=links;
  let physics=new ClotheslinePhysics(items.length);
  let bases=[],frame=null,last=0,clock=0,inView=false,paused=false,gesture=null;
  let suppressedClick=null;
  function draw(){
    const points=[{x:3,y:55}];
    activeIndices.forEach((index,i)=>{
      const item=items[index];
      const n=physics.nodes[i];
      item.style.transform=`translate3d(${n.x.toFixed(2)}px,${n.y.toFixed(2)}px,0) rotate(${n.angle.toFixed(2)}deg)`;
      points.push({x:bases[i].x+n.x,y:bases[i].y+n.y});
    });
    points.push({x:track.offsetWidth-3,y:55});
    let d=`M${points[0].x} ${points[0].y}`;
    for(let i=0;i<points.length-1;i++){
      const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];
      d+=` C${b.x+(c.x-a.x)/6} ${b.y+(c.y-a.y)/6} ${c.x-(e.x-b.x)/6} ${c.y-(e.y-b.y)/6} ${c.x} ${c.y}`;
    }
    path.setAttribute('d',d);
  }
  function measure(){
    bases=activeIndices.map(index=>{const item=items[index];return{x:item.offsetLeft+item.offsetWidth/2,y:item.offsetTop-14};});
    rope.setAttribute('viewBox',`0 0 ${track.offsetWidth} 185`);
    draw();updateNavigation();
  }
  function animate(time){
    frame=null;
    if(!inView||document.hidden||paused||reduced.matches){last=0;return;}
    const dt=Math.min(.033,(time-(last||time-16))/1000);last=time;clock+=dt;
    physics.step(dt,clock);draw();schedule();
  }
  function schedule(){if(frame===null&&inView&&!document.hidden&&!paused&&!reduced.matches)frame=requestAnimationFrame(animate);}
  function endGesture(event){
    if(!gesture||event&&event.pointerId!==gesture.id)return;
    const current=gesture;gesture=null;physics.release();
    items[current.index].classList.remove('is-grabbed');
    if(current.moved)suppressedClick={index:current.index,until:performance.now()+500};
    schedule();
  }
  function begin(event,index,fromPin){
    if(paused||reduced.matches||event.button!==0||gesture)return;
    // Touch users drag the peg; the photograph remains easy to swipe or scroll.
    if(!fromPin&&event.pointerType!=='mouse')return;
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const slot=activeIndices.indexOf(index);if(slot<0)return;
    const n=physics.nodes[slot];
    gesture={id:event.pointerId,index,slot,startX:event.clientX,startY:event.clientY,x:n.x,y:n.y,moved:false};
    event.currentTarget.setPointerCapture(event.pointerId);
    physics.grab(slot,n.x,n.y);items[index].classList.add('is-grabbed');schedule();
  }
  items.forEach((item,index)=>{
    const pin=pins[index],link=links[index];pin.hidden=false;
    for(const target of [pin,link]){
      target.addEventListener('pointerdown',e=>begin(e,index,target===pin));
      target.addEventListener('pointermove',e=>{
        if(!gesture||gesture.index!==index||gesture.id!==e.pointerId)return;
        const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;
        if(Math.hypot(dx,dy)>6)gesture.moved=true;
        physics.grab(gesture.slot,gesture.x+dx,gesture.y+dy);
      });
      target.addEventListener('pointerup',endGesture);
      target.addEventListener('pointercancel',endGesture);
      target.addEventListener('lostpointercapture',endGesture);
      target.addEventListener('dragstart',e=>e.preventDefault());
    }
    pin.addEventListener('click',e=>{
      if(e.detail===0&&!paused&&!reduced.matches){const n=physics.nodes[activeIndices.indexOf(index)];if(!n)return;n.vx+=70;n.vy+=35;schedule();}
    });
    pin.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      e.preventDefault();if(paused||reduced.matches)return;
      const n=physics.nodes[activeIndices.indexOf(index)];if(!n)return;if(e.key==='ArrowLeft')n.vx-=60;if(e.key==='ArrowRight')n.vx+=60;if(e.key==='ArrowUp')n.vy-=50;if(e.key==='ArrowDown')n.vy+=50;schedule();
    });
  });
  function updateMotion(){
    endGesture();
    pins.forEach(pin=>{pin.disabled=paused||reduced.matches;});
    toggle.hidden=reduced.matches;
    section.querySelector('#line-help').textContent=paused||reduced.matches?'Deslize para explorar. Toque em uma criação para ver a imagem inteira.':'Puxe pelo pregador para balançar. Deslize para explorar e toque na imagem para ampliar.';
    if(paused||reduced.matches){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;physics.reset();draw();}
    else schedule();
  }
  toggle.hidden=false;
  toggle.addEventListener('click',()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'retomar balanço ▷':'pausar balanço ⏸';updateMotion();});
  const back=section.querySelector('#line-back'),forward=section.querySelector('#line-forward');back.hidden=forward.hidden=false;
  function updateNavigation(){back.disabled=viewport.scrollLeft<=2;forward.disabled=viewport.scrollLeft+viewport.clientWidth>=viewport.scrollWidth-3;}
  back.addEventListener('click',()=>viewport.scrollBy({left:-viewport.clientWidth*.75,behavior:reduced.matches?'instant':'smooth'}));
  forward.addEventListener('click',()=>viewport.scrollBy({left:viewport.clientWidth*.75,behavior:reduced.matches?'instant':'smooth'}));
  viewport.addEventListener('scroll',updateNavigation,{passive:true});
  // Native dialog preserves focus and keeps the complete, uncropped artwork.
  const dialog=document.querySelector('.art-dialog'),full=document.querySelector('#full-art'),title=document.querySelector('#art-dialog-title'),count=document.querySelector('#art-dialog-count');
  let selected=0,opener=null;
  function display(index){selected=(index+visibleLinks.length)%visibleLinks.length;full.src=visibleLinks[selected].href;full.style.filter=visibleLinks[selected].dataset.imageFilter||'';full.alt=visibleLinks[selected].querySelector('img').alt;title.textContent=visibleLinks[selected].dataset.title;count.textContent=`${selected+1} / ${visibleLinks.length}`;}
  links.forEach((link,index)=>link.addEventListener('click',e=>{
    if(suppressedClick?.index===index&&performance.now()<suppressedClick.until){e.preventDefault();suppressedClick=null;return;}
    if(!dialog.showModal||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
    e.preventDefault();opener=link;display(activeIndices.indexOf(index));dialog.showModal();document.body.classList.add('photo-open');
  }));
  document.querySelector('#close-art').addEventListener('click',()=>dialog.close());
  document.querySelector('#previous-art').addEventListener('click',()=>display(selected-1));
  document.querySelector('#next-art').addEventListener('click',()=>display(selected+1));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();display(selected+(e.key==='ArrowLeft'?-1:1));}});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('photo-open');opener?.focus({preventScroll:true});});
  const filters=[...section.querySelectorAll('[data-art-filter]')];
  const filterLabels={all:'todas',desenho:'desenhos',pintura:'pintura',unhas:'nail art'};
  filters.forEach(button=>{
    const kind=button.dataset.artFilter;
    const total=items.filter(item=>kind==='all'||item.dataset.artKind===kind).length;
    button.textContent=`${filterLabels[kind]} (${total})`;
  });
  section.querySelector('.atelier-filters').hidden=false;
  filters.forEach(button=>button.addEventListener('click',()=>{
    endGesture();physics.reset();suppressedClick=null;
    const kind=button.dataset.artFilter;
    filters.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    items.forEach(item=>{item.hidden=kind!=='all'&&item.dataset.artKind!==kind;});
    activeIndices=items.map((_,index)=>index).filter(index=>!items[index].hidden);
    visibleLinks=activeIndices.map(index=>links[index]);
    physics=new ClotheslinePhysics(activeIndices.length);
    viewport.scrollTo({left:0,behavior:'instant'});
    section.querySelector('#line-count').textContent=`${visibleLinks.length} ${visibleLinks.length===1?'CRIAÇÃO':'CRIAÇÕES'} / UM VARAL EM CONSTRUÇÃO`;
    viewport.setAttribute('aria-label',`Varal com ${visibleLinks.length} criações. Use as setas para percorrer.`);
    measure();updateMotion();
  }));
  reduced.addEventListener('change',updateMotion);
  document.addEventListener('visibilitychange',()=>{endGesture();if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;}else schedule();});
  addEventListener('resize',measure,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(measure).observe(viewport);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)schedule();else{endGesture();if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;}}).observe(section);else inView=true;
  section.classList.add('line-ready');
  measure();updateMotion();schedule();
})();
