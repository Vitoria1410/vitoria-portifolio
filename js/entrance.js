'use strict';
(() => {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let seen=false;
  const sessionKey='vitoria-garden-entered-click-v2';
  try{seen=sessionStorage.getItem(sessionKey)==='1';}catch{}
  // Only an explicit entrance is remembered; old automatic visits don't count.
  if(seen||location.hash)return;
  root.classList.add('intro-pending');
  let finished=false;
  function finish(animate=true){
    if(finished)return;
    finished=true;
    const skip=document.querySelector('#skip-entrance');
    const restoreFocus=skip&&document.activeElement===skip;
    const intro=document.querySelector('.garden-intro');
    if(intro){intro.inert=true;intro.setAttribute('aria-hidden','true');}
    root.classList.remove('intro-pending');
    if(animate&&!reduced.matches)root.classList.add('garden-reveal');
    try{sessionStorage.setItem(sessionKey,'1');}catch{}
    if(restoreFocus){const title=document.querySelector('#hero-title');title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});}
    setTimeout(()=>root.classList.remove('garden-reveal'),1400);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(finished)return;
    document.querySelector('#skip-entrance')?.addEventListener('click',()=>finish());
  },{once:true});
})();
