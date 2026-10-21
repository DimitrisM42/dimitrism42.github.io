/* Real application media and local interactive project previews. */
import { createRaceDemo } from './race-demo.js';
import { createRetroDemo } from './retro-demo.js';
import { createGarageDemo } from './garage-demo.js';
import { createReceiptTear } from './receipt-tear.js';
const dialog = document.querySelector('#project-dialog');
const image = dialog.querySelector('#detail-image');
const wrap = image.parentElement;
const chrome = document.createElement('div');
chrome.className = 'showcase-chrome';
wrap.before(chrome);
const video = document.createElement('video');
video.controls = true; video.preload = 'none'; video.playsInline = true;
video.poster = 'images/RaceConsole.webp'; video.hidden = true;
video.setAttribute('aria-label', 'RaceConsole walkthrough using a recorded F1 25 telemetry replay');
wrap.append(video);
const raceDemo = createRaceDemo();
wrap.append(raceDemo.element);
const projectDemos = { retrobyte: createRetroDemo(), 'autoservice-garage': createGarageDemo() };
Object.values(projectDemos).forEach(demo => wrap.append(demo.element));
const controls = document.createElement('div'); controls.className = 'showcase-switcher'; wrap.after(controls);
const caption = document.createElement('p'); caption.className = 'showcase-caption'; controls.after(caption);
const desktopIds = ['race-console', 'java-ticket-booking', 'music-library'];
const flow = document.createElement('div');
flow.className = 'sante-flow'; flow.hidden = true;
flow.innerHTML = `<p class="section-kicker">From screen to service</p>
  <p>One part of the cafeteria management system: how an order reaches the bar or kitchen printer.</p>
  <ol><li><i class="fa-solid fa-mug-hot" aria-hidden="true"></i><strong>Order</strong><span>Web application</span></li><li><i class="fa-solid fa-server" aria-hidden="true"></i><strong>System</strong><span>Print job prepared</span></li><li><i class="fa-solid fa-microchip" aria-hidden="true"></i><strong>ESP32</strong><span>Network connection</span></li><li><i class="fa-solid fa-print" aria-hidden="true"></i><strong>Printers</strong><span>Bar / kitchen</span></li></ol>
  <div class="receipt-demo">
    <div class="receipt-demo-copy">
      <span class="receipt-demo-eyebrow">A little counter magic</span>
      <p>Go on. Give the little printer something to do.</p>
      <button type="button" class="btn btn-primary receipt-print"><i class="fa-solid fa-print" aria-hidden="true"></i><span>Print a demo order</span></button>
      <p class="receipt-print-status" role="status">The next coffee is imaginary.</p>
    </div>
    <div class="receipt-printer">
      <div class="printer-shadow"></div>
      <div class="printer-body"><span class="printer-brand">SANTÉ <span> / COUNTER 1</span></span><span class="printer-led"></span><span class="printer-vents"></span></div>
      <div class="printer-feed">
        <div class="printer-paper">
          <strong class="receipt-brand">SANTÉ</strong><span class="receipt-subtitle">CAFE · BAR</span>
          <span class="receipt-order-number">DEMO ORDER #1</span>
          <div class="receipt-rule"></div><div class="receipt-row"><strong>2 × Cappuccino</strong><span>BAR</span></div>
          <div class="receipt-row"><span>1 × Espresso</span><span>BAR</span></div>
          <div class="receipt-rule"></div><div class="receipt-row"><span>TABLE</span><strong>7</strong></div>
          <span class="receipt-note">A small ticket.<br>A whole system behind it.</span><div class="receipt-barcode"></div>
        </div>
      </div>
      <div class="printer-slot"></div>
    </div>
  </div>`;
