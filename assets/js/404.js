/* A brief decode and signal glitch; the actual error and navigation stay stable. */
(() => {
  const code = document.querySelector('.not-found-code');
  const digits = [...code.querySelectorAll('[data-digit]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const symbols = ['#', '/', '{', '}', '>', '_', '0', '1'];
  let decodeTimer, glitchTimer, repeatTimer, lastGlitch = -Infinity;
  const restore = () => digits.forEach(digit => {
    digit.textContent = digit.dataset.digit;
    digit.dataset.text = digit.dataset.digit;
  });
  function stop() {
    clearInterval(decodeTimer); clearTimeout(glitchTimer); clearInterval(repeatTimer);
    repeatTimer = null;
    decodeTimer = null; code.classList.remove('is-glitching'); restore();
  }
  function glitch() {
    if (motion.matches || document.hidden || decodeTimer || performance.now() - lastGlitch < 1600) return;
    lastGlitch = performance.now();
    code.classList.add('is-glitching');
    clearTimeout(glitchTimer);
    glitchTimer = setTimeout(() => code.classList.remove('is-glitching'), 520);
  }
  function startRepeat() {
    if (motion.matches || document.hidden || repeatTimer) return;
    repeatTimer = setInterval(glitch, 5000);
  }
  startRepeat();
  if (!motion.matches) {
    const start = performance.now();
    decodeTimer = setInterval(() => {
      const elapsed = performance.now() - start;
      digits.forEach((digit, i) => {
        const value = elapsed > 180 + i * 160 ? digit.dataset.digit : symbols[Math.floor(Math.random() * symbols.length)];
        digit.textContent = value; digit.dataset.text = value;
      });
      if (elapsed >= 560) { clearInterval(decodeTimer); decodeTimer = null; restore(); glitch(); }
    }, 80);
  }
  code.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') glitch(); });
  code.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') glitch(); });
  motion.addEventListener('change', () => { stop(); startRepeat(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else startRepeat(); });
  window.addEventListener('pageshow', startRepeat);
  window.addEventListener('pagehide', stop);
})();
