// frontend/app.js  —  CampusBook Professional Dashboard
'use strict';

const API_BASE = (
  window.location.protocol === 'file:' ||
  ['localhost', '127.0.0.1'].includes(window.location.hostname)
) ? 'http://localhost:3000'
  : 'https://cpen-421-mini-project-campus-booking.onrender.com/'; 

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
const state = {
  facilities: [],
  bookings:   [],
  bookingFilter: 'all',
  facilityFilter: '',
};

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // ── AUTH GUARD ──────────────────────────────────────────
  // Check session on every page load. Redirect to login if not authenticated.
  try {
    const { data: user } = await apiFetch('/auth/me');
    // Populate sidebar with real user info
    const initials = user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebar-avatar').textContent = initials;
    document.getElementById('sidebar-name').textContent   = user.name;
    document.getElementById('sidebar-role').textContent   = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    // Store current user for use throughout the app
    window.currentUser = user;
  } catch (err) {
    // Not logged in — send to login page
    window.location.href = '/login.html';
    return;
  }

  // ── LOGOUT ──────────────────────────────────────────────
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login.html';
    }
  });

  // Rest of init continues below:
  initGreeting();
  initTopbarDate();
  initNavigation();
  initModal();
  initMobileMenu();
  initSearch();
  initBookingFilters();
  initAvailabilityCheck();

  // Load initial data
  loadDashboard();
});

// ═══════════════════════════════════════════════════════════
// GREETING + DATE
// ═══════════════════════════════════════════════════════════
function initGreeting() {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  document.getElementById('greeting-part').textContent = part;
}

function initTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  el.textContent = new Date().toLocaleDateString('en-GB', opts);
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function initNavigation() {
  // Sidebar nav items
  document.querySelectorAll('.nav-item[data-view]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchView(link.dataset.view);
    });
  });

  // Text links (e.g. "See all" in section cards)
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-view]');
    if (!link || link.classList.contains('nav-item')) return;
    e.preventDefault();
    switchView(link.dataset.view);
  });

  // Dashboard "New Booking" button — open modal after picking facility
  const dashBtn = document.getElementById('dash-new-booking-btn');
  if (dashBtn) dashBtn.addEventListener('click', () => switchView('facilities'));
}

function switchView(viewId) {
  // Deactivate all views + nav items
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate target
  const view = document.getElementById(`${viewId}-view`);
  if (!view) return;
  view.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  // Load data for view
  if (viewId === 'dashboard')    loadDashboard();
  else if (viewId === 'facilities') loadFacilitiesView();
  else if (viewId === 'bookings')   loadBookingsView();
  else if (viewId === 'availability') loadAvailabilityView();
}

// ═══════════════════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════════════════
function initMobileMenu() {
  const btn     = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!btn) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ═══════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════
function initSearch() {
  const input = document.getElementById('global-search');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      switchView('facilities');
      setTimeout(() => {
        const fi = document.getElementById('facility-filter');
        if (fi) { fi.value = input.value.trim(); fi.dispatchEvent(new Event('input')); }
        input.value = '';
      }, 100);
    }
  });

  // Facility filter
  const fi = document.getElementById('facility-filter');
  if (fi) {
    fi.addEventListener('input', () => {
      state.facilityFilter = fi.value.toLowerCase();
      renderFacilityCards();
    });
  }
}

// ═══════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',   // send session cookie with every request
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
async function loadDashboard() {
  await Promise.all([loadStats(), loadFacilities(), loadBookings()]);
  renderDashFacilities();
  renderDashRecent();
}

