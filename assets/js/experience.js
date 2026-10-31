/* Progressive enhancements for the static portfolio. */
(() => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = window.portfolioMotion = { paused: reduced.matches };
  let introReady = !window.portfolioIntro?.active;
  let motionContext;
  let dialogTween;

  // Word masks preserve the existing text, line breaks, and accent spans.
  document.querySelectorAll('main .section-header h2').forEach(title => {
    const walker = document.createTreeWalker(title.querySelector('.section-title-copy') || title, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part || /^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
        const mask = document.createElement('span'); mask.className = 'heading-word';
        const word = document.createElement('span'); word.className = 'heading-word-inner';
        word.textContent = part; mask.append(word); fragment.append(mask);
      });
      node.replaceWith(fragment);
    });
  });

  function choreograph() {
    motionContext?.revert();
    motionContext = null;
    if (!gsap || !ScrollTrigger || motion.paused || !introReady) return;
    motionContext = gsap.context(() => {
      if (window.scrollY < 100 && (!location.hash || location.hash === '#hero')) {
        gsap.timeline({ defaults: { duration: .75, ease: 'power3.out' } })
          .from('.hero-content > .eyebrow', { opacity: 0, y: 12 })
          .from('.hero-greeting', { opacity: 0, y: 12, clearProps: 'transform,opacity' }, .1)
          .from('.hero h1 > span', { opacity: 0, y: 30, rotation: -.8, duration: .9, clearProps: 'transform,opacity' }, .2)
          .from('.hero-type, .hero-summary', { opacity: 0, y: 14, stagger: .1, clearProps: 'transform,opacity' }, .4)
          .from('.hero-actions, .secret-hint, .next-preview', { opacity: 0, y: 10, stagger: .08, clearProps: 'transform,opacity' }, .6)
          .from('#code-bg', { opacity: 0, duration: 1.2 }, .1);
      }
      document.querySelectorAll('main .section-header').forEach(header => {
        const reveal = gsap.timeline({ defaults: { duration: .65, ease: 'power3.out', clearProps: 'transform,opacity' },
          scrollTrigger: { trigger: header, start: 'top 88%', once: true } })
          .from(header.querySelector('.section-title-icon'), { opacity: 0, y: 8 }, 0)
          .from(header.querySelectorAll('.heading-word-inner'), { yPercent: 112, rotation: 1.2, stagger: .035, duration: .75 }, .08)
          .from(header.querySelectorAll(':scope > p:not(.section-kicker)'), { opacity: 0, y: 12 }, .22);
        // Resolve the completed timeline before later triggers inspect it on a deep link.
        reveal.scrollTrigger.refresh();
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
  if (!introReady) window.portfolioIntro.ready.then(() => { introReady = true; updateMotion(); });

  const cards = [...document.querySelectorAll('.project-card')];
  const filterGroup = document.querySelector('.project-filters');
  const filterButtons = [...filterGroup.querySelectorAll('button')];
  const visibleIndexes = () => cards.flatMap((card, index) => card.hidden ? [] : [index]);
  function filterProjects(category) {
    cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; card.inert = card.hidden; });
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === category)));
    document.querySelector('#project-filter-status').textContent = `${visibleIndexes().length} projects shown`;
    window.dispatchEvent(new Event('portfolio:filter'));
  }
  filterGroup.hidden = false;
  filterButtons.forEach(button => button.addEventListener('click', () => filterProjects(button.dataset.projectFilter)));


  // Project copy expands only on details already documented in this portfolio.
  const details = {
    'mourchoutas': { problem: 'Create a distinctive public showcase for the jewellery collections and watches of Mourchoutas in Kilkis, uniting Gold and Silver under one identity.',
      contribution: 'Designing and building the responsive website, its SVG logo introduction, and the scroll transition that carries the logo into the page background.',
      features: ['An SVG diamond and monogram drawn during the hero introduction', 'A continuous transition from the hero logo into the background as you scroll', 'Gold and Silver collections, jewellery categories, and watch browsing', 'Responsive layouts with light and dark themes and reduced-motion support'] },
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
  const titleFor = index => cards[index].querySelector('.project-content h3').textContent;
  const indexFor = id => cards.findIndex(card => card.dataset.project === id);
  const originalTitle = document.title;
  const position = dialog.querySelector('.detail-position');
  const copyLink = dialog.querySelector('.copy-project-link');
  const shareStatus = dialog.querySelector('#project-share-status');
  const shareFallback = dialog.querySelector('.detail-share-fallback');
  let currentIndex = -1;
  let copyTimer;
  let routeBackPending = false;
  let opener;
  let savedOverflow = '';
  let closing = false;
  function projectURL(id) {
    const url = new URL(location.href);
    url.searchParams.set('project', id); url.hash = 'projects';
    return url;
  }
  let openRequest = 0;
  const showcase = import('./showcase.js');
  const prepareProject = id => showcase.then(module => module.prepareProject(id));
  function prewarmProject(event) {
    const card = event.target.closest('.project-card, [data-project-open]');
    if (card) prepareProject(card.dataset.project || card.dataset.projectOpen).catch(() => {});
  }
  document.querySelector('#projects').addEventListener('pointerover', prewarmProject);
  document.querySelector('#projects').addEventListener('focusin', prewarmProject);
  async function openProject(index, trigger, routeMode = 'push') {
    if (!cards[index] || (dialog.open && currentIndex === index && !closing)) return;
    const request = ++openRequest;
    try { await prepareProject(cards[index].dataset.project); }
    catch (error) { console.warn('Project uses its original screenshot:', error.message); }
    if (request !== openRequest || (routeMode === 'none' && indexFor(new URL(location.href).searchParams.get('project')) !== index)) return;
    if (cards[index].hidden) filterProjects('all');
    const switching = dialog.open;
    if (closing) { dialogTween?.kill(); closing = false; gsap?.set(dialog, { clearProps: 'opacity,transform' }); }
    else dialogTween?.progress(1);
    if (!switching) opener = trigger || cards[index].querySelector('.project-preview');
    currentIndex = index;
    const card = cards[index];
    if (routeMode !== 'none') {
      const state = switching ? history.state : { ...history.state, portfolioProjectEntry: true };
      history[switching || routeMode === 'replace' ? 'replaceState' : 'pushState'](state, '', projectURL(card.dataset.project));
    }
    document.title = `${titleFor(index)} · ${originalTitle}`;
    clearTimeout(copyTimer); copyLink.classList.remove('is-copied'); copyLink.querySelector('span').textContent = 'Copy link';
    shareStatus.textContent = ''; shareFallback.hidden = true;
    const pool = visibleIndexes(), selected = pool.indexOf(index);
    position.textContent = `${selected + 1} / ${pool.length}`;
    dialog.querySelectorAll('[data-project-step]').forEach(button => {
      const next = pool[(selected + Number(button.dataset.projectStep) + pool.length) % pool.length];
      button.setAttribute('aria-label', `${Number(button.dataset.projectStep) < 0 ? 'Previous' : 'Next'} project: ${titleFor(next)}`);
      button.disabled = pool.length < 2;
    });
    const img = card.querySelector('img');
    const imageSrc = img.dataset.detailSrc || img.currentSrc || img.src;
    window.dispatchEvent(new CustomEvent('portfolio:project', { detail: { id: card.dataset.project, title: card.querySelector('.project-content h3').textContent, imageSrc, imageAlt: img.alt } }));
    const rect = img.getBoundingClientRect();
    detailImage.src = imageSrc;
    detailImage.alt = img.alt;
    document.querySelector('#detail-title').textContent = card.querySelector('.project-content h3').textContent;
    document.querySelector('#detail-stack').replaceChildren(...card.querySelector('.stack').textContent.split('/').map(technology => {
      const tag = document.createElement('span'); tag.textContent = technology.trim(); return tag;
    }));
    document.querySelector('#detail-summary').textContent = card.querySelector('.project-content > p:not(.stack)').textContent.trim();
    const detail = details[card.dataset.project];
    document.querySelector('#detail-problem').textContent = detail?.problem || '';
    document.querySelector('#detail-contribution').textContent = detail?.contribution || '';
    document.querySelector('.detail-columns').hidden = !detail;
    document.querySelector('#detail-features').replaceChildren(...(detail?.features || []).map(text => {
      const li = document.createElement('li'); li.textContent = text; return li;
    }));
    document.querySelector('#detail-links').replaceChildren(...[...card.querySelectorAll('.project-links a')].map(link => link.cloneNode(true)));
    if (!switching) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    if (gsap && !motion.paused) {
      const target = detailImage.getBoundingClientRect();
      dialogTween = gsap.timeline();
      if (!switching && target.width && target.height) dialogTween
        .fromTo(detailImage, { x: rect.left - target.left, y: rect.top - target.top, scaleX: rect.width / target.width,
          scaleY: rect.height / target.height, transformOrigin: 'top left' },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .55, ease: 'power3.inOut', clearProps: 'transform,transformOrigin' });
      else dialogTween.fromTo('.detail-showcase', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .4, ease: 'power3.out', clearProps: 'transform,opacity' });
      dialogTween.fromTo('.detail-body', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .3, clearProps: 'transform,opacity' }, .25);
    }
  }
  function closeProject() {
    if (!dialog.open || closing) return;
    closing = true;
    dialogTween?.progress(1);
    const finish = () => { dialog.close(); releaseViewer(); closing = false; };
    if (gsap && !motion.paused) {
      dialogTween = gsap.to(dialog, { opacity: 0, y: 12, duration: .18, onComplete: finish });
    } else finish();
  }
  function requestClose() {
    ++openRequest;
    if (!dialog.open || closing || routeBackPending) return;
    if (history.state?.portfolioProjectEntry) {
      routeBackPending = true; history.back();
    } else {
      const url = new URL(location.href); url.searchParams.delete('project');
      history.replaceState(history.state, '', url); closeProject();
    }
  }
  function syncProjectRoute() {
    ++openRequest;
    routeBackPending = false;
    const index = indexFor(new URL(location.href).searchParams.get('project'));
    if (index >= 0) openProject(index, null, 'none');
    else closeProject();
  }
  dialog.querySelector('.detail-close').addEventListener('click', requestClose);
  dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
  });
  function releaseViewer() {
    if (currentIndex < 0) return;
    window.dispatchEvent(new Event('portfolio:project-close'));
    clearTimeout(copyTimer); copyLink.classList.remove('is-copied'); currentIndex = -1; document.title = originalTitle;
    document.body.style.overflow = savedOverflow;
    gsap?.set(dialog, { clearProps: 'transform,opacity' });
    opener?.focus({ preventScroll: true });
  }
  dialog.addEventListener('close', () => { if (!dialog.open) releaseViewer(); });
  function stepProject(step) {
    if (currentIndex < 0 || closing) return;
    const pool = visibleIndexes();
    openProject(pool[(pool.indexOf(currentIndex) + step + pool.length) % pool.length], null, 'replace');
  }
  dialog.querySelectorAll('[data-project-step]').forEach(button => {
    button.addEventListener('click', () => stepProject(Number(button.dataset.projectStep)));
  });
  copyLink.addEventListener('click', async () => {
    if (currentIndex < 0) return;
    const index = currentIndex, url = projectURL(cards[index].dataset.project).href;
    try {
      await navigator.clipboard.writeText(url);
      if (currentIndex !== index || !dialog.open) return;
      shareStatus.textContent = 'Project link copied.'; copyLink.querySelector('span').textContent = 'Copied';
      copyLink.classList.add('is-copied');
      clearTimeout(copyTimer); copyTimer = setTimeout(() => { copyLink.classList.remove('is-copied'); copyLink.querySelector('span').textContent = 'Copy link'; }, 1800);
    } catch {
      if (currentIndex !== index || !dialog.open) return;
      clearTimeout(copyTimer); copyLink.classList.remove('is-copied'); copyLink.querySelector('span').textContent = 'Copy link';
      shareFallback.hidden = false;
      const input = shareFallback.querySelector('input'); input.value = url; input.focus(); input.select();
      shareStatus.textContent = 'Select and copy this project link.';
    }
  });
  // Swipe only over project copy; demos, forms, media and controls keep their gestures.
  const swipeArea = dialog.querySelector('.detail-body');
  let swipe;
  swipeArea.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !event.isPrimary || event.target.closest('a, button, input, textarea, select')) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
  });
  swipeArea.addEventListener('pointerup', event => {
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y, elapsed = performance.now() - swipe.time;
    swipe = null;
    if (elapsed < 700 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) stepProject(dx < 0 ? 1 : -1);
  });
  swipeArea.addEventListener('pointercancel', () => { swipe = null; });
  window.addEventListener('popstate', syncProjectRoute);
  window.addEventListener('hashchange', syncProjectRoute);
  // All module listeners and the intro must be ready before opening a shared link.
  window.addEventListener('load', () => {
    const start = () => {
      if (indexFor(new URL(location.href).searchParams.get('project')) >= 0) {
        document.querySelector('#projects').scrollIntoView({ behavior: 'instant', block: 'start' });
        syncProjectRoute();
      }
    };
    if (!window.portfolioIntro?.active) start();
    else {
      const observer = new MutationObserver(() => {
        if (!window.portfolioIntro.active) { observer.disconnect(); start(); }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
  }, { once: true });
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
    if (card.hasAttribute('data-interactive-demo')) {
      const badge = document.createElement('span'); badge.className = 'project-try-it'; badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = '<i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> Try it'; preview.append(badge);
      preview.setAttribute('aria-label', `Explore ${title} — interactive demo`);
    }
    if (card.hasAttribute('data-project-video')) {
      const badge = document.createElement('span'); badge.className = 'project-video-badge'; badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i> Watch intro'; preview.append(badge);
      preview.setAttribute('aria-label', `Explore ${title} — hero animation video`);
    }
    preview.addEventListener('click', async event => {
      const tryPrinter = event.target.closest('.project-try-it');
      await openProject(index, preview);
      if (tryPrinter && card.dataset.project === 'sante-cafe-bar') {
        dialog.querySelector('.sante-flow')?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
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
  document.querySelectorAll('[data-project-open]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const index = indexFor(link.dataset.projectOpen);
      if (index < 0) return;
      event.preventDefault(); openProject(index, link);
    });
  });
  const building = document.querySelector('.currently-building');
  const hammer = building?.querySelector('.fa-hammer');
  let hammerAnimation, hammerInterval;
  let hammerVisible = false;
  function stopHammer() {
    clearInterval(hammerInterval); hammerInterval = null;
    hammerAnimation?.cancel(); hammerAnimation = null;
  }
  function playHammer() {
    if (!hammer?.animate || motion.paused || document.hidden || dialog.open || !hammerVisible || hammerAnimation) return;
    hammerAnimation = hammer.animate([
      { transform: 'rotate(0deg)', offset: 0 },
      { transform: 'rotate(-28deg)', offset: .2 },
      { transform: 'rotate(10deg)', offset: .35 },
      { transform: 'rotate(-22deg)', offset: .58 },
      { transform: 'rotate(8deg)', offset: .73 },
      { transform: 'rotate(0deg)', offset: 1 },
    ], { duration: 750, easing: 'ease-in-out' });
    hammerAnimation.onfinish = () => { hammerAnimation = null; };
  }
  function syncHammer() {
    if (!hammerVisible || motion.paused || document.hidden || dialog.open) { stopHammer(); return; }
    if (!hammerInterval) { playHammer(); hammerInterval = setInterval(playHammer, 1500); }
  }
  const hammerObserver = new IntersectionObserver(entries => { hammerVisible = entries[0].isIntersecting; syncHammer(); });
  if (building) hammerObserver.observe(building);
  window.addEventListener('portfolio:motion', syncHammer);
  window.addEventListener('portfolio:project', stopHammer);
  dialog.addEventListener('close', syncHammer);
  document.addEventListener('visibilitychange', syncHammer);
  window.addEventListener('pageshow', syncHammer);
  window.addEventListener('pagehide', event => { stopHammer(); if (!event.persisted) hammerObserver.disconnect(); });
  updateMotion();
  function nearSection(selector, load) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect(); load().catch(error => console.warn('Static section remains available:', error.message));
    }, { rootMargin: '1000px' });
    observer.observe(document.querySelector(selector));
  }
  nearSection('#skills', () => import('./skills.js'));
  nearSection('#projects', () => import('./gallery.js'));
  nearSection('#contact', () => import('./contact.js'));
  nearSection('#about', () => import('./about.js'));
})();
