'use strict';
(() => {
  const section=document.querySelector('#universo');
  const rail=section.querySelector('.curiosity-rail');
  const panels=[...section.querySelectorAll('.curiosity-panel')];
  const tabs=[...section.querySelectorAll('[role="tab"]')];
  const videos=[...section.querySelectorAll('video[data-loop]')];
  const button=section.querySelector('#inspiration-motion');
  const back=section.querySelector('#curiosity-back'),next=section.querySelector('#curiosity-next');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=navigator.connection?.saveData;
  let visible=false,paused=false,active=videos[0],selected=-1;
  let wheelDistance=0,wheelUntil=0;
  function sync(){
    const moving=visible&&!paused&&!reduced.matches&&!document.hidden;
    section.classList.toggle('curiosity-moving',moving&&selected===1);
    for(const video of videos){
      if(video===active&&selected===0&&moving&&!saveData){
        if(!video.getAttribute('src'))video.src=video.dataset.loop;
        video.muted=true;
        if(video.paused)video.play()?.catch(()=>{});
      }else video.pause();
    }
  }
  function select(index){
    if(index===selected)return;
    selected=index;
    tabs.forEach((tab,i)=>{
      tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;
      panels[i].inert=i!==index;
      panels[i].setAttribute('aria-hidden',String(i!==index));
    });
    back.disabled=index===0;next.disabled=index===panels.length-1;
    section.querySelector('.curiosity-position').textContent=`${String(index+1).padStart(2,'0')} / ${String(panels.length).padStart(2,'0')}`;
    sync();
  }
  const position=index=>panels[index].offsetLeft-panels[0].offsetLeft;
  function go(index,focus=false){
    index=Math.max(0,Math.min(panels.length-1,index));
    select(index);
    rail.scrollTo({left:position(index),behavior:reduced.matches?'auto':'smooth'});
    if(focus)tabs[index].focus({preventScroll:true});
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>go(i));
    tab.addEventListener('keydown',event=>{
      const target=event.key==='ArrowRight'?(i+1)%tabs.length:event.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
      if(target!==null){event.preventDefault();go(target,true);}
    });
  });
  rail.addEventListener('scroll',()=>{
    let nearest=0;
    for(let i=1;i<panels.length;i++)if(Math.abs(rail.scrollLeft-position(i))<Math.abs(rail.scrollLeft-position(nearest)))nearest=i;
    select(nearest);
  },{passive:true});
  // Consume vertical wheel motion only while the strip has room in that
  // direction. At either end the page continues scrolling normally.
  rail.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.shiftKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?rail.clientWidth:1);
    const max=rail.scrollWidth-rail.clientWidth;
    if((delta<0&&rail.scrollLeft<=1)||(delta>0&&rail.scrollLeft>=max-1))return;
    event.preventDefault();
    if(Date.now()<wheelUntil)return;
    wheelDistance+=delta;
    if(Math.abs(wheelDistance)>=40){
      go(selected+Math.sign(wheelDistance));
      wheelDistance=0;wheelUntil=Date.now()+500;
    }
  },{passive:false});
  back.addEventListener('click',()=>go(selected-1));next.addEventListener('click',()=>go(selected+1));
  for(const video of videos){
    const card=video.closest('figure');
    card.addEventListener('pointerenter',()=>{active=video;sync();});
    card.addEventListener('focusin',()=>{active=video;sync();});
    video.addEventListener('pointerdown',()=>{active=video;sync();});
  }
  section.querySelector('.universe-tabs').hidden=false;
  button.hidden=back.hidden=next.hidden=false;
  button.addEventListener('click',()=>{
    paused=!paused;button.setAttribute('aria-pressed',String(paused));
    button.textContent=paused?'retomar movimento ▷':'pausar movimento ⏸';sync();
  });
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(section);
  else visible=true;
  select(0);
})();