async function loadStats() {
  try {
    const { data } = await apiFetch('/stats');
    animate(document.getElementById('stat-facilities'), data.total_facilities);
    animate(document.getElementById('stat-upcoming'),   data.upcoming_bookings);
    animate(document.getElementById('stat-today'),      data.today_bookings);
    animate(document.getElementById('stat-pending'),    data.pending_bookings);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function animate(el, target) {
  if (!el) return;
  const n = parseInt(target, 10) || 0;
  let current = 0;
  const step = Math.ceil(n / 20);
  const tick = () => {
    current = Math.min(current + step, n);
    el.textContent = current;
    if (current < n) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function loadFacilities() {
  try {
    const { data } = await apiFetch('/facilities');
    state.facilities = data;
  } catch (err) { console.error('Facilities error:', err); }
}

async function loadBookings() {
  try {
    const { data } = await apiFetch('/bookings');
    state.bookings = data;
  } catch (err) { console.error('Bookings error:', err); }
}

function renderDashFacilities() {
  const container = document.getElementById('dash-facility-list');
  if (!container) return;
  if (!state.facilities.length) {
    container.innerHTML = '<p class="empty-state"><p>No facilities found.</p></p>';
    return;
  }
  container.innerHTML = state.facilities.slice(0, 4).map(f => `
    <div class="facility-list-item" data-id="${f.id}">
      <div class="fli-icon">${facilityIcon(f.name)}</div>
      <div class="fli-info">
        <p class="fli-name">${f.name}</p>
        <p class="fli-meta">${f.location} &bull; Capacity: ${f.capacity}</p>
      </div>
      <button class="fli-action book-btn" data-id="${f.id}">Book</button>
    </div>
  `).join('');

  container.querySelectorAll('.book-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openBookingModal(btn.dataset.id); });
  });
}

function renderDashRecent() {
  const container = document.getElementById('dash-recent-list');
  if (!container) return;
  const recent = [...state.bookings].reverse().slice(0, 5);
  if (!recent.length) {
    container.innerHTML = '<p class="empty-state" style="padding:20px;text-align:center;color:var(--text-muted);font-size:.85rem">No bookings yet.</p>';
    return;
  }
  container.innerHTML = recent.map(b => {
    const date = formatDate(b.date);
    const t    = `${b.start_time.substring(0,5)} – ${b.end_time.substring(0,5)}`;
    return `
      <div class="activity-item">
        <div class="activity-dot ${b.status}"></div>
        <div class="activity-info">
          <p class="activity-title">${b.facility_name}</p>
          <p class="activity-meta">${b.user_name} &bull; ${date}</p>
        </div>
        <div class="activity-time">${t}</div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// FACILITIES VIEW
// ═══════════════════════════════════════════════════════════
async function loadFacilitiesView() {
  if (!state.facilities.length) await loadFacilities();
  renderFacilityCards();
}

function renderFacilityCards() {
  const grid = document.getElementById('all-facilities-grid');
  if (!grid) return;
  const filtered = state.facilities.filter(f =>
    !state.facilityFilter ||
    f.name.toLowerCase().includes(state.facilityFilter) ||
    f.location.toLowerCase().includes(state.facilityFilter)
  );
  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-state" style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-muted)">No facilities match your search.</p>';
    return;
  }
  grid.innerHTML = filtered.map(f => `
    <div class="facility-card">
      <div class="facility-card-img">${facilityIcon(f.name)}</div>
      <div class="facility-card-body">
        <p class="facility-card-name">${f.name}</p>
        <div class="facility-card-tags">
          <span class="tag">${f.location}</span>
          <span class="tag cap">Cap: ${f.capacity}</span>
        </div>
      </div>
      <div class="facility-card-footer">
        <button class="book-facility-btn" data-id="${f.id}">Book This Facility</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.book-facility-btn').forEach(btn => {
    btn.addEventListener('click', () => openBookingModal(btn.dataset.id));
  });
}

// ═══════════════════════════════════════════════════════════
// BOOKINGS VIEW
// ═══════════════════════════════════════════════════════════
function initBookingFilters() {
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.bookingFilter = pill.dataset.filter;
      renderBookingsTable();
    });
  });
}

async function loadBookingsView() {
  await loadBookings();
  renderBookingsTable();
}

