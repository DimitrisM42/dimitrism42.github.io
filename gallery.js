import * as THREE from './vendor/three.module.min.js';
import { CSS3DObject, CSS3DRenderer } from './vendor/CSS3DRenderer.js';

// The same project cards and links are used in both views. Only their placement changes.
const grid = document.querySelector('.projects-grid');
const section = document.querySelector('#projects');
const cards = [...grid.children];
const gsap = window.gsap;
const desktop = matchMedia('(min-width: 1000px) and (hover: hover) and (pointer: fine)');
const motion = window.portfolioMotion;
const dialog = document.querySelector('#project-dialog');
const toolbar = document.createElement('div');
toolbar.className = 'gallery-toolbar';
toolbar.innerHTML = '<button type="button" class="gallery-view" aria-pressed="false">Show floating gallery</button>';
const viewButton = toolbar.querySelector('button');
const room = document.createElement('div');
room.className = 'project-room';
room.hidden = true;
room.setAttribute('role', 'region');
room.setAttribute('aria-label', 'Interactive project gallery');
grid.before(toolbar, room);

let cssRenderer;
let cssScene;
let camera;
let panels = [];
let active = false;
let visible = false;
let manualList = false;
let failed = false;
let frame = 0;
let previous = 0;
let time = 0;
let distance = 1700;
const cameraOffset = { x: 0, y: 0 };
const pointer = { x: 0, y: 0, inside: false };
const projection = new THREE.Vector3();
const boundsPoint = new THREE.Vector3();
const fitObject = new THREE.Object3D();
let size = { width: 1, height: 1 };
// A stable scatter keeps projects findable between visits without visible rows.
const composition = [
  [90, 500, 150, .07], [-440, 395, -140, -.09], [455, 110, -230, .11],
  [-70, 30, 240, -.06], [-470, -160, 60, .08],
  [-80, -470, -180, -.09], [410, -430, 180, .06]
];
let scatterSeed = 42;
function scatterRandom() {
  scatterSeed = (Math.imul(scatterSeed, 1664525) + 1013904223) >>> 0;
  return scatterSeed / 4294967296;
}
const placements = cards.map((_, index) => {
  if (composition[index]) return [...composition[index]];
  const bottom = Math.min(...composition.map(point => point[1]));
  let point;
  for (let attempt = 0; attempt < 100; attempt++) {
    point = [-500 + scatterRandom() * 1000, bottom + 140 - scatterRandom() * 600,
      -260 + scatterRandom() * 500, (scatterRandom() - .5) * .22];
    if (composition.every(other => Math.abs(other[0] - point[0]) >= 440 || Math.abs(other[1] - point[1]) >= 350)) break;
    point = null;
  }
  point ||= [(scatterRandom() - .5) * 900, bottom - 420, -100, .04];
  composition.push(point);
  return [...point];
});
placements.forEach(point => { point[1] *= .9; });
const top = Math.max(...placements.map(point => point[1]));
const bottom = Math.min(...placements.map(point => point[1]));
const spread = top - bottom;
// Shells include a hidden detail area below the preview; center the visible cards.
placements.forEach(point => { point[1] -= (top + bottom) / 2 + 110; });
const lowest = -spread / 2 - 110;
room.style.height = `${Math.max(900, spread + 360)}px`;

function animate(target, values, duration = .65) {
  if (gsap && !motion.paused) gsap.to(target, { ...values, duration, ease: 'power3.out', overwrite: 'auto', onUpdate: wake });
  else { gsap?.killTweensOf(target); Object.assign(target, values); wake(); }
}
function wake() {
  if (!frame && active && visible && !document.hidden) frame = requestAnimationFrame(render);
}
function expandedCardOffset(panel) {
  // Reserve the full tilt envelope once, so pointer movement never repositions a card.
  const index = panels.indexOf(panel);
  const [x, y, z, angle] = placements[index];
  const anchor = (distance - 500) / (distance - z);
  const raise = y < lowest + 220 ? 100 : 0;
  const height = panel.card.offsetHeight;
  fitObject.position.set(x * anchor, (y + raise) * anchor, 500);
  fitObject.scale.setScalar(.85);
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  camera.updateMatrixWorld();
  for (const rx of [-.27, 0, .27]) {
    for (const ry of [-.34, 0, .34]) {
      fitObject.rotation.set(rx, angle + ry, 0);
      fitObject.updateMatrixWorld(true);
      for (const px of [-175, 175]) {
        for (const py of [217.5, 217.5 - height]) {
          boundsPoint.set(px, py, 0).applyMatrix4(fitObject.matrixWorld).project(camera);
          const screenX = (boundsPoint.x + 1) * size.width / 2;
          const screenY = (1 - boundsPoint.y) * size.height / 2;
          left = Math.min(left, screenX); right = Math.max(right, screenX);
          top = Math.min(top, screenY); bottom = Math.max(bottom, screenY);
        }
      }
    }
  }
  const margin = 50;
  const dx = left < margin ? margin - left : right > size.width - margin ? size.width - margin - right : 0;
  const dy = top < margin ? margin - top : bottom > size.height - margin ? size.height - margin - bottom : 0;
  const unitsPerPixel = 2 * (distance - 500) * Math.tan(THREE.MathUtils.degToRad(20)) / size.height;
  return { fitX: dx * unitsPerPixel, fitY: -dy * unitsPerPixel };
}
function render(now) {
  frame = 0;
  if (!active || !visible || document.hidden) return;
  const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
  previous = now;
  if (!motion.paused && !dialog.open) time += dt;
  camera.position.set(cameraOffset.x, cameraOffset.y + 25, distance);
  camera.lookAt(0, -20, -100);
  camera.updateMatrixWorld();
  panels.forEach((panel, index) => {
    const [x, y, z, angle] = placements[index];
    const float = motion.paused || panel.open ? 0 : Math.sin(time * .65 + index * 1.7) * 6;
    const anchor = (distance - z - panel.state.lift) / (distance - z);
    panel.object.position.set(x * anchor + panel.state.fitX, (y + panel.state.raise) * anchor + float + panel.state.fitY, z + panel.state.lift);
    panel.object.rotation.set(panel.state.rx, angle + panel.state.ry, 0);
    panel.object.scale.setScalar(panel.state.scale);
  });
  cssRenderer.render(cssScene, camera);
  if (!motion.paused && !dialog.open) wake();
}