caption.after(flow);
const printButton = flow.querySelector('.receipt-print');
const printLabel = printButton.querySelector('span');
const printStatus = flow.querySelector('.receipt-print-status');
const paper = flow.querySelector('.printer-paper');
const printer = flow.querySelector('.receipt-printer');
const receiptTemplate = paper.innerHTML;
paper.replaceChildren();
let attachedCount = 0;
const receiptTear = createReceiptTear({ paper, printer, dialog, status: printStatus, returnFocus: printButton, onTear() {
  attachedCount = 0; paper.replaceChildren(); printer.style.setProperty('--receipt-length', '0px');
} });
const steps = [...flow.querySelectorAll('ol li')];
let printTimeline;
let demoOrder = 0;
let printing = false;
const printQueue = [];
function resetPrinter() {
  printTimeline?.kill();
  printTimeline = null;
  printing = false; printQueue.length = 0; attachedCount = 0;
  receiptTear.reset(); paper.replaceChildren(); printer.style.setProperty('--receipt-length', '0px');
  paper.style.transform = '';
  flow.classList.remove('is-printing');
  steps.forEach(step => step.classList.remove('is-active', 'is-complete'));
  printButton.disabled = false;
  printLabel.textContent = 'Print a demo order';
  printStatus.textContent = 'The next coffee is imaginary.';
}
function printNext() {
  if (printing || !printQueue.length) return;
  printing = true; receiptTear.beginPrint();
  const ticket = document.createElement('div'); ticket.className = 'receipt-ticket'; ticket.innerHTML = receiptTemplate;
  ticket.querySelector('.receipt-order-number').textContent = `DEMO ORDER #${printQueue.shift()}`;
  paper.prepend(ticket); attachedCount += 1;
  printer.style.setProperty('--receipt-length', `${attachedCount * 286}px`);
  // Adding the new ticket above the old paper and feeding one ticket length
  // keeps the already printed content in place before it advances downward.
  if (window.gsap) window.gsap.set(paper, { x: 0, y: -286, yPercent: 0, rotation: 0, scaleY: 1 });
  else paper.style.transform = 'translateY(-286px)';
  printLabel.textContent = 'Print another demo';
  flow.classList.add('is-printing');
  printStatus.textContent = 'Your imaginary coffee order is on its way…';
  const finish = () => {
    flow.classList.remove('is-printing');
    steps.forEach(step => { step.classList.remove('is-active'); step.classList.add('is-complete'); });
    printing = false; printTimeline = null;
    if (printQueue.length) { printNext(); return; }
    printStatus.textContent = 'Paper ready. Pull to tear it off, or keep printing.';
    receiptTear.ready();
  };
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paper.style.transform = 'translateY(0)'; finish(); return;
  }
  printTimeline = window.gsap.timeline({ onComplete: finish });
  steps.forEach((step, index) => {
    printTimeline.call(() => {
      steps.forEach((item, stepIndex) => {
        item.classList.toggle('is-active', stepIndex === index);
        item.classList.toggle('is-complete', stepIndex < index);
      });
    }, [], index * .32);
  });
  printTimeline.fromTo(paper, { x: 0, y: -286, yPercent: 0, rotation: 0, skewX: 0, scaleY: 1 }, { x: 0, y: 0, yPercent: 0, rotation: 0, duration: 1.8, ease: 'none' }, 1.02)
    .to(paper, { rotation: .6, duration: .18, transformOrigin: 'top center', ease: 'sine.inOut' })
    .to(paper, { rotation: 0, duration: .3, ease: 'sine.out' });
}
printButton.addEventListener('click', () => {
  printQueue.push(++demoOrder);
  if (printing) printStatus.textContent = `${printQueue.length} more ${printQueue.length === 1 ? 'order' : 'orders'} queued. Keep the paper rolling.`;
  else printNext();
});
window.addEventListener('portfolio:project', ({ detail }) => {
  raceDemo.deactivate();
  raceDemo.reset();
  Object.values(projectDemos).forEach(demo => { demo.deactivate(); demo.reset(); });
  resetPrinter();
  flow.hidden = detail.id !== 'sante-cafe-bar';
  video.pause(); video.hidden = true; image.hidden = false;
  controls.replaceChildren();
  const desktop = desktopIds.includes(detail.id);
  dialog.classList.toggle('desktop-detail', desktop);
  chrome.textContent = desktop ? `${detail.title}                         −   □   ×` : `${detail.title} / project preview`;
  caption.hidden = detail.id !== 'race-console';
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
    ['Dashboard', 'images/RaceConsole.webp'], ['Vehicle', 'media/raceconsole/vehicle.png'],
    ['Timing', 'media/raceconsole/timing.png'], ['Watch walkthrough', null]
  ];
  choices.forEach(([label, src], index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      video.pause();
      raceDemo.deactivate();
      for (const sibling of controls.children) sibling.setAttribute('aria-pressed', String(sibling === button));
      caption.textContent = src === 'interactive' ? demoCaption : mediaCaption;
      if (src === 'interactive') { image.hidden = true; video.hidden = true; raceDemo.activate(); return; }
      image.hidden = !src; video.hidden = Boolean(src);
      if (src) { image.src = src; image.alt = `RaceConsole ${label.toLowerCase()} view`; }
      else if (!video.getAttribute('src')) video.src = 'media/raceconsole/walkthrough.mp4';
    });
    controls.append(button);
  });
});
window.addEventListener('portfolio:project-close', () => {
  video.pause(); resetPrinter(); raceDemo.deactivate(); raceDemo.reset();
  Object.values(projectDemos).forEach(demo => { demo.deactivate(); demo.reset(); });
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
  if (event.matches && printTimeline?.isActive()) printTimeline.progress(1);
});
