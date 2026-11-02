'use strict';
(() => {
  const gallery=document.querySelector('#galeria');
  const petals=gallery.querySelector('.gallery-petals');
  const backdrop=document.createElement('div');
  backdrop.className='gallery-atmosphere';backdrop.setAttribute('aria-hidden','true');
  const layers=Array.from({length:2},()=>{
    const img=document.createElement('img');img.alt='';img.decoding='async';
    backdrop.append(img);return img;
  });
  petals.prepend(backdrop);
  let current='',slot=0,request=0;
  function clear(){request++;backdrop.classList.remove('is-active');}
  async function show(card){
    const thumb=card.querySelector('img');
    const slug=thumb.getAttribute('src').split('/').pop().replace('-small.webp','.webp');
    const source=`assets/atmospheres/${slug}`;
    const ticket=++request;
    if(source===current){backdrop.classList.add('is-active');return;}
    // Tiny pre-blurred local images keep the viewport effect inexpensive.
    const preload=new Image();preload.src=source;
    try{await preload.decode();}catch{return;}
    if(ticket!==request||card.hidden||document.hidden)return;
    slot=1-slot;layers[slot].src=source;
    layers.forEach((layer,i)=>layer.classList.toggle('is-current',i===slot));
    current=source;backdrop.classList.add('is-active');
  }
  gallery.querySelectorAll('.photo-card').forEach(card=>{
    card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')show(card);});
    card.addEventListener('focusin',()=>show(card));
    card.addEventListener('pointerdown',()=>show(card));
  });
  gallery.addEventListener('pointerleave',clear);
  gallery.addEventListener('focusout',event=>{if(!gallery.contains(event.relatedTarget))clear();});
  gallery.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',clear));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
})();
