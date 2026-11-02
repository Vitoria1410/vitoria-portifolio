'use strict';
(() => {
  const section=document.querySelector('#atelie'),viewport=section.querySelector('.line-viewport');
  const items=[...section.querySelectorAll('.line-item')],links=items.map(item=>item.querySelector('.line-art'));
  const filters=[...section.querySelectorAll('[data-art-filter]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const toggle=section.querySelector('#line-motion-toggle'),back=section.querySelector('#line-back'),forward=section.querySelector('#line-forward');
  const entry=section.querySelector('.mural-entry'),open=section.querySelector('#open-mural'),board=section.querySelector('.line-items');
  let manual=false,opening=1,max=0,frame=null,visibleLinks=links;
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
  const isStatic=()=>manual||reduced.matches||innerHeight<600;
  const origin=()=>section.getBoundingClientRect().top+scrollY;
  items.forEach(item=>{
    const peg=item.querySelector('.line-pin'),pin=document.createElement('span');
    pin.className='mural-pin';pin.setAttribute('aria-hidden','true');peg.replaceWith(pin);
  });
  function navigation(){back.disabled=viewport.scrollLeft<=2;forward.disabled=viewport.scrollLeft>=max-2;}
  function render(){
    frame=null;
    if(document.hidden)return;
    if(isStatic()){board.inert=false;entry.inert=true;navigation();return;}
    const offset=scrollY-origin(),door=clamp(offset/opening),ease=door*door*(3-2*door);
    section.style.setProperty('--door-left',`${-105*ease}deg`);
    section.style.setProperty('--door-right',`${105*ease}deg`);
    section.style.setProperty('--door-opacity',String(1-clamp((door-.8)/.2)));
    section.style.setProperty('--entry-opacity',String(1-clamp(door/.45)));
    const opened=door>=.99;
    section.classList.toggle('mural-revealed',opened);
    board.inert=!opened;entry.inert=door>.45;
    viewport.scrollLeft=clamp(offset-opening,0,max);
    navigation();
  }
  function schedule(){if(frame===null)frame=requestAnimationFrame(render);}
  function measure(){
    max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
    opening=Math.max(320,Math.min(700,innerHeight*.75));
    section.classList.toggle('mural-static',isStatic());
    section.style.height=isStatic()?'auto':`${innerHeight+opening+max}px`;
    toggle.textContent=manual?'retomar passeio com scroll':'explorar sem animação';
    toggle.setAttribute('aria-pressed',String(manual));toggle.hidden=reduced.matches||innerHeight<600;
    section.querySelector('#line-help').textContent=isStatic()?'Deslize para explorar o mural. Toque em uma criação para ampliar.':'Role para abrir as portas e passear pelo mural. Toque para ampliar.';
    schedule();
  }
  function travel(x){
    x=clamp(x,0,max);
    if(isStatic())viewport.scrollTo({left:x,behavior:reduced.matches?'auto':'smooth'});
    else window.scrollTo({top:origin()+opening+x,behavior:'smooth'});
  }
  open.addEventListener('click',()=>travel(0));
  toggle.addEventListener('click',()=>{
    const wasPinned=section.getBoundingClientRect().top<=0&&section.getBoundingClientRect().bottom>innerHeight;
    manual=!manual;measure();
    if(wasPinned)window.scrollTo({top:origin(),behavior:'instant'});
  });
  back.addEventListener('click',()=>travel(viewport.scrollLeft-viewport.clientWidth*.75));
  forward.addEventListener('click',()=>travel(viewport.scrollLeft+viewport.clientWidth*.75));
  viewport.addEventListener('scroll',navigation,{passive:true});
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();travel(viewport.scrollLeft+(event.key==='ArrowRight'?1:-1)*viewport.clientWidth*.75);
  });
  const dialog=document.querySelector('.art-dialog'),full=document.querySelector('#full-art'),title=document.querySelector('#art-dialog-title'),count=document.querySelector('#art-dialog-count');
  let selected=0,opener=null;
  function display(index){
    selected=(index+visibleLinks.length)%visibleLinks.length;const link=visibleLinks[selected];
    full.src=link.href;full.style.filter=link.dataset.imageFilter||'';full.alt=link.querySelector('img').alt;
    title.textContent=link.dataset.title;count.textContent=`${selected+1} / ${visibleLinks.length}`;
  }
  links.forEach(link=>link.addEventListener('click',event=>{
    if(!dialog.showModal||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();opener=link;display(visibleLinks.indexOf(link));dialog.showModal();document.body.classList.add('photo-open');
  }));
  links.forEach((link,i)=>link.addEventListener('focus',()=>{
    if(!isStatic()&&!board.inert){const item=items[i];if(item.offsetLeft<viewport.scrollLeft||item.offsetLeft+item.offsetWidth>viewport.scrollLeft+viewport.clientWidth)travel(item.offsetLeft-30);}
  }));
  document.querySelector('#close-art').addEventListener('click',()=>dialog.close());
  document.querySelector('#previous-art').addEventListener('click',()=>display(selected-1));
  document.querySelector('#next-art').addEventListener('click',()=>display(selected+1));
  dialog.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();display(selected+(event.key==='ArrowRight'?1:-1));}});
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('photo-open');opener?.focus({preventScroll:true});});
  const names={all:'todas',desenho:'desenhos',pintura:'pintura',unhas:'nail art'};
  filters.forEach(button=>{
    const kind=button.dataset.artFilter;
    button.textContent=`${names[kind]} (${items.filter(item=>kind==='all'||item.dataset.artKind===kind).length})`;
    button.addEventListener('click',()=>{
      const pinned=section.getBoundingClientRect().top<=0&&section.getBoundingClientRect().bottom>innerHeight;
      filters.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
      items.forEach(item=>{item.hidden=kind!=='all'&&item.dataset.artKind!==kind;});
      visibleLinks=items.filter(item=>!item.hidden).map(item=>item.querySelector('.line-art'));
      section.querySelector('#line-count').textContent=`${visibleLinks.length} ${visibleLinks.length===1?'CRIAÇÃO':'CRIAÇÕES'} / UM MURAL EM CONSTRUÇÃO`;
      viewport.setAttribute('aria-label',`Mural com ${visibleLinks.length} criações. Use as setas para percorrer.`);
      viewport.scrollLeft=0;measure();
      if(pinned&&!isStatic())window.scrollTo({top:origin()+opening,behavior:'instant'});
    });
  });
  section.querySelector('.atelier-filters').hidden=false;back.hidden=forward.hidden=false;
  section.classList.add('mural-enhanced');
  addEventListener('scroll',()=>{const r=section.getBoundingClientRect();if(r.top<=innerHeight&&r.bottom>=0)schedule();},{passive:true});
  addEventListener('resize',measure,{passive:true});
  reduced.addEventListener('change',measure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null;}else schedule();});
  if('ResizeObserver'in window)new ResizeObserver(measure).observe(viewport);
  measure();
})();
