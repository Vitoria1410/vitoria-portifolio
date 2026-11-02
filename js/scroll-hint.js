'use strict';
(() => {
  const hint=document.createElement('div');
  hint.className='scroll-hint';hint.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.textContent='role para continuar';
  const arrow=document.createElement('span');arrow.className='scroll-hint-arrow';arrow.textContent='↓';
  hint.append(text,arrow);document.body.append(hint);
  let timer=null,editing=false;
  function hide(){hint.classList.remove('is-visible');clearTimeout(timer);}
  function show(){
    if(document.hidden||editing||document.body.classList.contains('photo-open')||document.documentElement.classList.contains('intro-pending'))return;
    if(scrollY+innerHeight>=document.documentElement.scrollHeight-140)return;
    const mural=document.querySelector('#atelie'),rect=mural?.getBoundingClientRect();
    text.textContent=rect&&rect.top<=0&&rect.bottom>innerHeight&&!mural.classList.contains('mural-static')?'continue descendo para explorar':'role para continuar';
    hint.classList.add('is-visible');
  }
  function arm(delay=0){hide();timer=setTimeout(show,delay);}
  addEventListener('scroll',()=>arm(80),{passive:true});
  addEventListener('resize',()=>arm(),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();else arm();});
  document.addEventListener('pointerdown',event=>{if(event.target.closest('canvas,input,textarea,button')){editing=true;hide();}},{passive:true});
  document.addEventListener('pointerup',()=>{editing=false;arm();},{passive:true});
  document.addEventListener('pointercancel',()=>{editing=false;arm();},{passive:true});
  // The intro may finish after the first check. Reveal the cue at that moment.
  new MutationObserver(()=>arm()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  arm();
})();
