'use strict';

(() => {
  const gallery = document.querySelector('#galeria');
  const cards = [...gallery.querySelectorAll('.photo-card')];
  const filters = [...gallery.querySelectorAll('[data-filter]')];
  const count = gallery.querySelector('#gallery-count');
  const dialog = document.querySelector('.photo-dialog');
  const fullPhoto = dialog.querySelector('#full-photo');
  const fullVideo = dialog.querySelector('#full-video');
  const title = dialog.querySelector('#photo-dialog-title');
  const dialogCount = dialog.querySelector('#photo-dialog-count');
  let visibleCards = cards;
  let selected = 0;
  let opener = null;

  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
    for (const card of cards) card.hidden = category !== 'all' && card.dataset.category !== category && card.dataset.kind !== category;
    visibleCards = cards.filter(card => !card.hidden);
    updateCount();
  }));

  function updateCount() {
    const videos = visibleCards.filter(card => card.dataset.kind === 'video').length;
    const photos = visibleCards.length - videos;
    const labels = [];
    if (photos) labels.push(`${photos} ${photos === 1 ? 'foto' : 'fotos'}`);
    if (videos) labels.push(`${videos} ${videos === 1 ? 'vídeo' : 'vídeos'}`);
    count.textContent = `${labels.join(' · ')} · toque para explorar`;
  }

  function stopVideo() {
    fullVideo.pause();
    fullVideo.removeAttribute('src');
    fullVideo.load();
    fullVideo.hidden = true;
  }

  function displayPhoto(index) {
    selected = (index + visibleCards.length) % visibleCards.length;
    const card = visibleCards[selected];
    stopVideo();
    const isVideo = card.dataset.kind === 'video';
    fullPhoto.hidden = isVideo;
    if (isVideo) {
      fullVideo.poster = card.querySelector('img').src;
      fullVideo.src = card.href;
      fullVideo.setAttribute('aria-label', card.dataset.title);
      fullVideo.hidden = false;
    } else {
      fullPhoto.src = card.href;
      fullPhoto.alt = card.querySelector('img').alt;
    }
    title.textContent = card.dataset.title;
    dialogCount.textContent = `${selected + 1} / ${visibleCards.length}`;
  }
  cards.forEach(card => card.addEventListener('click', event => {
    // Preserve open-in-new-tab behavior and normal links without dialog support.
    if (!dialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    opener = card;
    displayPhoto(visibleCards.indexOf(card));
    dialog.showModal();
    document.body.classList.add('photo-open');
  }));
  dialog.querySelector('#close-photo').addEventListener('click', () => dialog.close());
  dialog.querySelector('#previous-photo').addEventListener('click', () => displayPhoto(selected - 1));
  dialog.querySelector('#next-photo').addEventListener('click', () => displayPhoto(selected + 1));
  dialog.addEventListener('keydown', event => {
    // Leave native video controls' arrow-key behavior intact.
    if (event.target === fullVideo) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      displayPhoto(selected + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    stopVideo();
    document.body.classList.remove('photo-open');
    if (opener) opener.focus({ preventScroll: true });
  });

  const toggle = gallery.querySelector('#petals-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let petalsPaused = false;
  let inView = false;
  function updatePetals() {
    gallery.classList.toggle('petals-paused', petalsPaused || !inView || document.hidden || reducedMotion.matches);
    toggle.hidden = reducedMotion.matches;
  }
  toggle.addEventListener('click', () => {
    petalsPaused = !petalsPaused;
    toggle.setAttribute('aria-pressed', String(petalsPaused));
    toggle.textContent = petalsPaused ? 'retomar pétalas ▷' : 'pausar pétalas ⏸';
    updatePetals();
  });
  reducedMotion.addEventListener('change', updatePetals);
  document.addEventListener('visibilitychange', updatePetals);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; updatePetals(); }).observe(gallery);
  } else { inView = true; }
  updatePetals();
  updateCount();
  gallery.classList.add('gallery-ready');
})();
