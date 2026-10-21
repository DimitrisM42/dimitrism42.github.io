/* Local sample data. Workflow reviewed against the project's PHP controllers:
 * add_appointment.php, assigned_appointments.php, manage_appointments.php,
 * manage_jobs.php, my_appointments.php, and functions.php (2026-10-21).
 * No authentication, requests, storage, or connection to the real application.
 */
const vehicles = [
  { id: 'bmw', name: 'BMW 320', serial: 'DEMO-BMW-001', color: '#63b7ef' },
  { id: 'golf', name: 'VW Golf', serial: 'DEMO-VW-002', color: '#a7b7ca' }
];
const mechanics = ['Alex', 'Niki'];
const hour = 3600000;
const euro = cents => `€${(cents / 100).toFixed(2)}`;
const statusNames = { CREATED: 'Created', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
function car() {
  return `<svg viewBox="0 0 280 115" aria-hidden="true"><path class="garage-car-body" d="M24 66L45 54L72 25Q78 19 90 19H169Q179 19 188 29L211 53L248 62Q258 65 260 78V88H21V76Z"/><path class="garage-car-glass" d="M79 29H112V52H57ZM122 29H166L190 52H122Z"/><path d="M25 73H257M118 59H132"/><circle class="garage-car-wheel" cx="69" cy="87" r="20"/><circle class="garage-car-wheel" cx="217" cy="87" r="20"/><circle class="garage-car-hub" cx="69" cy="87" r="9"/><circle class="garage-car-hub" cx="217" cy="87" r="9"/><path class="garage-car-light" d="M244 65H257V75H244Z"/></svg>`;
}
function today() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
// UTC stores calendar values for the simulated clock, independent of DST changes.
const timestamp = (date, time) => Date.parse(`${date}T${time}:00Z`);
const dateLabel = date => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(new Date(date));
const timeLabel = date => new Date(date).toISOString().slice(11, 16);

export function createGarageDemo() {
  const element = document.createElement('div'); element.className = 'garage-demo'; element.hidden = true;
  element.setAttribute('role', 'region'); element.setAttribute('aria-label', 'AutoService interactive appointment demo');
  element.innerHTML = `<div class="garage-heading"><div><i class="fa-solid fa-wrench" aria-hidden="true"></i><strong>AUTOSERVICE<span>GARAGE</span></strong></div><span class="garage-demo-tag">INTERACTIVE DEMO</span><button type="button" class="garage-reset">Reset ↺</button></div>
    <div class="garage-intro"><div><span>ONE APPOINTMENT. EVERY PERSPECTIVE.</span><h3>From booking to service.</h3><p>Your car, the front desk, and the work behind the scenes.</p></div></div>
    <div class="garage-roles" role="group" aria-label="Preview as"><button type="button" data-role="customer" aria-pressed="true"><i class="fa-regular fa-user" aria-hidden="true"></i> Customer</button><button type="button" data-role="secretary" aria-pressed="false"><i class="fa-regular fa-calendar-check" aria-hidden="true"></i> Secretary</button><button type="button" data-role="mechanic" aria-pressed="false"><i class="fa-solid fa-wrench" aria-hidden="true"></i> Mechanic</button></div>
    <div class="garage-preview-clock"><span><i class="fa-regular fa-clock" aria-hidden="true"></i> PREVIEW CLOCK <strong class="garage-clock-value"></strong></span><div><button type="button" class="garage-clock-jump" hidden>Jump to appointment →</button><button type="button" class="garage-clock-advance" hidden>+2 hours</button></div></div>
    <div class="garage-workspace"><div class="garage-role-content">
      <div data-role-panel="customer"><form class="garage-booking-form"><div class="garage-pane-heading"><span>CUSTOMER / NEW APPOINTMENT</span><h4>Book a visit.</h4></div>
        <label>Registered vehicle<select class="garage-vehicle" required>${vehicles.map(vehicle => `<option value="${vehicle.id}">${vehicle.name}</option>`).join('')}</select></label>
        <div class="garage-form-row"><label>Date<input type="date" class="garage-date" required></label><label>Time<select class="garage-time" required>${Array.from({ length: 7 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`).map(time => `<option value="${time}">${time}</option>`).join('')}</select></label></div>
        <label>Reason<select class="garage-reason"><option value="repair">Repair</option><option value="service">Service</option></select></label>
        <label class="garage-problem-label">Problem description <span>(optional)</span><textarea class="garage-problem" rows="2" maxlength="180" placeholder="For example, a rattle when braking…"></textarea></label>
        <p class="garage-booking-error" role="alert" hidden></p><button type="submit" class="garage-primary garage-book">Book demo appointment →</button>
        <p class="garage-form-note">An available mechanic is assigned automatically to a two-hour appointment window.</p></form>
        <div class="garage-customer-booked" hidden><div class="garage-pane-heading"><span>CUSTOMER / MY APPOINTMENTS</span><h4>Your appointment.</h4></div><p class="garage-customer-message"></p><div class="garage-appointment-row"><span class="garage-appointment-date"></span><strong class="garage-appointment-car"></strong><span class="garage-status-badge"></span></div><div class="garage-customer-actions"><button type="button" class="garage-secondary garage-cancel">Cancel appointment</button><button type="button" class="garage-primary" data-go-role="secretary">Open secretary view →</button></div></div>
      </div>
      <div data-role-panel="secretary" hidden><div class="garage-pane-heading"><span>SECRETARY / APPOINTMENTS</span><h4>At the front desk.</h4></div><p class="garage-secretary-message"></p><div class="garage-reception-actions"><button type="button" class="garage-primary" data-arrival="yes">Arrived ✓</button><button type="button" class="garage-secondary" data-arrival="no">Not arrived</button></div><button type="button" class="garage-secondary garage-secretary-cancel">Cancel appointment</button><button type="button" class="garage-primary garage-open-mechanic" data-go-role="mechanic">Open mechanic view →</button></div>
      <div data-role-panel="mechanic" hidden><div class="garage-pane-heading"><span>MECHANIC / ASSIGNED APPOINTMENT</span><h4>Record the work.</h4></div><p class="garage-mechanic-message"></p><div class="garage-mechanic-arrival"><button type="button" class="garage-primary" data-arrival="yes">Arrived ✓</button><button type="button" class="garage-secondary" data-arrival="no">Not arrived</button></div>
        <form class="garage-job-form" hidden><div class="garage-presets" role="group" aria-label="Fill sample job"><span>Try a sample:</span><button type="button" data-preset="oil">Oil & filter</button><button type="button" data-preset="brakes">Brake inspection</button></div>
          <label>Description<input class="garage-job-description" required maxlength="100" placeholder="Work carried out"></label><label>Materials<input class="garage-job-materials" required maxlength="100" placeholder="Parts and materials used"></label>
          <div class="garage-job-numbers"><label>Hours<input class="garage-job-hours" type="number" min="0" max="99" step="1" value="0" required></label><label>Minutes<input class="garage-job-minutes" type="number" min="0" max="59" step="1" value="45" required></label><label>Cost (€)<input class="garage-job-cost" type="number" min="0" max="99999.99" step="0.01" value="65.00" required></label></div>
          <p class="garage-job-error" role="alert" hidden></p><div class="garage-job-form-actions"><button type="submit" class="garage-primary garage-save-job">Add job →</button><button type="button" class="garage-secondary garage-cancel-edit" hidden>Cancel edit</button><span class="garage-inline-total">Total <strong>€0.00</strong></span></div>
        </form>
      </div>
    </div><aside class="garage-booking-summary" aria-label="Appointment summary"><div class="garage-summary-top"><span class="garage-summary-kicker">YOUR REGISTERED VEHICLE</span><span class="garage-summary-status"></span></div><div class="garage-lift" aria-hidden="true"><div class="garage-lift-post"></div><div class="garage-lift-car">${car()}</div><div class="garage-lift-platform"></div><div class="garage-lift-floor"></div></div><h4 class="garage-summary-car"></h4><span class="garage-summary-serial"></span><dl><div><dt>Appointment</dt><dd class="garage-summary-date"></dd></div><div><dt>Reason</dt><dd class="garage-summary-reason"></dd></div><div><dt>Mechanic</dt><dd class="garage-summary-mechanic"></dd></div></dl><div class="garage-summary-cost"><span>Recorded job total</span><strong>€0.00</strong></div><p class="garage-summary-note">Choose your vehicle and book a time.</p></aside></div>
    <div class="garage-records" hidden><div class="garage-records-heading"><h4>Recorded work</h4><span>Materials · duration · cost</span></div><div class="garage-record-list"></div></div>
    <div class="garage-footer"><span>Sample vehicles, appointments & costs</span><span>Preview clock controls only this demo.</span></div><span class="project-demo-sr" role="status"></span>`;
  const find = selector => element.querySelector(selector);
  const reportedProblem = document.createElement('p'); reportedProblem.className = 'garage-reported-problem';
  find('.garage-booking-summary dl').after(reportedProblem);
  const bookingForm = find('.garage-booking-form'), jobForm = find('.garage-job-form');
  const vehicleField = find('.garage-vehicle'), dateField = find('.garage-date'), timeField = find('.garage-time'), reasonField = find('.garage-reason');
  const jobFields = { description: find('.garage-job-description'), materials: find('.garage-job-materials'), hours: find('.garage-job-hours'), minutes: find('.garage-job-minutes'), cost: find('.garage-job-cost') };
  const live = find('[role=status]'), reduced = matchMedia('(prefers-reduced-motion: reduce)'), tweens = new Set();
  let role = 'customer', appointment = null, clock = 0, sampleDay = '', busy = [], editId = null, nextJob = 1;
  function flash(node) {
    if (!window.gsap || reduced.matches || element.hidden) return;
    const tween = window.gsap.fromTo(node, { opacity: .35, y: 7 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out', clearProps: 'opacity,transform', onComplete: () => tweens.delete(tween) });
    tweens.add(tween);
  }
  function getVehicle() { return vehicles.find(vehicle => vehicle.id === (appointment?.vehicle || vehicleField.value)); }
  function total() { return (appointment?.jobs || []).reduce((sum, job) => sum + job.cents, 0); }
  function arrivalAvailable() { return appointment?.status === 'CREATED' && clock >= appointment.start && clock <= appointment.start + 2 * hour; }
  function updateTimeStatuses() {
    if (!appointment) return;
    if (appointment.status === 'IN_PROGRESS' && clock >= appointment.start + 2 * hour) appointment.status = 'COMPLETED';
    else if (appointment.status === 'CREATED' && clock > appointment.start + 2 * hour) appointment.status = 'CANCELLED';
  }
  function clearJobForm() {
    editId = null; jobForm.reset(); jobFields.description.value = ''; jobFields.materials.value = '';
    find('.garage-save-job').textContent = 'Add job →'; find('.garage-cancel-edit').hidden = true; find('.garage-job-error').hidden = true;
  }
  function renderRecords() {
    const list = find('.garage-record-list'); list.replaceChildren();
    find('.garage-records').hidden = !appointment?.jobs.length;
    for (const job of appointment?.jobs || []) {
      const row = document.createElement('div'); row.className = 'garage-record'; row.dataset.job = job.id;
      const copy = document.createElement('div'), description = document.createElement('strong'), materials = document.createElement('span');
      description.textContent = job.description; materials.textContent = job.materials; copy.append(description, materials);
      const duration = document.createElement('span'); duration.className = 'garage-record-duration'; duration.textContent = `${String(job.hours).padStart(2, '0')}:${String(job.minutes).padStart(2, '0')}`;
      const cost = document.createElement('strong'); cost.className = 'garage-record-cost'; cost.textContent = euro(job.cents);
      row.append(copy, duration, cost);
      if (role === 'mechanic' && appointment.status === 'IN_PROGRESS') {
        const actions = document.createElement('div'); actions.className = 'garage-record-actions';
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Edit ${job.description}`);
        edit.addEventListener('click', () => {
          editId = job.id;
          for (const key of ['description', 'materials', 'hours', 'minutes']) jobFields[key].value = job[key];
          jobFields.cost.value = (job.cents / 100).toFixed(2);
          find('.garage-save-job').textContent = 'Save changes'; find('.garage-cancel-edit').hidden = false; jobFields.description.focus();
        });
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete'; remove.setAttribute('aria-label', `Delete ${job.description}`);
        remove.addEventListener('click', () => {
          appointment.jobs = appointment.jobs.filter(item => item.id !== job.id);
          if (editId === job.id) clearJobForm();
          render(); live.textContent = `Job deleted. Appointment total ${euro(total())}.`; find('.garage-save-job').focus({ preventScroll: true });
        });
        actions.append(edit, remove); row.append(actions);
      }
      list.append(row);
    }
  }
  function render() {
    updateTimeStatuses();
    element.dataset.status = appointment?.status || 'UNBOOKED'; element.dataset.role = role;
    element.querySelectorAll('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
    element.querySelectorAll('[data-role-panel]').forEach(panel => panel.hidden = panel.dataset.rolePanel !== role);
    const status = appointment?.status, vehicle = getVehicle(); element.style.setProperty('--garage-car', vehicle.color);
    find('.garage-clock-value').textContent = `${dateLabel(clock)} · ${timeLabel(clock)}`;
    find('.garage-clock-jump').hidden = !appointment || clock >= appointment.start || status !== 'CREATED';
    find('.garage-clock-advance').hidden = !appointment || ['COMPLETED', 'CANCELLED'].includes(status);
    bookingForm.hidden = Boolean(appointment); find('.garage-customer-booked').hidden = !appointment;
    find('.garage-summary-car').textContent = vehicle.name; find('.garage-summary-serial').textContent = vehicle.serial;
    find('.garage-summary-status').textContent = status ? statusNames[status] : 'Not booked';
    const previewStart = appointment?.start ?? timestamp(dateField.value, timeField.value);
    find('.garage-summary-date').textContent = Number.isFinite(previewStart) ? `${dateLabel(previewStart)} · ${timeLabel(previewStart)}` : 'Choose a date and time';
    find('.garage-summary-reason').textContent = (appointment?.reason || reasonField.value) === 'repair' ? 'Repair' : 'Service';
    find('.garage-summary-mechanic').textContent = appointment ? mechanics[appointment.mechanic] : 'Assigned on booking';
    find('.garage-summary-cost strong').textContent = euro(total());
    find('.garage-inline-total strong').textContent = euro(total());
    reportedProblem.hidden = !appointment?.problem;
    reportedProblem.textContent = appointment?.problem ? `Reported issue: ${appointment.problem}` : '';
    const notes = { CREATED: 'Created. Your mechanic has been assigned.', IN_PROGRESS: 'Arrival recorded. Work entries update the appointment total.', COMPLETED: 'Completed automatically at the end of the two-hour appointment window.', CANCELLED: 'Appointment cancelled. Reset to try another booking.' };
    find('.garage-summary-note').textContent = notes[status] || 'Choose a registered vehicle and book a time.';
    if (appointment) {
      find('.garage-customer-message').textContent = status === 'CREATED' ? `Appointment created. ${mechanics[appointment.mechanic]} was assigned automatically.` : notes[status];
      find('.garage-appointment-date').textContent = `${dateLabel(appointment.start)} · ${timeLabel(appointment.start)}`;
      find('.garage-appointment-car').textContent = vehicle.name; find('.garage-status-badge').textContent = statusNames[status];
    }
    find('.garage-cancel').hidden = status !== 'CREATED'; find('.garage-secretary-cancel').hidden = status !== 'CREATED';
    const arrival = arrivalAvailable();
    find('.garage-reception-actions').hidden = !arrival; find('.garage-mechanic-arrival').hidden = !arrival;
    find('.garage-open-mechanic').hidden = status !== 'IN_PROGRESS';
    find('.garage-secretary-message').textContent = !appointment ? 'No appointment in this preview yet. Book one in the Customer view.' : status === 'CREATED' ? arrival ? 'The appointment window is open. Record whether the customer has arrived.' : 'This appointment is upcoming. Jump the preview clock to its booked time to record arrival.' : notes[status];
    find('.garage-mechanic-message').textContent = !appointment ? 'No assigned appointment yet. Book one in the Customer view.' : status === 'CREATED' ? `Assigned to ${mechanics[appointment.mechanic]}. ${arrival ? 'Record arrival before adding work.' : 'The appointment window has not started yet.'}` : status === 'IN_PROGRESS' ? 'Add the work carried out, materials, duration, and cost. The appointment total is calculated from these entries.' : notes[status];
    jobForm.hidden = status !== 'IN_PROGRESS'; find('.garage-problem-label').hidden = reasonField.value !== 'repair'; renderRecords();
  }
  function setRole(next) { role = next; render(); flash(find(`[data-role-panel="${role}"]`)); }
  element.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));
  element.querySelectorAll('[data-go-role]').forEach(button => button.addEventListener('click', () => { setRole(button.dataset.goRole); find(`[data-role="${role}"]`).focus({ preventScroll: true }); }));
  for (const field of [vehicleField, dateField, timeField, reasonField]) field.addEventListener('change', () => { find('.garage-booking-error').hidden = true; if (dateField.value) render(); });
  bookingForm.addEventListener('submit', event => {
    event.preventDefault(); if (appointment || !bookingForm.reportValidity()) return;
    const start = timestamp(dateField.value, timeField.value), error = find('.garage-booking-error');
    if (!Number.isFinite(start) || start <= clock) { error.textContent = 'Choose a date and time after the preview clock.'; error.hidden = false; return; }
    // Mirror the two-hour availability query, including its inclusive start boundary.
    const available = mechanics.map((_, index) => index).filter(index => !busy.some(slot => slot.mechanic === index && ((slot.start >= start && slot.start <= start + 2 * hour) || (slot.start + 119 * 60000 >= start && slot.start + 119 * 60000 <= start + 2 * hour))));
    if (!available.length) { error.textContent = 'No available mechanics in this two-hour window. Please choose another time.'; error.hidden = false; return; }
    appointment = { vehicle: vehicleField.value, start, reason: reasonField.value, problem: reasonField.value === 'repair' ? find('.garage-problem').value.trim() : '', mechanic: available[Math.floor(Math.random() * available.length)], status: 'CREATED', jobs: [] };
    error.hidden = true; render(); live.textContent = `Demo appointment created. Mechanic ${mechanics[appointment.mechanic]} assigned automatically.`;
    find('.garage-customer-actions [data-go-role]').focus({ preventScroll: true }); flash(find('.garage-customer-booked'));
  });
  const cancel = () => { if (appointment?.status !== 'CREATED') return; appointment.status = 'CANCELLED'; render(); live.textContent = 'Demo appointment cancelled.'; find(`[data-role="${role}"]`).focus({ preventScroll: true }); };
  find('.garage-cancel').addEventListener('click', cancel); find('.garage-secretary-cancel').addEventListener('click', cancel);
  element.querySelectorAll('[data-arrival]').forEach(button => button.addEventListener('click', () => {
    if (!arrivalAvailable() || !['secretary', 'mechanic'].includes(role)) return;
    appointment.status = button.dataset.arrival === 'yes' ? 'IN_PROGRESS' : 'CANCELLED'; render();
    live.textContent = appointment.status === 'IN_PROGRESS' ? 'Arrival recorded. Appointment in progress.' : 'No arrival recorded. Appointment cancelled.';
    (role === 'secretary' && appointment.status === 'IN_PROGRESS' ? find('.garage-open-mechanic') : find(`[data-role="${role}"]`)).focus({ preventScroll: true });
  }));
  find('.garage-clock-jump').addEventListener('click', () => { if (!appointment) return; clock = Math.max(clock, appointment.start); render(); live.textContent = 'Preview clock moved to the appointment time.'; find('.garage-clock-advance').focus({ preventScroll: true }); });
  find('.garage-clock-advance').addEventListener('click', () => {
    clock += 2 * hour; render(); live.textContent = `Preview clock advanced two hours. ${appointment ? statusNames[appointment.status] : ''}`;
    if (find('.garage-clock-advance').hidden) find(`[data-role="${role}"]`).focus({ preventScroll: true });
  });
  element.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    const oil = button.dataset.preset === 'oil';
    jobFields.description.value = oil ? 'Oil and filter replacement' : 'Brake inspection'; jobFields.materials.value = oil ? 'Engine oil, oil filter' : 'Brake cleaner';
    jobFields.hours.value = '0'; jobFields.minutes.value = oil ? '45' : '30'; jobFields.cost.value = oil ? '65.00' : '35.00'; find('.garage-job-error').hidden = true;
  }));
  jobForm.addEventListener('submit', event => {
    event.preventDefault(); if (role !== 'mechanic' || appointment?.status !== 'IN_PROGRESS' || !jobForm.reportValidity()) return;
    const description = jobFields.description.value.trim(), materials = jobFields.materials.value.trim(), hours = Number(jobFields.hours.value), minutes = Number(jobFields.minutes.value), cents = Math.round(Number(jobFields.cost.value) * 100);
    if (!description || !materials || !Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59 || !Number.isSafeInteger(cents) || cents < 0) { find('.garage-job-error').textContent = 'Enter a description, materials, a valid duration, and a non-negative cost.'; find('.garage-job-error').hidden = false; return; }
    const entry = { id: editId ?? nextJob++, description, materials, hours, minutes, cents };
    if (editId !== null) appointment.jobs = appointment.jobs.map(job => job.id === editId ? entry : job); else appointment.jobs.push(entry);
    clearJobForm(); render(); live.textContent = `Work recorded. Appointment total ${euro(total())}.`; flash(find(`.garage-record[data-job="${entry.id}"]`));
  });
  find('.garage-cancel-edit').addEventListener('click', clearJobForm);
  function reset() {
    tweens.forEach(tween => tween.kill()); tweens.clear();
    element.querySelectorAll('[data-role-panel],.garage-record').forEach(node => { node.style.transform = ''; node.style.opacity = ''; });
    sampleDay = today(); clock = timestamp(sampleDay, '08:00'); appointment = null; role = 'customer'; nextJob = 1;
    busy = [{ mechanic: 0, start: timestamp(sampleDay, '10:00') }, { mechanic: 0, start: timestamp(sampleDay, '13:00') }, { mechanic: 1, start: timestamp(sampleDay, '13:00') }];
    bookingForm.reset(); vehicleField.value = vehicles[0].id; dateField.min = sampleDay; dateField.value = sampleDay; timeField.value = '10:00';
    clearJobForm(); find('.garage-booking-error').hidden = true; live.textContent = ''; render();
  }
  find('.garage-reset').addEventListener('click', () => { reset(); live.textContent = 'Sample appointment preview reset.'; });
  reduced.addEventListener('change', event => { if (event.matches) tweens.forEach(tween => tween.progress(1)); });
  reset();
  return { element, reset, activate() { element.hidden = false; }, deactivate() { tweens.forEach(tween => tween.progress(1)); element.hidden = true; } };
}
