const form = document.getElementById('booking-form');
const participant = document.getElementById('participant');
const sessionType = document.getElementById('session-type');
const day = document.getElementById('schedule-day');
const time = document.getElementById('schedule-time');
const schedule = document.getElementById('schedule-list');
const scheduleLabel = document.getElementById('schedule-label');
const error = document.getElementById('booking-error');
const status = document.getElementById('booking-status');
const reset = document.getElementById('reset-schedule');
const slots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'];
const dateFormat = new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
const today = new Date();
const initial = [
  { day: '0', time: '9:00 AM', participant: 'Alex R.', type: 'Private session' },
  { day: '1', time: '11:00 AM', participant: 'Riley M.', type: 'Semi-private session' },
];
let bookings = [...initial];

for (let offset = 0; offset < 7; offset += 1) {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  day.add(new Option(dateFormat.format(date), String(offset)));
}

function bookingAt(slot) {
  return bookings.find(booking => booking.day === day.value && booking.time === slot);
}

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

function renderSchedule() {
  const previousTime = time.value;
  scheduleLabel.textContent = day.selectedOptions[0].textContent;
  schedule.replaceChildren();
  time.replaceChildren();

  for (const slot of slots) {
    const booking = bookingAt(slot);
    time.add(new Option(booking ? `${slot} · Booked` : slot, slot));
    const row = document.createElement('li');
    const details = document.createElement('div');
    details.className = 'schedule-slot';
    const hour = document.createElement('strong');
    hour.textContent = slot;
    const description = document.createElement('p');
    description.textContent = booking ? `${booking.participant} · ${booking.type}` : 'Available';
    details.append(hour, description);
    row.append(details);

    if (booking) {
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'button button-outline';
      cancel.textContent = 'Cancel';
      cancel.setAttribute('aria-label', `Cancel ${slot} session for ${booking.participant}`);
      cancel.addEventListener('click', () => {
        bookings = bookings.filter(item => item !== booking);
        renderSchedule();
        time.focus();
        showError('');
        status.textContent = `${slot} session cancelled.`;
      });
      row.append(cancel);
    }
    schedule.append(row);
  }

  const firstAvailable = slots.find(slot => !bookingAt(slot));
  time.value = previousTime || firstAvailable || slots[0];
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const slot = time.value;
  if (bookingAt(slot)) {
    status.textContent = '';
    showError(`${slot} is already booked. Choose an available time.`);
    time.focus();
    return;
  }

  bookings.push({ day: day.value, time: slot, participant: participant.value, type: sessionType.value });
  showError('');
  status.textContent = `Booked ${slot} for ${participant.value}.`;
  renderSchedule();
});

day.addEventListener('change', () => {
  showError('');
  status.textContent = '';
  renderSchedule();
});
time.addEventListener('change', () => showError(''));
reset.addEventListener('click', () => {
  bookings = [...initial];
  form.reset();
  day.value = '0';
  time.value = '';
  showError('');
  status.textContent = 'The sample schedule is ready again.';
  renderSchedule();
});

renderSchedule();
form.querySelector('button[type=submit]').disabled = false;
reset.disabled = false;
