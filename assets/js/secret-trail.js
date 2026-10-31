/* A local, decorative code trail: no tracking, stored coordinates, or dependencies. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(any-pointer: fine)');
const canvas = document.createElement('canvas');
canvas.className = 'secret-code-trail'; canvas.setAttribute('aria-hidden', 'true');
const context = canvas.getContext('2d');

if (context) {
  document.body.append(canvas);
  const glyphs = ['<', '>', '/', '{', '}', ';', '=', '+', '*', '0', '1', '$', '[', ']', '(', ')', 'a', 'b', 'x', 'y', '=>', '&&', '++', 'let', 'fn'];
  const colours = ['#ffb64a', '#ff9e00', '#ed579a', '#e4b0cc', '#f0d2a8'];
  const particles = [];
  const limit = 160;
  let width = innerWidth, height = innerHeight, frame = 0, previous = null, lastFrame = 0;
  const enabled = () => !reduced.matches && finePointer.matches && !document.hidden;

  function clear() {
    cancelAnimationFrame(frame); frame = 0; lastFrame = 0; previous = null;
    particles.length = 0; context.clearRect(0, 0, width, height);
  }
  function resize() {
    clear(); width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.hidden = !enabled();
  }
  function emit(x, y, dx, dy, scatter = false) {
    if (particles.length >= limit) particles.shift();
    const speed = Math.hypot(dx, dy) || 1;
    const angle = Math.random() * Math.PI * 2;
    const scatterSpeed = 30 + Math.random() * 75;
    particles.push({ x: x + (Math.random() - .5) * 5, y: y + (Math.random() - .5) * 5,
      vx: scatter ? Math.cos(angle) * scatterSpeed : -dx / speed * 8 + (Math.random() - .5) * 12,
      vy: scatter ? Math.sin(angle) * scatterSpeed : -dy / speed * 12 + 4,
      age: 0, life: scatter ? .65 + Math.random() * .4 : .75 + Math.random() * .3,
      text: glyphs[Math.floor(Math.random() * glyphs.length)], colour: colours[Math.floor(Math.random() * colours.length)],
      size: scatter ? 10 + Math.random() * 3 : 12 + Math.random() * 3, scatter });
  }
  function render(now) {
    frame = 0;
    if (!enabled()) { clear(); canvas.hidden = true; return; }
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 1 / 60;
    lastFrame = now; context.clearRect(0, 0, width, height);
    context.textAlign = 'center'; context.textBaseline = 'middle';
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]; particle.age += dt;
      if (particle.age >= particle.life) { particles.splice(i, 1); continue; }
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      particle.vy += (particle.scatter ? 28 : 14) * dt;
      const remaining = 1 - particle.age / particle.life;
      context.globalAlpha = Math.min(1, particle.age / .045) * remaining * remaining * .9;
      context.font = `${particle.size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      context.fillStyle = particle.colour;
      context.fillText(particle.text, particle.x, particle.y);
    }
    context.globalAlpha = 1;
    if (particles.length) frame = requestAnimationFrame(render);
    else lastFrame = 0;
  }
  document.addEventListener('pointermove', event => {
    if (!enabled() || !['mouse', 'pen'].includes(event.pointerType)) return;
    const next = { x: event.clientX, y: event.clientY };
    if (!previous) { previous = next; return; }
    const dx = next.x - previous.x, dy = next.y - previous.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 9) return;
    // Interpolate fast movement into a continuous string rather than isolated blobs.
    const steps = Math.min(18, Math.max(1, Math.floor(distance / 13)));
    for (let step = 0; step < steps; step++) {
      const progress = step / steps;
      const x = previous.x + dx * progress, y = previous.y + dy * progress;
      emit(x, y, dx, dy);
      if (Math.random() < .45) emit(x, y, dx, dy, true);
    }
    previous = next; canvas.hidden = false;
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { previous = null; });
  window.addEventListener('blur', clear);
  window.addEventListener('scroll', clear, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', clear);
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); else resize(); });
  reduced.addEventListener('change', resize);
  finePointer.addEventListener('change', resize);
  resize();
}
