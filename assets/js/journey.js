/* Original PDFs remain usable when JavaScript or animation libraries are unavailable. */
const section = document.querySelector('#experience');
const gsap = window.gsap;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const items = [...section.querySelectorAll('.certificate-item')];
const certificates = items.map(item => ({
  id: item.dataset.document, title: item.dataset.title, issuer: item.dataset.issuer,
  date: item.dataset.date, kind: item.dataset.kind, description: item.dataset.description,
  short: item.dataset.short, pdf: item.getAttribute('href'),
  thumb: item.querySelector('img').getAttribute('src'),
  image: item.querySelector('img').getAttribute('src').replace('-640.webp', '.webp'),
  alt: item.querySelector('img').alt
}));
const recognitions = [
  { id:'ieee-webmaster', title:'Webmaster recognition', issuer:'IEEE · University of the Aegean', date:'Aug 2025 – Aug 2026', kind:'Volunteering' }
].map(item => ({ ...item, image:`/assets/images/certificates/${item.id}.webp`, pdf:`/assets/documents/certificates/${item.id}.pdf`, alt:item.title }));
const documents = [...certificates, ...recognitions];
const deck = section.querySelector('.certificate-deck');
section.querySelector('.certificate-showcase').classList.add('floating-certificates');
for (const slot of [1, 2]) {
  const sheet = deck.firstElementChild.cloneNode(true);
  sheet.dataset.deckSlot = String(slot); deck.append(sheet);
}
let sheets = [...section.querySelectorAll('.certificate-sheet')];
const selectors = section.querySelector('.certificate-selectors');
const dialog = document.querySelector('#credential-dialog');
const previewImage = dialog.querySelector('#credential-image');
const viewLink = section.querySelector('.certificate-view');
const indexLabel = value => String(value + 1);
const kindLabel = document => document.id.startsWith('google-') ? 'Seminar attendance' : document.kind[0].toUpperCase() + document.kind.slice(1);
let selected = 0, previewDocument = null, opener, previousOverflow, entrance;
const departingSheets = new Set();
function clearDepartures() {
  departingSheets.forEach(sheet => { gsap?.killTweensOf(sheet); sheet.remove(); });
  departingSheets.clear();
}

