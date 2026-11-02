'use strict';
(() => {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let seen=false;
  try{seen=sessionStorage.getItem('vitoria-garden-entered')==='1';}catch{}
  // Deep links, return visits in this tab and reduced motion go straight in.
  if(seen||location.hash||reduced.matches)return;
  root.classList.add('intro-pending');
  let finished=false,ready=false;
  function finish(animate=true){
    if(finished)return;
    finished=true;
    const skip=document.querySelector('#skip-entrance');
    const restoreFocus=skip&&document.activeElement===skip;
    const intro=document.querySelector('.garden-intro');
    if(intro){intro.inert=true;intro.setAttribute('aria-hidden','true');}
    root.classList.remove('intro-pending');
    if(animate&&!reduced.matches)root.classList.add('garden-reveal');
    try{sessionStorage.setItem('vitoria-garden-entered','1');}catch{}
    if(restoreFocus){const title=document.querySelector('#hero-title');title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});}
    setTimeout(()=>root.classList.remove('garden-reveal'),1400);
    document.removeEventListener('keydown',key);
  }
  function key(event){if(event.key==='Escape')finish();}
  // Fail open even if startup is slow or a later script fails.
  setTimeout(()=>finish(ready),3000);
  document.addEventListener('DOMContentLoaded',()=>{
    if(finished)return;
    ready=true;
    document.querySelector('#skip-entrance')?.addEventListener('click',()=>finish());
    document.addEventListener('keydown',key);
    setTimeout(()=>finish(),1700);
  },{once:true});
  reduced.addEventListener('change',()=>{if(reduced.matches)finish(false);});
})();
