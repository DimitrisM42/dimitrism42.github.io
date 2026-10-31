(() => {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a')];
  const indicator = nav.querySelector('.nav-indicator');
  const sections = links.map(link => ({
    id: link.hash.slice(1), label: link.querySelector('span').textContent.trim(),
    element: document.querySelector(link.hash), link,
  })).filter(section => section.element);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ruler, positions = [], active, frame = 0, generation = 0;

  // Tablets and narrow/short desktop windows retain the ruler; a landscape phone is still a phone.
  function isPhone() {
    const ua = navigator.userAgent;
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) ||
        (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return false;
    if (/iPhone|iPod|Windows Phone|Android.*Mobile/i.test(ua)) return true;
    if (/Android/i.test(ua)) return false;
    return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
  }

  function highlight(id) {
    active = id;
    for (const { id: sectionId, link } of sections) {
      const selected = sectionId === id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if (!ruler) {
      const link = sections.find(section => section.id === id)?.link;
      if (link && indicator) {
        indicator.style.width = `${link.offsetWidth}px`;
        indicator.style.transform = `translateX(${link.offsetLeft}px)`;
      }
    }
  }

  function update() {
    frame = 0;
    nav.classList.toggle('scrolled', scrollY > 40);
    if (ruler) return;
    const line = scrollY + Math.min(innerHeight * .3, 200);
    let index = 0;
    positions.forEach((top, i) => { if (top <= line) index = i; });
    if (scrollY >= document.documentElement.scrollHeight - innerHeight - 4) index = sections.length - 1;
    if (sections[index]?.id !== active) highlight(sections[index].id);
  }
  function queue() { if (!frame) frame = requestAnimationFrame(update); }
  function measure() {
    positions = sections.map(({ element }) => element.getBoundingClientRect().top + scrollY);
    if (active) highlight(active);
    queue();
  }
  async function configure() {
    const token = ++generation;
    ruler?.destroy(); ruler = null;
    const phone = isPhone();
    document.documentElement.dataset.navigationDevice = phone ? 'phone' : 'large';
    if (!phone && window.gsap) {
      try {
        const { createRuler } = await import('./ruler.js');
        if (token !== generation) return;
        ruler = createRuler({ sections, reduced: reduced.matches, onActive: highlight,
          onFailure: () => { if (token === generation) { ruler = null; measure(); } },
        });
      } catch (error) {
        console.warn('Section ruler unavailable; using standard navigation.', error);
      }
    }
    measure();
  }

  sections.forEach(({ element }) => { element.tabIndex = -1; });
  nav.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const index = links.indexOf(event.target.closest('a'));
    if (index < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 :
      (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links[next].focus({ preventScroll: true });
  });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  reduced.addEventListener('change', configure);
  const observer = new ResizeObserver(measure);
  observer.observe(document.querySelector('main'));
  document.fonts?.ready.then(measure);
  window.portfolioIntro?.ready.then(measure);
  configure();
})();

// Secrets remain independent of the navigation enhancement.
import('./secrets.js').catch(error => console.warn('Secret journal unavailable:', error.message));
