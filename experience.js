/* Progressive enhancements for the static portfolio. */
(() => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = window.portfolioMotion = { paused: reduced.matches };
  let motionContext;
  let dialogTween;

  function choreograph() {
    motionContext?.revert();
    motionContext = null;
    if (!gsap || !ScrollTrigger || motion.paused) return;
    motionContext = gsap.context(() => {
      if (window.scrollY < 100) {
        gsap.timeline({ defaults: { duration: .75, ease: 'power3.out' } })
          .from('.hero-content > .eyebrow', { opacity: 0, y: 12 })
          .from('.hero h1', { opacity: 0, y: 28 }, .12)
          .from('.hero-type, .hero-summary', { opacity: 0, y: 18, stagger: .1 }, .25)
          .from('.hero-actions, .secret-hint, .next-preview', { opacity: 0, y: 12, stagger: .08 }, .45)
          .from('#code-bg', { opacity: 0, duration: 1.2 }, .1);
      }
      document.querySelectorAll('.section-header').forEach(header => {
        gsap.from(header.children, { y: 24, opacity: 0, stagger: .08, duration: .65,
          scrollTrigger: { trigger: header, start: 'top 92%', once: true } });
      });
      document.querySelectorAll('.preview-screen img').forEach(img => {
        gsap.fromTo(img, { yPercent: 4, scale: 1.08 }, { yPercent: -3, scale: 1.08, ease: 'none',
          scrollTrigger: { trigger: img.closest('.project-card'), start: 'top bottom', end: 'bottom top', scrub: .7 } });
      });
    });
  }

  function updateMotion() {
    if (dialogTween) dialogTween.progress(1);
    document.documentElement.classList.toggle('motion-paused', motion.paused);
    choreograph();
    window.dispatchEvent(new Event('portfolio:motion'));
  }
  reduced.addEventListener('change', () => { motion.paused = reduced.matches; updateMotion(); });

  const cards = [...document.querySelectorAll('.project-card')];

  // Project copy expands only on details already documented in this portfolio.
  const details = {
    'sante-cafe-bar': { problem: 'Bring the cafeteria’s content, staff, shifts, deliveries, coupons, and ordering workflows into one management system.',
      contribution: 'Building the cafeteria admin system, CMS, staff workflows, and ESP32 integration for network printing.',
      features: ['Content management through a CMS', 'Staff accounts and shift management', 'Delivery and coupon management', 'Order printing through an ESP32, with separate bar and kitchen printer targets'] },
    'retrobyte': { problem: 'Bring a retro product catalog and the work of managing products and orders into one e-commerce website.',
      contribution: 'Building the responsive storefront and a custom CMS around PHP, MySQL, and JavaScript.',
      features: ['Product listings and individual product pages', 'Custom CMS for product and order management', 'Responsive pages with a retro visual identity'] },
    'ieee-aegean': { problem: 'Give the IEEE Aegean Student Branch a central place to present its events, members, and information.',
      contribution: 'Developing a glass-themed interface and JSON-driven content for the student branch website.',
      features: ['Event information', 'Board member profiles', 'JSON-driven content and responsive pages'] },
    'autoservice-garage': { problem: 'Organize the everyday workflow of an auto repair shop, from customers to appointments and jobs.',
      contribution: 'Building a PHP and MySQL application with customer, secretary, and mechanic views for vehicle records, appointment booking, and recorded repair work.',
      features: ['Registered vehicles, appointment booking, and automatic mechanic assignment', 'Arrival tracking and time-based appointment statuses', 'Work entries with materials, duration, and automatically calculated appointment costs'] },
    'java-ticket-booking': { problem: 'Coordinate event management and ticket reservations across a distributed Java application.',
      contribution: 'Implementing booking workflows using Java RMI and TCP socket communication.',
      features: ['User roles and event management', 'Ticket reservations', 'Callback-based discounts'] },
    'music-library': { problem: 'Model a digital music library with communication between clients and a server.',
      contribution: 'Building a Java client-server application around TCP sockets, concurrency, and streaming data.',
      features: ['Digital music library simulation', 'TCP socket communication', 'Concurrent operations and streaming data'] },
    'festival-api': { problem: 'Expose consistent backend operations for festivals, performances, and reservations.',
      contribution: 'Developing a Spring Boot REST service with Hibernate, validation, and structured error handling.',
      features: ['CRUD operations for festival resources', 'Performance and reservation management', 'Input validation and structured errors'] },
    'race-console': { problem: 'Make the game’s live race telemetry readable during driving and available for review after a session.',
      contribution: 'Building a native Windows application in C# and WPF, with local UDP telemetry processing, race views, and recording and replay workflows.',
      features: ['Live F1 25 telemetry dashboards, timing, and vehicle condition', 'Strategy and race preparation views', 'Local telemetry recordings and replay playback with seeking and bookmarks'] }
  };
  const dialog = document.querySelector('#project-dialog');
  const detailImage = document.querySelector('#detail-image');
  let opener;
  let savedOverflow = '';
  let closing = false;
  function openProject(index, trigger) {
    if (dialog.open) return;
    opener = trigger;
    const card = cards[index];
    const img = card.querySelector('img');
    const imageSrc = img.dataset.detailSrc || img.currentSrc || img.src;
    window.dispatchEvent(new CustomEvent('portfolio:project', { detail: { id: card.dataset.project, title: card.querySelector('.project-content h3').textContent, imageSrc, imageAlt: img.alt } }));
    const rect = img.getBoundingClientRect();
    detailImage.src = imageSrc;
    detailImage.alt = img.alt;
    document.querySelector('#detail-title').textContent = card.querySelector('.project-content h3').textContent;
    document.querySelector('#detail-stack').textContent = card.querySelector('.stack').textContent;
    document.querySelector('#detail-summary').textContent = card.querySelector('.project-content > p:not(.stack)').textContent.trim();
    const detail = details[card.dataset.project];
    document.querySelector('#detail-problem').textContent = detail?.problem || '';
    document.querySelector('#detail-contribution').textContent = detail?.contribution || '';
    document.querySelector('.detail-columns').hidden = !detail;
    document.querySelector('#detail-features').replaceChildren(...(detail?.features || []).map(text => {
      const li = document.createElement('li'); li.textContent = text; return li;
    }));
    document.querySelector('#detail-links').replaceChildren(...[...card.querySelectorAll('.project-links a')].map(link => link.cloneNode(true)));
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
    if (gsap && !motion.paused) {
      const target = detailImage.getBoundingClientRect();
      dialogTween = gsap.timeline();
      if (target.width && target.height) dialogTween
        .fromTo(detailImage, { x: rect.left - target.left, y: rect.top - target.top, scaleX: rect.width / target.width,
          scaleY: rect.height / target.height, transformOrigin: 'top left' },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .55, ease: 'power3.inOut', clearProps: 'transform,transformOrigin' });
      dialogTween.fromTo('.detail-body', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .3, clearProps: 'transform,opacity' }, .25);
    }
  }
  function closeProject() {
    if (!dialog.open || closing) return;
    closing = true;
    dialogTween?.progress(1);
    const finish = () => { dialog.close(); closing = false; };
    if (gsap && !motion.paused) {
      dialogTween = gsap.to(dialog, { opacity: 0, y: 12, duration: .18, onComplete: finish });
    } else finish();
  }
  dialog.querySelector('.detail-close').addEventListener('click', closeProject);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProject();
  });
  dialog.addEventListener('close', () => {
    window.dispatchEvent(new Event('portfolio:project-close'));
    document.body.style.overflow = savedOverflow;
    gsap?.set(dialog, { clearProps: 'transform,opacity' });
    opener?.focus({ preventScroll: true });
  });
  cards.forEach((card, index) => {
    const img = card.querySelector('img');
    const title = card.querySelector('h3').textContent;
    const preview = document.createElement('button');
    preview.type = 'button'; preview.className = 'project-preview';
    preview.setAttribute('aria-label', `Explore ${title}`);
    preview.setAttribute('aria-haspopup', 'dialog');
    const bar = document.createElement('span'); bar.className = 'browser-bar'; bar.setAttribute('aria-hidden', 'true');
    const desktop = ['race-console', 'java-ticket-booking', 'music-library'].includes(card.dataset.project);
    card.classList.toggle('desktop-project', desktop);
    for (let i = 0; i < 3; i++) bar.append(document.createElement('i'));
    const url = document.createElement('span');
    url.textContent = (card.dataset.previewLabel || new URL(card.querySelector('.project-links a').href).hostname) + ' / ' + title;
    bar.append(url);
    if (desktop) {
      bar.replaceChildren(url);
      const controls = document.createElement('b'); controls.className = 'window-controls'; controls.textContent = '−  □  ×'; bar.append(controls);
    }
    const screen = document.createElement('span'); screen.className = 'preview-screen';
    img.before(preview); screen.append(img); preview.append(bar, screen);
    preview.addEventListener('click', () => openProject(index, preview));
    const button = document.createElement('button'); button.className = 'detail-trigger'; button.type = 'button';
    button.innerHTML = 'Explore project <span aria-hidden="true">↗</span>';
    button.setAttribute('aria-label', `View details for ${title}`); button.setAttribute('aria-haspopup', 'dialog');
    card.querySelector('.project-content').append(button);
    button.addEventListener('click', () => openProject(index, button));
    preview.addEventListener('pointermove', event => {
      if (motion.paused || !gsap || event.pointerType !== 'mouse' || card.classList.contains('in-room')) return;
      const rect = preview.getBoundingClientRect();
      gsap.to(screen, { rotationY: ((event.clientX - rect.left) / rect.width - .5) * 5,
        rotationX: -((event.clientY - rect.top) / rect.height - .5) * 5, duration: .4, overwrite: true });
    });
    const resetTilt = () => gsap?.to(screen, { rotationX: 0, rotationY: 0, duration: motion.paused ? 0 : .4, overwrite: true });
    preview.addEventListener('pointerleave', resetTilt);
    window.addEventListener('portfolio:motion', resetTilt);
  });
  updateMotion();
  import('./skills.js').catch(error => console.warn('Skills use the static board layout:', error.message));
  import('./gallery.js').catch(error => console.warn('Project gallery uses the standard card layout:', error.message));
  import('./contact.js').catch(error => console.warn('Contact links remain available:', error.message));
  import('./about.js').catch(error => console.warn('About content remains available:', error.message));
})();
