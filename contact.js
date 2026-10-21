const section = document.querySelector('#contact');
const network = section.querySelector('.contact-network');
const cards = [...network.querySelectorAll('.connect-card')];
const slots = [...network.querySelectorAll('.contact-card-slot')];
const paths = [...network.querySelectorAll('path')];
const svg = network.querySelector('svg');
const node = network.querySelector('.contact-node');
const gsap = window.gsap;
let entrance;

function drawConnections() {
  const bounds = network.getBoundingClientRect();
  const hub = node.getBoundingClientRect();
  const x = hub.left + hub.width / 2 - bounds.left;
  const y = hub.top + hub.height / 2 - bounds.top;
  svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  cards.forEach((card, i) => {
    const target = card.getBoundingClientRect();
    const endX = target.left - bounds.left + 4;
    const endY = target.top - bounds.top + target.height / 2;
    const middle = x + (endX - x) * .5;
    paths[i].setAttribute('d', `M ${x} ${y} C ${middle} ${y}, ${middle} ${endY}, ${endX} ${endY}`);
  });
}
function animateEntrance() {
  entrance?.revert();
  cards.forEach(card => { gsap?.killTweensOf(card); gsap?.set(card, { clearProps: 'transform' }); });
  drawConnections();
  if (!gsap || !window.ScrollTrigger || window.portfolioMotion.paused) return;
  entrance = gsap.context(() => {
    gsap.timeline({ scrollTrigger: { trigger: network, start: 'top 85%', once: true } })
      .from(slots, { y: 36, opacity: 0, duration: .85, stagger: .14, ease: 'power3.out', clearProps: 'transform,opacity', onUpdate: drawConnections })
      .from(paths, { strokeDashoffset: 1, duration: 1.1, stagger: .12, ease: 'power2.out', clearProps: 'strokeDashoffset' }, .15)
      .from(node, { opacity: 0, scale: .6, duration: .5, clearProps: 'opacity,transform' }, .1);
  }, section);
}
paths.forEach(path => path.setAttribute('pathLength', '1'));
cards.forEach((card, i) => {
  const highlight = active => paths[i].classList.toggle('is-active', active);
  const settle = () => {
    highlight(card.contains(document.activeElement));
    gsap?.to(card, { rotationX: 3, rotationY: -7, z: 0, duration: window.portfolioMotion.paused ? 0 : .65,
      ease: 'power3.out', overwrite: true, onUpdate: drawConnections });
  };
  card.addEventListener('pointerenter', () => highlight(true));
  card.addEventListener('pointermove', event => {
    if (!gsap || window.portfolioMotion.paused || event.pointerType !== 'mouse') return;
    const rect = slots[i].getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
    gsap.to(card, { rotationY: x * 10, rotationX: -y * 8, z: 20, duration: .55,
      ease: 'power3.out', overwrite: true, onUpdate: drawConnections });
  });
  card.addEventListener('pointerleave', settle);
  card.addEventListener('focusin', () => highlight(true));
  card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) highlight(false); });
});
const copy = section.querySelector('.copy-email');
const status = section.querySelector('.contact-status');
if (navigator.clipboard?.writeText) {
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('dimitmourh@gmail.com');
      status.textContent = 'Copied. The first hello is on you.';
    } catch {
      status.textContent = 'Couldn’t copy. Email me at dimitmourh@gmail.com.';
    }
  });
}
const resize = new ResizeObserver(drawConnections); resize.observe(network);
window.addEventListener('portfolio:motion', animateEntrance);
window.addEventListener('pageshow', drawConnections);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  resize.disconnect(); entrance?.revert(); cards.forEach(card => gsap?.killTweensOf(card));
});
animateEntrance();
