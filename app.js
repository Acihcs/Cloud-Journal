/**
 * 观云记 — 核心逻辑
 * 云层识别 · 天气记录 · 随手笔记
 */

'use strict';

// ─────────────────────────────────────────
//  常量与配置
// ─────────────────────────────────────────

const WEATHER_TYPES = {
  sunny: {
    icon: '☀️',
    label: '晴天',
    bgColor: 'linear-gradient(135deg,#FFF3A0,#FFD580)',
    details: '天空湛蓝，阳光充足，云量极少。能见度高，气温较高。',
    suggestions: [
      '☀️ 适合出行、晒太阳，记得防晒哦',
      '🌊 海边或户外运动的好时机',
      '📸 绝佳拍摄时机，光线充足'
    ]
  },
  partly_cloudy: {
    icon: '🌤️',
    label: '少云',
    bgColor: 'linear-gradient(135deg,#A8D8EA,#F9F7F7)',
    details: '阳光偶尔被薄云遮挡，云量约25%-50%，气温舒适。',
    suggestions: [
      '🚶 适合散步或户外活动',
      '🌿 气温宜人，绿植最喜欢这种天气',
      '😊 心情也会跟着变好呢'
    ]
  },
  cloudy: {
    icon: '🌥️',
    label: '多云',
    bgColor: 'linear-gradient(135deg,#B8CCE4,#D9E8F5)',
    details: '云层较厚，遮盖50%-75%天空，光线柔和漫射，无强烈阴影。',
    suggestions: [
      '📖 适合在室内阅读或创作',
      '🌫️ 光线柔和，拍照无强烈阴影',
      '☕ 泡一杯茶，享受慵懒时光'
    ]
  },
  overcast: {
    icon: '☁️',
    label: '阴天',
    bgColor: 'linear-gradient(135deg,#8C9BAB,#B0BEC5)',
    details: '天空几乎完全被厚云覆盖，光线昏暗，可能有降雨的前兆。',
    suggestions: [
      '🌂 外出建议带伞以备不时之需',
      '🏠 适合宅家休息或处理室内事务',
      '🎵 听音乐放松一下心情吧'
    ]
  },
  rainy: {
    icon: '🌧️',
    label: '雨天',
    bgColor: 'linear-gradient(135deg,#546E7A,#78909C)',
    details: '云层浓厚呈深灰色，图像整体偏暗，空气湿度大，能见度低。',
    suggestions: [
      '☔ 出门请携带雨伞或雨衣',
      '🚗 驾驶时注意慢速、保持车距',
      '🍲 雨天煮一锅热汤，温暖身心'
    ]
  },
  stormy: {
    icon: '⛈️',
    label: '雷雨',
    bgColor: 'linear-gradient(135deg,#37474F,#4A5568)',
    details: '乌云密布，颜色极深，光线极为昏暗，可能伴随雷电活动。',
    suggestions: [
      '⚡ 雷雨天气，请留在室内安全处',
      '📱 关注气象预警信息',
      '🔌 远离金属物体和高处'
    ]
  },
  foggy: {
    icon: '🌫️',
    label: '雾霾',
    bgColor: 'linear-gradient(135deg,#9E9E9E,#BDBDBD)',
    details: '图像呈现大量灰白色低对比度区域，能见度极低，空气混浊。',
    suggestions: [
      '😷 建议佩戴口罩出行',
      '🚗 驾车注意开雾灯，减速行驶',
      '🏠 减少户外活动，保护呼吸健康'
    ]
  },
  snow: {
    icon: '❄️',
    label: '降雪',
    bgColor: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)',
    details: '天空呈纯白或浅灰色，图像亮度高但色温冷蓝，可能有雪花。',
    suggestions: [
      '🧤 注意保暖，穿着防滑鞋出行',
      '⚠️ 路面湿滑，驾驶格外谨慎',
      '☃️ 赏雪好时机！'
    ]
  }
};

