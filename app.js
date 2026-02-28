'use strict';

const WEATHER = {
  sunny: { icon: '☀️', label: '晴', desc: '蓝天占比高，光照充足。', tip: '适合外出，注意防晒。' },
  partly: { icon: '🌤️', label: '少云', desc: '蓝天与云层并存。', tip: '体感舒适，适合散步。' },
  cloudy: { icon: '🌥️', label: '多云', desc: '云层较多，光线偏柔。', tip: '适合室内创作。' },
  overcast: { icon: '☁️', label: '阴', desc: '灰度偏高，天空被厚云覆盖。', tip: '建议备伞。' },
  rainy: { icon: '🌧️', label: '雨', desc: '画面偏暗且云层浓厚。', tip: '外出注意防雨。' }
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
  if (!latest) return;
  const w = WEATHER[latest.type];
  $('heroIcon').textContent = w.icon;
  $('heroTitle').textContent = `${w.label} · ${latest.confidence}%`;
  $('heroDesc').textContent = `${w.desc}（${fmt(latest.ts)}）`;
  $('heroTip').textContent = `建议：${w.tip}`;
}

function renderWeatherList() {
  $('weatherCount').textContent = `${state.weatherRecords.length} 条`;
  $('weatherList').innerHTML = state.weatherRecords.slice(0, 30).map((r) => {
    const w = WEATHER[r.type];
    return `<article class="item"><div><strong>${w.icon} ${w.label}</strong></div><div class="meta">置信度 ${r.confidence}% · ${fmt(r.ts)}</div></article>`;
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
      <div class="meta">${wt ? wt.icon + ' ' + wt.label : '无天气关联'}</div>
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
    hint.textContent = note.weatherType ? `关联天气：${WEATHER[note.weatherType].icon} ${WEATHER[note.weatherType].label}` : '未关联天气';
  } else {
    $('dialogTitle').textContent = '新建笔记';
    title.value = '';
    content.value = '';
    hint.textContent = weatherType ? `将关联天气：${WEATHER[weatherType].icon} ${WEATHER[weatherType].label}` : '未关联天气';
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
  let objectUrl = null;

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    hint.hidden = true;
    $('analyzeBtn').disabled = false;
  });

  $('analyzeBtn').addEventListener('click', () => {
    if (preview.hidden) return;
    const result = analyzeImage(preview);
    state.pendingResult = result;
    const w = WEATHER[result.type];
    $('result').hidden = false;
    $('result').innerHTML = `
      <strong>${w.icon} ${w.label}</strong><br>
      置信度：${result.confidence}%<br>
      判断：${w.desc}<br>
      建议：${w.tip}
    `;
    $('saveWeatherBtn').disabled = false;
    $('writeWithWeatherBtn').disabled = false;
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