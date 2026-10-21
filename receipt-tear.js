/* Attached paper tears away into persistent, movable receipts in this viewer. */
export function createReceiptTear({ paper, printer, dialog, status, returnFocus, onTear }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const receipts = new Set();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let ready = false, gesture = null, layer = null, bin = null, returnTween, resizeFrame = 0, order = 0;
  paper.setAttribute('role', 'button');
  printer.querySelector('.printer-body').setAttribute('aria-hidden', 'true');
  const stub = document.createElement('span'); stub.className = 'printer-stub'; stub.setAttribute('aria-hidden', 'true');
  paper.parentElement.append(stub);
  function setPaper(values) {
    if (window.gsap) window.gsap.set(paper, { yPercent: 0, ...values });
    else paper.style.transform = `translate(${values.x || 0}px,${values.y || 0}px) rotate(${values.rotation || 0}deg) scaleY(${values.scaleY || 1})`;
  }
  function releaseCapture() {
    const previous = gesture; gesture = null;
    if (previous && previous.target.hasPointerCapture(previous.id)) previous.target.releasePointerCapture(previous.id);
    return previous;
  }
  function markUnavailable() {
    ready = false; paper.classList.remove('is-tearable', 'is-pulling'); printer.classList.remove('has-ready-ticket');
    paper.tabIndex = -1; paper.setAttribute('aria-disabled', 'true'); paper.setAttribute('aria-hidden', 'true');
  }
  function reset() {
    releaseCapture(); returnTween?.kill(); cancelAnimationFrame(resizeFrame); resizeFrame = 0;
    receipts.forEach(receipt => { receipt.moveTween?.kill(); receipt.settleTween?.kill(); receipt.recycleTween?.kill(); });
    receipts.clear(); layer?.remove(); bin?.remove(); layer = null; bin = null; order = 0; markUnavailable();
    paper.classList.remove('is-cut-source'); printer.classList.remove('has-torn-ticket');
    paper.style.removeProperty('--tear-tension'); paper.style.removeProperty('--tear-origin'); paper.style.transformOrigin = '';
  }
  function beginPrint() {
    cancelGesture(); returnTween?.kill(); markUnavailable();
    paper.classList.remove('is-cut-source'); printer.classList.remove('has-torn-ticket');
    paper.style.removeProperty('--tear-tension'); paper.style.removeProperty('--tear-origin');
    setPaper({ x: 0, y: 0, rotation: 0, scaleY: 1 });
  }
  function readyToTear() {
    ready = true; paper.classList.add('is-tearable'); printer.classList.add('has-ready-ticket'); paper.tabIndex = 0;
    paper.setAttribute('aria-disabled', 'false'); paper.removeAttribute('aria-hidden');
    paper.setAttribute('aria-label', 'Take the printed paper. Pull to tear it off, or press Enter or Space.');
  }
  function visibleBounds() {
    const bounds = dialog.getBoundingClientRect(), viewport = window.visualViewport;
    // Keep the viewer's close control above the movable receipts.
    const left = Math.max(bounds.left + dialog.clientLeft + 6, (viewport?.offsetLeft || 0) + 6);
    const top = Math.max(bounds.top + dialog.clientTop + 58, (viewport?.offsetTop || 0) + 6);
    const right = Math.min(bounds.left + dialog.clientLeft + dialog.clientWidth - 6, (viewport?.offsetLeft || 0) + (viewport?.width || innerWidth) - 6);
    const bottom = Math.min(bounds.top + dialog.clientTop + dialog.clientHeight - 6, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 6);
    return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
  }
  function sizeReceipt(receipt, bounds) {
    const radians = 4 * Math.PI / 180;
    const envelopeWidth = receipt.width * Math.cos(radians) + receipt.height * Math.sin(radians);
    const envelopeHeight = receipt.height * Math.cos(radians) + receipt.width * Math.sin(radians);
    receipt.scale = Math.min(1, Math.max(1, bounds.width - 4) / envelopeWidth, Math.max(1, bounds.height - 4) / envelopeHeight);
    receipt.halfWidth = envelopeWidth * receipt.scale / 2; receipt.halfHeight = envelopeHeight * receipt.scale / 2;
    receipt.layerWidth = bounds.width; receipt.layerHeight = bounds.height;
  }
  function boundedPosition(receipt, x, y) {
    return {
      x: clamp(x + receipt.width / 2, receipt.halfWidth, receipt.layerWidth - receipt.halfWidth) - receipt.width / 2,
      y: clamp(y + receipt.height / 2, receipt.halfHeight, receipt.layerHeight - receipt.halfHeight) - receipt.height / 2
    };
  }
  function placeReceipt(receipt, x, y, rotation = receipt.rotation, instant = false) {
    const position = boundedPosition(receipt, x, y);
    Object.assign(receipt, position, { rotation: clamp(rotation, -4, 4) });
    const values = { ...position, yPercent: 0, rotation: receipt.rotation, scale: receipt.scale, opacity: 1 };
    receipt.settleTween?.kill();
    if (window.gsap) {
      if (!instant && !reduced.matches) receipt.moveTween = window.gsap.to(receipt.node, { ...values, duration: .08, ease: 'power2.out', overwrite: true });
      else { receipt.moveTween?.kill(); window.gsap.set(receipt.node, values); }
    } else receipt.node.style.transform = `translate(${position.x}px,${position.y}px) rotate(${receipt.rotation}deg) scale(${receipt.scale})`;
  }
  function updateBounds() {
    resizeFrame = 0;
    if (!layer || !dialog.open) return;
    const bounds = visibleBounds();
    Object.assign(layer.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px` });
    Object.assign(bin.style, { left: `${bounds.left + Math.max(0, bounds.width - 106)}px`, top: `${bounds.top + Math.max(0, bounds.height - 116)}px` });
    receipts.forEach(receipt => {
      if (receipt.recycling) return;
      const centreX = (receipt.x + receipt.width / 2) / receipt.layerWidth;
      const centreY = (receipt.y + receipt.height / 2) / receipt.layerHeight;
      sizeReceipt(receipt, bounds);
      placeReceipt(receipt, centreX * bounds.width - receipt.width / 2, centreY * bounds.height - receipt.height / 2, receipt.rotation, true);
    });
  }
  function scheduleBounds() { if (layer && !resizeFrame) resizeFrame = requestAnimationFrame(updateBounds); }
  function createLayer() {
    layer = document.createElement('div'); layer.className = 'receipt-tear-layer';
    bin = document.createElement('button'); bin.type = 'button'; bin.className = 'receipt-recycle';
    bin.setAttribute('aria-label', 'Recycle the last picked-up receipt');
    bin.innerHTML = '<span class="receipt-bin" aria-hidden="true"><span class="receipt-bin-lid"></span><i class="fa-solid fa-recycle"></i></span><strong>Recycle</strong><span>Drag paper here</span>';
    bin.addEventListener('click', () => {
      const available = [...receipts].filter(receipt => !receipt.recycling);
      const latest = available.sort((a, b) => Number(b.node.style.zIndex) - Number(a.node.style.zIndex))[0];
      if (latest) recycle(latest);
    });
    dialog.append(layer, bin);
  }
  function overBin(x, y) {
    if (!bin || bin.hidden || bin.disabled) return false;
    const rect = bin.getBoundingClientRect();
    return x >= rect.left - 12 && x <= rect.right + 12 && y >= rect.top - 12 && y <= rect.bottom + 12;
  }
  function recycle(receipt) {
    if (!receipt || receipt.recycling) return;
    if (gesture?.receipt === receipt) releaseCapture();
    receipt.recycling = true; receipt.moveTween?.kill(); receipt.settleTween?.kill();
    const restoreFocus = receipt.node === document.activeElement || bin === document.activeElement;
    receipt.node.classList.remove('is-held'); receipt.node.style.pointerEvents = 'none'; receipt.node.tabIndex = -1;
    bin.classList.remove('is-target'); bin.classList.add('is-recycling');
    bin.disabled = ![...receipts].some(item => !item.recycling);
    if (restoreFocus) returnFocus.focus({ preventScroll: true });
    const finish = () => {
      receipt.node.remove(); receipts.delete(receipt);
      bin.hidden = receipts.size === 0;
      bin.classList.toggle('is-recycling', [...receipts].some(item => item.recycling));
    };
    status.textContent = 'Receipt recycled. Less paper, same imaginary coffee.';
    if (!window.gsap || reduced.matches) { finish(); return; }
    const target = bin.getBoundingClientRect(), bounds = layer.getBoundingClientRect();
    receipt.recycleTween = window.gsap.to(receipt.node, {
      x: target.left + target.width / 2 - bounds.left - receipt.width / 2,
      y: target.top + 30 - bounds.top - receipt.height / 2,
      scale: .02, rotation: -16, opacity: 0, duration: .38, ease: 'power2.in', overwrite: true, onComplete: finish
    });
  }
  function startSavedDrag(receipt, event) {
    if (gesture || receipt.recycling || event.button !== 0) return;
    event.preventDefault(); receipt.moveTween?.kill(); receipt.settleTween?.kill();
    receipt.node.focus({ preventScroll: true }); receipt.node.style.zIndex = String(++order);
    receipt.node.setPointerCapture(event.pointerId); receipt.node.classList.add('is-held');
    gesture = { id: event.pointerId, target: receipt.node, x: event.clientX, y: event.clientY, torn: true, receipt, baseX: receipt.x, baseY: receipt.y };
  }
  function tear() {
    returnTween?.kill(); setPaper({ x: 0, y: 0, rotation: 0, scaleY: 1 });
    const rect = paper.getBoundingClientRect(), bounds = visibleBounds();
    if (!rect.height) return;
    if (!layer) createLayer();
    updateBounds();
    const node = paper.cloneNode(true); node.className = 'printer-paper is-cut-ticket';
    for (const attr of ['style', 'aria-hidden', 'aria-disabled', 'aria-label']) node.removeAttribute(attr);
    node.tabIndex = 0; node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `Torn paper with ${node.children.length} ${node.children.length === 1 ? 'receipt' : 'receipts'}. Drag to move or drop in the recycle bin. Arrow keys move; Delete recycles.`);
    Object.assign(node.style, { left: '0px', top: '0px', width: `${rect.width}px`, height: `${rect.height}px`, transform: 'none', zIndex: String(++order) });
    layer.append(node);
    const receipt = { node, width: rect.width, height: rect.height, x: rect.left - bounds.left, y: rect.top - bounds.top, rotation: 0, pullX: 0 };
    sizeReceipt(receipt, bounds); receipts.add(receipt); bin.hidden = false; bin.disabled = false;
    placeReceipt(receipt, receipt.x, receipt.y, 0, true);
    node.addEventListener('pointerdown', event => startSavedDrag(receipt, event));
    for (const type of ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) node.addEventListener(type, handlePointer);
    node.addEventListener('keydown', event => {
      if (receipt.recycling) return;
      if (['Delete', 'Backspace'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation(); recycle(receipt); return;
      }
      const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!directions[event.key]) return;
      event.preventDefault(); event.stopPropagation(); const [x, y] = directions[event.key], step = event.shiftKey ? 30 : 10;
      placeReceipt(receipt, receipt.x + x * step, receipt.y + y * step, receipt.rotation, true);
    });
    paper.classList.add('is-cut-source'); printer.classList.add('has-torn-ticket'); markUnavailable();
    if (gesture) { gesture.torn = true; gesture.receipt = receipt; gesture.baseX = receipt.x; gesture.baseY = receipt.y; node.classList.add('is-held'); }
    onTear?.(); status.textContent = 'Keep it, move it, or drop it in the recycle bin.';
    if (document.activeElement === paper) returnFocus.focus({ preventScroll: true });
    return receipt;
  }
  function letGo(receipt) {
    if (!receipt) return;
    receipt.node.classList.remove('is-held'); receipt.moveTween?.kill();
    const position = boundedPosition(receipt, receipt.x + clamp(receipt.pullX * .1, -10, 10), receipt.y + 12);
    Object.assign(receipt, position);
    if (!window.gsap || reduced.matches) { placeReceipt(receipt, receipt.x, receipt.y, receipt.rotation, true); return; }
    receipt.settleTween = window.gsap.to(receipt.node, { ...position, opacity: 1, duration: .3, ease: 'power2.out', overwrite: true });
  }
  function springBack() {
    paper.classList.remove('is-pulling'); paper.style.removeProperty('--tear-tension'); paper.style.removeProperty('--tear-origin');
    if (window.gsap && !reduced.matches) returnTween = window.gsap.to(paper, { x: 0, y: 0, yPercent: 0, rotation: 0, skewX: 0, scaleY: 1, duration: .35, ease: 'back.out(1.1)' });
    else setPaper({ x: 0, y: 0, rotation: 0, scaleY: 1 });
  }
  function cancelGesture() {
    bin?.classList.remove('is-target');
    const previous = releaseCapture(); if (!previous) return;
    if (previous.torn) letGo(previous.receipt); else springBack();
  }
  function handlePointer(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (event.type === 'pointermove') {
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.torn) {
        const tension = Math.min(1, Math.hypot(dx * .85, Math.max(0, dy)) / 60);
        const origin = Math.abs(dx) > Math.max(8, Math.abs(dy) * .3) ? (dx > 0 ? 0 : 100) : gesture.origin;
        paper.style.setProperty('--tear-origin', `${origin}%`); paper.style.setProperty('--tear-tension', String(tension));
        if (tension >= 1) tear();
        else {
          const maxAngle = Math.min(3, Math.atan(14 / Math.max(1, paper.offsetHeight)) * 180 / Math.PI);
          setPaper({ x: clamp(dx * .12, -8, 8), y: clamp(dy * .14, -6, 10), rotation: clamp(-dx / 24, -maxAngle, maxAngle), scaleY: 1 + Math.max(0, dy) * .0004 }); return;
        }
      }
      const receipt = gesture.receipt;
      receipt.pullX = dx; placeReceipt(receipt, gesture.baseX + dx, gesture.baseY + dy, -dx / 30);
      bin.classList.toggle('is-target', overBin(event.clientX, event.clientY));
    } else if (event.type === 'pointerup' && gesture.torn && overBin(event.clientX, event.clientY)) {
      const previous = releaseCapture(); recycle(previous.receipt);
    } else cancelGesture();
  }
  paper.addEventListener('pointerdown', event => {
    if (!ready || gesture || event.button !== 0) return;
    event.preventDefault(); returnTween?.kill(); paper.focus({ preventScroll: true });
    setPaper({ x: 0, y: 0, rotation: 0, scaleY: 1 }); const rect = paper.getBoundingClientRect(); paper.setPointerCapture(event.pointerId);
    gesture = { id: event.pointerId, target: paper, x: event.clientX, y: event.clientY, origin: clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100, torn: false };
    paper.style.setProperty('--tear-origin', `${gesture.origin}%`); paper.classList.add('is-pulling'); paper.style.transformOrigin = 'top center';
  });
  for (const type of ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) paper.addEventListener(type, handlePointer);
  paper.addEventListener('keydown', event => {
    if (!ready || event.repeat || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation(); letGo(tear());
  });
  paper.addEventListener('click', event => { if (ready && event.detail === 0) letGo(tear()); });
  window.addEventListener('blur', cancelGesture);
  window.addEventListener('resize', () => { cancelGesture(); scheduleBounds(); });
  window.visualViewport?.addEventListener('resize', scheduleBounds);
  window.visualViewport?.addEventListener('scroll', scheduleBounds);
  const observer = new ResizeObserver(scheduleBounds); observer.observe(dialog);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelGesture(); });
  reduced.addEventListener('change', event => {
    if (event.matches) { returnTween?.progress(1); receipts.forEach(receipt => { receipt.moveTween?.progress(1); receipt.settleTween?.progress(1); receipt.recycleTween?.progress(1); }); }
  });
  reset();
  return { ready: readyToTear, beginPrint, reset };
}