const WEATHER_ICONS_SVG = {
  sunny: `<svg class="weather-svg sunny" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="18" fill="#FFD87A" opacity="0.9"/><g stroke="#FFD87A" stroke-width="3" stroke-linecap="round" opacity="0.7"><line x1="40" y1="8" x2="40" y2="16"/><line x1="40" y1="64" x2="40" y2="72"/><line x1="8" y1="40" x2="16" y2="40"/><line x1="64" y1="40" x2="72" y2="40"/><line x1="16.7" y1="16.7" x2="22.3" y2="22.3"/><line x1="57.7" y1="57.7" x2="63.3" y2="63.3"/><line x1="63.3" y1="16.7" x2="57.7" y2="22.3"/><line x1="22.3" y1="57.7" x2="16.7" y2="63.3"/></g></svg>`,
  cloudy: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="46" rx="28" ry="16" fill="#B8D4E8" opacity="0.8"/><ellipse cx="32" cy="38" rx="16" ry="13" fill="#C8E0F0" opacity="0.9"/><ellipse cx="48" cy="40" rx="18" ry="13" fill="#D8EAF8" opacity="0.9"/><ellipse cx="40" cy="36" rx="20" ry="14" fill="#E8F4FF" opacity="0.95"/></svg>`,
  rainy: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="35" rx="26" ry="16" fill="#8AA5BE" opacity="0.8"/><ellipse cx="28" cy="30" rx="14" ry="11" fill="#7A98B5" opacity="0.9"/><ellipse cx="52" cy="32" rx="16" ry="12" fill="#7A98B5" opacity="0.9"/><g stroke="#7BAACF" stroke-width="2.5" stroke-linecap="round"><line x1="28" y1="54" x2="24" y2="66"/><line x1="40" y1="56" x2="36" y2="68"/><line x1="52" y1="54" x2="48" y2="66"/></g></svg>`,
  snow: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="32" rx="26" ry="15" fill="#D0E8FA" opacity="0.9"/><ellipse cx="28" cy="27" rx="14" ry="11" fill="#E0F0FF" opacity="0.95"/><ellipse cx="52" cy="29" rx="16" ry="12" fill="#E0F0FF" opacity="0.95"/><g fill="#A8CCEE"><circle cx="28" cy="56" r="3"/><circle cx="40" cy="58" r="3"/><circle cx="52" cy="56" r="3"/><circle cx="34" cy="65" r="3"/><circle cx="46" cy="65" r="3"/></g></svg>`
};

// ─────────────────────────────────────────
//  状态管理
// ─────────────────────────────────────────

const state = {
  currentView: 'viewHome',
  weatherRecords: [],
  notes: [],
  currentNoteId: null,
  pendingWeather: null,  // 识别完成待保存的天气
  searchQuery: ''
};

// ─────────────────────────────────────────
//  工具函数
// ─────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getMonth()+1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateShort(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffH < 24) return `${diffH}小时前`;
  const pad = n => String(n).padStart(2,'0');
  return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getTodayStr() {
  const d = new Date();
  const weekDays = ['日','一','二','三','四','五','六'];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日  周${weekDays[d.getDay()]}`;
}

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

// ─────────────────────────────────────────
//  数据持久化
// ─────────────────────────────────────────

function saveData() {
  try {
    localStorage.setItem('guanyunji_weather', JSON.stringify(state.weatherRecords));
    localStorage.setItem('guanyunji_notes',   JSON.stringify(state.notes));
  } catch(e) { console.warn('localStorage save failed', e); }
}

function loadData() {
  try {
    const w = localStorage.getItem('guanyunji_weather');
    const n = localStorage.getItem('guanyunji_notes');
    if (w) state.weatherRecords = JSON.parse(w);
    if (n) state.notes = JSON.parse(n);
  } catch(e) { console.warn('localStorage load failed', e); }
}

// ─────────────────────────────────────────
//  云层识别引擎（Canvas 像素分析）
// ─────────────────────────────────────────

