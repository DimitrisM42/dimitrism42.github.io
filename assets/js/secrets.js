/* A session-only Easter egg hunt. No analytics, remote requests, or automatic redirects. */
const progressKey = 'portfolio-secrets-progress';
const catalog = [
  { id: 'rocket', name: 'Escape velocity', hint: 'A quick journey down the page can leave a trail.', detail: 'You gave the scroll some speed.', symbol: '↗' },
  { id: 'scrollflip', name: 'Change of direction', hint: 'Sometimes the way forward is back. And forward. And back.', detail: 'Ten changes of direction. Still exploring?', symbol: '⇅' },
  { id: 'konami', name: 'Old-school access', hint: 'An old gaming code still opens doors. Start with the arrow keys.', detail: '↑ ↑ ↓ ↓ ← → ← → B A. A classic for a reason.', symbol: '⌘' },
  { id: 'dimitriskeys', name: 'On a first-name basis', hint: 'You already know whose portfolio this is. Your keyboard does too.', detail: 'You typed my name. Hello to you too.', symbol: '>_' },
  { id: 'tap3skills', name: 'Connect the dots', hint: 'Three different technologies, one quick sequence.', detail: 'Three skills. One connection.', symbol: '◇' },
  { id: 'triple', name: 'Third time lucky', hint: 'The introduction has more to say if you ask three times.', detail: 'You looked a little closer at the introduction.', symbol: '✦' },
  { id: 'mono', name: 'Another perspective', hint: 'Stay with a technology for a couple of seconds. Hold that thought.', detail: 'A different way to see the same work. Hold again to restore colour.', symbol: '◐' },
  { id: 'wizard', name: 'One more Java', hint: 'There is a certain language that appreciates five quick visits.', detail: 'Five visits to Java. That deserves a coffee break.', symbol: '{ }' }
];
function readProgress() {
  try {
    const record = JSON.parse(sessionStorage.getItem(progressKey));
    if (record?.version === 1 && Array.isArray(record.ids)) return record.ids.filter(id => catalog.some(secret => secret.id === id));
  } catch { /* The hunt still works for this page when storage is blocked. */ }
  return [];
}
const found = new Set(readProgress());
const hero = document.querySelector('#hero');

