/* Real application media and local interactive project previews. */
const dialog = document.querySelector('#project-dialog');
const image = dialog.querySelector('#detail-image');
const wrap = image.parentElement;
const chrome = dialog.querySelector('.showcase-chrome');
const video = document.createElement('video');
video.controls = true; video.preload = 'none'; video.playsInline = true;
video.poster = '/assets/images/RaceConsole.webp'; video.hidden = true;
video.setAttribute('aria-label', 'RaceConsole walkthrough using a recorded F1 25 telemetry replay');
wrap.append(video);
function releaseVideo() {
  video.pause();
  if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
}
let raceDemo;
const projectDemos = {};
const controls = document.createElement('div'); controls.className = 'showcase-switcher';
controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Project preview mode');
wrap.before(controls);
const caption = document.createElement('p'); caption.className = 'showcase-caption'; wrap.after(caption);
const desktopIds = ['race-console', 'java-ticket-booking', 'music-library'];
let printerDemo;
const flow = document.createElement('div'); flow.hidden = true;
caption.after(flow);
const resetPrinter = () => printerDemo?.reset();
const pending = new Map();
export function prepareProject(id) {
  if (pending.has(id)) return pending.get(id);
  const task = (async () => {
    if (id === 'race-console') {
      const { createRaceDemo } = await import('./race-demo.js'); raceDemo = createRaceDemo(); wrap.append(raceDemo.element);
    } else if (id === 'retrobyte' || id === 'autoservice-garage') {
      const module = await (id === 'retrobyte' ? import('./retro-demo.js') : import('./garage-demo.js'));
      const demo = id === 'retrobyte' ? module.createRetroDemo() : module.createGarageDemo(); projectDemos[id] = demo; wrap.append(demo.element);
    } else if (id === 'sante-cafe-bar') {
      const { createPrinterDemo } = await import('./printer-demo.js'); printerDemo = createPrinterDemo(dialog); printerDemo.element.hidden = false; flow.append(printerDemo.element);
    }
  })();
  pending.set(id, task); task.catch(() => pending.delete(id)); return task;
}
window.addEventListener('portfolio:project', ({ detail }) => {
  raceDemo?.deactivate();
  raceDemo?.reset();
  Object.values(projectDemos).forEach(demo => { demo.deactivate(); demo.reset(); });
  resetPrinter();
  flow.hidden = detail.id !== 'sante-cafe-bar';
  releaseVideo(); video.hidden = true; image.hidden = false;
  video.preload = 'none'; video.muted = false; video.poster = '/assets/images/RaceConsole.webp';
  video.setAttribute('aria-label', 'RaceConsole walkthrough using a recorded F1 25 telemetry replay');
  controls.replaceChildren();
  const desktop = desktopIds.includes(detail.id);
  dialog.classList.toggle('desktop-detail', desktop);
  dialog.classList.toggle('website-detail', detail.id === 'mourchoutas');
  chrome.textContent = detail.title;
  caption.hidden = detail.id !== 'race-console';
  if (detail.id === 'mourchoutas') {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    video.preload = 'metadata'; video.muted = true; video.poster = detail.imageSrc;
    video.setAttribute('aria-label', 'Mourchoutas public website: the SVG logo draws in, then becomes part of the background while scrolling');
    caption.hidden = false;
    caption.textContent = 'In development · Public website preview. SVG logo introduction and scroll transition.';
    const showPreview = (play, explicit = false) => {
      video.pause(); image.hidden = play; video.hidden = !play;
      for (const button of controls.children) button.setAttribute('aria-pressed', String(button.dataset.preview === (play ? 'video' : 'image')));
      if (play) {
        if (!video.hasAttribute('src')) video.src = '/assets/media/mourchoutas/hero-intro.webm';
        if (!reduced || explicit) video.play().catch(() => { /* Native controls remain available. */ });
      }
    };
    [['Watch intro', 'video'], ['Website preview', 'image']].forEach(([label, mode]) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.preview = mode;
      button.addEventListener('click', () => showPreview(mode === 'video', true)); controls.append(button);
    });
    showPreview(!reduced);
    return;
  }
  const projectDemo = projectDemos[detail.id];
  if (projectDemo) {
    const screenshot = detail.imageSrc;
    const demoCaption = detail.id === 'retrobyte' ? 'Interactive demo · sample products and prices.' : 'Interactive demo · booking, arrival, and mechanic job records.';
    caption.hidden = false; caption.textContent = demoCaption;
    image.hidden = true; projectDemo.activate();
    ['Interactive demo', 'Website preview'].forEach((label, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        if (button.getAttribute('aria-pressed') === 'true') return;
        projectDemo.deactivate();
        for (const sibling of controls.children) sibling.setAttribute('aria-pressed', String(sibling === button));
        image.hidden = index === 0;
        if (index === 0) { projectDemo.activate(); caption.textContent = demoCaption; }
        else { image.src = screenshot; image.alt = detail.imageAlt; caption.textContent = 'Original website preview.'; }
      });
      controls.append(button);
    });
    return;
  }
  if (detail.id !== 'race-console') return;
  const mediaCaption = 'Actual Windows application · recorded F1 25 telemetry replay. Walkthrough v0.170.0; screenshots show a later version.';
  const demoCaption = 'Interactive demo · simulated telemetry. Explore the actual app using the screenshots and walkthrough.';
  caption.textContent = demoCaption;
  image.hidden = true;
  raceDemo.activate();
  const choices = [
    ['Interactive demo', 'interactive'],
    ['Dashboard', '/assets/images/RaceConsole.webp'], ['Vehicle', '/assets/media/raceconsole/vehicle.png'],
    ['Timing', '/assets/media/raceconsole/timing.png'], ['Watch walkthrough', null]
  ];
  choices.forEach(([label, src], index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      video.pause();
      raceDemo?.deactivate();
      for (const sibling of controls.children) sibling.setAttribute('aria-pressed', String(sibling === button));
      caption.textContent = src === 'interactive' ? demoCaption : mediaCaption;
      if (src === 'interactive') { image.hidden = true; video.hidden = true; raceDemo.activate(); return; }
      image.hidden = !src; video.hidden = Boolean(src);
      if (src) { image.src = src; image.alt = `RaceConsole ${label.toLowerCase()} view`; }
      else if (video.getAttribute('src') !== '/assets/media/raceconsole/walkthrough.mp4') video.src = '/assets/media/raceconsole/walkthrough.mp4';
    });
    controls.append(button);
  });
});
window.addEventListener('portfolio:project-close', () => {
  releaseVideo(); resetPrinter(); raceDemo?.deactivate(); raceDemo?.reset();
  Object.values(projectDemos).forEach(demo => { demo.deactivate(); demo.reset(); });
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
  if (event.matches) {
    video.pause();

  }
});