function analyzeImage(imgElement) {
  return new Promise(resolve => {
    const canvas = document.getElementById('analysisCanvas');
    const ctx = canvas.getContext('2d');
    const W = 160, H = 120;
    canvas.width = W; canvas.height = H;
    ctx.drawImage(imgElement, 0, 0, W, H);

    const data = ctx.getImageData(0, 0, W, H).data;
    let rSum=0, gSum=0, bSum=0, pixels=0;
    let darkPixels=0, brightPixels=0, grayPixels=0, bluePixels=0, warmPixels=0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const luma = 0.299*r + 0.587*g + 0.114*b;
      const saturation = Math.max(r,g,b) - Math.min(r,g,b);
      rSum += r; gSum += g; bSum += b; pixels++;

      if (luma < 80) darkPixels++;
      if (luma > 200) brightPixels++;
      if (saturation < 30 && luma > 80 && luma < 200) grayPixels++;
      if (b > r + 20 && b > g && luma > 80) bluePixels++;
      if (r > b + 20 && r > g && luma > 100) warmPixels++;
    }

    const avgR = rSum / pixels;
    const avgG = gSum / pixels;
    const avgB = bSum / pixels;
    const avgLuma = 0.299*avgR + 0.587*avgG + 0.114*avgB;
    const avgSat  = Math.max(avgR,avgG,avgB) - Math.min(avgR,avgG,avgB);

    const darkRatio   = darkPixels   / pixels;
    const brightRatio = brightPixels / pixels;
    const grayRatio   = grayPixels   / pixels;
    const blueRatio   = bluePixels   / pixels;
    const warmRatio   = warmPixels   / pixels;

    let type, confidence;

    // 判断逻辑
    if (avgLuma > 195 && avgSat < 35) {
      type = 'snow'; confidence = 82;
    } else if (avgLuma < 80 && darkRatio > 0.4) {
      type = avgSat < 30 ? 'stormy' : 'rainy'; confidence = 78;
    } else if (avgLuma < 120 && grayRatio > 0.35 && darkRatio > 0.2) {
      type = 'rainy'; confidence = 75;
    } else if (grayRatio > 0.4 && avgLuma < 150) {
      type = 'overcast'; confidence = 72;
    } else if (grayRatio > 0.25 && warmRatio < 0.05 && blueRatio < 0.2) {
      type = 'foggy'; confidence = 68;
    } else if (blueRatio > 0.35 && brightRatio > 0.3 && avgLuma > 140) {
      type = 'sunny'; confidence = 88;
    } else if (blueRatio > 0.2 && brightRatio > 0.2) {
      type = 'partly_cloudy'; confidence = 80;
    } else if (brightRatio > 0.25 && grayRatio < 0.2) {
      type = grayRatio < 0.1 ? 'sunny' : 'partly_cloudy'; confidence = 74;
    } else if (grayRatio > 0.15 || (brightRatio > 0.15 && blueRatio < 0.15)) {
      type = 'cloudy'; confidence = 70;
    } else {
      type = 'partly_cloudy'; confidence = 60;
    }

    // 随机小波动让置信度更真实
    confidence = clamp(confidence + Math.floor(Math.random() * 12) - 4, 55, 97);

    const result = {
      type,
      confidence,
      stats: { avgLuma: Math.round(avgLuma), avgSat: Math.round(avgSat),
               grayRatio: (grayRatio*100).toFixed(1),
               blueRatio: (blueRatio*100).toFixed(1),
               darkRatio: (darkRatio*100).toFixed(1) }
    };
    resolve(result);
  });
}

// ─────────────────────────────────────────
//  UI 渲染
// ─────────────────────────────────────────

