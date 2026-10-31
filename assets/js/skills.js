import * as THREE from '../vendor/three.module.min.js';

const gsap = window.gsap, motion = window.portfolioMotion;
const section = document.querySelector('#skills');
const layout = section.querySelector('.skills-layout');
const host = section.querySelector('.skills-sculpture');
const planes = [...section.querySelectorAll('.skills-plane')];
const names = ['Frontend', 'Backend', 'Languages', 'Tools'];
const icons = ['fa-code', 'fa-server', 'fa-file-code', 'fa-gear'];
// Open from the top: each gap carries only the plates below it.
const assembly = { base: 2.4, gap1: .17, gap2: .17, gap3: .17, reveal: 0 };
const labelLayer = document.createElement('div');
labelLayer.className = 'stack-layer-labels'; labelLayer.setAttribute('aria-hidden', 'true');
const labels = names.map((name, i) => {
  const label = document.createElement('div'); label.className = 'stack-layer-caption';
  const icon = document.createElement('i'); icon.className = `fa-solid ${icons[i]}`;
  const text = document.createElement('span'); text.textContent = name;
  label.append(icon, text); labelLayer.append(label); return label;
});
host.append(labelLayer);
const labelPoint = new THREE.Vector3();
const labelOffset = new THREE.Vector3(.65, .15, .65);
let renderer, scene, camera, entrance, frame = 0, visible = false;
let layers = [], selected = 0, pinned = 0, failed = false;
const view = { x: 0, y: 0 };

function wake() {
  if (!frame && renderer && visible && !document.hidden && !failed) frame = requestAnimationFrame(render);
}
function render() {
  frame = 0;
  camera.position.set(7 + view.x, 5.6 + view.y, 7);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  const labelWidth = host.clientWidth, labelHeight = host.clientHeight;
  layers.forEach((layer, i) => {
    // Screen-facing icons retain their proportions while following each 3D plate.
    labelPoint.copy(layer.group.position).add(labelOffset).project(camera);
    labels[i].style.transform = `translate(${(labelPoint.x + 1) * labelWidth / 2}px, ${(1 - labelPoint.y) * labelHeight / 2}px) translate(-50%, -50%)`;
    const revealGap = i === 0 ? assembly.reveal * 1.1 : assembly[`gap${i}`];
    labels[i].style.opacity = String(THREE.MathUtils.smoothstep(revealGap, .75, 1.05));
  });
  host.classList.add('is-rendered');
}
function positionLayers() {
  layers.forEach((layer, i) => {
    let y = assembly.base;
    for (let gap = 1; gap <= i; gap++) {
      y -= assembly[`gap${gap}`];
    }
    // Lift only after the steps have separated, keeping the assembly collision-free.
    const open = THREE.MathUtils.smoothstep(Math.min(assembly.gap1, assembly.gap2, assembly.gap3), .75, 1.05);
    layer.group.position.set(0, y + layer.lift * open, 0);
  });
  wake();
}
function select(index, instant = false) {
  selected = index;
  labels.forEach((label, i) => label.classList.toggle('is-selected', i === index));
  planes.forEach((plane, i) => {
    plane.classList.toggle('is-selected', i === index);
    plane.querySelector('.stack-category').setAttribute('aria-pressed', String(i === index));
  });
  host.querySelectorAll('.stack-fallback span').forEach((span, i) => span.classList.toggle('is-selected', i === index));
  layers.forEach((layer, i) => {
    const color = new THREE.Color(i === index ? 0xff9e00 : 0x686c70);
    const duration = motion.paused || instant ? 0 : .45;
    if (gsap) {
      gsap.to(layer.outline.material.color, { r: color.r, g: color.g, b: color.b, duration, onUpdate: wake, overwrite: true });
      gsap.to(layer.glow.material.color, { r: color.r, g: color.g, b: color.b, duration, onUpdate: wake, overwrite: true });
      gsap.to(layer.material, { emissiveIntensity: i === index ? .035 : 0, duration, onUpdate: wake, overwrite: true });
      gsap.to(layer.glow.material, { opacity: i === index ? .09 : 0, duration, onUpdate: wake, overwrite: true });
      gsap.to(layer, { lift: i === index ? .08 : 0, duration, ease: 'power2.out', onUpdate: positionLayers, overwrite: true });
    } else {
      layer.outline.material.color.copy(color);
      layer.glow.material.color.copy(color);
      layer.material.emissiveIntensity = i === index ? .035 : 0;
      layer.glow.material.opacity = i === index ? .09 : 0;
      layer.lift = i === index ? .08 : 0;
    }
  });
  positionLayers();
}
planes.forEach((plane, index) => {
  const heading = plane.querySelector('h3');
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'stack-category'; button.textContent = heading.textContent;
  button.setAttribute('aria-pressed', String(index === 0)); heading.replaceChildren(button);
  button.addEventListener('click', () => { pinned = index; select(index); });
  plane.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') select(index); });
  plane.addEventListener('pointerleave', () => { if (!plane.contains(document.activeElement)) select(pinned); });
  plane.addEventListener('focusin', () => select(index));
  plane.addEventListener('focusout', event => { if (!plane.contains(event.relatedTarget)) select(pinned); });
});
select(0, true);

