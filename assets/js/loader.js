/* A brief local introduction. Lazy project assets never hold up the page. */
(() => {
  const intro = window.portfolioIntro;
  if (!intro?.active) return;
  const overlay = document.querySelector('#site-intro');
  if (!overlay) { intro.finish(); return; }
  intro.started = true;
  clearTimeout(intro.timeout);
  intro.timeout = setTimeout(intro.finish, 2500);
  overlay.hidden = false;

  const logo = overlay.querySelector('.intro-logo');
  const glyphs = [...overlay.querySelectorAll('.intro-glyphs span')];
  const message = overlay.querySelector('.intro-message');
  const phrase = 'Making things work.';
  const symbols = '<>{}/_01;[]=$';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const started = performance.now();
  const inertElements = new Map();
  let frame = 0, exitTimer = 0, lastShuffle = 0, leaving = false, remembered = false;

  function lock(element) {
    if (!(element instanceof HTMLElement) || element === overlay ||
        element.matches('script, style, link') || inertElements.has(element)) return;
    inertElements.set(element, element.inert);
    element.inert = true;
  }
  [...document.body.children].forEach(lock);
  const additions = new MutationObserver(records => {
    records.forEach(record => [...record.addedNodes].forEach(lock));
  });
  additions.observe(document.body, { childList: true });

  function leave(immediate = false) {
    if (!intro.active || leaving) return;
    leaving = true;
    cancelAnimationFrame(frame);
    if (immediate) { intro.finish(); return; }
    overlay.classList.add('is-leaving');
    // The hero starts as this overlay fades, so its entrance is visible.
    intro.reveal();
    exitTimer = setTimeout(intro.finish, 360);
  }
  const dismiss = () => { intro.remember(); leave(true); };
  const onKey = event => { if (event.key === 'Escape') { event.preventDefault(); dismiss(); } };
  const onMotion = () => { if (reduced.matches) leave(true); };
  const onVisibility = () => { if (document.hidden) leave(true); };
  intro.cleanup = () => {
    cancelAnimationFrame(frame);
    clearTimeout(exitTimer);
    additions.disconnect();
    inertElements.forEach((inert, element) => { element.inert = inert; });
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onMotion);
    if (overlay.contains(document.activeElement)) document.activeElement.blur();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onMotion);
  overlay.querySelector('.intro-skip').addEventListener('click', dismiss);

  let logoReady = false, pageReady = document.readyState === 'complete';
  document.addEventListener('DOMContentLoaded', () => { pageReady = true; }, { once: true });
  // Some browsers defer decode() for a fully transparent image. A loaded logo
  // can already be revealed; waiting on decoding alone may miss the intro.
  logo.addEventListener('load', () => { logoReady = true; });
  logo.src = logo.dataset.src;
  if (logo.complete && logo.naturalWidth) logoReady = true;
  logo.decode().then(() => { logoReady = true; }).catch(() => {
    // A failed full-size asset still leaves the original favicon as a fallback.
    logo.src = '/assets/images/favicon-64.png';
    logo.decode().then(() => { logoReady = true; }).catch(() => {});
  });

  function tick(now) {
    if (!intro.active) return;
    const elapsed = now - started;
    // Background loads must not count as a viewed introduction.
    if (elapsed >= 520 && !document.hidden && !remembered) {
      intro.remember(); remembered = true;
    }
    if (elapsed < 520 && now - lastShuffle > 55) {
      glyphs.forEach(glyph => { glyph.textContent = symbols[Math.floor(Math.random() * symbols.length)]; });
      lastShuffle = now;
    }
    if (elapsed >= 520) {
      if (logoReady) overlay.classList.add('is-resolved');
      else glyphs.forEach((glyph, index) => { glyph.textContent = ['<', '/', 'D', 'M', '>'][index]; });
    }
    const length = Math.min(phrase.length, Math.max(0, Math.floor((elapsed - 220) / 42)));
    if (message.textContent.length !== length) message.textContent = phrase.slice(0, length);
    // Wait only for the parsed page and brand mark, with the head guard as a hard cap.
    if (elapsed >= 1500 && pageReady && (logoReady || elapsed >= 1800)) { leave(); return; }
    frame = requestAnimationFrame(tick);
  }
  if (reduced.matches || document.hidden) leave(true);
  else frame = requestAnimationFrame(tick);
})();
