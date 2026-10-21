const section = document.querySelector('#about');
const slots = [...section.querySelectorAll('.about-note-slot')];
const notes = [...section.querySelectorAll('.about-note')];
const gsap = window.gsap;
let entrance;

function animateAbout() {
  entrance?.revert();
  notes.forEach(note => { gsap?.killTweensOf(note); gsap?.set(note, { clearProps: 'transform' }); });
  if (!gsap || !window.ScrollTrigger || window.portfolioMotion.paused) return;
  entrance = gsap.context(() => {
    gsap.from(slots, { y: 30, opacity: 0, duration: .85, stagger: .15, ease: 'power3.out',
      clearProps: 'opacity,transform', scrollTrigger: { trigger: section.querySelector('.about-notes'), start: 'top 88%', once: true } });
  }, section);
}
notes.forEach((note, i) => {
  note.addEventListener('pointermove', event => {
    if (!gsap || window.portfolioMotion.paused || event.pointerType !== 'mouse') return;
    const rect = slots[i].getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
    gsap.to(note, { rotationY: x * 7, rotationX: -y * 5, z: 10, duration: .6, ease: 'power3.out', overwrite: true });
  });
  note.addEventListener('pointerleave', () => gsap?.to(note, { rotationY: 0, rotationX: 0, z: 0,
    duration: window.portfolioMotion.paused ? 0 : .7, ease: 'power3.out', overwrite: true }));
});
window.addEventListener('portfolio:motion', animateAbout);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  entrance?.revert(); notes.forEach(note => gsap?.killTweensOf(note));
});
animateAbout();
