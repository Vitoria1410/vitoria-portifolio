'use strict';
(() => {
 const memories=["assets/story/lembranca-01.webp", "assets/photos/amarelo-no-ceu-small.webp", "assets/creations/anjo-em-grafite-small.webp", "assets/story/lembranca-02.webp", "assets/photos/caminho-de-luz-small.webp", "assets/creations/borboleta-em-detalhe-small.webp", "assets/story/lembranca-03.webp", "assets/photos/ceu-no-aeroporto-small.webp", "assets/creations/dois-retratos-small.webp", "assets/story/lembranca-04.webp", "assets/photos/esculturas-no-jardim-small.webp", "assets/creations/entre-aves-e-tracos-small.webp", "assets/story/lembranca-05.webp", "assets/photos/flores-no-azul-small.webp", "assets/creations/estrelas-e-oncinha-small.webp", "assets/story/lembranca-06.webp", "assets/photos/flores-pelo-caminho-small.webp", "assets/creations/lilas-marmorizado-small.webp", "assets/story/lembranca-07.webp", "assets/photos/frida-de-perfil-small.webp", "assets/creations/morango-e-estrelas-small.webp", "assets/story/lembranca-08.webp", "assets/photos/frida-florida-small.webp", "assets/creations/olhar-de-gato-small.webp", "assets/story/lembranca-09.webp", "assets/photos/frida-na-grama-small.webp", "assets/creations/pagina-de-ideias-small.webp", "assets/story/lembranca-10.webp", "assets/photos/luz-na-janela-small.webp", "assets/creations/paisagem-pintada-small.webp", "assets/story/lembranca-11.webp", "assets/photos/mar-e-nuvens-small.webp", "assets/creations/perolado-e-lacos-small.webp", "assets/story/lembranca-12.webp", "assets/photos/margem-do-rio-small.webp", "assets/creations/personagens-e-mascaras-small.webp", "assets/story/lembranca-13.webp", "assets/photos/olhar-para-cima-small.webp", "assets/creations/retrato-com-flor-small.webp", "assets/story/lembranca-14.webp", "assets/photos/pequenos-jardins-small.webp", "assets/creations/retrato-digital-small.webp", "assets/story/lembranca-15.webp", "assets/photos/seguir-a-trilha-small.webp", "assets/creations/retrato-em-grafite-small.webp", "assets/story/lembranca-16.webp", "assets/photos/sol-entre-arvores-small.webp", "assets/creations/rosa-com-glitter-small.webp", "assets/photos/tantos-verdes-small.webp", "assets/creations/sob-o-chapeu-small.webp", "assets/photos/um-instante-small.webp", "assets/creations/tracos-no-caderno-small.webp", "assets/photos/uma-pausa-small.webp", "assets/creations/vinho-e-brilho-small.webp", "assets/photos/verde-sem-pressa-small.webp", "assets/images/vitoria-portrait.png", "assets/inspirations/cookies-saindo-do-forno.webp", "assets/inspirations/cookies-recheados.webp"];
 const section=document.querySelector('#arte'),stage=section.querySelector('.story-stage');
 const mosaic=stage.querySelector('.story-mosaic'),station=stage.querySelector('.drawing-station');
 const slot=stage.querySelector('.story-piece-shape'),piece=stage.querySelector('#story-guest-piece'),label=stage.querySelector('.story-slot-label');
 const completion=stage.querySelector('.story-completion'),note=section.querySelector('#story-note'),privacy=section.querySelector('.story-privacy');
 const save=document.querySelector('#save-drawing'),drawing=document.querySelector('#drawing-canvas'),download=document.querySelector('#download-drawing');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=false,visible=false,busy=false,current='',animation=null,flying=null,visitRevision=0;
 const visitPhotos=[];
 let landingCard=null,landingSource='',heldLane=null;
 const valid=(url,limit=1500000)=>typeof url==='string'&&/^data:image\/(png|webp);base64,/.test(url)&&url.length<limit;
 try{localStorage.removeItem('vitoria-story-pieces-v1')}catch{}
 const shown=new Set(memories);
 const groups=[];
 function photo(url){const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';img.decoding='async';img.width=240;img.height=180;return img;}
 for(let lane=0;lane<4;lane++){
  const column=document.createElement('div');column.className='story-lane';
  const strip=document.createElement('div');strip.className='story-strip';
  const urls=memories.filter((_,i)=>i%4===lane);
  for(let repeat=0;repeat<2;repeat++){
   const group=document.createElement('div');group.className='story-lane-group';
   urls.forEach(url=>group.append(photo(url)));strip.append(group);if(lane===0)groups.push(group);
  }
  column.append(strip);mosaic.append(column);
 }
 function sync(){section.classList.toggle('story-moving',visible&&!paused&&!reduced.matches&&!document.hidden&&!busy)}
 function releaseCard(){
  if(landingCard){landingCard.src=landingSource;landingCard.classList.remove('story-guest-card');}
  heldLane?.classList.remove('story-holds-piece');landingCard=null;heldLane=null;
 }
 function reserveCard(){
  if(landingCard)return landingCard;
  const bounds=stage.getBoundingClientRect(),cx=bounds.left+bounds.width*.5,cy=bounds.top+bounds.height*.43;
  let best=Infinity;
  for(const card of mosaic.querySelectorAll('.story-lane-group img')){
   const rect=card.getBoundingClientRect();
   if(!rect.width||!rect.height)continue;
   const distance=Math.hypot(rect.left+rect.width/2-cx,rect.top+rect.height/2-cy);
   if(distance<best){best=distance;landingCard=card;}
  }
  if(!landingCard)return slot;
  landingSource=landingCard.src;
  heldLane=landingCard.closest('.story-lane');heldLane?.classList.add('story-holds-piece');
  landingCard.classList.add('story-guest-card');
  landingCard.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  return landingCard;
 }
 function joined(url){
  current=url;piece.src=url;piece.hidden=false;label.hidden=true;
  reserveCard().src=url;
  stage.classList.remove('story-inserting');stage.classList.add('story-joined');
  station.inert=true;completion.hidden=false;
  note.textContent='Seu traço se encaixou nesta visita. Baixe uma cópia para guardar.';
  privacy.textContent='Ao reabrir o site, tudo começa de novo para a próxima pessoa. Seu desenho pode ser baixado.';
 }
 function compact(url){return new Promise(resolve=>{
  const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');c.width=420;c.height=Math.round(420*img.naturalHeight/img.naturalWidth);const ctx=c.getContext('2d');ctx.fillStyle='#fffcf6';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',.85))}catch{resolve(url)}};img.onerror=()=>resolve(url);img.src=url;
 })}
 async function confirm(event){
  if(busy||!valid(event.detail?.url,6000000))return;
  busy=true;save.disabled=true;sync();
  const revision=visitRevision,url=await compact(event.detail.url);
  if(revision!==visitRevision)return;
  const from=drawing.getBoundingClientRect(),to=reserveCard().getBoundingClientRect();
  station.inert=true;stage.classList.add('story-inserting');
  try{
   if(!reduced.matches&&from.width>0&&to.width>0){
    flying=document.createElement('img');flying.className='story-flying-piece';flying.alt='';flying.src=url;flying.setAttribute('aria-hidden','true');
    flying.style.width=`${from.width}px`;flying.style.height=`${from.height}px`;document.body.append(flying);
    const targetWidth=landingCard?.offsetWidth?landingCard.offsetWidth*1.06:to.width;
    const targetHeight=landingCard?.offsetHeight?landingCard.offsetHeight*1.06:to.height;
    const sx=targetWidth/from.width,sy=targetHeight/from.height;
    const targetTop=to.top-Math.min(0,Math.sin(-8*Math.PI/180)*targetWidth);
    if(flying.animate){animation=flying.animate([
     {transform:`translate(${from.left}px,${from.top}px) scale(1,1)`,borderRadius:'3px'},
     {transform:`translate(${to.left-25}px,${to.top-60}px) scale(${sx*1.1},${sy*1.1}) rotate(-7deg)`,offset:.65,borderRadius:'15px'},
     {transform:`translate(${to.left}px,${targetTop}px) rotate(-8deg) scale(${sx},${sy})`,borderRadius:'0px'}
    ],{duration:1200,easing:'cubic-bezier(.22,.65,.25,1)',fill:'forwards'});await animation.finished;}
   }
  }catch{/* If resizing cancels the flight, the piece still lands in its slot. */}
  finally{
   flying?.remove();flying=null;animation=null;
   if(revision===visitRevision){joined(url);busy=false;sync();}
  }
 }
 document.addEventListener('drawing-confirmed',confirm);
 stage.querySelector('#story-draw-again').addEventListener('click',()=>{
  if(busy)return;
  if(current&&!shown.has(current)){groups.forEach(group=>{const image=photo(current);group.append(image);visitPhotos.push(image)});shown.add(current)}
  releaseCard();
  stage.classList.remove('story-joined');completion.hidden=true;piece.hidden=true;label.hidden=false;
  station.inert=false;save.disabled=false;document.querySelector('#clear-drawing').click();
  note.textContent='Uma peça nova, outra história. Pode começar de novo.';
  drawing.scrollIntoView({block:'center',behavior:reduced.matches?'auto':'smooth'});
 });
 const toggle=section.querySelector('#story-motion');
 toggle.addEventListener('click',()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'retomar lembranças ▷':'pausar lembranças ⏸';sync()});
 reduced.addEventListener('change',()=>{if(reduced.matches)animation?.cancel();sync()});
 document.addEventListener('visibilitychange',sync);
 addEventListener('resize',()=>animation?.cancel(),{passive:true});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.05}).observe(stage);
 else{visible=true;sync()}
 addEventListener('pageshow',event=>{
  if(!event.persisted)return;
  visitRevision++;animation?.cancel();animation=null;flying?.remove();flying=null;
  releaseCard();visitPhotos.splice(0).forEach(image=>image.remove());
  shown.clear();memories.forEach(url=>shown.add(url));
  busy=false;current='';paused=false;
  stage.classList.remove('story-joined');stage.classList.remove('story-inserting');
  completion.hidden=true;piece.hidden=true;piece.removeAttribute('src');label.hidden=false;
  station.inert=false;save.disabled=false;download.hidden=true;download.removeAttribute('href');
  toggle.setAttribute('aria-pressed','false');toggle.textContent='pausar lembranças ⏸';
  note.textContent='Uma nova visita, uma nova peça. Que tal deixar seu traço?';sync();
 });
})();