function selectCertificate(index, animate = true) {
  const previous = selected;
  // Finish an interrupted move before measuring the next arrangement.
  if (gsap) sheets.forEach(sheet => gsap.getTweensOf(sheet).forEach(tween => tween.progress(1).kill()));
  const oldPositions = new Map(sheets.map(sheet => [sheet, {
    left:sheet.offsetLeft, top:sheet.offsetTop, width:sheet.offsetWidth, height:sheet.offsetHeight,
    slot:Number(sheet.dataset.deckSlot), document:sheet.dataset.document
  }]));
  selected = (index + certificates.length) % certificates.length;
  const direction = (selected - previous + certificates.length) % certificates.length <= certificates.length / 2 ? 1 : -1;
  const wanted = [selected, (selected - 1 + certificates.length) % certificates.length, (selected + 1) % certificates.length];
  const moving = gsap && animate && !motion.matches && previous !== selected;
  if (!moving) clearDepartures();
  // Preserve outgoing papers while their live slots receive the incoming ones.
  if (moving) sheets.filter(sheet => !wanted.some(i => certificates[i].id === sheet.dataset.document)).forEach(sheet => {
    const departing = sheet.cloneNode(true);
    departing.classList.add('certificate-departing');
    departing.removeAttribute('href'); departing.removeAttribute('data-document');
    departing.removeAttribute('aria-haspopup'); departing.removeAttribute('aria-label');
    departing.setAttribute('aria-hidden', 'true'); departing.inert = true;
    deck.append(departing); departingSheets.add(departing);
    const slot = Number(sheet.dataset.deckSlot);
    gsap.fromTo(departing, { x:0, y:0, opacity:1, scale:slot ? .94 : 1,
      rotationY:slot === 1 ? 24 : slot === 2 ? -24 : 0 }, {
      x:-direction * deck.clientWidth * .22, y:12, scale:.8,
      rotationY:direction * 38, opacity:0, duration:.65, ease:'power2.inOut',
      onComplete:() => { departing.remove(); departingSheets.delete(departing); }
    });
  });
  const available = [...sheets];
  const ordered = wanted.map(i => {
    const match = available.find(sheet => sheet.dataset.document === certificates[i].id);
    if (match) available.splice(available.indexOf(match), 1);
    return match;
  });
  sheets = ordered.map(sheet => sheet || available.shift());
  const certificate = certificates[selected];
  section.querySelector('.certificate-position').textContent = `${indexLabel(selected)} / ${indexLabel(certificates.length - 1)} · ${kindLabel(certificate)}`;
  section.querySelector('.certificate-title').textContent = certificate.title;
  section.querySelector('.certificate-issuer').textContent = `${certificate.issuer} · ${certificate.date}`;
  section.querySelector('.certificate-description').textContent = certificate.description;
  viewLink.href = certificate.pdf; viewLink.dataset.document = certificate.id;
  sheets.forEach((sheet, slot) => {
    sheet.dataset.deckSlot = String(slot);
    const item = certificates[(selected + (slot === 1 ? -1 : slot === 2 ? 1 : 0) + certificates.length) % certificates.length];
    sheet.href = item.pdf; sheet.dataset.document = item.id;
    sheet.setAttribute('aria-label', slot ? `Select ${item.title}` : `View ${item.title} certificate`);
    if (slot) sheet.removeAttribute('aria-haspopup'); else sheet.setAttribute('aria-haspopup', 'dialog');
    const image = sheet.querySelector('img'); image.src = slot ? item.thumb : item.image; image.alt = item.alt; image.draggable = false;
  });
  [...selectors.children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
  // Reveal the active label without shifting the page away from the controls.
  const activeLabel = selectors.children[selected];
  if (activeLabel) {
    const label = activeLabel.getBoundingClientRect(), strip = selectors.getBoundingClientRect();
    if (label.left < strip.left) selectors.scrollLeft -= strip.left - label.left;
    else if (label.right > strip.right) selectors.scrollLeft += label.right - strip.right;
  }
  if (gsap) {
    const images = sheets.map(sheet => sheet.querySelector('img'));
    gsap.killTweensOf(images);
    gsap.set(images, { clearProps:'transform,opacity' });
    if (animate && !motion.matches && previous !== selected) {
      sheets.forEach((sheet, slot) => {
        const old = oldPositions.get(sheet), side = slot !== 0;
        const angle = position => position === 1 ? 24 : position === 2 ? -24 : 0;
        const oldScale = old.slot ? .94 : 1;
        const width = sheet.offsetWidth, height = sheet.offsetHeight;
        const recycled = old.document !== sheet.dataset.document;
        gsap.fromTo(sheet, {
          x:recycled ? direction * deck.clientWidth * .14 : old.left + old.width / 2 - sheet.offsetLeft - width / 2,
          y:recycled ? 12 : old.top + old.height / 2 - sheet.offsetTop - height / 2,
          scaleX:recycled ? .86 : old.width / width * oldScale,
          scaleY:recycled ? .86 : old.height / height * oldScale,
          rotationY:recycled ? angle(slot) : angle(old.slot), opacity:recycled ? 0 : 1
        }, { x:0, y:0, scaleX:side ? .94 : 1, scaleY:side ? .94 : 1,
          rotationY:angle(slot), opacity:1, duration:.65, ease:'power3.inOut',
          clearProps:'transform,opacity', overwrite:true });
      });
    } else gsap.set(sheets, { clearProps:'transform,opacity' });
  }
}

certificates.forEach((certificate, index) => {
  const button = document.createElement('button'); button.type = 'button';
  button.title = certificate.short;
  button.setAttribute('aria-label', `Select ${certificate.title}`);
  button.setAttribute('aria-pressed', String(index === selected));
  button.addEventListener('click', () => selectCertificate(index)); selectors.append(button);
});
selectors.hidden = false;
// Put the position controls below the caption, keeping the three papers together.
section.querySelector('.certificate-showcase').append(selectors);
let drag = null, suppressClickUntil = 0;
deck.addEventListener('dragstart', event => event.preventDefault());
deck.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  drag = { id:event.pointerId, x:event.clientX, y:event.clientY };
});
deck.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  const x = event.clientX - drag.x, y = event.clientY - drag.y;
  if (Math.abs(y) > 16 && Math.abs(y) > Math.abs(x)) { drag = null; return; }
  if (Math.abs(x) > 12) deck.setPointerCapture(event.pointerId);
});
deck.addEventListener('pointerup', event => {
  if (!drag || drag.id !== event.pointerId) return;
  const x = event.clientX - drag.x;
  if (Math.abs(x) > 40) { suppressClickUntil = performance.now() + 400; selectCertificate(selected + (x < 0 ? 1 : -1)); }
  drag = null;
});
deck.addEventListener('pointercancel', () => { drag = null; });
deck.addEventListener('click', event => {
  if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
}, true);
section.querySelectorAll('a[data-document]:not(.certificate-sheet)').forEach(link => link.setAttribute('aria-haspopup', 'dialog'));
section.querySelector('.certificate-controls').hidden = false;
section.querySelectorAll('[data-certificate-step]').forEach(button => button.addEventListener('click', () => selectCertificate(selected + Number(button.dataset.certificateStep))));
// Arrow navigation stays local to the certificate controls, away from the secret hunt.
for (const target of [deck, selectors, section.querySelector('.certificate-controls')]) target.addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? certificates.length - 1 : selected + (event.key === 'ArrowRight' ? 1 : -1);
  selectCertificate(next);
  if (target === selectors) selectors.children[selected].focus({ preventScroll:true });
});