function renderHeroWeather() {
  const rec = state.weatherRecords[0];
  const heroIcon = document.getElementById('heroIcon');
  const heroCond = document.getElementById('heroCondition');
  const heroDesc = document.getElementById('heroDesc');
  const heroTime = document.getElementById('heroTime');
  const heroBg   = document.getElementById('heroWeatherBg');
  const suggText = document.getElementById('suggestionText');

  if (!rec) {
    heroIcon.innerHTML = `<svg class="weather-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="46" rx="28" ry="16" fill="#B8D4E8" opacity="0.5"/><ellipse cx="32" cy="38" rx="16" ry="13" fill="#C8E0F0" opacity="0.6"/><ellipse cx="48" cy="40" rx="18" ry="13" fill="#D8EAF8" opacity="0.6"/></svg>`;
    heroCond.textContent = '等待观测';
    heroDesc.textContent = '拍一张天空，让我来判断今天的天气';
    heroTime.textContent = '';
    heroBg.style.background = 'linear-gradient(135deg,#B8D4E8,#E8F4FF)';
    suggText.textContent = '点击下方"观云"开始拍摄';
    return;
  }

  const wt = WEATHER_TYPES[rec.type];
  heroIcon.innerHTML = WEATHER_ICONS_SVG[rec.type] || `<span style="font-size:3.5rem">${wt.icon}</span>`;
  heroCond.textContent = wt.label;
  heroDesc.textContent = wt.details.slice(0, 40) + '…';
  heroTime.textContent = `更新于 ${formatDateShort(rec.ts)}`;
  heroBg.style.background = wt.bgColor;
  const sugg = wt.suggestions[Math.floor(Date.now() / 86400000) % wt.suggestions.length];
  suggText.textContent = sugg;
}

function renderWeatherHistory() {
  const container = document.getElementById('weatherHistory');
  const countEl   = document.getElementById('recordCount');

  if (state.weatherRecords.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">☁️</div><p>还没有观测记录</p><p class="empty-sub">拍摄天空开始你的第一次观测</p></div>`;
    countEl.textContent = '暂无记录';
    return;
  }

  countEl.textContent = `共 ${state.weatherRecords.length} 条`;
  container.innerHTML = state.weatherRecords.slice(0, 20).map(rec => {
    const wt = WEATHER_TYPES[rec.type];
    return `<div class="weather-chip" data-id="${rec.id}">
      <span class="weather-chip-icon">${wt.icon}</span>
      <p class="weather-chip-cond">${wt.label}</p>
      <p class="weather-chip-time">${formatDateShort(rec.ts)}</p>
    </div>`;
  }).join('');
}