function renderBookingsTable() {
  const container = document.getElementById('bookings-table-card');
  if (!container) return;

  const filtered = state.bookings.filter(b =>
    state.bookingFilter === 'all' || b.status === state.bookingFilter
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">
      <p>No ${state.bookingFilter === 'all' ? '' : state.bookingFilter + ' '}bookings found.</p>
    </div>`;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Facility</th>
          <th>Booked By</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(b => `
          <tr>
            <td style="color:var(--text-muted);font-size:.8rem">${b.id}</td>
            <td class="td-facility">${b.facility_name}</td>
            <td class="td-user">${b.user_name}</td>
            <td class="td-time">${formatDate(b.date)}</td>
            <td class="td-time">${b.start_time.substring(0,5)} – ${b.end_time.substring(0,5)}</td>
            <td><span class="badge ${b.status}">${b.status}</span></td>
            <td>
              ${b.status !== 'cancelled'
                ? `<button class="btn-cancel cancel-booking-btn" data-id="${b.id}">Cancel</button>`
                : '<span style="color:var(--text-muted);font-size:.8rem">—</span>'
              }
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  container.querySelectorAll('.cancel-booking-btn').forEach(btn => {
    btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
  });
}

async function cancelBooking(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    await apiFetch(`/bookings/${id}`, { method: 'DELETE' });
    showToast('Booking cancelled successfully.', 'success');
    await loadBookings();
    renderBookingsTable();
    renderDashRecent();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// AVAILABILITY VIEW
// ═══════════════════════════════════════════════════════════
function initAvailabilityCheck() {
  const btn = document.getElementById('avail-check-btn');
  if (!btn) return;
  btn.addEventListener('click', checkStandaloneAvailability);
}

async function loadAvailabilityView() {
  if (!state.facilities.length) await loadFacilities();
  const select = document.getElementById('avail-facility');
  if (!select) return;
  // Populate facility dropdown
  select.innerHTML = '<option value="">Choose a facility…</option>' +
    state.facilities.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  // Set min date
  const dateIn = document.getElementById('avail-date');
  if (dateIn) dateIn.min = new Date().toISOString().split('T')[0];
}

async function checkStandaloneAvailability() {
  const facilityId = document.getElementById('avail-facility').value;
  const date       = document.getElementById('avail-date').value;
  const results    = document.getElementById('avail-results');

  if (!facilityId || !date) {
    showToast('Please select a facility and date.', 'info');
    return;
  }

  results.innerHTML = '<div class="avail-empty"><p>Loading slots…</p></div>';
  try {
    const { data } = await apiFetch(`/availability?facility_id=${facilityId}&date=${date}`);
    const facility  = data.facility;
    const slots     = data.slots;
    const available = slots.filter(s => s.available).length;

    results.innerHTML = `
      <div class="avail-facility-info">
        <h3>${facility.name}</h3>
        <p>${facility.location} &bull; Capacity: ${facility.capacity} &bull; ${available} of ${slots.length} slots free</p>
      </div>
      <div class="avail-legend">
        <div class="avail-leg-item"><div class="avail-leg-box free"></div> Available</div>
        <div class="avail-leg-item"><div class="avail-leg-box busy"></div> Booked</div>
      </div>
      <div class="avail-slots-grid">
        ${slots.map(s => `
          <div class="avail-slot ${s.available ? 'free' : 'taken'}" title="${s.start_time} – ${s.end_time}">
            ${s.start_time.substring(0,5)}
          </div>
        `).join('')}
      </div>`;
  } catch (err) {
    results.innerHTML = `<div class="avail-empty"><p style="color:var(--rose)">Error: ${err.message}</p></div>`;
  }
}

// ═══════════════════════════════════════════════════════════
// BOOKING MODAL
// ═══════════════════════════════════════════════════════════
function initModal() {
  const backdrop  = document.getElementById('booking-modal');
  const closeBtn  = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form      = document.getElementById('booking-form');
  const dateInput = document.getElementById('booking-date');
  const durSelect = document.getElementById('booking-duration');

  closeBtn.addEventListener('click',  closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

  dateInput.min = new Date().toISOString().split('T')[0];
  dateInput.addEventListener('change', fetchModalAvailability);
  durSelect.addEventListener('change', fetchModalAvailability);
  form.addEventListener('submit', handleBookingSubmit);
}

function openBookingModal(facilityId) {
  const facility = state.facilities.find(f => f.id == facilityId);
  if (!facility) return;

  document.getElementById('facility-id').value       = facility.id;
  document.getElementById('modal-fac-name').textContent = facility.name;
  document.getElementById('modal-fac-meta').textContent = `${facility.location} · Capacity: ${facility.capacity}`;
  document.getElementById('modal-fac-badge').textContent = facilityIcon(facility.name);

  // Reset form
  document.getElementById('booking-date').value      = '';
  document.getElementById('booking-duration').value  = '30';
  document.getElementById('available-slots').innerHTML = '<p class="slots-hint">Pick a date above to load slots.</p>';
  document.getElementById('submit-booking-btn').disabled = true;
  document.getElementById('selected-start-time').value  = '';
  document.getElementById('selected-end-time').value    = '';

  document.getElementById('booking-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('booking-modal').classList.remove('open');
  document.body.style.overflow = '';
}

async function fetchModalAvailability() {
  const facilityId = document.getElementById('facility-id').value;
  const date       = document.getElementById('booking-date').value;
  const duration   = parseInt(document.getElementById('booking-duration').value);
  const container  = document.getElementById('available-slots');

  if (!facilityId || !date) return;

  container.innerHTML = '<p class="slots-hint">Checking availability…</p>';
  document.getElementById('submit-booking-btn').disabled = true;
  document.getElementById('selected-start-time').value = '';
  document.getElementById('selected-end-time').value   = '';

  try {
    const { data } = await apiFetch(`/availability?facility_id=${facilityId}&date=${date}`);
    renderModalSlots(data.slots, duration);
  } catch (err) {
    container.innerHTML = `<p class="slots-hint" style="color:var(--rose)">Error: ${err.message}</p>`;
  }
}

function renderModalSlots(slots, durationMins) {
  const container    = document.getElementById('available-slots');
  const requiredCount = durationMins / 30;

  if (!slots.length) {
    container.innerHTML = '<p class="slots-hint">No slots available for this date.</p>';
    return;
  }

  let html = '';
  slots.forEach((slot, i) => {
    const label = slot.start_time.substring(0, 5);
    if (!slot.available) {
      html += `<div class="slot taken" title="Already booked">${label}</div>`;
      return;
    }
    // Check enough consecutive slots available
    let canBook = true;
    for (let k = 1; k < requiredCount; k++) {
      if (!slots[i + k] || !slots[i + k].available) { canBook = false; break; }
    }
    if (canBook) {
      const end = addMinutes(slot.start_time, durationMins);
      html += `<div class="slot available" data-start="${slot.start_time}" data-end="${end}" title="${label} – ${end}">${label}</div>`;
    } else {
      html += `<div class="slot taken" title="Not enough consecutive time">${label}</div>`;
    }
  });

  container.innerHTML = html;

  container.querySelectorAll('.slot.available').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.slot.available').forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
      document.getElementById('selected-start-time').value = el.dataset.start;
      document.getElementById('selected-end-time').value   = el.dataset.end;
      document.getElementById('submit-booking-btn').disabled = false;
    });
  });
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const startRaw = document.getElementById('selected-start-time').value;
  const endRaw   = document.getElementById('selected-end-time').value;

  if (!startRaw || !endRaw) { showToast('Please select a time slot.', 'error'); return; }

  const payload = {
    facility_id: parseInt(document.getElementById('facility-id').value),
    date:        document.getElementById('booking-date').value,
    start_time:  startRaw.substring(0, 5),
    end_time:    endRaw.substring(0, 5),
    // user_id is set server-side from the session — never send it from the client
  };

  const btn = document.getElementById('submit-booking-btn');
  btn.textContent = 'Confirming…';
  btn.disabled = true;

  try {
    await apiFetch('/bookings', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Booking confirmed! 🎉', 'success');
    closeModal();
    await loadBookings();
    renderDashRecent();
    loadStats();
    switchView('bookings');
  } catch (err) {
    showToast(err.message, 'error');
    btn.textContent = 'Confirm Booking';
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
function showToast(message, type = 'info') {
  const stack = document.getElementById('toast-stack');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span> ${message}`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s, transform 0.4s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(20px)';
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function facilityIcon(name = '') {
  const l = name.toLowerCase();
  if (l.includes('lab'))        return '💻';
  if (l.includes('hall'))       return '🏛️';
  if (l.includes('conference')) return '🎙️';
  if (l.includes('seminar'))    return '📚';
  if (l.includes('project'))    return '🔬';
  if (l.includes('sport'))      return '⚽';
  return '🏢';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.toString().substring(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}
