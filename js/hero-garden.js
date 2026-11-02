'use strict';
(() => {
  const hero=document.querySelector('#inicio');
  const lights=document.createElement('div');
  lights.className='hero-fairy-lights';lights.setAttribute('aria-hidden','true');
  for(let i=0;i<24;i++){
    const light=document.createElement('i');light.className='hero-fairy-light';
    light.style.cssText=`--x:${(i*37+11)%100}%;--y:${(i*23+19)%95}%;--size:${2+i%3}px;--time:${5+i%6}s;--delay:-${i*.7}s`;
    lights.append(light);
  }
  hero.prepend(lights);
  let visible=false;
  function sync(){hero.classList.toggle('hero-garden-visible',visible&&!document.hidden);}
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(hero);
  document.addEventListener('visibilitychange',sync);
})();
