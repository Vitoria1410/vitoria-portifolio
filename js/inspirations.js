'use strict';
(() => {
  const section=document.querySelector('#universo');
  const videos=[...section.querySelectorAll('video[data-loop]')];
  const button=document.querySelector('#inspiration-motion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=navigator.connection?.saveData;
  let visible=false,paused=false,active=videos[0];
  function sync(){
    for(const video of videos){
      if(video===active&&visible&&!paused&&!reduced.matches&&!saveData&&!document.hidden){
        if(!video.getAttribute('src'))video.src=video.dataset.loop;
        video.muted=true;
        video.play()?.catch(()=>{});
      }else video.pause();
    }
  }
  for(const video of videos){
    const card=video.closest('figure');
    card.addEventListener('pointerenter',()=>{active=video;sync();});
    card.addEventListener('focusin',()=>{active=video;sync();});
    video.addEventListener('pointerdown',()=>{active=video;sync();});
  }
  button.hidden=false;
  button.addEventListener('click',()=>{
    paused=!paused;button.setAttribute('aria-pressed',String(paused));
    button.textContent=paused?'retomar cenas ▷':'pausar cenas ⏸';sync();
  });
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(section);
})();