function fillPreview(document) {
  previewDocument = document;
  dialog.querySelector('#credential-title').textContent = document.title;
  dialog.querySelector('#credential-meta').textContent = `${kindLabel(document)} · ${document.issuer} · ${document.date}`;
  previewImage.src = document.image; previewImage.alt = document.alt;
  dialog.querySelector('#credential-pdf').href = document.pdf;
  const index = certificates.indexOf(document);
  dialog.querySelector('.credential-paging').hidden = index < 0;
  dialog.querySelector('#credential-count').textContent = index < 0 ? '' : `${indexLabel(index)} / ${indexLabel(certificates.length - 1)}`;
  dialog.querySelector('.credential-image-wrap').scrollTop = 0;
}
function openPreview(credential, trigger) {
  if (dialog.open) return;
  opener = trigger; previousOverflow = document.body.style.overflow;
  fillPreview(credential); dialog.showModal(); document.body.style.overflow = 'hidden';
  dialog.querySelector('.credential-close').focus({ preventScroll:true });
  if (gsap && !motion.matches) gsap.fromTo(dialog, { opacity:0 }, { opacity:1, duration:.2, clearProps:'opacity' });
}
function stepPreview(step) {
  const index = certificates.indexOf(previewDocument);
  if (index < 0) return;
  const next = (index + step + certificates.length) % certificates.length;
  selectCertificate(next, false); fillPreview(certificates[next]);
}
section.addEventListener('click', event => {
  const link = event.target.closest('a[data-document]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  const document = documents.find(item => item.id === link.dataset.document);
  if (!document) return;
  event.preventDefault();
  if (link.matches('.certificate-sheet') && link.dataset.deckSlot !== '0') {
    selectCertificate(certificates.indexOf(document)); return;
  }
  openPreview(document, link);
});
dialog.querySelector('.credential-close').addEventListener('click', () => dialog.close());
dialog.querySelectorAll('[data-credential-step]').forEach(button => button.addEventListener('click', () => stepPreview(Number(button.dataset.credentialStep))));
dialog.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.key === 'Tab') {
    const controls = [...dialog.querySelectorAll('button:not([disabled]),a[href]')].filter(control => control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (['ArrowLeft','ArrowRight'].includes(event.key) && certificates.includes(previewDocument)) {
    event.preventDefault(); stepPreview(event.key === 'ArrowRight' ? 1 : -1);
  }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  gsap?.killTweensOf(dialog); gsap?.set(dialog, { clearProps:'opacity' });
  document.body.style.overflow = previousOverflow; previewDocument = null;
  opener?.focus({ preventScroll:true });
});

const filters = section.querySelector('.certificate-filters'); filters.hidden = false;
section.querySelector('.certificate-browse').addEventListener('click', event => {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) section.querySelector('.certificate-catalog').open = true;
});
filters.addEventListener('click', event => {
  const button = event.target.closest('[data-certificate-filter]'); if (!button) return;
  const kind = button.dataset.certificateFilter;
  filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  items.forEach(item => { item.hidden = kind !== 'all' && item.dataset.kind !== kind; });
});

function animateEntrance() {
  entrance?.revert(); entrance = null;
  if (!gsap || !window.ScrollTrigger || motion.matches) return;
  entrance = gsap.context(() => {
    gsap.from('.journey-milestone', { y:20, opacity:0, duration:.65, stagger:.12, clearProps:'transform,opacity', ease:'power3.out', scrollTrigger:{ trigger:section.querySelector('.journey-timeline'), start:'top 90%', once:true } });
    gsap.from('.certificate-showcase', { y:20, opacity:0, duration:.7, clearProps:'transform,opacity', ease:'power3.out', scrollTrigger:{ trigger:section.querySelector('.certificate-showcase'), start:'top 92%', once:true } });
  }, section);
}
motion.addEventListener('change', () => { selectCertificate(selected, false); animateEntrance(); });
window.addEventListener('pagehide', event => { if (!event.persisted) { clearDepartures(); entrance?.revert(); gsap?.killTweensOf([...sheets, dialog]); } });
selectCertificate(0, false); animateEntrance();
