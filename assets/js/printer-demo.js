import { createReceiptTear } from './receipt-tear.js';
export function createPrinterDemo(dialog) {
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

matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if (e.matches && printTimeline?.isActive()) printTimeline.progress(1); });
return { element: flow, reset: resetPrinter };
}
