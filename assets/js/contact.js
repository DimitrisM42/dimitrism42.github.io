const section = document.querySelector('#contact');
const network = section.querySelector('.contact-network');
const cards = [...network.querySelectorAll('.connect-card')];
const slots = [...network.querySelectorAll('.contact-card-slot')];
const svg = network.querySelector('.contact-connections');
const paths = [...svg.querySelectorAll('path')];
const node = network.querySelector('.contact-node');
const gsap = window.gsap;
let entrance;
const socialAnimations = new Map();
const socialGestures = {
  github: [
    { transform: 'rotate(0deg) scale(1)', offset: 0 },
    { transform: 'rotate(-12deg) scale(1.08)', offset: .25 },
    { transform: 'rotate(8deg) scale(1.08)', offset: .5 },
    { transform: 'rotate(-4deg) scale(1.04)', offset: .75 },
    { transform: 'rotate(0deg) scale(1)', offset: 1 },
  ],
  linkedin: [
    { transform: 'translateY(0) scale(1)', offset: 0 },
    { transform: 'translateY(-4px) scale(1.08)', offset: .35 },
    { transform: 'translateY(1px) scale(.98)', offset: .7 },
    { transform: 'translateY(0) scale(1)', offset: 1 },
  ],
};
function stopSocialAnimations() {
  socialAnimations.forEach(animation => animation.cancel()); socialAnimations.clear();
}
section.querySelectorAll('[data-social-motion]').forEach(icon => {
  const link = icon.closest('a');
  const play = () => {
    if (window.portfolioMotion.paused || document.hidden || socialAnimations.has(icon) || !icon.animate) return;
    const animation = icon.animate(socialGestures[icon.dataset.socialMotion], {
      duration: icon.dataset.socialMotion === 'github' ? 650 : 550,
      easing: 'ease-in-out',
    });
    socialAnimations.set(icon, animation);
    animation.onfinish = () => socialAnimations.delete(icon);
  };
  link.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') play(); });
  link.addEventListener('focus', () => { if (link.matches(':focus-visible')) play(); });
});
window.addEventListener('portfolio:motion', () => { if (window.portfolioMotion.paused) stopSocialAnimations(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSocialAnimations(); });

let connectionFrame = 0;
function drawConnections() {
  if (!connectionFrame) connectionFrame = requestAnimationFrame(() => { connectionFrame = 0; paintConnections(); });
}
function paintConnections() {
  const bounds = network.getBoundingClientRect();
  const hub = node.getBoundingClientRect();
  const x = hub.left + hub.width / 2 - bounds.left;
  const y = hub.top + hub.height / 2 - bounds.top;
  const targets = cards.map(card => card.getBoundingClientRect());
  svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  cards.forEach((card, i) => {
    const target = targets[i];
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
      .from(slots, { y: 20, opacity: 0, duration: .65, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity', onUpdate: drawConnections })
      .from(paths, { strokeDashoffset: 1, duration: .9, stagger: .08, ease: 'power2.out', clearProps: 'strokeDashoffset' }, .15)
      .from(node, { opacity: 0, scale: .85, duration: .45, clearProps: 'opacity,transform' }, .1);
  }, section);
}
paths.forEach(path => path.setAttribute('pathLength', '1'));
cards.forEach((card, i) => {
  const highlight = active => paths[i].classList.toggle('is-active', active);
  const settle = () => {
    highlight(card.contains(document.activeElement));
    gsap?.to(card, { rotationX: 0, rotationY: 0, z: 0, duration: window.portfolioMotion.paused ? 0 : .65,
      ease: 'power3.out', overwrite: true, onUpdate: drawConnections });
  };
  card.addEventListener('pointerenter', () => highlight(true));
  card.addEventListener('pointermove', event => {
    if (!gsap || window.portfolioMotion.paused || event.pointerType !== 'mouse') return;
    const rect = slots[i].getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
    gsap.to(card, { rotationY: x * 3, rotationX: -y * 2, z: 5, duration: .55,
      ease: 'power3.out', overwrite: true, onUpdate: drawConnections });
  });
  card.addEventListener('pointerleave', settle);
  card.addEventListener('focusin', () => highlight(true));
  card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) highlight(false); });
});
const copy = section.querySelector('.copy-email');
const status = section.querySelector('.contact-status');
let copyTimer;
function resetCopy() {
  clearTimeout(copyTimer); copy.classList.remove('is-copied');
  copy.querySelector('span').textContent = 'Copy email';
}
if (navigator.clipboard?.writeText) {
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('dimitmourh@gmail.com');
      clearTimeout(copyTimer); copy.classList.add('is-copied'); copy.querySelector('span').textContent = 'Copied';
      copyTimer = setTimeout(resetCopy, 1800);
      status.textContent = 'Copied. The first hello is on you.';
    } catch {
      resetCopy();
      status.textContent = 'Couldn’t copy. Email me at dimitmourh@gmail.com.';
    }
  });
}
const resize = new ResizeObserver(drawConnections); resize.observe(network);
window.addEventListener('portfolio:motion', animateEntrance);
window.addEventListener('pageshow', drawConnections);
window.addEventListener('pagehide', event => {
  resetCopy();
  stopSocialAnimations();
  if (event.persisted) return;
  resize.disconnect(); entrance?.revert(); cards.forEach(card => gsap?.killTweensOf(card));
});
animateEntrance();