function setOpen(panel, open) {
  if (panel.open === open) return;
  panel.open = open;
  panel.shell.style.zIndex = open ? '10' : String(Math.round(placements[panels.indexOf(panel)][2] / 100) + 4);
  panel.card.classList.toggle('room-open', open);
  panel.content.inert = !open;
  // visibility follows the fade, while inert removes hidden links from tab order immediately.
  if (gsap) gsap.to(panel.content, { autoAlpha: open ? 1 : 0, y: open ? 0 : -8,
    duration: motion.paused ? 0 : open ? .3 : .22, overwrite: true });
  else { panel.content.style.opacity = open ? '1' : '0'; panel.content.style.visibility = open ? 'visible' : 'hidden'; }
  const index = panels.indexOf(panel);
  animate(panel.state, {
    lift: open ? 500 - placements[index][2] : 0,
    raise: open && placements[index][1] < lowest + 220 ? 100 : 0,
    scale: open ? .85 : 1,
    ...(open ? expandedCardOffset(panel) : { fitX: 0, fitY: 0 })
  });
}

function updatePointer() {
  if (!active || dialog.open) return;
  const rect = room.getBoundingClientRect();
  panels.forEach(panel => {
    projection.copy(panel.object.position).project(camera);
    const cx = rect.left + (projection.x + 1) * size.width / 2;
    // Aim toward the screenshot, not the invisible detail area below it.
    const cy = rect.top + (1 - projection.y) * size.height / 2 - 70;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const proximity = pointer.inside ? Math.max(0, 1 - Math.hypot(dx, dy) / 310) : 0;
    const strength = panel.open && pointer.inside ? 1 : proximity * proximity * (3 - 2 * proximity);
    animate(panel.state, {
      rx: motion.paused ? 0 : THREE.MathUtils.clamp(dy / 170, -1, 1) * .27 * strength,
      ry: motion.paused ? 0 : THREE.MathUtils.clamp(dx / 170, -1, 1) * .34 * strength
    }, .45);
  });
  animate(cameraOffset, {
    x: pointer.inside && !motion.paused ? ((pointer.x - rect.left) / size.width - .5) * 60 : 0,
    y: pointer.inside && !motion.paused ? -((pointer.y - rect.top) / size.height - .5) * 36 : 0
  }, 1);
}

function makeGallery() {
  cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.className = 'room-layer';
  room.prepend(cssRenderer.domElement);
  cssScene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 1, 6000);
  panels = cards.map(card => {
    const shell = document.createElement('div'); shell.className = 'room-panel';
    const title = card.querySelector('h3').cloneNode(true); title.className = 'room-title';
    card.querySelector('.project-preview').after(title);
    const object = new CSS3DObject(shell);
    cssScene.add(object);
    const panel = { shell, card, object, title, content: card.querySelector('.project-content'), state: { rx: 0, ry: 0, lift: 0, raise: 0, fitX: 0, fitY: 0, scale: 1 }, open: false, hovered: false };
    card.addEventListener('pointerenter', event => {
      if (!active || event.pointerType !== 'mouse') return;
      panel.hovered = true; setOpen(panel, true);
    });
    card.addEventListener('pointerleave', () => {
      panel.hovered = false;
      if (active && !card.contains(document.activeElement)) setOpen(panel, false);
    });
    card.addEventListener('focusin', () => { if (active) setOpen(panel, true); });
    card.addEventListener('focusout', () => queueMicrotask(() => {
      if (active && !panel.hovered && !card.contains(document.activeElement)) setOpen(panel, false);
    }));
    return panel;
  });

}

