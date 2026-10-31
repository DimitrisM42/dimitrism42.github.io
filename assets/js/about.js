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
    gsap.from(slots, { y: 20, opacity: 0, duration: .65, stagger: .12, ease: 'power3.out',
      clearProps: 'opacity,transform', scrollTrigger: { trigger: section.querySelector('.about-notes'), start: 'top 88%', once: true } });
  }, section);
}
window.addEventListener('portfolio:motion', animateAbout);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  entrance?.revert(); notes.forEach(note => gsap?.killTweensOf(note));
});
animateAbout();
