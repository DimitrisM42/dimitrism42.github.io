/* A sample storefront. All cart state stays in this page; there is no checkout. */
const products = [
  { id: 'pocket', name: 'Pocket console', category: 'HANDHELD / 01', price: 4900, description: 'Tiny screen. Unreasonably big adventures. A pocket-sized dose of nostalgia.' },
  { id: 'controller', name: 'Classic controller', category: 'CONTROLLERS / 02', price: 1900, description: 'A D-pad, two buttons, and absolutely no need for a tutorial.' },
  { id: 'keyboard', name: 'Mechanical keyboard', category: 'DESKTOP / 03', price: 7900, description: 'For the satisfying click of getting something right. Or trying again.' }
];
const money = cents => `€${(cents / 100).toFixed(2)}`;
function device(id) {
  const body = id === 'pocket'
    ? `<path d="M77 15H167V141L148 164H77Z" fill="#333044"/><path d="M69 9H159V135L140 157H69Z" fill="#e9e2d5" stroke="#252342" stroke-width="3"/><rect x="79" y="24" width="70" height="61" rx="6" fill="#706a86"/><rect x="88" y="32" width="52" height="42" fill="#93c7c5"/><path d="M101 40H125V46H131V60H125V54H101V60H95V46H101Z" fill="#284d66"/><path d="M105 46H110V51H105ZM119 46H124V51H119Z" fill="#b7efbb"/><path d="M85 104H94V95H104V104H113V114H104V123H94V114H85Z" fill="#282741"/><circle cx="130" cy="113" r="7" fill="#c45881"/><circle cx="145" cy="101" r="7" fill="#c45881"/><path d="M114 137H123M130 137H139" stroke="#7a7483" stroke-width="4"/>`
    : id === 'controller'
      ? `<path d="M113 15V37Q113 46 130 46H173" fill="none" stroke="#3f3b56" stroke-width="5"/><rect x="25" y="61" width="194" height="88" rx="13" fill="#302c46"/><rect x="19" y="53" width="194" height="88" rx="13" fill="#e8e1d7" stroke="#252342" stroke-width="3"/><rect x="30" y="66" width="171" height="60" rx="5" fill="#5d596f"/><path d="M42 87H55V74H70V87H83V102H70V115H55V102H42Z" fill="#25263f"/><circle cx="157" cy="104" r="12" fill="#c45881"/><circle cx="185" cy="84" r="12" fill="#c45881"/><path d="M98 105H110M116 105H128" stroke="#29263f" stroke-width="6"/>`
      : `<g transform="translate(10 24) rotate(-6 105 65)"><rect x="5" y="29" width="204" height="99" rx="7" fill="#38324f"/><rect y="20" width="204" height="99" rx="7" fill="#c4bed0" stroke="#252342" stroke-width="3"/>${Array.from({ length: 4 }, (_, row) => Array.from({ length: 11 }, (_, col) => `<rect x="${9 + col * 17}" y="${29 + row * 18}" width="13" height="13" rx="2" fill="${col === 10 || row === 0 && col === 0 ? '#3157d9' : '#f1eadf'}" stroke="#9c95ad"/>`).join('')).join('')}<rect x="52" y="101" width="97" height="10" rx="2" fill="#f1eadf"/></g>`;
  return `<svg viewBox="0 0 240 180" aria-hidden="true" focusable="false">${body}</svg>`;
}
export function createRetroDemo() {
  const element = document.createElement('div');
  element.className = 'rb-demo'; element.hidden = true;
  element.setAttribute('role', 'region'); element.setAttribute('aria-label', 'RetroByte interactive storefront');
  element.innerHTML = `
    <div class="rb-header"><div class="rb-logo"><i class="fa-solid fa-computer" aria-hidden="true"></i><strong>RETROBYTE</strong></div><span class="rb-demo-tag">SAMPLE STORE</span><button type="button" class="rb-reset">Reset</button><button type="button" class="rb-cart-toggle" aria-expanded="false" aria-controls="rb-cart"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i> Cart <span class="rb-cart-count">0</span></button></div>
    <div class="rb-store"><p class="rb-kicker">THE PAST NEVER LOOKED SO GOOD</p><h3>A little nostalgia.<br>A few good finds.</h3>
      <div class="rb-products" role="group" aria-label="Choose a sample product">${products.map((product, index) => `<button type="button" data-product="${product.id}" aria-pressed="${index === 0}">${device(product.id)}<span>${product.name}</span></button>`).join('')}</div>
      <div class="rb-product-detail"><div class="rb-product-art">${device(products[0].id)}<span>INSERT A LITTLE NOSTALGIA</span></div><div class="rb-product-copy"><span class="rb-category"></span><h4 class="rb-product-name"></h4><p class="rb-product-description"></p><strong class="rb-price"></strong><span class="rb-stock"></span><div class="rb-buy"><div class="rb-quantity" role="group" aria-label="Quantity"><button type="button" class="rb-quantity-minus" aria-label="Decrease quantity">−</button><span class="rb-quantity-value" aria-live="off">1</span><button type="button" class="rb-quantity-plus" aria-label="Increase quantity">+</button></div><button type="button" class="rb-add">Add to cart <span aria-hidden="true">↗</span></button></div></div></div>
      <p class="rb-footnote">Sample products & prices · just here for the nostalgia.</p>
    </div>
    <button type="button" class="rb-cart-scrim" aria-label="Close cart" tabindex="-1" hidden></button>
    <aside class="rb-cart" id="rb-cart" aria-labelledby="rb-cart-title" hidden><div class="rb-cart-heading"><div><span>YOUR DEMO CART</span><h4 id="rb-cart-title">Nice finds.</h4></div><button type="button" class="rb-cart-close" aria-label="Close cart"><span class="close-icon" aria-hidden="true"></span></button></div><div class="rb-cart-items"><p class="rb-cart-empty">Your nostalgia starts here.<br>Pick something from the shelf.</p>${products.map(product => `<div class="rb-cart-item" data-cart-product="${product.id}" hidden><div class="rb-cart-art">${device(product.id)}</div><div class="rb-cart-item-copy"><strong>${product.name}</strong><span class="rb-line-price"></span><div class="rb-line-controls"><button type="button" data-change="-1" aria-label="Remove one ${product.name}">−</button><span class="rb-line-quantity"></span><button type="button" data-change="1" aria-label="Add one ${product.name}">+</button><button type="button" class="rb-remove" aria-label="Remove ${product.name} from cart">Remove</button></div></div></div>`).join('')}</div><div class="rb-cart-footer"><div><span>Total</span><strong class="rb-total">€0.00</strong></div><p>A very real cart interaction.<br>An entirely imaginary shopping spree.</p></div></aside>
    <span class="project-demo-sr" role="status"></span>`;
  const store = element.querySelector('.rb-store');
  const cart = element.querySelector('.rb-cart');
  const scrim = element.querySelector('.rb-cart-scrim');
  const toggle = element.querySelector('.rb-cart-toggle');
  const header = element.querySelector('.rb-header');
  const close = element.querySelector('.rb-cart-close');
  const resetButton = element.querySelector('.rb-reset');
  const art = element.querySelector('.rb-product-art');
  const add = element.querySelector('.rb-add');
  const minus = element.querySelector('.rb-quantity-minus');
  const plus = element.querySelector('.rb-quantity-plus');
  const badge = element.querySelector('.rb-cart-count');
  const status = element.querySelector('[role=status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const viewer = document.querySelector('#project-dialog');
  let selected = products[0], quantity = 1, counts = {}, opener = null;
  let drawerTween, artTween, badgeTween;
  let viewerOverflow = null;
  function fitCart() {
    if (cart.hidden || element.hidden) return;
    const dialog = element.closest('dialog');
    if (!dialog?.open) return;
    const demoBounds = element.getBoundingClientRect(), bounds = dialog.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = Math.max(demoBounds.top, bounds.top + dialog.clientTop + 52, viewport?.offsetTop || 0);
    const bottom = Math.min(demoBounds.bottom, bounds.top + dialog.clientTop + dialog.clientHeight, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight));
    cart.style.top = `${Math.max(0, top - demoBounds.top)}px`;
    cart.style.height = `${Math.max(1, bottom - top)}px`;
  }
  function updateProduct() {
    const remaining = 5 - (counts[selected.id] || 0);
    quantity = Math.min(quantity, Math.max(1, remaining));
    element.querySelector('.rb-category').textContent = selected.category;
    element.querySelector('.rb-product-name').textContent = selected.name;
    element.querySelector('.rb-product-description').textContent = selected.description;
    element.querySelector('.rb-price').textContent = money(selected.price);
    element.querySelector('.rb-stock').textContent = remaining ? `${remaining} available in this sample collection` : 'All 5 are in your cart';
    element.querySelector('.rb-quantity-value').textContent = quantity;
    minus.disabled = quantity <= 1 || remaining === 0; plus.disabled = quantity >= remaining; add.disabled = remaining === 0;
    element.querySelectorAll('[data-product]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.product === selected.id)));
  }
  function updateCart() {
    let count = 0, total = 0;
    for (const product of products) {
      const qty = counts[product.id] || 0;
      count += qty; total += qty * product.price;
      const row = element.querySelector(`[data-cart-product="${product.id}"]`);
      row.hidden = qty === 0;
      row.querySelector('.rb-line-price').textContent = money(qty * product.price);
      row.querySelector('.rb-line-quantity').textContent = qty;
      row.querySelector('[data-change="1"]').disabled = qty >= 5;
    }
    badge.textContent = count;
    toggle.setAttribute('aria-label', `Cart, ${count} ${count === 1 ? 'item' : 'items'}`);
    element.querySelector('.rb-total').textContent = money(total);
    element.querySelector('.rb-cart-empty').hidden = count > 0;
    updateProduct();
  }
  function showCart(open, trigger = toggle, instant = false) {
    drawerTween?.kill();
    if (open) {
      opener = trigger; cart.hidden = false; scrim.hidden = false;
      store.inert = true; header.inert = true; cart.inert = false; toggle.setAttribute('aria-expanded', 'true');
      if (viewer && viewerOverflow === null) { viewerOverflow = viewer.style.overflowY; viewer.style.overflowY = 'hidden'; }
      cart.setAttribute('role', 'dialog'); cart.setAttribute('aria-modal', 'true');
      fitCart();
      if (window.gsap && !reduced.matches && !instant) drawerTween = window.gsap.fromTo(cart, { xPercent: 100 }, { xPercent: 0, duration: .4, ease: 'power3.out' });
      else cart.style.transform = '';
      close.focus({ preventScroll: true });
    } else {
      toggle.setAttribute('aria-expanded', 'false'); store.inert = false; header.inert = false; scrim.hidden = true; cart.inert = true;
      if (viewer && viewerOverflow !== null) { viewer.style.overflowY = viewerOverflow; viewerOverflow = null; }
      const finish = () => { cart.hidden = true; cart.style.transform = ''; };
      if (!cart.hidden && window.gsap && !reduced.matches && !instant) drawerTween = window.gsap.to(cart, { xPercent: 100, duration: .25, ease: 'power2.in', onComplete: finish });
      else finish();
      if (!instant) (opener?.disabled ? toggle : opener)?.focus({ preventScroll: true });
    }
  }
  element.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
    selected = products.find(product => product.id === button.dataset.product); quantity = 1;
    artTween?.kill(); art.innerHTML = `${device(selected.id)}<span>INSERT A LITTLE NOSTALGIA</span>`; updateProduct();
    if (window.gsap && !reduced.matches) artTween = window.gsap.fromTo(art.querySelector('svg'), { y: 8, opacity: .3 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out' });
  }));
  minus.addEventListener('click', () => { quantity = Math.max(1, quantity - 1); updateProduct(); });
  plus.addEventListener('click', () => { quantity = Math.min(5 - (counts[selected.id] || 0), quantity + 1); updateProduct(); });
  add.addEventListener('click', () => {
    const amount = Math.min(quantity, 5 - (counts[selected.id] || 0));
    counts[selected.id] = (counts[selected.id] || 0) + amount;
    updateCart(); status.textContent = `Added ${amount} ${selected.name} to your demo cart.`;
    badgeTween?.kill();
    if (window.gsap && !reduced.matches) badgeTween = window.gsap.fromTo(badge, { scale: 1.4 }, { scale: 1, duration: .45, ease: 'back.out(2)' });
    showCart(true, add);
  });
  element.querySelectorAll('[data-cart-product]').forEach(row => {
    const id = row.dataset.cartProduct;
    row.querySelectorAll('[data-change]').forEach(button => button.addEventListener('click', () => {
      counts[id] = Math.max(0, Math.min(5, (counts[id] || 0) + Number(button.dataset.change)));
      updateCart(); status.textContent = `Demo cart updated. Total ${element.querySelector('.rb-total').textContent}.`;
      if (row.hidden) close.focus({ preventScroll: true });
    }));
    row.querySelector('.rb-remove').addEventListener('click', () => { counts[id] = 0; updateCart(); status.textContent = 'Item removed from your demo cart.'; close.focus({ preventScroll: true }); });
  });
  toggle.addEventListener('click', () => showCart(toggle.getAttribute('aria-expanded') !== 'true'));
  close.addEventListener('click', () => showCart(false)); scrim.addEventListener('click', () => showCart(false));
  cart.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || cart.hidden || cart.inert) return;
    const controls = [...cart.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')].filter(control => control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  // Keep the drawer inside the visible viewer, rather than the full store height.
  viewer?.addEventListener('scroll', fitCart, { passive: true });
  window.addEventListener('resize', fitCart);
  window.visualViewport?.addEventListener('resize', fitCart);
  window.visualViewport?.addEventListener('scroll', fitCart);
  const cartResize = new ResizeObserver(fitCart); cartResize.observe(element);
  element.addEventListener('keydown', event => { if (event.key === 'Escape' && !cart.hidden) { event.preventDefault(); event.stopPropagation(); showCart(false); } });
  function reset() {
    drawerTween?.kill(); artTween?.kill(); badgeTween?.kill(); showCart(false, toggle, true);
    selected = products[0]; quantity = 1; counts = {};
    art.innerHTML = `${device(selected.id)}<span>INSERT A LITTLE NOSTALGIA</span>`;
    badge.style.transform = ''; status.textContent = ''; updateCart();
  }
  resetButton.addEventListener('click', () => { reset(); status.textContent = 'Sample store reset.'; });
  reduced.addEventListener('change', event => { if (event.matches) { drawerTween?.progress(1); artTween?.progress(1); badgeTween?.progress(1); } });
  reset();
  return {
    element, reset,
    activate() { element.hidden = false; },
    deactivate() { drawerTween?.kill(); artTween?.progress(1); badgeTween?.progress(1); showCart(false, toggle, true); element.hidden = true; }
  };
}
