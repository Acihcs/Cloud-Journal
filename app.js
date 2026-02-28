'use strict';

const WEATHER = {
  sunny: { label: '晴', desc: '蓝天占比高，光照充足。', tip: '适合外出，注意防晒。' },
  partly: { label: '少云', desc: '蓝天与云层并存。', tip: '体感舒适，适合散步。' },
  cloudy: { label: '多云', desc: '云层较多，光线偏柔。', tip: '适合室内创作。' },
  overcast: { label: '阴', desc: '灰度偏高，天空被厚云覆盖。', tip: '建议备伞。' },
  rainy: { label: '雨', desc: '画面偏暗且云层浓厚。', tip: '外出注意防雨。' }
};

const WEATHER_ICONS = {
  sunny: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.8" y1="4.8" x2="7" y2="7"/><line x1="17" y1="17" x2="19.2" y2="19.2"/><line x1="19.2" y1="4.8" x2="17" y2="7"/><line x1="7" y1="17" x2="4.8" y2="19.2"/></g></svg>',
  partly: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3.5" fill="currentColor" opacity=".85"/><path d="M17 18H8a3 3 0 1 1 .3-6 4.5 4.5 0 0 1 8.5 1.8A2.8 2.8 0 1 1 17 18Z" fill="currentColor" opacity=".75"/></svg>',
  cloudy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.5 18H7.2a3.7 3.7 0 1 1 .4-7.4A5.5 5.5 0 0 1 18 13a2.5 2.5 0 1 1 .5 5Z" fill="currentColor"/></svg>',
  overcast: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 18H6.5a3.5 3.5 0 1 1 .3-7A5.8 5.8 0 0 1 18 13a2.9 2.9 0 1 1 1 5Z" fill="currentColor"/><rect x="3" y="18.5" width="18" height="1.5" rx=".75" fill="currentColor" opacity=".45"/></svg>',
  rainy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.5 15.5H7.2a3.7 3.7 0 1 1 .4-7.4A5.5 5.5 0 0 1 18 10.5a2.5 2.5 0 1 1 .5 5Z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="9" y1="17" x2="8" y2="20"/><line x1="13" y1="17" x2="12" y2="20"/><line x1="17" y1="17" x2="16" y2="20"/></g></svg>',
  default: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.5 18H7.2a3.7 3.7 0 1 1 .4-7.4A5.5 5.5 0 0 1 18 13a2.5 2.5 0 1 1 .5 5Z" fill="currentColor"/></svg>'
};

const KEY = {
  weather: 'cloud_journal_weather',
  notes: 'cloud_journal_notes'
};

const state = {
  weatherRecords: [],
  notes: [],
  pendingResult: null,
  pendingWeatherTypeForNote: null,
  editingNoteId: null
};

const $ = (id) => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>\"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const fmt = (ts) => new Date(ts).toLocaleString('zh-CN', { hour12: false });

function weatherIcon(type, className = '') {
  const svg = WEATHER_ICONS[type] || WEATHER_ICONS.default;
  return `<span class="weather-icon ${className}" aria-hidden="true">${svg}</span>`;
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function load() {
  try {
    state.weatherRecords = JSON.parse(localStorage.getItem(KEY.weather) || '[]');
    state.notes = JSON.parse(localStorage.getItem(KEY.notes) || '[]');
  } catch {
    state.weatherRecords = [];
    state.notes = [];
  }
}

function save() {
  localStorage.setItem(KEY.weather, JSON.stringify(state.weatherRecords));
  localStorage.setItem(KEY.notes, JSON.stringify(state.notes));
}

function analyzeImage(img) {
  const canvas = $('analysisCanvas');
  const ctx = canvas.getContext('2d');
  const W = 160, H = 120;
  canvas.width = W; canvas.height = H;
  ctx.drawImage(img, 0, 0, W, H);

  const data = ctx.getImageData(0, 0, W, H).data;
  let dark = 0, bright = 0, gray = 0, blue = 0, total = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (l < 85) dark++;
    if (l > 200) bright++;
    if (sat < 30) gray++;
    if (b > r + 18 && b > g + 8) blue++;
    total++;
  }

  const darkR = dark / total;
  const brightR = bright / total;
  const grayR = gray / total;
  const blueR = blue / total;

  let type = 'cloudy';
  let confidence = 72;

  if (darkR > 0.4) { type = 'rainy'; confidence = 78; }
  else if (blueR > 0.33 && brightR > 0.2) { type = 'sunny'; confidence = 86; }
  else if (blueR > 0.2 && brightR > 0.14) { type = 'partly'; confidence = 80; }
  else if (grayR > 0.48) { type = 'overcast'; confidence = 76; }

  confidence = Math.max(55, Math.min(95, confidence + Math.floor(Math.random() * 8) - 3));

  return { type, confidence, stats: { darkR, brightR, grayR, blueR } };
}

