'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'fechar −' : 'menu +';
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'menu +';
  navigation.classList.remove('open');
}));

// The original photograph stays unchanged. A canvas reveals color along a mask.
const portrait = document.querySelector('#portrait');
const photo = portrait.querySelector('img');
const reveal = document.querySelector('#portrait-canvas');
const revealContext = reveal.getContext('2d');
const mask = document.createElement('canvas');
const maskContext = mask.getContext('2d');
const brushCursor = portrait.querySelector('.brush-cursor');
let lastPoint = null;
let touched = false;
function preparePortrait() {
  reveal.width = mask.width = photo.naturalWidth;
  reveal.height = mask.height = photo.naturalHeight;
  lastPoint = null;
}
if (photo.complete && photo.naturalWidth) preparePortrait();
else photo.addEventListener('load', preparePortrait, { once: true });
function renderReveal() {
  revealContext.clearRect(0, 0, reveal.width, reveal.height);
  revealContext.globalCompositeOperation = 'source-over';
  revealContext.drawImage(photo, 0, 0, reveal.width, reveal.height);
  revealContext.globalCompositeOperation = 'destination-in';
  revealContext.drawImage(mask, 0, 0);
  revealContext.globalCompositeOperation = 'source-over';
}
function paintPortrait(event) {
  if (!photo.naturalWidth || (event.pointerType !== 'mouse' && !touched)) return;
  const rect = portrait.getBoundingClientRect();
  // Invert the paper frame's rotation to keep the paint directly under the pointer.
  const transform = getComputedStyle(portrait.parentElement).transform;
  const matrix = new DOMMatrix(transform === 'none' ? undefined : transform);
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const local = matrix.inverse().transformPoint(new DOMPoint(dx, dy));
  const x = local.x + portrait.clientWidth / 2;
  const y = local.y + portrait.clientHeight / 2;
  brushCursor.style.left = `${x}px`;
  brushCursor.style.top = `${y}px`;
  const point = { x: x * reveal.width / portrait.clientWidth, y: y * reveal.height / portrait.clientHeight };
  maskContext.strokeStyle = maskContext.fillStyle = '#fff';
  maskContext.lineCap = maskContext.lineJoin = 'round';
  maskContext.lineWidth = 65 * reveal.width / portrait.clientWidth;
  maskContext.beginPath();
  maskContext.moveTo((lastPoint || point).x, (lastPoint || point).y);
  maskContext.lineTo(point.x, point.y);
  maskContext.stroke();
  maskContext.beginPath();
  maskContext.arc(point.x, point.y, maskContext.lineWidth / 2, 0, Math.PI * 2);
  maskContext.fill();
  lastPoint = point;
  renderReveal();
}
portrait.addEventListener('pointerdown', event => {
  touched = true;
  if (event.pointerType !== 'mouse') portrait.setPointerCapture(event.pointerId);
  paintPortrait(event);
});
portrait.addEventListener('pointermove', paintPortrait);
portrait.addEventListener('pointerleave', () => { lastPoint = null; });
['pointerup', 'pointercancel'].forEach(type => portrait.addEventListener(type, () => { touched = false; lastPoint = null; }));
document.querySelector('#reset-portrait').addEventListener('click', () => {
  maskContext.clearRect(0, 0, mask.width, mask.height);
  revealContext.clearRect(0, 0, reveal.width, reveal.height);
  lastPoint = null;
});
document.querySelector('#reveal-portrait').addEventListener('click', () => {
  if (!photo.naturalWidth) return;
  maskContext.fillStyle = '#fff';
  maskContext.fillRect(0, 0, mask.width, mask.height);
  renderReveal();
});

const drawing = document.querySelector('#drawing-canvas');
const context = drawing.getContext('2d');
const status = document.querySelector('#drawing-status');
const download = document.querySelector('#download-drawing');
let color = '#252521';
let drawingPointer = null;
let hasDrawing = false;
let previous = null;
function drawingPoint(event) {
  const rect = drawing.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * drawing.width / rect.width, y: (event.clientY - rect.top) * drawing.height / rect.height };
}
function draw(event) {
  if (event.pointerId !== drawingPointer) return;
  const point = drawingPoint(event);
  context.strokeStyle = context.fillStyle = color;
  context.lineWidth = Number(document.querySelector('#brush-size').value) * drawing.width / drawing.getBoundingClientRect().width;
  context.lineCap = context.lineJoin = 'round';
  context.beginPath();
  context.moveTo((previous || point).x, (previous || point).y);
  context.lineTo(point.x, point.y);
  context.stroke();
  context.beginPath();
  context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
  context.fill();
  previous = point;
  hasDrawing = true;
  download.hidden = true;
}
drawing.addEventListener('pointerdown', event => {
  drawingPointer = event.pointerId;
  previous = null;
  drawing.setPointerCapture(event.pointerId);
  draw(event);
});
drawing.addEventListener('pointermove', draw);
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => drawing.addEventListener(type, () => { drawingPointer = null; previous = null; }));
document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => {
  color = button.dataset.color;
  document.querySelectorAll('.swatch').forEach(other => {
    other.classList.toggle('selected', other === button);
    other.setAttribute('aria-pressed', String(other === button));
  });
}));
document.querySelector('#clear-drawing').addEventListener('click', () => {
  context.clearRect(0, 0, drawing.width, drawing.height);
  hasDrawing = false;
  download.hidden = true;
  try { localStorage.removeItem('vitoria-guest-drawing'); } catch { /* Storage may be disabled. */ }
  status.textContent = 'Uma página em branco. Pode começar de novo.';
});
document.querySelector('#save-drawing').addEventListener('click', () => {
  if (!hasDrawing) { status.textContent = 'Faça um primeiro traço para guardar seu desenho.'; return; }
  const output = document.createElement('canvas');
  output.width = drawing.width;
  output.height = drawing.height;
  const outputContext = output.getContext('2d');
  outputContext.fillStyle = '#fffcf6';
  outputContext.fillRect(0, 0, output.width, output.height);
  outputContext.drawImage(drawing, 0, 0);
  download.href = output.toDataURL('image/png');
  download.hidden = false;
  try {
    localStorage.setItem('vitoria-guest-drawing', drawing.toDataURL('image/png'));
    status.textContent = 'Seu traço ficou guardado neste navegador. Você também pode baixar a imagem ao lado.';
  } catch {
    status.textContent = 'Este navegador não permitiu salvar. Use “baixar meu desenho” para guardar a imagem.';
  }
});
try {
  const saved = localStorage.getItem('vitoria-guest-drawing');
  if (saved && saved.startsWith('data:image/png;base64,')) {
    const restored = new Image();
    restored.onload = () => { context.drawImage(restored, 0, 0); hasDrawing = true; status.textContent = 'Seu último desenho continua aqui, guardado neste navegador.'; };
    restored.src = saved;
  }
} catch { /* Drawing remains available when browser storage is disabled. */ }
