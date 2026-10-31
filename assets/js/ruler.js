// A document-scale section ruler. Each measured glyph travels queue -> rail ->
// top stack; the same coordinates morph into a whole-document map on hover/drag.
const L = Object.freeze({ nav: 48, rail: 60, edge: 12, threshold: .12, heading: 34,
  riding: 20, queue: 16, top: 28, currentGap: 26, slot: 20, bottom: 36 });
const M = Object.freeze({ flip: 200, detach: 240, stagger: .16, arc: 28,
  jump: 1.25, snapDelay: 400, snap: .7, intent: 150, zoomDamping: 10, drag: .18 });
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (from, to, progress) => from + (to - from) * progress;
const cubic = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const expo = t => t >= 1 ? 1 : 1 - 2 ** (-10 * t);

function node(tag, className, parent, attributes = {}) {
  const element = document.createElement(tag);
  element.className = className;
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  parent?.append(element);
  return element;
}

export function createRuler({ sections, reduced, onActive, onFailure }) {
  const html = document.documentElement;
  const events = new AbortController();
  const listen = (target, type, callback, options = {}) =>
    target.addEventListener(type, callback, { ...options, signal: events.signal });
  const root = node('div', 'section-ruler', null);
  root.hidden = true;
  if (reduced) root.dataset.static = '';
  document.querySelector('.site-nav').after(root);
  const poolTop = node('div', 'ruler-pool ruler-pool-top', root, { 'aria-hidden': 'true' });
  const poolBottom = node('div', 'ruler-pool ruler-pool-bottom', root, { 'aria-hidden': 'true' });
  const rail = node('div', 'ruler-rail', root, {
    role: 'scrollbar', tabindex: '0', 'aria-label': 'Page position',
    'aria-controls': 'main', 'aria-orientation': 'vertical',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
  });
  node('div', 'ruler-frost', rail, { 'aria-hidden': 'true' });
  const belt = node('div', 'ruler-belt', rail, { 'aria-hidden': 'true' });
  const ticks = Array.from({ length: 101 }, (_, pct) => {
    const major = pct % 5 === 0;
    const element = node('div', `ruler-tick${major ? ' ruler-tick-major' : ''}`, belt);
    const line = node('span', 'ruler-tick-line', element);
    const label = major ? node('span', 'ruler-tick-number', element) : null;
    if (label) label.textContent = pct;
    return { pct, element, line, label, alpha: major ? .8 : .4, docY: 0 };
  });
  const bracket = node('div', 'ruler-viewport', rail, { 'aria-hidden': 'true' });
  const needle = node('div', 'ruler-needle', rail, { 'aria-hidden': 'true' });
  const readout = node('span', 'ruler-readout', needle);
  const digits = node('span', 'ruler-digits', readout);
  const columns = Array.from({ length: 3 }, () => {
    const column = node('span', 'ruler-digit-column', digits);
    for (let digit = 0; digit < 10; digit++) node('span', '', column).textContent = digit;
    return column;
  });
  node('span', '', readout).textContent = '%';
  const ghost = node('div', 'ruler-ghost', rail, { 'aria-hidden': 'true' });
  const navigation = node('nav', 'ruler-sections', root, { 'aria-label': 'Sections' });
  const entries = sections.map(section => {
    const hit = node('a', 'ruler-link', navigation, {
      href: `#${section.id}`, 'aria-label': `Jump to ${section.label}`,
    });
    node('span', 'ruler-static-label', hit).textContent = section.label;
    const displayLabel = section.label.toUpperCase();
    const letters = [...displayLabel].map(character => {
      const letter = node('span', 'ruler-glyph', navigation, { 'aria-hidden': 'true' });
      letter.textContent = character;
      return letter;
    });
    return { ...section, displayLabel, hit, letters, widths: [], offsets: [], total: 0,
      anchor: 0, bottom: 0, hover: 0, hovered: false, flashUntil: 0 };
  });
  let width = innerWidth, height = innerHeight, docHeight = 1, range = 1;
  let ready = false, destroyed = false, dirty = true, measureFrame = 0;
  let lastScroll = scrollY, velocity = 0, activeIndex = -1, percentage = -1;
  let zoom = 0, zoomIntent = false, zoomTimer, dragging = false, dragStart = 0, dragMoved = 0;
  let ghostActive = false, ghostY = 0, pointerId = null;
  let armed = false, snapSince = null, jumping = false, snapping = false;
  let lenis, fallbackTween, blocked = false, settleUntil = 0, introAt = 0;
  const mapping = () => ({ base: L.nav + L.edge, span: Math.max(1, height - L.nav - L.edge * 2) });
  const invalidate = () => { dirty = true; settleUntil = performance.now() + 1000; };

  function activate(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    entries.forEach((entry, i) => {
      if (i === index) entry.hit.setAttribute('aria-current', 'location');
      else entry.hit.removeAttribute('aria-current');
    });
    rail.setAttribute('aria-valuetext', `${Math.round(clamp(scrollY / range) * 100)}%, ${entries[index].label}`);
    onActive(entries[index].id);
  }

  function measureLetters() {
    const measure = node('div', 'ruler-measure', document.body, { 'aria-hidden': 'true' });
    for (const entry of entries) {
      measure.replaceChildren();
      const spans = [...entry.displayLabel].map(character => {
        const span = node('span', '', measure); span.textContent = character; return span;
      });
      entry.widths = spans.map(span => span.getBoundingClientRect().width / 100);
      entry.total = 0;
      entry.offsets = entry.widths.map(advance => { const offset = entry.total; entry.total += advance; return offset; });
    }
    measure.remove();
  }

  function measure() {
    measureFrame = 0;
    if (destroyed || !ready) return;
    width = innerWidth; height = innerHeight;
    docHeight = html.scrollHeight;
    range = Math.max(1, docHeight - height);
    for (const entry of entries) {
      const rect = entry.element.getBoundingClientRect();
      entry.anchor = rect.top + scrollY; entry.bottom = rect.bottom + scrollY;
    }
    for (const tick of ticks) {
      tick.docY = tick.pct / 100 * docHeight;
      tick.element.style.top = `${tick.docY}px`;
    }
    belt.style.height = `${docHeight}px`;
    const poolWidth = Math.max(260, ...entries.map(entry => entry.total * L.heading)) + L.rail + 64;
    poolTop.style.width = poolBottom.style.width = `${poolWidth}px`;
    poolTop.style.height = `${L.nav + L.top + (entries.length - 1) * L.slot + L.currentGap + L.heading + 64}px`;
    poolBottom.style.height = `${L.bottom + entries.length * L.slot + 64}px`;
    lenis?.resize();
    invalidate();
  }
  const queueMeasure = () => { if (!measureFrame) measureFrame = requestAnimationFrame(measure); };

  function interrupt() {
    if (blocked) return;
    armed = true; snapping = false; jumping = false; snapSince = null;
    fallbackTween?.kill();
    invalidate();
  }

  function scrollTo(top, { duration = M.jump, easing = expo, immediate = false, complete } = {}) {
    if (blocked) return;
    top = Math.max(0, Math.min(range, top));
    fallbackTween?.kill();
    jumping = !immediate && !reduced;
    snapSince = null;
    const done = () => { jumping = false; snapping = false; complete?.(); invalidate(); };
    if (lenis) lenis.scrollTo(top, { duration, easing, immediate, onComplete: done });
    else if (reduced || immediate) { window.scrollTo({ top, behavior: 'instant' }); done(); }
    else {
      const target = { y: scrollY };
      fallbackTween = window.gsap.to(target, { y: top, duration, ease: easing,
        onUpdate: () => window.scrollTo({ top: target.y, behavior: 'instant' }), onComplete: done });
    }
    invalidate();
  }
  function jumpTo(entry, { history = true, immediate = false, focus = false } = {}) {
    if (blocked) return;
    armed = false;
    entry.flashUntil = performance.now() + 350;
    if (history && location.hash !== `#${entry.id}`) window.history.pushState(null, '', `#${entry.id}`);
    scrollTo(entry.id === entries[0].id ? 0 : entry.anchor - L.nav, {
      immediate, complete: () => { if (focus) entry.element.focus({ preventScroll: true }); },
    });
  }

  function setZoom(intent, immediate = false) {
    clearTimeout(zoomTimer);
    const apply = () => { zoomIntent = intent; invalidate(); };
    if (immediate) apply(); else zoomTimer = setTimeout(apply, M.intent);
  }
  function pointerPosition(clientY) {
    const map = mapping();
    ghostY = Math.max(map.base, Math.min(map.base + map.span, clientY));
    ghostActive = true;
    return clamp((ghostY - map.base) / map.span) * range;
  }
  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    if (pointerId !== null && rail.hasPointerCapture(pointerId)) rail.releasePointerCapture(pointerId);
    pointerId = null;
    const cancelled = event.type === 'pointercancel' || event.type === 'lostpointercapture';
    if (cancelled) dragMoved = Infinity;
    if (event.pointerType !== 'mouse' || event.clientX < width - L.rail || cancelled) {
      ghostActive = false; setZoom(false);
    }
    invalidate();
  }
  listen(rail, 'pointerenter', event => { if (event.pointerType === 'mouse') setZoom(true); });
  listen(rail, 'pointerleave', () => { ghostActive = false; if (!dragging) setZoom(false); });
  listen(rail, 'pointerdown', event => {
    if (event.button !== 0 || blocked) return;
    event.preventDefault(); interrupt(); armed = false;
    dragging = true; dragStart = event.clientY; dragMoved = 0; pointerId = event.pointerId;
    rail.setPointerCapture(pointerId);
    pointerPosition(event.clientY); setZoom(true, event.pointerType !== 'mouse');
  });
  listen(rail, 'pointermove', event => {
    const top = pointerPosition(event.clientY);
    if (dragging) {
      dragMoved = Math.max(dragMoved, Math.abs(event.clientY - dragStart));
      if (lenis) lenis.scrollTo(top, { lerp: M.drag });
      else window.scrollTo({ top, behavior: 'instant' });
    }
    invalidate();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => listen(rail, type, endDrag));
  listen(rail, 'click', event => {
    if (dragMoved > 4 || blocked) return;
    armed = false;
    const top = pointerPosition(event.clientY);
    scrollTo(top, { duration: M.jump * (.4 + .6 * Math.min(1, Math.abs(top - scrollY) / (2.5 * height))) });
  });
  listen(rail, 'keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const targets = { ArrowDown: scrollY + 80, ArrowUp: scrollY - 80,
      PageDown: scrollY + height * .85, PageUp: scrollY - height * .85, Home: 0, End: range };
    if (!(event.key in targets)) return;
    event.preventDefault(); armed = false;
    scrollTo(targets[event.key], { duration: .45 });
  });
  listen(rail, 'focus', () => setZoom(true));
  listen(rail, 'blur', () => { if (!dragging) setZoom(false); });
  entries.forEach(entry => {
    listen(entry.hit, 'pointerenter', () => { entry.hovered = true; invalidate(); });
    listen(entry.hit, 'pointerleave', () => { entry.hovered = false; invalidate(); });
    listen(entry.hit, 'focus', () => { entry.hovered = true; invalidate(); });
    listen(entry.hit, 'blur', () => { entry.hovered = false; invalidate(); });
  });
  listen(navigation, 'keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = entries.findIndex(entry => entry.hit === event.target);
    if (index < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 :
      (index + (event.key === 'ArrowDown' ? 1 : -1) + entries.length) % entries.length;
    entries[next].hit.focus({ preventScroll: true });
  });
  // Keep real hrefs for open-in-new-tab, hash history and the no-JS fallback.
  listen(document, 'click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const entry = entries.find(entry => `#${entry.id}` === link.hash);
    if (!entry || blocked) return;
    event.preventDefault(); jumpTo(entry, { focus: event.detail === 0 });
  });
  const restoreHash = () => {
    const entry = entries.find(entry => `#${entry.id}` === location.hash) || (!location.hash && entries[0]);
    if (entry) jumpTo(entry, { history: false, immediate: true });
  };
  listen(window, 'popstate', restoreHash);
  listen(window, 'hashchange', restoreHash);
  listen(window, 'wheel', interrupt, { passive: true });
  listen(window, 'touchmove', interrupt, { passive: true });
  listen(window, 'keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) &&
        !root.contains(event.target) && !event.target.closest('input, textarea, select, [contenteditable]')) interrupt();
  });
  listen(window, 'scroll', () => { dirty = true; }, { passive: true });
  listen(window, 'resize', queueMeasure);

  // A dialog or the loader owns scrolling while open; inner dialog scrolling
  // remains native. Stop any outstanding navigation tween before locking.
  function syncLock() {
    const next = Boolean(window.portfolioIntro?.active || document.body.style.overflow === 'hidden');
    if (next === blocked) return;
    blocked = next; root.inert = next;
    if (next) { fallbackTween?.kill(); lenis?.stop(); jumping = false; snapping = false; armed = false; }
    else { lenis?.start(); queueMeasure(); }
  }
  const bodyObserver = new MutationObserver(syncLock);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  const layoutObserver = new ResizeObserver(queueMeasure);
  layoutObserver.observe(document.querySelector('main'));
  const footer = document.querySelector('.privacy-footer');
  if (footer) layoutObserver.observe(footer);

  function resolveSnap(states, drift, now) {
    const index = states.findIndex(state => state.flip > .04 && state.flip < .96);
    if (snapping || !armed || jumping || dragging || zoom >= .3 || Math.abs(velocity) >= 30 || index < 0) {
      snapSince = null; return;
    }
    if (snapSince === null) { snapSince = now; return; }
    if (now - snapSince < M.snapDelay) return;
    const state = states[index], entry = entries[index], threshold = L.threshold * height;
    const forward = state.flip >= .5;
    const target = state.scrollFlip ? (forward ? state.scrollFlip.end + 4 : state.scrollFlip.start - 4) :
      entry.anchor + drift - (forward ? threshold - 4 : threshold + M.flip + 4);
    const bounds = (entry, state) => {
      let finished = entry.anchor + drift - threshold - .04 * M.flip;
      let waiting = entry.anchor + drift - threshold - .96 * M.flip;
      if (state.scrollFlip) {
        const span = state.scrollFlip.end - state.scrollFlip.start;
        finished = Math.min(finished, state.scrollFlip.start + .96 * span);
        waiting = Math.min(waiting, state.scrollFlip.start + .04 * span);
      }
      return { finished, waiting };
    };
    let safeTarget = target;
    states.forEach((other, i) => {
      if (i === index || i === 0) return;
      const limit = bounds(entries[i], other);
      if (other.flip >= .96) safeTarget = Math.max(safeTarget, limit.finished + 2);
      else if (other.flip <= .04) safeTarget = Math.min(safeTarget, limit.waiting - 2);
    });
    const limit = bounds(entry, state);
    if (forward ? safeTarget < limit.finished : safeTarget > limit.waiting) safeTarget = target;
    armed = false; snapping = true;
    scrollTo(safeTarget, { duration: M.snap, easing: cubic });
  }

  function render(time, deltaMs) {
    if (!ready || destroyed || document.hidden) return;
    // The loader releases its ready promise at the start of its fade, before
    // active becomes false. Recheck that final unlock even without a body mutation.
    syncLock();
    lenis?.raf(time * 1000);
    const now = performance.now();
    if (!dirty && now > settleUntil && !jumping && !dragging && snapSince === null && Math.abs(velocity) < .1) return;
    dirty = false;
    const dt = Math.min(deltaMs / 1000, .1) || .016;
    const y = scrollY, progress = clamp(y / range), map = mapping();
    const drift = map.base - progress * (L.nav + L.edge * 2);
    velocity += ((y - lastScroll) / dt - velocity) * (1 - Math.exp(-6 * dt)); lastScroll = y;
    if (reduced) {
      let index = 0;
      entries.forEach((entry, i) => { if (entry.anchor <= y + L.nav + 4) index = i; });
      if (y >= range - 4) index = entries.length - 1;
      activate(index); poolBottom.style.opacity = '1'; return;
    }
    const zoomTarget = zoomIntent || dragging ? 1 : 0;
    zoom += (zoomTarget - zoom) * (1 - Math.exp(-M.zoomDamping * dt));
    if (Math.abs(zoomTarget - zoom) < .0005) zoom = zoomTarget;
    if (zoom !== zoomTarget) dirty = true;
    const zoomEase = cubic(zoom), bottom = height - L.bottom;
    const states = entries.map((entry, index) => {
      const rideLength = entry.total * L.riding, position = entry.anchor - y + drift;
      let flip = index === 0 ? 1 : clamp((L.threshold * height + M.flip - position) / M.flip);
      let scrollFlip = null;
      // The last, short section must still finish its turn at the document end.
      if (index > 0 && entry.anchor - range > L.threshold * height) {
        const start = Math.min(entry.bottom - height, range - 24);
        flip = Math.max(flip, clamp((y - start) / Math.max(24, range - start)));
        scrollFlip = { start, end: range };
      }
      return { position, rideLength, flip, detach: index === 0 ? 1 : 0, queueY: bottom, scrollFlip };
    });
    let queued = 0;
    for (let i = entries.length - 1; i > 0; i--) {
      const state = states[i];
      state.queueY = bottom - L.slot * queued;
      state.detach = clamp((state.queueY + M.detach - (state.position + state.rideLength)) / M.detach);
      queued += 1 - state.detach;
    }
    const completed = states.filter(state => state.flip >= 1).length;
    const turning = states.reduce((sum, state) => sum + (state.flip > 0 && state.flip < 1 ? state.flip : 0), 0);
    poolTop.style.opacity = String(Math.max(...states.map(state => state.flip)));
    poolBottom.style.opacity = String(Math.max(...states.slice(1).map(state => 1 - state.detach)));
    let current = 0;
    states.forEach((state, i) => { if (state.flip >= .5) current = i; });
    activate(current);
    const occupancy = [];
    const horizontal = (entry, i, y, scale, alpha) => {
      // Keep the same mechanism in very narrow desktop/zoomed windows too.
      scale = Math.min(scale, (width - L.rail - 12) / (entry.total * L.heading));
      return {
        x: width - L.rail - (entry.total - entry.offsets[i] - entry.widths[i] / 2) * L.heading * scale,
        y, rotation: 0, scale, alpha,
      };
    };
    const riding = (entry, i, y) => ({ x: width - L.rail / 2,
      y: y + (entry.total - entry.offsets[i] - entry.widths[i] / 2) * L.riding,
      rotation: -90, scale: L.riding / L.heading, alpha: .35,
    });
    entries.forEach((entry, index) => {
      const state = states[index], count = entry.letters.length;
      let from, to, phase, stagger = true;
      if (state.flip > 0) {
        phase = state.flip;
        from = i => riding(entry, i, state.position);
        if (state.flip >= 1) {
          const shrink = index === completed - 1 ? turning : 1;
          const y = L.nav + L.top + index * L.slot + L.currentGap * (1 - shrink);
          to = i => horizontal(entry, i, y, mix(1, L.queue / L.heading, shrink), mix(1, .35, shrink));
        } else to = i => horizontal(entry, i, L.nav + L.top + index * L.slot + L.currentGap, 1, 1);
      } else if (state.detach < 1) {
        phase = state.detach;
        from = i => horizontal(entry, i, state.queueY, L.queue / L.heading, .35);
        to = i => riding(entry, i, state.queueY - state.rideLength);
      } else {
        phase = 1; stagger = false;
        from = to = i => riding(entry, i, state.position);
      }
      entry.hover += (Number(entry.hovered) - entry.hover) * (1 - Math.exp(-dt / .08));
      const flash = clamp((entry.flashUntil - now) / 350);
      const mapY = map.base + entry.anchor / docHeight * map.span;
      let left = Infinity, right = -Infinity, top = Infinity, lower = -Infinity;
      entry.letters.forEach((letter, i) => {
        const order = stagger ? count - 1 - i : i;
        const t = cubic(clamp(phase * (1 + (count - 1) * M.stagger) - order * M.stagger));
        const a = from(i), b = to(i), inverse = 1 - t;
        let x = inverse * inverse * a.x + 2 * inverse * t * ((a.x + b.x) / 2 - M.arc) + t * t * b.x;
        let y = mix(a.y, b.y, t), rotation = mix(a.rotation, b.rotation, t);
        let scale = mix(a.scale, b.scale, t), alpha = mix(a.alpha, b.alpha, t);
        const mapped = horizontal(entry, i, mapY, L.queue / L.heading, .85);
        x = mix(x, mapped.x, zoomEase); y = mix(y, mapped.y, zoomEase);
        rotation *= 1 - zoomEase; scale = mix(scale, mapped.scale, zoomEase); alpha = mix(alpha, mapped.alpha, zoomEase);
        letter.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`;
        const ink = mix(alpha, 1, entry.hover);
        const color = ink >= .995 ? 'var(--ruler-ink)' : `color-mix(in srgb,var(--ruler-ink) ${ink * 100}%,var(--bg))`;
        letter.style.color = flash > .01 ? `color-mix(in srgb,var(--orange) ${flash * 70}%,${color})` : color;
        // Rotated letter bounds are also the live, accessible link hit area.
        const rad = rotation * Math.PI / 180;
        const halfWidth = entry.widths[i] * L.heading * scale / 2;
        const halfHeight = L.heading * scale / 2;
        const dx = Math.abs(Math.cos(rad)) * halfWidth + Math.abs(Math.sin(rad)) * halfHeight + 2;
        const dy = Math.abs(Math.sin(rad)) * halfWidth + Math.abs(Math.cos(rad)) * halfHeight + 2;
        left = Math.min(left, x - dx); right = Math.max(right, x + dx);
        top = Math.min(top, y - dy); lower = Math.max(lower, y + dy);
      });
      entry.hit.style.transform = `translate3d(${left - 2}px,${top - 2}px,0)`;
      entry.hit.style.width = `${right - left + 4}px`;
      entry.hit.style.height = `${lower - top + 4}px`;
      const strength = state.detach * (1 - state.flip);
      if (strength > .02) occupancy.push({ top: state.position, bottom: state.position + state.rideLength, strength });
    });
    belt.style.transform = `translate3d(0,${-y + drift}px,0)`;
    const needleY = map.base + progress * map.span;
    needle.style.transform = `translate3d(0,${needleY}px,0)`;
    needle.style.opacity = String(clamp(progress / .03));
    readout.style.top = needleY > height - 26 ? '-14px' : '4px';
    const pct = Math.round(progress * 100);
    if (pct !== percentage) {
      percentage = pct; rail.setAttribute('aria-valuenow', String(pct));
      rail.setAttribute('aria-valuetext', `${pct}%, ${entries[current].label}`);
      [...String(pct).padStart(3, '0')].forEach((digit, i) => { columns[i].style.transform = `translateY(-${digit}em)`; });
    }
    bracket.style.transform = `translate3d(0,${map.base + y / docHeight * map.span}px,0)`;
    bracket.style.height = `${height / docHeight * map.span}px`; bracket.style.opacity = String(zoom);
    ghost.style.transform = `translate3d(0,${ghostY}px,0)`;
    ghost.style.opacity = ghostActive ? String(.2 + .8 * zoom) : '0';
    const speed = clamp(Math.abs(velocity) / 3000);
    for (const tick of ticks) {
      const screenY = tick.docY - y + drift, mapY = map.base + tick.pct / 100 * map.span;
      tick.element.style.transform = zoom ? `translate3d(0,${zoom * (mapY - screenY)}px,0)` : '';
      let alpha = 1;
      if (tick.label) {
        const labelY = mix(screenY, mapY, zoom);
        for (const span of occupancy) {
          const gap = labelY < span.top ? span.top - labelY : labelY > span.bottom ? labelY - span.bottom : 0;
          if (gap < 24) alpha = Math.min(alpha, 1 - span.strength * (1 - gap / 24));
        }
        tick.label.style.opacity = String(.5 * (1 - (1 - alpha) * (1 - zoom)));
      }
      const distance = Math.abs(tick.docY - progress * docHeight);
      const stretch = distance < 180 ? speed * (1 - distance / 180) ** 2 : 0;
      const intro = 1 - (1 - clamp((now - introAt - tick.pct * 10) / 1000)) ** 3;
      tick.line.style.transform = `scaleX(${intro * (1 + .6 * stretch)})`;
      tick.line.style.opacity = String(intro * Math.min(1, tick.alpha + .6 * stretch));
    }
    if (now < introAt + 2100) dirty = true;
    if (!blocked) resolveSnap(states, drift, now);
  }

  const ticker = window.gsap.ticker;
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { fallbackTween?.pause(); lenis?.stop(); }
    else { if (!blocked) lenis?.start(); fallbackTween?.resume(); queueMeasure(); }
  });
  listen(window, 'pagehide', () => { ticker.remove(render); lenis?.stop(); fallbackTween?.pause(); });
  listen(window, 'pageshow', () => {
    if (!ready) return;
    if (!blocked) lenis?.start();
    ticker.add(render); queueMeasure();
  });

  // Measure the actual variable font, including its stretch. No guessed widths.
  Promise.all([document.fonts.load('620 34px "Navigator Archivo"'), window.portfolioIntro?.ready]).then(() => {
    if (destroyed) return;
    measureLetters();
    html.dataset.ruler = reduced ? 'static' : 'on';
    ready = true;
    if (!reduced && window.Lenis) {
      lenis = new window.Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false,
        prevent: element => Boolean(element.closest('dialog, .secret-journal, .cookie-panel, [data-lenis-prevent]')) });
      lenis.on('scroll', () => window.ScrollTrigger?.update());
    }
    syncLock(); measure(); root.hidden = false; introAt = performance.now();
    ticker.add(render); invalidate();
    // Apply deep links after fonts and the gutter have settled, without changing history.
    if (location.hash) restoreHash();
    window.ScrollTrigger?.refresh();
  }).catch(error => {
    destroy();
    onFailure?.();
    console.warn('Section ruler could not initialise; standard navigation retained.', error);
  });

  function destroy() {
    destroyed = true; ready = false;
    events.abort(); clearTimeout(zoomTimer); cancelAnimationFrame(measureFrame);
    ticker.remove(render); fallbackTween?.kill(); lenis?.destroy();
    bodyObserver.disconnect(); layoutObserver.disconnect(); root.remove();
    delete html.dataset.ruler;
  }
  return { destroy };
}
