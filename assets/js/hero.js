/* The original flowing code waterfall and typing line. */
(() => {
  const hero = document.querySelector('#hero');
  const canvas = document.querySelector('#code-bg');
  const context = canvas.getContext('2d');
  const typed = document.querySelector('#typed-text');
  const phrases = ['Full-Stack Developer', 'Backend & API Developer', 'IoT & Hardware Integration'];
  const characters = '<>_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(){};/\\=';
  const motion = window.portfolioMotion;
  let introduced = !window.portfolioIntro?.active;
  let width = 1, height = 1, drops = [];
  let visible = false, frame = 0, last = 0;
  let timer = 0, phrase = 0, deleting = true, length = phrases[0].length;

  // Match the live site's original accumulated trails and random reset timing.
  function draw() {
    if (!context) return;
    context.fillStyle = 'rgba(13, 13, 13, 0.13)';
    context.fillRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff0099');
    gradient.addColorStop(.55, '#ff9e00');
    gradient.addColorStop(1, '#ffbe0b');
    context.fillStyle = gradient;
    context.font = '16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    drops.forEach((drop, index) => {
      const text = characters[Math.floor(Math.random() * characters.length)];
      context.fillText(text, index * 16, drop * 16);
      if (drop * 16 > height && Math.random() > .975) drops[index] = 0;
      drops[index] += 1;
    });
  }
  function render(now) {
    frame = 0;
    if (!introduced || !visible || document.hidden || motion.paused) return;
    if (!last || now - last >= 50) {
      last = last ? now - ((now - last) % 50) : now;
      draw();
    }
    frame = requestAnimationFrame(render);
  }
  function type() {
    timer = 0;
    if (!introduced || !visible || document.hidden || motion.paused) return;
    const text = phrases[phrase];
    if (deleting) {
      length = Math.max(0, length - 1);
      typed.textContent = text.slice(0, length);
      if (!length) { deleting = false; phrase = (phrase + 1) % phrases.length; timer = setTimeout(type, 300); return; }
    } else {
      length = Math.min(text.length, length + 1);
      typed.textContent = text.slice(0, length);
      if (length === text.length) { deleting = true; timer = setTimeout(type, 2400); return; }
    }
    timer = setTimeout(type, deleting ? 42 : 85);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    clearTimeout(timer); timer = 0;
    if (!introduced || !visible || document.hidden || motion.paused) {
      typed.textContent = phrases[phrase]; length = phrases[phrase].length; deleting = true;
      return;
    }
    frame = requestAnimationFrame(render);
    timer = setTimeout(type, 2000);
  }
  const resize = new ResizeObserver(() => {
    const rect = hero.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    drops = Array(Math.ceil(width / 16)).fill(1);
    draw();
  }); resize.observe(hero);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }); observer.observe(hero);
  window.addEventListener('portfolio:motion', sync);
  if (!introduced) window.portfolioIntro.ready.then(() => { introduced = true; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('pagehide', event => {
    clearTimeout(timer); cancelAnimationFrame(frame);
    if (!event.persisted) { observer.disconnect(); resize.disconnect(); }
  });
})();