function renderHero() {
  const latest = state.weatherRecords[0];
  if (!latest) {
    $('heroIcon').innerHTML = weatherIcon('default', 'hero-weather-icon');
    $('heroTitle').textContent = '等待观测';
    $('heroDesc').textContent = '拍一张天空，开始今天的观云记录';
    $('heroTip').textContent = '建议：先拍照识别，再记录当下想法。';
    return;
  }
  const w = WEATHER[latest.type];
  $('heroIcon').innerHTML = weatherIcon(latest.type, 'hero-weather-icon');
  $('heroTitle').textContent = `${w.label} · ${latest.confidence}%`;
  $('heroDesc').textContent = `${w.desc}（${fmt(latest.ts)}）`;
  $('heroTip').textContent = `建议：${w.tip}`;
}

function renderWeatherTrend() {
  const summaryEl = $('weatherSummary');
  const trendEl = $('weatherTrend');
  const dailyEl = $('weatherDailyTrend');
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * oneDay;
  const recent = state.weatherRecords.filter(r => r.ts >= sevenDaysAgo);

  if (recent.length === 0) {
    summaryEl.innerHTML = '';
    trendEl.innerHTML = '<p class="trend-empty">近7天暂无观测数据。</p>';
    dailyEl.innerHTML = '';
    return;
  }

  const order = ['sunny', 'partly', 'cloudy', 'overcast', 'rainy'];
  const counts = order.map(type => ({
    type,
    label: WEATHER[type].label,
    count: recent.filter(r => r.type === type).length
  })).filter(x => x.count > 0);

  const most = counts.reduce((a, b) => (a.count >= b.count ? a : b));
  summaryEl.innerHTML = `
    <span class="summary-chip">近7天观测：${recent.length} 次</span>
    <span class="summary-chip">最常见：${weatherIcon(most.type, 'inline-weather-icon')} ${most.label}</span>
  `;

  const maxCount = Math.max(...counts.map(c => c.count), 1);
  trendEl.innerHTML = counts.map(c => {
    const width = Math.max(8, Math.round((c.count / maxCount) * 100));
    return `<div class="trend-row">
      <div class="trend-label">${weatherIcon(c.type, 'inline-weather-icon')} ${c.label}</div>
      <div class="trend-track"><div class="trend-fill" style="width:${width}%"></div></div>
      <div class="meta">${c.count}</div>
    </div>`;
  }).join('');

  const dayBuckets = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * oneDay);
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    dayBuckets.push({
      key,
      label: `${d.getMonth()+1}/${d.getDate()}`,
      count: recent.filter(r => {
        const t = new Date(r.ts);
        return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}` === key;
      }).length
    });
  }
  const maxDay = Math.max(...dayBuckets.map(d => d.count), 1);
  dailyEl.innerHTML = dayBuckets.map(d => {
    const width = d.count === 0 ? 0 : Math.max(8, Math.round((d.count / maxDay) * 100));
    return `<div class="daily-row">
      <div class="meta">${d.label}</div>
      <div class="daily-track"><div class="daily-fill" style="width:${width}%"></div></div>
      <div class="meta">${d.count}</div>
    </div>`;
  }).join('');
}

function renderWeatherList() {
  $('weatherCount').textContent = `${state.weatherRecords.length} 条`;
  renderWeatherTrend();
  $('weatherList').innerHTML = state.weatherRecords.slice(0, 30).map((r) => {
    const w = WEATHER[r.type];
    return `<article class="item"><div class="row" style="gap:6px"><strong>${weatherIcon(r.type, 'inline-weather-icon')} ${w.label}</strong></div><div class="meta">置信度 ${r.confidence}% · ${fmt(r.ts)}</div></article>`;
  }).join('') || '<p class="muted">还没有观测记录。</p>';
}

function renderNotes() {
  const q = $('searchInput').value.trim().toLowerCase();
  const list = state.notes.filter(n => !q || `${n.title} ${n.content}`.toLowerCase().includes(q));
  $('notesList').innerHTML = list.map((n) => {
    const wt = n.weatherType ? WEATHER[n.weatherType] : null;
    return `<article class="item" data-id="${n.id}">
      <div class="row between">
        <strong>${esc(n.title || '无标题')}</strong>
        <span class="meta">${fmt(n.ts)}</span>
      </div>
      <div>${esc((n.content || '').slice(0, 120))}${n.content.length > 120 ? '…' : ''}</div>
      <div class="meta">${wt ? `${weatherIcon(n.weatherType, 'inline-weather-icon')} ${wt.label}` : '无天气关联'}</div>
    </article>`;
  }).join('') || '<p class="muted">还没有笔记。</p>';

  $('notesList').querySelectorAll('.item[data-id]').forEach(el => {
    el.addEventListener('click', () => openNoteDialog(el.dataset.id));
  });
}

function renderAll() {
  renderHero();
  renderWeatherList();
  renderNotes();
}

function openNoteDialog(noteId = null, weatherType = null) {
  const dialog = $('noteDialog');
  const title = $('noteTitle');
  const content = $('noteContent');
  const hint = $('noteWeatherHint');

  state.editingNoteId = noteId;
  state.pendingWeatherTypeForNote = weatherType;

  if (noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    $('dialogTitle').textContent = '编辑笔记';
    title.value = note.title || '';
    content.value = note.content || '';
    hint.textContent = note.weatherType ? `关联天气：${WEATHER[note.weatherType].label}` : '未关联天气';
  } else {
    $('dialogTitle').textContent = '新建笔记';
    title.value = '';
    content.value = '';
    hint.textContent = weatherType ? `将关联天气：${WEATHER[weatherType].label}` : '未关联天气';
  }

  dialog.showModal();
}

function saveNote() {
  const title = $('noteTitle').value.trim();
  const content = $('noteContent').value.trim();
  if (!title && !content) return;

  if (state.editingNoteId) {
    const idx = state.notes.findIndex(n => n.id === state.editingNoteId);
    if (idx >= 0) state.notes[idx] = { ...state.notes[idx], title, content, updatedAt: Date.now() };
  } else {
    state.notes.unshift({
      id: uid(), title, content, ts: Date.now(), weatherType: state.pendingWeatherTypeForNote
    });
  }

  $('noteDialog').close();
  state.editingNoteId = null;
  state.pendingWeatherTypeForNote = null;
  save();
  renderNotes();
}

function setup() {
  $('todayText').textContent = new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const input = $('photoInput');
  const preview = $('preview');
  const hint = $('uploadHint');
  preview.classList.remove('is-ready');
  preview.hidden = true;
  preview.removeAttribute('src');
  hint.hidden = false;
  let objectUrl = null;

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    preview.classList.add('is-ready');
    hint.hidden = true;
    $('analyzeBtn').disabled = false;
  });

  $('analyzeBtn').addEventListener('click', async () => {
    if (preview.hidden || !preview.classList.contains('is-ready')) return;

    const analyzeBtn = $('analyzeBtn');
    analyzeBtn.disabled = true;
    const prevText = analyzeBtn.textContent;
    analyzeBtn.textContent = '识别中...';

    await new Promise(r => setTimeout(r, 350));
    const result = analyzeImage(preview);
    state.pendingResult = result;

    const w = WEATHER[result.type];
    $('result').hidden = false;
    $('result').innerHTML = `
      <strong>${weatherIcon(result.type, 'inline-weather-icon')} ${w.label}</strong><br>
      置信度：${result.confidence}%<br>
      判断：${w.desc}<br>
      建议：${w.tip}
    `;

    $('saveWeatherBtn').disabled = false;
    $('writeWithWeatherBtn').disabled = false;
    analyzeBtn.textContent = prevText;
    analyzeBtn.disabled = false;
  });

  $('saveWeatherBtn').addEventListener('click', () => {
    if (!state.pendingResult) return;
    state.weatherRecords.unshift({ id: uid(), ...state.pendingResult, ts: Date.now() });
    save();
    renderHero();
    renderWeatherList();
  });

  $('writeWithWeatherBtn').addEventListener('click', () => {
    const wt = state.pendingResult?.type || null;
    openNoteDialog(null, wt);
  });

  $('newNoteQuick').addEventListener('click', () => openNoteDialog());
  $('saveNote').addEventListener('click', saveNote);
  $('cancelNote').addEventListener('click', () => $('noteDialog').close());
  $('searchInput').addEventListener('input', renderNotes);
}

function init() {
  load();
  setup();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);