function roundedPlate(width, height, radius) {
  const s = new THREE.Shape(), x = -width / 2, y = -height / 2;
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height); s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}
function createSculpture() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true'); host.prepend(renderer.domElement);
  scene = new THREE.Scene(); camera = new THREE.OrthographicCamera(-3, 3, 4, -4, .1, 40);
  scene.add(new THREE.HemisphereLight(0xe9ecef, 0x101214, 1.3));
  const warm = new THREE.DirectionalLight(0xf3f4f5, 2.6); warm.position.set(2, 5, 4); scene.add(warm);
  const rim = new THREE.DirectionalLight(0xcbd1d8, 1.8); rim.position.set(-4, 1, -2); scene.add(rim);
  const plate = roundedPlate(3.2, 3.2, .1);
  const geometry = new THREE.ExtrudeGeometry(plate, { depth: .085, bevelEnabled: true, bevelSegments: 3,
    steps: 1, bevelSize: .025, bevelThickness: .018, curveSegments: 16 });
  const edgePoints = plate.getPoints(48).map(p => new THREE.Vector3(p.x, p.y, .107));
  edgePoints.pop();
  const edgeCurve = new THREE.CatmullRomCurve3(edgePoints, true);
  const outlineGeometry = new THREE.TubeGeometry(edgeCurve, 192, .009, 6, true);
  const glowGeometry = new THREE.TubeGeometry(edgeCurve, 192, .035, 6, true);
  layers = names.map((name, index) => {
    const group = new THREE.Group();
    const material = new THREE.MeshPhysicalMaterial({ color: 0x0d0f11, metalness: .3, roughness: .48,
      clearcoat: .35, emissive: 0x332616, emissiveIntensity: 0 });
    const side = new THREE.MeshStandardMaterial({ color: 0x0d0f11, metalness: .35, roughness: .45 });
    const face = new THREE.Mesh(geometry, [material, side]);
    const outline = new THREE.Mesh(outlineGeometry, new THREE.MeshBasicMaterial({ color: 0x686c70 }));
    const glow = new THREE.Mesh(glowGeometry, new THREE.MeshBasicMaterial({ color: 0x686c70, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.z = -.10;
    const surface = new THREE.Group(); surface.rotation.x = -Math.PI / 2;
    surface.add(face, outline, glow); group.add(surface); scene.add(group);
    return { group, material, outline, glow, lift: 0 };
  });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); failed = true; host.classList.remove('is-rendered'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { failed = false; resize(); wake(); });
  resize();
  // Warm shaders while the section is still approaching, before its entrance.
  renderer.compile(scene, camera);
}
function resize() {
  if (!renderer) return;
  const rect = host.getBoundingClientRect(); if (!rect.width || !rect.height) return;
  renderer.setSize(rect.width, rect.height, false);
  const aspect = rect.width / rect.height;
  const halfHeight = Math.max(3.85, 2.55 / aspect);
  camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
  camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.updateProjectionMatrix(); wake();
}
function setupEntrance() {
  entrance?.revert();
  gsap?.killTweensOf(assembly);
  Object.assign(assembly, { base: 1.98, gap1: 1.32, gap2: 1.32, gap3: 1.32, reveal: 1 });
  positionLayers();
  if (!gsap || !window.ScrollTrigger || motion.paused) { select(selected, true); wake(); return; }
  entrance = gsap.context(() => {
    const timeline = gsap.timeline({ scrollTrigger: { trigger: layout, start: 'top 85%', once: true } });
    Object.assign(assembly, { base: 2.4, gap1: .17, gap2: .17, gap3: .17, reveal: 0 });
    positionLayers();
    timeline.to(assembly, { base: 1.98, reveal: 1, duration: .65, ease: 'power2.inOut', onUpdate: positionLayers }, 0);
    [1, 2, 3].forEach((gap, step) => {
      timeline.to(assembly, { [`gap${gap}`]: 1.32, duration: .8, ease: 'power2.inOut', onUpdate: positionLayers }, .3 + step * .5);
    });
    planes.forEach((plane, i) => {
      timeline.from(plane.querySelector('h3'), { opacity: 0, duration: .4, clearProps: 'opacity' }, .2 + i * .5)
        .from(plane.querySelectorAll('.skill-card'), { opacity: 0, duration: .45, stagger: .04,
          clearProps: 'opacity' }, .3 + i * .5);
    });
  });
  select(selected, true); wake();
}
const loader = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  loader.disconnect();
  try { createSculpture(); } catch (error) {
    renderer?.dispose(); renderer = null; host.classList.remove('is-rendered'); console.warn('Static developer stack:', error.message);
  }
  setupEntrance();
}, { rootMargin: '800px' }); loader.observe(layout);
const observer = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible) { cancelAnimationFrame(frame); frame = 0; } else wake();
}); observer.observe(host);
const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
host.addEventListener('pointermove', event => {
  if (!gsap || motion.paused || event.pointerType !== 'mouse') return;
  const rect = host.getBoundingClientRect();
  gsap.to(view, { x: ((event.clientX - rect.left) / rect.width - .5) * .18,
    y: -((event.clientY - rect.top) / rect.height - .5) * .1, duration: .7, overwrite: true, onUpdate: wake });
});
host.addEventListener('pointerleave', () => gsap?.to(view, { x: 0, y: 0, duration: motion.paused ? 0 : .7, overwrite: true, onUpdate: wake }));
window.addEventListener('portfolio:motion', () => {
  gsap?.killTweensOf(view); view.x = view.y = 0; setupEntrance();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake(); });
window.addEventListener('pageshow', wake);
window.addEventListener('pagehide', event => {
  cancelAnimationFrame(frame); frame = 0;
  if (event.persisted) return;
  loader.disconnect(); observer.disconnect(); resizeObserver.disconnect(); entrance?.revert(); gsap?.killTweensOf([view, assembly]);
  layers.forEach(layer => {
    gsap?.killTweensOf([layer, layer.material, layer.outline.material.color, layer.glow.material, layer.glow.material.color]);
  });
  scene?.traverse(object => { object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else object.material?.dispose();
  }); renderer?.dispose();
});
