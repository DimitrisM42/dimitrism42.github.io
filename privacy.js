/* Basic consent: Google is contacted only after an explicit analytics opt-in. */
(() => {
  const measurementId = 'G-CPB3LMSKJ2';
  const storageKey = 'portfolio-cookie-consent';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const base = new URL('.', document.currentScript.src);
  const disableKey = `ga-disable-${measurementId}`;
  let analyticsStarted = false;
  let opener;
  let choice = readChoice();
  window[disableKey] = true;

  function readChoice() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored?.version === 1 && typeof stored.analytics === 'boolean' &&
        Number.isFinite(stored.expires) && stored.expires > Date.now() && stored.expires <= Date.now() + lifetime + 60000) return stored;
    } catch { /* Storage may be unavailable; analytics stays off until a choice. */ }
    return null;
  }
  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0])
      .filter(name => /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name));
    const parts = location.hostname.split('.');
    const domains = ['', ...parts.map((_, i) => parts.slice(i).join('.'))];
    const paths = ['/', ...location.pathname.split('/').slice(1, -1).map((_, i, all) => '/' + all.slice(0, i + 1).join('/'))];
    for (const name of names) for (const domain of domains) for (const path of paths) {
      document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? `; domain=${domain}` : ''}; SameSite=Lax`;
    }
  }
  function startAnalytics() {
    if (analyticsStarted || !choice?.analytics) return;
    analyticsStarted = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: lifetime / 1000,
      cookie_update: false,
      page_location: location.origin + location.pathname
    });
    const script = document.createElement('script');
    script.id = 'consented-analytics'; script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }

  const panel = document.createElement('section');
  panel.className = 'cookie-panel'; panel.hidden = true;
  panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', 'cookie-title');
  panel.innerHTML = `
    <div class="cookie-topline"><span>YOUR PRIVACY</span><button class="cookie-close" type="button" aria-label="Close cookie settings" hidden><span class="close-icon" aria-hidden="true"></span></button></div>
    <h2 id="cookie-title" tabindex="-1">A small choice. Your call.</h2>
    <p>This site works without analytics. If you accept, Google Analytics uses cookies to help me understand visits and improve the portfolio. Rejecting won't change your experience.</p>
    <p class="cookie-current" aria-live="polite"></p>
    <div class="cookie-actions"><button type="button" data-consent="false">Reject analytics</button><button type="button" data-consent="true">Accept analytics</button></div>
    <a class="cookie-policy" href="${new URL('privacy.html', base)}">Privacy &amp; Cookies <span aria-hidden="true">↗</span></a>`;
  document.body.append(panel);
  const current = panel.querySelector('.cookie-current');
  const close = panel.querySelector('.cookie-close');
  function showSettings(event) {
    opener = event?.currentTarget;
    close.hidden = !choice;
    current.textContent = choice ? `Current choice: analytics ${choice.analytics ? 'on' : 'off'}. You can change it here.` : '';
    panel.hidden = false;
    if (opener) panel.querySelector('h2').focus({ preventScroll: true });
  }
  function hideSettings() {
    panel.hidden = true;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  function choose(analytics) {
    choice = { version: 1, analytics, expires: Date.now() + lifetime };
    try { localStorage.setItem(storageKey, JSON.stringify(choice)); } catch { /* This visit's choice still applies. */ }
    hideSettings();
    if (analytics) startAnalytics();
    else {
      window[disableKey] = true;
      clearAnalyticsCookies();
      // Reload to remove an already-loaded tag and its event listeners completely.
      if (analyticsStarted) location.reload();
    }
  }
  panel.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => choose(button.dataset.consent === 'true')));
  close.addEventListener('click', hideSettings);
  panel.addEventListener('keydown', event => { if (event.key === 'Escape' && choice) { event.stopPropagation(); hideSettings(); } });
  document.querySelectorAll('[data-cookie-settings]').forEach(button => { button.hidden = false; button.addEventListener('click', showSettings); });
  function syncChoice() {
    choice = readChoice();
    if (choice?.analytics) { panel.hidden = true; startAnalytics(); }
    else {
      window[disableKey] = true; clearAnalyticsCookies();
      if (analyticsStarted) location.reload();
      else if (!choice) showSettings();
      else panel.hidden = true;
    }
  }
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) syncChoice();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) syncChoice(); });
  if (choice?.analytics) startAnalytics();
  else {
    clearAnalyticsCookies();
    if (!choice) showSettings();
  }
})();