if (!hero) {
  document.querySelector('[data-new-hunt]')?.addEventListener('click', () => {
    found.clear();
    try { sessionStorage.removeItem(progressKey); } catch { /* Navigation also clears memory-only progress. */ }
  });
  const count = document.querySelector('[data-secret-count]');
  if (count) count.textContent = found.size ? `${found.size} ${found.size === 1 ? 'discovery' : 'discoveries'} in your journal` : 'A quiet corner for curious people';
} else {
  const touchOnly = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const available = catalog.filter(secret => !touchOnly || !['konami', 'dimitriskeys'].includes(secret.id));
  const availableIds = new Set(available.map(secret => secret.id));
  const countFound = () => available.filter(secret => found.has(secret.id)).length;
  const tracker = document.createElement('button');
  tracker.className = 'secret-journal-toggle'; tracker.type = 'button'; tracker.hidden = true;
  tracker.setAttribute('aria-expanded', 'false'); tracker.setAttribute('aria-controls', 'secret-journal');
  const journal = document.createElement('aside');
  journal.id = 'secret-journal'; journal.className = 'secret-journal'; journal.hidden = true;
  journal.setAttribute('aria-labelledby', 'secret-journal-title');
  journal.innerHTML = `<div class="secret-journal-top"><span>FOR THE CURIOUS</span><button type="button" class="secret-journal-close" aria-label="Close secret journal"><span class="close-icon" aria-hidden="true"></span></button></div>
    <h2 id="secret-journal-title">Off the beaten path.</h2><p class="secret-journal-summary"></p>
    <progress class="secret-progress" aria-label="Secrets discovered" max="${available.length}" value="0"></progress>
    <div class="secret-entries"></div><div class="secret-journal-bottom"><button type="button" class="secret-hint-button">Give me a clue</button><span>This tab's progress</span></div>
    <a class="secret-reward-link" href="/secret.html" hidden>Open the hidden page <span aria-hidden="true">↗</span></a>`;
  const entries = journal.querySelector('.secret-entries');
  const hintRevealed = new Set();
  let toast, toastTimer;
  document.body.append(tracker, journal);

  function updateJournal() {
    const count = countFound();
    tracker.hidden = count === 0;
    tracker.innerHTML = `<span aria-hidden="true">✦</span> <span>Secrets</span> <span class="secret-count">${count} / ${available.length}</span>`;
    tracker.setAttribute('aria-label', `Secret journal: ${count} of ${available.length} discovered`);
    journal.querySelector('.secret-journal-summary').textContent = count === available.length ? 'Every secret found. There is one more place to visit.' : `${count} of ${available.length} discovered. The rest are hiding in plain sight.`;
    journal.querySelector('progress').value = count;
    entries.replaceChildren(...available.map((secret, index) => {
      const item = document.createElement('div');
      const unlocked = found.has(secret.id);
      item.className = `secret-entry${unlocked ? ' is-found' : ''}`;
      item.dataset.secret = secret.id;
      const number = document.createElement('span'); number.className = 'secret-entry-number';
      number.textContent = unlocked ? secret.symbol : String(index + 1);
      number.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = unlocked ? secret.name : 'Undiscovered';
      const detail = document.createElement('p');
      detail.textContent = unlocked ? secret.detail : hintRevealed.has(secret.id) ? secret.hint : 'A little curiosity goes a long way.';
      copy.append(title, detail); item.append(number, copy); return item;
    }));
    journal.querySelector('.secret-reward-link').hidden = count !== available.length;
    journal.querySelector('.secret-hint-button').hidden = count === available.length;
  }
  function showJournal(open) {
    journal.hidden = !open;
    tracker.setAttribute('aria-expanded', String(open));
    if (open) journal.querySelector('.secret-journal-close').focus({ preventScroll: true });
    else tracker.focus({ preventScroll: true });
  }
  tracker.addEventListener('click', () => showJournal(journal.hidden));
  journal.querySelector('.secret-journal-close').addEventListener('click', () => showJournal(false));
  journal.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.stopPropagation(); showJournal(false); }
  });
  journal.querySelector('.secret-hint-button').addEventListener('click', () => {
    const next = available.find(secret => !found.has(secret.id) && !hintRevealed.has(secret.id)) || available.find(secret => !found.has(secret.id));
    if (!next) return;
    hintRevealed.add(next.id); updateJournal();
    const item = entries.querySelector(`[data-secret="${next.id}"]`);
    item.classList.add('has-clue');
    item.setAttribute('tabindex', '-1'); item.focus({ preventScroll: true });
    item.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  });
  function unlock(id) {
    if (!availableIds.has(id) || found.has(id)) return;
    found.add(id);
    try { sessionStorage.setItem(progressKey, JSON.stringify({ version: 1, ids: [...found] })); } catch { /* Memory-only progress is fine. */ }
    updateJournal();
    const secret = available.find(item => item.id === id);
    toast?.remove(); clearTimeout(toastTimer);
    toast = document.createElement('div'); toast.className = 'secret-unlock-toast';
    toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    const eyebrow = document.createElement('span'); eyebrow.className = 'secret-unlock-kicker';
    eyebrow.textContent = `DISCOVERY ${countFound()} / ${available.length}`;
    const title = document.createElement('strong'); title.textContent = secret.name;
    const detail = document.createElement('p'); detail.textContent = countFound() === available.length ? 'All secrets found. Open your journal for the hidden page.' : secret.detail;
    toast.append(eyebrow, title, detail); document.body.append(toast);
    toastTimer = setTimeout(() => { toast?.remove(); toast = null; }, 4500);
  }

  function editable(target) { return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'); }
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let sequence = [], nameSequence = '', lastKey = 0;
  document.addEventListener('keydown', event => {
    if (editable(event.target) || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (Date.now() - lastKey > 4000) { sequence = []; nameSequence = ''; }
    lastKey = Date.now();
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    sequence = [...sequence, key].slice(-konami.length);
    if (sequence.join('|') === konami.join('|')) { unlock('konami'); sequence = []; }
    nameSequence = /^[a-z]$/.test(key) ? (nameSequence + key).slice(-8) : '';
    if (nameSequence === 'dimitris') { unlock('dimitriskeys'); nameSequence = ''; }
  });
  let heroTaps = 0, heroTimer;
  function tapHero() {
    clearTimeout(heroTimer);
    if (++heroTaps === 3) { unlock('triple'); heroTaps = 0; }
    heroTimer = setTimeout(() => { heroTaps = 0; }, 800);
  }
  hero.addEventListener('click', event => { if (!event.target.closest('a, button, input')) tapHero(); });
  const name = hero.querySelector('h1 span');
  name.setAttribute('role', 'button'); name.tabIndex = 0;
  name.setAttribute('aria-label', 'Dimitris: explore a hidden interaction');
  name.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key) && !event.repeat) { event.preventDefault(); tapHero(); } });

  let heldCard = null, holdTimer, ignoreClick = null, skills = new Set(), skillsTimer, javaCount = 0, javaTimer;
  function cancelHold() { clearTimeout(holdTimer); heldCard = null; }
  function startHold(card) {
    cancelHold(); heldCard = card;
    holdTimer = setTimeout(() => {
      if (heldCard !== card) return;
      document.body.classList.toggle('monochrome-mode');
      ignoreClick = card; unlock('mono');
    }, 2000);
  }
  function activateSkill(card) {
    if (ignoreClick === card) { ignoreClick = null; return; }
    const label = card.querySelector('span')?.textContent.trim();
    if (!label) return;
    skills.add(label); clearTimeout(skillsTimer);
    if (skills.size >= 3) { unlock('tap3skills'); skills.clear(); }
    skillsTimer = setTimeout(() => skills.clear(), 1500);
    if (label === 'Java') {
      clearTimeout(javaTimer);
      if (++javaCount >= 5) { unlock('wizard'); javaCount = 0; }
      javaTimer = setTimeout(() => { javaCount = 0; }, 4000);
    }
  }
  document.querySelectorAll('.skill-card').forEach(card => {
    const label = card.querySelector('span')?.textContent.trim();
    card.setAttribute('role', 'button'); card.setAttribute('aria-label', `${label} skill`);
    card.addEventListener('pointerdown', event => { if (event.button === 0) startHold(card); });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) card.addEventListener(type, cancelHold);
    card.addEventListener('click', () => activateSkill(card));
    card.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key) || event.repeat) return;
      event.preventDefault();
      if (event.key === 'Enter') activateSkill(card); else startHold(card);
    });
    card.addEventListener('keyup', event => { if (event.key === ' ') { event.preventDefault(); cancelHold(); activateSkill(card); } });
  });
  window.addEventListener('blur', cancelHold);

  let lastInput = 0, previousY = scrollY, burstStart = 0, travelled = 0, previousDirection = 0, reversals = 0, reversalTimer;
  const markScrollInput = () => { lastInput = performance.now(); };
  window.addEventListener('wheel', markScrollInput, { passive: true });
  window.addEventListener('touchmove', markScrollInput, { passive: true });
  window.addEventListener('scroll', () => {
    const now = performance.now(), delta = scrollY - previousY; previousY = scrollY;
    if (now - lastInput > 250 || Math.abs(delta) < 12) return;
    if (now - burstStart > 650) { burstStart = now; travelled = 0; }
    travelled += Math.abs(delta);
    if (travelled > 900) unlock('rocket');
    const direction = Math.sign(delta);
    if (previousDirection && direction !== previousDirection && ++reversals >= 10) { unlock('scrollflip'); reversals = 0; }
    previousDirection = direction;
    clearTimeout(reversalTimer);
    reversalTimer = setTimeout(() => { reversals = 0; previousDirection = 0; }, 2500);
  }, { passive: true });
  updateJournal();
}
