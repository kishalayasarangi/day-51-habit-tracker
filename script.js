let habits = JSON.parse(localStorage.getItem('habit-tracker') || '[]');

function today() {
  return new Date().toISOString().split('T')[0];
}

function save() {
  localStorage.setItem('habit-tracker', JSON.stringify(habits));
}

function addHabit() {
  const name = document.getElementById('habitName').value.trim();
  const icon = document.getElementById('habitIcon').value;
  if (!name) { alert('Enter a habit name!'); return; }
  habits.push({
    id: Date.now(),
    name,
    icon,
    logs: [],
    createdAt: today()
  });
  document.getElementById('habitName').value = '';
  save();
  renderAll();
}

function deleteHabit(id) {
  if (!confirm('Delete this habit?')) return;
  habits = habits.filter(h => h.id !== id);
  save();
  renderAll();
}

function toggleCheckin(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  const t = today();
  if (habit.logs.includes(t)) {
    habit.logs = habit.logs.filter(d => d !== t);
  } else {
    habit.logs.push(t);
  }
  save();
  renderAll();
}

function getStreak(habit) {
  if (habit.logs.length === 0) return 0;
  const sorted = [...habit.logs].sort().reverse();
  const t = today();
  let streak = 0;
  let check = new Date(t);

  for (let i = 0; i < 365; i++) {
    const dateStr = check.toISOString().split('T')[0];
    if (sorted.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getDayLabel(dateStr) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return days[new Date(dateStr + 'T00:00:00').getDay()];
}

function renderHabits() {
  const list = document.getElementById('habitsList');
  if (habits.length === 0) {
    list.innerHTML = '<div class="empty-habits">No habits yet — add one above! 🎯</div>';
    return;
  }

  const t = today();
  const last7 = getLast7Days();

  list.innerHTML = habits.map(h => {
    const isDoneToday = h.logs.includes(t);
    const streak = getStreak(h);
    const streakLabel = streak > 0
      ? `🔥 ${streak} day streak`
      : 'No streak yet';
    const streakCls = streak >= 7 ? 'hot' : '';

    const dots = last7.map(d => {
      const isToday = d === t;
      const done = h.logs.includes(d);
      const isPast = d < t;
      let cls = 'week-dot';
      if (isToday) cls += ' today-dot';
      if (done) cls += ' completed';
      else if (isPast && !done) cls += ' missed';
      return `<div class="${cls}" title="${d}">
        <span>${getDayLabel(d)}</span>
        ${done ? '✓' : ''}
      </div>`;
    }).join('');

    return `
      <div class="habit-card ${isDoneToday ? 'done-today' : ''}">
        <div class="habit-top">
          <div class="habit-icon">${h.icon}</div>
          <div class="habit-info">
            <div class="habit-name">${h.name}</div>
            <div class="habit-streak ${streakCls}">${streakLabel}</div>
          </div>
          <div class="habit-actions">
            <button class="btn-checkin ${isDoneToday ? 'checked' : ''}"
                    onclick="toggleCheckin(${h.id})">
              ${isDoneToday ? '✓ Done' : '○ Check In'}
            </button>
            <button class="btn-del-habit"
                    onclick="deleteHabit(${h.id})">✕</button>
          </div>
        </div>
        <div class="week-dots">
          <span class="week-label">Last 7 days:</span>
          ${dots}
        </div>
      </div>`;
  }).join('');
}

function renderTodayBanner() {
  const t = today();
  const dateObj = new Date();
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric'
  });

  document.getElementById('todayDate').textContent = dateStr;

  const total = habits.length;
  const done = habits.filter(h => h.logs.includes(t)).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  document.getElementById('completedToday').textContent = done;
  document.getElementById('totalHabits').textContent = total;
  document.getElementById('todayProgress').style.width = pct + '%';
}

function renderHeatmap() {
  const heatmap = document.getElementById('heatmap');
  const allLogs = {};

  habits.forEach(h => {
    h.logs.forEach(d => {
      allLogs[d] = (allLogs[d] || 0) + 1;
    });
  });

  const totalHabits = habits.length || 1;
  const weeks = 12;
  const cols = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7 - 1));

  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split('T')[0];
      const count = allLogs[dateStr] || 0;
      const pct = count / totalHabits;
      let level = 0;
      if (pct > 0) level = 1;
      if (pct >= 0.25) level = 2;
      if (pct >= 0.5) level = 3;
      if (pct >= 0.75) level = 4;

      col.push(`<div class="heatmap-cell l${level}"
                     data-date="${dateStr} (${count}/${totalHabits})">
               </div>`);
    }
    cols.push(`<div class="heatmap-col">${col.join('')}</div>`);
  }

  heatmap.innerHTML = cols.join('');
}

function renderStats() {
  const grid = document.getElementById('statsGrid');
  if (habits.length === 0) { grid.innerHTML = ''; return; }

  const t = today();
  const totalLogs = habits.reduce((s, h) => s + h.logs.length, 0);
  const bestStreak = Math.max(...habits.map(h => getStreak(h)), 0);
  const doneToday = habits.filter(h => h.logs.includes(t)).length;
  const longestStreak = Math.max(...habits.map(h => {
    let max = 0, cur = 0;
    const sorted = [...h.logs].sort();
    sorted.forEach((d, i) => {
      if (i === 0) { cur = 1; }
      else {
        const prev = new Date(sorted[i-1]);
        const curr = new Date(d);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        cur = diff === 1 ? cur + 1 : 1;
      }
      max = Math.max(max, cur);
    });
    return max;
  }), 0);

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-val">${habits.length}</div>
      <div class="stat-label">Total Habits</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${doneToday}</div>
      <div class="stat-label">Done Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${totalLogs}</div>
      <div class="stat-label">Total Check-ins</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${bestStreak}🔥</div>
      <div class="stat-label">Current Best Streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${longestStreak}</div>
      <div class="stat-label">Longest Streak Ever</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${habits.length > 0 ?
        Math.round(totalLogs / habits.length) : 0}</div>
      <div class="stat-label">Avg Check-ins/Habit</div>
    </div>`;
}

function renderAll() {
  renderTodayBanner();
  renderHabits();
  renderHeatmap();
  renderStats();
}

window.onload = () => {
  renderAll();
  document.getElementById('habitName').addEventListener('keydown', e => {
    if (e.key === 'Enter') addHabit();
  });
};