function resize() {
  if (!active) return;
  const rect = room.getBoundingClientRect();
  size = { width: rect.width, height: rect.height };
  cssRenderer.setSize(size.width, size.height);
  camera.aspect = size.width / size.height;
  // Fit the actual composition rather than assuming a fixed number of rows.
  distance = Math.max(1580, 1580 / camera.aspect, (spread / 2 + 170) / Math.tan(THREE.MathUtils.degToRad(20)) + 220);
  camera.far = distance + 2500;
  camera.updateProjectionMatrix();
  camera.position.set(cameraOffset.x, cameraOffset.y + 25, distance);
  camera.lookAt(0, -20, -100);
  camera.updateMatrixWorld();
  panels.forEach((panel, index) => {
    const [x, y, z, angle] = placements[index];
    Object.assign(panel.state, panel.open ? expandedCardOffset(panel) : { fitX: 0, fitY: 0 });
    const anchor = (distance - z - panel.state.lift) / (distance - z);
    panel.object.position.set(x * anchor + panel.state.fitX, (y + panel.state.raise) * anchor + panel.state.fitY, z + panel.state.lift);
    panel.object.rotation.set(panel.state.rx, angle + panel.state.ry, 0);
    panel.object.scale.setScalar(panel.state.scale);
  });
  // Mount accessible DOM immediately, even before the gallery scrolls into view.
  cssRenderer.render(cssScene, camera);
  wake();
}
function setMode(enabled) {
  if (enabled && !cssRenderer) {
    try { makeGallery(); }
    catch (error) {
      failed = true; enabled = false;
      console.warn('Floating gallery unavailable; showing project cards:', error.message);
    }
  }
  active = enabled;
  section.classList.toggle('has-project-gallery', enabled);
  room.hidden = !enabled;
  grid.hidden = enabled;
  viewButton.textContent = enabled ? 'Switch to list view' : 'Show floating gallery';
  viewButton.setAttribute('aria-pressed', String(enabled));
  viewButton.hidden = !desktop.matches || failed;
  toolbar.hidden = !desktop.matches;
  panels.forEach(panel => {
    gsap?.killTweensOf([panel.state, panel.content]);
    panel.open = false; panel.hovered = false;
    panel.state.rx = panel.state.ry = panel.state.lift = panel.state.raise = panel.state.fitX = panel.state.fitY = 0;
    panel.state.scale = 1;
    panel.card.classList.toggle('in-room', enabled);
    panel.card.classList.remove('room-open');
    panel.content.inert = enabled;
    panel.content.style.opacity = enabled ? '0' : '';
    panel.content.style.visibility = enabled ? 'hidden' : '';
    panel.content.style.transform = '';
    (enabled ? panel.shell : grid).append(panel.card);
  });
  pointer.inside = false;
  gsap?.killTweensOf(cameraOffset); cameraOffset.x = cameraOffset.y = 0;
  if (!active) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  else { resize(); wake(); }
  window.ScrollTrigger?.refresh();
}

room.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  pointer.inside = true; pointer.x = event.clientX; pointer.y = event.clientY; updatePointer();
});
room.addEventListener('pointerleave', () => { pointer.inside = false; updatePointer(); });
viewButton.addEventListener('click', () => { manualList = active; setMode(!active && desktop.matches && !failed); });
desktop.addEventListener('change', () => setMode(desktop.matches && !manualList && !failed));
window.addEventListener('portfolio:motion', () => {
  if (!active) return;
  panels.forEach((panel, index) => {
    gsap?.killTweensOf([panel.state, panel.content]);
    panel.state.rx = panel.state.ry = 0;
    panel.state.lift = panel.open ? 500 - placements[index][2] : 0;
    panel.state.raise = panel.open && placements[index][1] < lowest + 220 ? 100 : 0;
    panel.state.scale = panel.open ? .85 : 1;
    Object.assign(panel.state, panel.open ? expandedCardOffset(panel) : { fitX: 0, fitY: 0 });
    panel.content.style.opacity = panel.open ? '1' : '0';
    panel.content.style.visibility = panel.open ? 'visible' : 'hidden';
    panel.content.style.transform = '';
  });
  gsap?.killTweensOf(cameraOffset); cameraOffset.x = cameraOffset.y = 0; wake();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  else wake();
});
dialog.addEventListener('close', wake);
const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(room); resizeObserver.observe(section);
const observer = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  else wake();
}, { rootMargin: '100px' }); observer.observe(room);
window.addEventListener('pagehide', event => {
  cancelAnimationFrame(frame); frame = 0;
  if (event.persisted) return;
  observer.disconnect(); resizeObserver.disconnect();
  panels.forEach(panel => gsap?.killTweensOf([panel.state, panel.content]));
  gsap?.killTweensOf(cameraOffset);
});
window.addEventListener('pageshow', wake);
setMode(desktop.matches);