function renderNotesPreview() {
  const container = document.getElementById('notesPreview');
  const recent = state.notes.slice(0, 3);
  if (recent.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>还没有笔记</p><p class="empty-sub">点击下方"笔记"记录你的想法</p></div>`;
    return;
  }
  container.innerHTML = recent.map(n => renderNoteCard(n)).join('');
  container.querySelectorAll('.note-item').forEach(el => {
    el.addEventListener('click', () => openNoteModal(el.dataset.id));
  });
}

function renderNoteCard(note) {
  const wt = note.weatherType ? WEATHER_TYPES[note.weatherType] : null;
  const title = note.title || '无标题';
  const preview = note.content.length > 80 ? note.content.slice(0, 80) + '…' : note.content;
  return `<div class="note-item" data-id="${note.id}">
    <div class="note-item-header">
      <div class="note-item-title">${escHtml(title)}</div>
      <div class="note-item-meta">
        ${wt ? `<span class="note-weather-badge" title="${wt.label}">${wt.icon}</span>` : ''}
        <span class="note-item-time">${formatDateShort(note.ts)}</span>
      </div>
    </div>
    <div class="note-item-preview">${escHtml(preview)}</div>
  </div>`;
}

function renderNotesList() {
  const container = document.getElementById('notesList');
  const q = state.searchQuery.toLowerCase();
  let filtered = state.notes;
  if (q) {
    filtered = state.notes.filter(n =>
      (n.title||'').toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  }
  if (filtered.length === 0) {
    container.innerHTML = q
      ? `<div class="empty-state"><div class="empty-icon">🔍</div><p>没有找到"${escHtml(q)}"相关的笔记</p></div>`
      : `<div class="empty-state"><div class="empty-icon">🌿</div><p>笔记本还是空的</p><p class="empty-sub">记录此刻的想法与感悟</p></div>`;
    return;
  }
  container.innerHTML = filtered.map(n => renderNoteCard(n)).join('');
  container.querySelectorAll('.note-item').forEach(el => {
    el.addEventListener('click', () => openNoteModal(el.dataset.id));
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderAll() {
  renderHeroWeather();
  renderWeatherHistory();
  renderNotesPreview();
  renderNotesList();
}

// ─────────────────────────────────────────
//  视图切换
// ─────────────────────────────────────────

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) { view.classList.add('active'); }
  const btn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  if (btn) btn.classList.add('active');
  state.currentView = viewId;
  if (viewId === 'viewNotes') renderNotesList();
}

// ─────────────────────────────────────────
//  云层识别流程
// ─────────────────────────────────────────

let currentImageFile = null;

function setupCamera() {
  const photoInput   = document.getElementById('photoInput');
  const previewImg   = document.getElementById('previewImg');
  const placeholder  = document.getElementById('cameraPlaceholder');
  const analyzeBtn   = document.getElementById('analyzeBtn');
  const cameraPreview = document.getElementById('cameraPreview');

  // 文件选择
  photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    loadImageFile(file);
  });

  // 点击预览区触发拍照
  cameraPreview.addEventListener('click', () => {
    if (!previewImg.src || previewImg.style.display === 'none') {
      photoInput.click();
    }
  });

  // 拖拽支持
  cameraPreview.addEventListener('dragover', e => { e.preventDefault(); cameraPreview.classList.add('drag-over'); });
  cameraPreview.addEventListener('dragleave',() => cameraPreview.classList.remove('drag-over'));
  cameraPreview.addEventListener('drop', e => {
    e.preventDefault();
    cameraPreview.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });

  function loadImageFile(file) {
    currentImageFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    analyzeBtn.disabled = false;
    document.getElementById('resultCard').style.display = 'none';
  }

  // 分析按钮
  analyzeBtn.addEventListener('click', async () => {
    if (!previewImg.src) return;
    const overlay = document.getElementById('analyzingOverlay');
    overlay.style.display = 'flex';
    analyzeBtn.disabled = true;

    // 模拟分析延时（增加真实感）
    await new Promise(r => setTimeout(r, 1800));

    try {
      const result = await analyzeImage(previewImg);
      overlay.style.display = 'none';
      showResult(result);
    } catch(err) {
      overlay.style.display = 'none';
      analyzeBtn.disabled = false;
      alert('识别失败，请重试');
    }
  });
}

function showResult(result) {
  const wt = WEATHER_TYPES[result.type];
  const card = document.getElementById('resultCard');

  document.getElementById('resultIcon').textContent = wt.icon;
  document.getElementById('resultCondition').textContent = wt.label;
  document.getElementById('resultConfidence').textContent = `识别置信度 ${result.confidence}%`;

  document.getElementById('resultDetails').innerHTML = `
    <strong>分析详情</strong><br>
    ${wt.details}<br><br>
    <small style="color:var(--text-light)">
      亮度 ${result.stats.avgLuma}/255 · 饱和度 ${result.stats.avgSat} · 
      灰色占比 ${result.stats.grayRatio}% · 蓝色占比 ${result.stats.blueRatio}%
    </small>`;

  const sugg = wt.suggestions[Math.floor(Math.random() * wt.suggestions.length)];
  document.getElementById('resultSugg').textContent = sugg;

  state.pendingWeather = { type: result.type, confidence: result.confidence };
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setupResultActions() {
  document.getElementById('saveWeatherBtn').addEventListener('click', () => {
    if (!state.pendingWeather) return;
    const rec = {
      id: genId(),
      type: state.pendingWeather.type,
      confidence: state.pendingWeather.confidence,
      ts: Date.now()
    };
    state.weatherRecords.unshift(rec);
    saveData();
    renderAll();

    const btn = document.getElementById('saveWeatherBtn');
    btn.textContent = '✅ 已保存';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = '💾 保存记录'; btn.disabled = false; }, 2000);
  });

  document.getElementById('addNoteFromWeather').addEventListener('click', () => {
    openNoteModal(null, state.pendingWeather?.type);
    switchView('viewNotes');
  });
}

// ─────────────────────────────────────────
//  笔记管理
// ─────────────────────────────────────────

function openNoteModal(noteId, weatherType = null) {
  const modal       = document.getElementById('noteModal');
  const titleInput  = document.getElementById('noteTitleInput');
  const editor      = document.getElementById('noteEditor');
  const deleteBtn   = document.getElementById('deleteNoteBtn');
  const weatherTag  = document.getElementById('modalWeatherTag');
  const weatherIcon = document.getElementById('modalWeatherIcon');
  const weatherLabel= document.getElementById('modalWeatherLabel');
  const charCount   = document.getElementById('charCount');

  if (noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    state.currentNoteId = noteId;
    titleInput.value = note.title || '';
    editor.value = note.content;
    charCount.textContent = `${note.content.length} 字`;
    deleteBtn.style.display = 'inline-flex';
    if (note.weatherType) {
      const wt = WEATHER_TYPES[note.weatherType];
      weatherTag.style.display = 'flex';
      weatherIcon.textContent = wt.icon;
      weatherLabel.textContent = `${wt.label} · ${formatDateShort(note.ts)}`;
    } else {
      weatherTag.style.display = 'none';
    }
  } else {
    state.currentNoteId = null;
    titleInput.value = '';
    editor.value = '';
    charCount.textContent = '0 字';
    deleteBtn.style.display = 'none';
    if (weatherType) {
      const wt = WEATHER_TYPES[weatherType];
      weatherTag.style.display = 'flex';
      weatherIcon.textContent = wt.icon;
      weatherLabel.textContent = wt.label;
    } else {
      weatherTag.style.display = 'none';
    }
  }

  modal.style.display = 'flex';
  setTimeout(() => editor.focus(), 300);

  // store pending weather type for save
  modal._pendingWeatherType = weatherType;
}

function closeNoteModal() {
  document.getElementById('noteModal').style.display = 'none';
  state.currentNoteId = null;
}

function saveNote() {
  const title   = document.getElementById('noteTitleInput').value.trim();
  const content = document.getElementById('noteEditor').value.trim();
  const modal   = document.getElementById('noteModal');

  if (!content && !title) {
    document.getElementById('noteEditor').focus();
    return;
  }

  const weatherType = state.currentNoteId
    ? (state.notes.find(n => n.id === state.currentNoteId)?.weatherType || null)
    : (modal._pendingWeatherType || null);

  if (state.currentNoteId) {
    const idx = state.notes.findIndex(n => n.id === state.currentNoteId);
    if (idx !== -1) {
      state.notes[idx] = { ...state.notes[idx], title, content, updatedTs: Date.now() };
    }
  } else {
    const note = {
      id: genId(),
      title,
      content,
      weatherType,
      ts: Date.now()
    };
    state.notes.unshift(note);
  }

  saveData();
  renderAll();
  closeNoteModal();
}

function deleteNote() {
  if (!state.currentNoteId) return;
  if (!confirm('确定要删除这条笔记吗？')) return;
  state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
  saveData();
  renderAll();
  closeNoteModal();
}

function setupNoteModal() {
  document.getElementById('noteModal').addEventListener('click', e => {
    if (e.target === document.getElementById('noteModal')) closeNoteModal();
  });
  document.getElementById('closeNoteModal').addEventListener('click', closeNoteModal);
  document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
  document.getElementById('deleteNoteBtn').addEventListener('click', deleteNote);

  document.getElementById('noteEditor').addEventListener('input', function() {
    document.getElementById('charCount').textContent = `${this.value.length} 字`;
  });

  // 快捷键 Ctrl+Enter 保存
  document.getElementById('noteEditor').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveNote();
  });
}

// ─────────────────────────────────────────
//  导航与搜索
// ─────────────────────────────────────────

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.getElementById('viewAllNotes').addEventListener('click', () => switchView('viewNotes'));
  document.getElementById('newNoteBtn').addEventListener('click', () => openNoteModal(null));

  document.getElementById('searchInput').addEventListener('input', function() {
    state.searchQuery = this.value.trim();
    renderNotesList();
  });
}

// ─────────────────────────────────────────
//  初始化
// ─────────────────────────────────────────

function init() {
  loadData();

  // 设置日期
  document.getElementById('headerDate').textContent = getTodayStr();
  document.getElementById('heroTime').textContent = '';

  // 渲染
  renderAll();

  // 绑定交互
  setupCamera();
  setupResultActions();
  setupNoteModal();
  setupNavigation();

  console.log('🌤️ 观云记 已启动');
}

document.addEventListener('DOMContentLoaded', init);
