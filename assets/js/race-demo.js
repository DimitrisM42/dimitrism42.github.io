/* A local telemetry illustration. No game connection, recording, audio, or network. */
export function createRaceDemo() {
  const element = document.createElement('div');
  element.className = 'rc-demo'; element.hidden = true; element.tabIndex = 0;
  element.dataset.view = 'dashboard';
  element.setAttribute('role', 'region'); element.setAttribute('aria-label', 'Interactive RaceConsole demo');
  element.innerHTML = `
    <div class="rc-demo-heading"><div><span class="rc-wordmark">RACE<span>CONSOLE</span></span><span class="rc-demo-badge">INTERACTIVE DEMO</span></div><button type="button" class="rc-reset">Reset <span aria-hidden="true">↺</span></button></div>
    <div class="rc-view-switch" role="group" aria-label="Telemetry view"><button type="button" data-view="dashboard" aria-pressed="true">Dashboard</button><button type="button" data-view="tyres" aria-pressed="false">Tyres</button><button type="button" data-view="timing" aria-pressed="false">Timing</button><span>SIMULATED TELEMETRY</span></div>
    <div class="rc-instruments" aria-live="off">
      <div class="rc-driving rc-panel">
        <div class="rc-panel-title">DRIVING STATE <span>YOUR INPUTS</span></div>
        <div class="rc-rpm-head"><span>RPM</span><span data-readout="rpm">1,200</span></div>
        <div class="rc-shift-lights" aria-hidden="true">${Array.from({ length: 20 }, (_, index) => `<i style="--led:${index < 8 ? '#34d889' : index < 14 ? '#00d9da' : '#ca77ff'}"></i>`).join('')}</div>
        <div class="rc-main-values">
          <div class="rc-input-meter"><span>BRAKE</span><strong data-readout="brake">0%</strong><div class="rc-meter-track"><i class="rc-brake-fill"></i></div></div>
          <div class="rc-speed-gear"><span class="rc-label">GEAR</span><strong data-readout="gear" class="rc-gear">N</strong><div class="rc-speed-line"><strong data-readout="speed" class="rc-speed">0</strong><span>KM/H</span></div></div>
          <div class="rc-input-meter"><span>THROTTLE</span><strong data-readout="throttle">0%</strong><div class="rc-meter-track"><i class="rc-throttle-fill"></i></div></div>
        </div>
        <div class="rc-steering-meter"><span>STEERING</span><strong data-readout="angle">0°</strong><div><i></i></div><span class="rc-steering-zero">CENTRE</span></div>
      </div>
      <div class="rc-secondary rc-panel">
        <div class="rc-view" data-panel="dashboard"><div class="rc-panel-title">INPUT TRACE <span>LAST FEW SECONDS</span></div>
          <div class="rc-trace-label"><span>SPEED</span><span>315 KM/H</span></div><svg class="rc-trace" viewBox="0 0 300 120" preserveAspectRatio="none" aria-label="Recent simulated speed"><path d="M0 30H300M0 60H300M0 90H300"/><polyline points="0,115 300,115"/></svg>
          <div class="rc-info-row"><span>SHIFT MODE</span><strong>AUTO</strong></div><div class="rc-info-row"><span>STEERING INPUT</span><strong data-readout="direction">CENTRED</strong></div><p class="rc-panel-note">A few inputs. A dashboard full of answers.</p>
        </div>
        <div class="rc-view" data-panel="tyres" hidden><div class="rc-panel-title">TYRE TEMPERATURE <span>°C · DEMO</span></div>
          <div class="rc-tyres">${['FRONT LEFT', 'FRONT RIGHT', 'REAR LEFT', 'REAR RIGHT'].map((label, index) => `<div class="rc-tyre rc-tyre-${index}"><span>${label}</span><strong data-temp="${index}">76°C</strong></div>`).join('')}
          <svg class="rc-car" viewBox="0 0 100 220" aria-hidden="true"><path d="M41 18H59L64 72L73 109L70 177H30L27 109L36 72Z"/><path d="M19 28H81V38H19ZM19 185H81V198H19Z"/><rect class="rc-front-wheel" x="14" y="51" width="15" height="34" rx="3"/><rect class="rc-front-wheel" x="71" y="51" width="15" height="34" rx="3"/><rect x="12" y="151" width="18" height="38" rx="3"/><rect x="70" y="151" width="18" height="38" rx="3"/><ellipse cx="50" cy="121" rx="10" ry="18"/></svg></div>
          <p class="rc-panel-note">Build speed. Brake. Turn. Watch the temperatures respond.</p>
        </div>
        <div class="rc-view" data-panel="timing" hidden><div class="rc-panel-title">SESSION TIMING <span>SIMULATED</span></div>
          <div class="rc-lap-clock"><span>CURRENT LAP</span><strong data-readout="lapTime">0:00.000</strong></div>
          <div class="rc-info-row"><span>LAP</span><strong data-readout="lap">1</strong></div><div class="rc-info-row"><span>BEST</span><strong data-readout="best">—</strong></div><div class="rc-lap-progress"><i></i></div>
          <p class="rc-panel-note">The clock starts when you move. Your best lap stays until reset.</p>
        </div>
      </div>
    </div>
    <div class="rc-controls">
      <div class="rc-wheel-group"><div class="rc-wheel-control" role="slider" tabindex="0" aria-label="Steering wheel" aria-valuemin="-90" aria-valuemax="90" aria-valuenow="0" aria-valuetext="Centred" aria-orientation="horizontal" aria-describedby="rc-wheel-help">
        <svg class="rc-wheel" viewBox="0 0 220 150" aria-hidden="true"><path class="rc-wheel-rim" d="M45 27Q20 29 20 54L24 110Q25 130 48 130H66L77 106H143L154 130H172Q195 130 196 110L200 54Q200 29 175 27L153 43H67Z"/><path class="rc-wheel-centre" d="M67 43H153L166 95L144 108H76L54 95Z"/><rect class="rc-wheel-screen" x="87" y="57" width="46" height="28" rx="4"/><text x="110" y="76" text-anchor="middle">RC</text><path class="rc-wheel-stripe" d="M106 39H114V50H106Z"/><circle cx="68" cy="68" r="5"/><circle cx="151" cy="68" r="5"/><circle cx="74" cy="89" r="4"/><circle cx="146" cy="89" r="4"/></svg>
      </div><span id="rc-wheel-help">Drag to steer · A/D or ← →</span></div>
      <div class="rc-pedals"><button type="button" class="rc-pedal rc-brake" data-pedal="brake" aria-pressed="false"><span class="rc-pedal-grooves" aria-hidden="true"></span><strong>Brake</strong><span>S / ↓ · HOLD</span></button><button type="button" class="rc-pedal rc-accelerate" data-pedal="throttle" aria-pressed="false"><span class="rc-pedal-grooves" aria-hidden="true"></span><strong>Accelerate</strong><span>W / ↑ · HOLD</span></button></div>
    </div>
    `;

  const readouts = Object.fromEntries([...element.querySelectorAll('[data-readout]')].map(node => [node.dataset.readout, node]));
  const lights = [...element.querySelectorAll('.rc-shift-lights i')];
  const wheelControl = element.querySelector('.rc-wheel-control');
  const wheel = element.querySelector('.rc-wheel');
  const frontWheels = [...element.querySelectorAll('.rc-front-wheel')];
  const throttleFill = element.querySelector('.rc-throttle-fill');
  const brakeFill = element.querySelector('.rc-brake-fill');
  const steeringMarker = element.querySelector('.rc-steering-meter i');
  const trace = element.querySelector('.rc-trace polyline');
  const temperatures = [...element.querySelectorAll('[data-temp]')];
  const pedals = [...element.querySelectorAll('[data-pedal]')];
  const lapProgress = element.querySelector('.rc-lap-progress i');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const keys = new Set();
  const heldKeyCodes = new Map();
  const pointers = new Map();
  const latched = { throttle: false, brake: false };
  let active = false, inView = true, frame = 0, previous = 0, lastPaint = 0;
  let wheelPointer = null, dragSteering = 0, historyTime = 0;
  let state;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function formatTime(value) {
    const ms = Math.round(value * 1000);
    return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
  }
  function text(name, value) { if (readouts[name].textContent !== value) readouts[name].textContent = value; }
  function getInputs() {
    const values = [...pointers.values()];
    return {
      throttle: latched.throttle || values.includes('throttle') || keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0,
      brake: latched.brake || values.includes('brake') || keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0,
      steering: wheelPointer !== null ? dragSteering : Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'))
    };
  }
  function draw() {
    const bounds = [0, 40, 75, 115, 155, 200, 245, 285, 315];
    const gear = state.speed < 1 ? 0 : Math.min(8, bounds.filter(bound => state.speed >= bound).length);
    const rpm = gear ? 3500 + clamp((state.speed - bounds[gear - 1]) / (bounds[gear] - bounds[gear - 1]), 0, 1) * 9500 : 1200 + state.throttle * 1200;
    text('speed', String(Math.round(state.speed)));
    text('gear', gear ? String(gear) : 'N'); text('rpm', Math.round(rpm).toLocaleString('en-US'));
    text('throttle', `${Math.round(state.throttle * 100)}%`); text('brake', `${Math.round(state.brake * 100)}%`);
    const angle = Math.round(state.steering * 90);
    text('angle', `${angle > 0 ? '+' : ''}${angle}°`);
    text('direction', Math.abs(angle) < 1 ? 'CENTRED' : `${Math.abs(angle)}° ${angle < 0 ? 'LEFT' : 'RIGHT'}`);
    wheelControl.setAttribute('aria-valuenow', String(angle));
    wheelControl.setAttribute('aria-valuetext', angle === 0 ? 'Centred' : `${Math.abs(angle)} degrees ${angle < 0 ? 'left' : 'right'}`);
    wheel.style.transform = `rotate(${angle}deg)`;
    frontWheels.forEach(tyre => tyre.style.transform = `rotate(${state.steering * 25}deg)`);
    steeringMarker.style.left = `${50 + state.steering * 47}%`;
    throttleFill.style.transform = `scaleY(${state.throttle})`; brakeFill.style.transform = `scaleY(${state.brake})`;
    lights.forEach((light, index) => light.classList.toggle('is-lit', index < Math.round(rpm / 13000 * 20)));
    pedals.forEach(pedal => pedal.setAttribute('aria-pressed', String(getInputs()[pedal.dataset.pedal] === 1)));
    temperatures.forEach((node, index) => {
      const side = index % 2 === 0 ? 1 : -1;
      node.textContent = `${Math.round(76 + state.speed * .065 + state.brake * 12 + Math.abs(state.steering) * 4 + side * state.steering * 3)}°C`;
    });
    text('lapTime', formatTime(state.lapTime)); text('lap', String(state.lap)); text('best', state.best ? formatTime(state.best) : '—');
    lapProgress.style.transform = `scaleX(${state.distance / 1400})`;
    trace.setAttribute('points', state.history.map((speed, index) => `${index * 300 / 39},${115 - speed / 315 * 105}`).join(' '));
  }
  function tick(now) {
    frame = 0;
    if (!active || !inView || document.hidden) return;
    const dt = previous ? Math.min((now - previous) / 1000, .05) : .016;
    previous = now;
    const inputs = getInputs();
    const ease = 1 - Math.exp(-dt * 11);
    for (const key of ['throttle', 'brake', 'steering']) {
      state[key] += (inputs[key] - state[key]) * ease;
      if (Math.abs(state[key] - inputs[key]) < .001) state[key] = inputs[key];
    }
    const acceleration = state.throttle * (50 - state.speed * .08) - state.brake * (72 + state.speed * .06) - (1 - state.throttle) * (4 + state.speed * .025);
    state.speed = clamp(state.speed + acceleration * dt, 0, 315);
    if (state.speed > .05) state.started = true;
    if (state.started) state.lapTime += dt;
    if (state.speed > .05) {
      state.distance += state.speed / 3.6 * dt;
      if (state.distance >= 1400) {
        state.distance -= 1400;
        state.best = state.best ? Math.min(state.best, state.lapTime) : state.lapTime;
        state.lapTime = 0; state.lap += 1;
      }
    } else state.speed = 0;
    historyTime += dt;
    if (historyTime >= .2) { state.history.push(state.speed); state.history.shift(); historyTime = 0; }
    if (!reduced.matches || now - lastPaint > 100) { draw(); lastPaint = now; }
    if (state.started || state.speed || state.throttle || state.brake || state.steering || inputs.throttle || inputs.brake || inputs.steering) frame = requestAnimationFrame(tick);
    else { draw(); previous = 0; }
  }
  function wake() {
    if (active && inView && !document.hidden && !frame) { previous = 0; frame = requestAnimationFrame(tick); }
  }
  function release() {
    keys.clear(); heldKeyCodes.clear(); pointers.clear(); latched.throttle = latched.brake = false;
    if (wheelPointer !== null && wheelControl.hasPointerCapture(wheelPointer)) wheelControl.releasePointerCapture(wheelPointer);
    wheelPointer = null; dragSteering = 0;
    if (state) { draw(); wake(); }
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    release(); cancelAnimationFrame(frame); frame = 0;
    state = { speed: 0, throttle: 0, brake: 0, steering: 0, started: false, lap: 1, lapTime: 0, distance: 0, best: 0, history: Array(40).fill(0) };
    previous = lastPaint = historyTime = 0;
    draw();
  }
  pedals.forEach(pedal => {
    pedal.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault(); pedal.focus({ preventScroll: true });
      pedal.setPointerCapture(event.pointerId); pointers.set(event.pointerId, pedal.dataset.pedal);
      draw(); wake();
    });
    const end = event => { pointers.delete(event.pointerId); draw(); wake(); };
    pedal.addEventListener('pointerup', end); pedal.addEventListener('pointercancel', end); pedal.addEventListener('lostpointercapture', end);
    // Assistive technology can activate a pedal as a toggle rather than hold it.
    pedal.addEventListener('click', event => {
      if (event.detail !== 0) return;
      const name = pedal.dataset.pedal; latched[name] = !latched[name];
      draw(); wake();
    });
  });
  wheelControl.addEventListener('pointerdown', event => {
    if (event.button !== 0 || wheelPointer !== null) return;
    event.preventDefault(); wheelControl.focus({ preventScroll: true });
    wheelPointer = event.pointerId; wheelControl.setPointerCapture(event.pointerId);
    steer(event);
  });
  function steer(event) {
    if (event.pointerId !== wheelPointer) return;
    const bounds = wheelControl.getBoundingClientRect();
    dragSteering = clamp((event.clientX - bounds.left - bounds.width / 2) / (bounds.width * .42), -1, 1); wake();
  }
  wheelControl.addEventListener('pointermove', steer);
  const endSteering = event => { if (event.pointerId === wheelPointer) { wheelPointer = null; dragSteering = 0; wake(); } };
  wheelControl.addEventListener('pointerup', endSteering); wheelControl.addEventListener('pointercancel', endSteering); wheelControl.addEventListener('lostpointercapture', endSteering);
  function keyCode(event) {
    if (['Space', 'Enter'].includes(event.code)) {
      const pedal = event.target.closest('[data-pedal]');
      if (pedal) return pedal.dataset.pedal === 'throttle' ? 'KeyW' : 'KeyS';
    }
    return ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code) ? event.code : null;
  }
  element.addEventListener('keydown', event => {
    if (!active || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.code === 'Home' && event.target === wheelControl) { event.preventDefault(); release(); return; }
    const code = keyCode(event); if (!code) return;
    event.preventDefault(); event.stopPropagation(); heldKeyCodes.set(event.code, code); keys.add(code); draw(); wake();
  });
  window.addEventListener('keyup', event => {
    const code = heldKeyCodes.get(event.code);
    if (!code) return;
    heldKeyCodes.delete(event.code);
    if (![...heldKeyCodes.values()].includes(code)) keys.delete(code);
    if (element.contains(event.target)) event.preventDefault();
    draw(); wake();
  });
  element.addEventListener('focusout', event => { if (!element.contains(event.relatedTarget)) release(); });
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { release(); cancelAnimationFrame(frame); frame = 0; previous = 0; }
    else wake();
  });
  element.querySelector('.rc-reset').addEventListener('click', reset);
  element.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    element.dataset.view = button.dataset.view;
    element.querySelectorAll('[data-view]').forEach(other => other.setAttribute('aria-pressed', String(button === other)));
    element.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== button.dataset.view);
  }));
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) { release(); cancelAnimationFrame(frame); frame = 0; previous = 0; }
    else wake();
  });
  observer.observe(element);
  reset();
  return {
    element,
    reset,
    activate() { active = true; element.hidden = false; wake(); },
    deactivate() { active = false; cancelAnimationFrame(frame); frame = 0; previous = 0; release(); element.hidden = true; }
  };
}
