// ═══════════════════════════════════════════════════════════
//  GILMAR DASHBOARD — app.js
//  Lógica completa + integração Supabase
// ═══════════════════════════════════════════════════════════

// ──────────────────────────────────────────
// SUPABASE INIT
// ──────────────────────────────────────────
let sb = null;
try {
  if (SUPABASE_URL !== 'COLE_SUA_URL_AQUI') {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    console.log('✅ Supabase conectado');
  } else {
    console.warn('⚠️ Supabase não configurado. Usando localStorage.');
  }
} catch(e) {
  console.warn('Supabase não disponível:', e);
}

function setSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = 'sync-dot sync-' + status;
  el.title = { idle:'Offline', saving:'Salvando...', ok:'Sincronizado', error:'Erro ao salvar' }[status] || '';
}

// ──────────────────────────────────────────
// ESTADO LOCAL (fallback quando offline)
// ──────────────────────────────────────────
const LOCAL = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem('g_local') || '{}'); } catch(e) {}
  return {
    get: k => d[k],
    set: (k, v) => { d[k] = v; try { localStorage.setItem('g_local', JSON.stringify(d)); } catch(e) {} },
    all: () => ({ ...d })
  };
})();

// ──────────────────────────────────────────
// SAVE / LOAD (Supabase com fallback local)
// ──────────────────────────────────────────
let saveTimer = null;
function schedSave(key, value) {
  LOCAL.set(key, value);
  if (!sb) return;
  clearTimeout(saveTimer);
  setSyncStatus('saving');
  saveTimer = setTimeout(() => doSave(key, value), 800);
}

async function doSave(key, value) {
  if (!sb) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    await sb.from('dashboard_state').upsert({
      user_id: USER_ID,
      date: today,
      key: key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date,key' });
    setSyncStatus('ok');
    setTimeout(() => setSyncStatus('idle'), 3000);
  } catch (e) {
    console.error('Save error:', e);
    setSyncStatus('error');
  }
}

async function loadTodayState() {
  if (!sb) { setSyncStatus('idle'); return; }
  try {
    setSyncStatus('saving');
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await sb
      .from('dashboard_state')
      .select('key, value')
      .eq('user_id', USER_ID)
      .eq('date', today);
    if (error) throw error;
    if (data && data.length > 0) {
      data.forEach(row => {
        try { LOCAL.set(row.key, JSON.parse(row.value)); } catch(e) {}
      });
    }
    setSyncStatus('ok');
    setTimeout(() => setSyncStatus('idle'), 2000);
  } catch (e) {
    console.error('Load error:', e);
    setSyncStatus('error');
  }
}

async function loadStreakAndHistory() {
  if (!sb) return;
  try {
    const { data } = await sb
      .from('daily_summary')
      .select('date, tasks_done, tasks_total, efficiency_pct')
      .eq('user_id', USER_ID)
      .order('date', { ascending: false })
      .limit(60);
    if (data && data.length > 0) {
      // Calculate streak
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < data.length; i++) {
        const d = new Date(data[i].date);
        const diff = Math.round((today - d) / 86400000);
        if (diff === i && data[i].tasks_done > 0) streak++;
        else break;
      }
      if (streak > 0) {
        document.getElementById('s-streak').textContent = streak;
        localStorage.setItem('g_streak', streak);
      }
    }
  } catch(e) {}
}

async function saveDailySummary() {
  if (!sb) return;
  const all  = document.querySelectorAll('#page-rotina .task-card').length;
  const done = document.querySelectorAll('#page-rotina .task-card.done').length;
  const pct  = all > 0 ? Math.round(done / all * 100) : 0;
  try {
    const today = new Date().toISOString().slice(0, 10);
    await sb.from('daily_summary').upsert({
      user_id: USER_ID,
      date: today,
      tasks_done: done,
      tasks_total: all,
      efficiency_pct: pct,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });
  } catch(e) {}
}

// ──────────────────────────────────────────
// QUOTES
// ──────────────────────────────────────────
const QUOTES = [
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.", author: "David Goggins", color: "#8B2E42" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins", color: "#8B2E42" },
  { text: "The most important conversations you'll ever have are the ones you'll have with yourself.", author: "David Goggins", color: "#8B2E42" },
  { text: "Motivation is crap. Motivation comes and goes. When you're driven, whatever is in front of you will get destroyed.", author: "David Goggins", color: "#8B2E42" },
  { text: "You have to build calluses on your brain just like how you build calluses on your hands.", author: "David Goggins", color: "#8B2E42" },
  { text: "The most powerful weapon on earth is the human soul on fire.", author: "David Goggins", color: "#8B2E42" },
  { text: "Only you can master your mind, which is what it takes to live a bold life filled with accomplishments most people consider beyond their capability.", author: "David Goggins", color: "#8B2E42" },
  { text: "Posso fazer tudo através daquele que me fortalece.", author: "Filipenses 4:13", color: "#1D4A42" },
  { text: "Tudo o que você fizer, façam de todo o coração, como se fosse para o Senhor.", author: "Colossenses 3:23", color: "#1D4A42" },
  { text: "Seja forte e corajoso! Não se apavore, nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.", author: "Josué 1:9", color: "#1D4A42" },
  { text: "Comprometei vossos atos ao Senhor e vossos planos se realizarão.", author: "Provérbios 16:3", color: "#1D4A42" },
  { text: "O que é impossível para os homens é possível para Deus.", author: "Lucas 18:27", color: "#1D4A42" },
  { text: "Não vo-lo digo somente por causa da necessidade, pois aprendi a estar contente em qualquer estado em que me encontre.", author: "Filipenses 4:11", color: "#1D4A42" },
];

let qIdx = 0;
function renderQuoteDots() {
  const c = document.getElementById('qdots');
  c.innerHTML = '';
  QUOTES.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'qdot' + (i === qIdx ? ' active' : '');
    d.onclick = () => { qIdx = i; showQuote(); };
    c.appendChild(d);
  });
}
function showQuote() {
  const q = QUOTES[qIdx];
  const isScripture = !q.author.includes('Goggins');
  document.getElementById('quote-src').innerHTML =
    (isScripture ? 'Escrituras' : 'Goggins') +
    '<span style="flex:1;height:1px;background:rgba(255,255,255,0.1);margin-left:10px;display:inline-block"></span>';
  const el = document.getElementById('quote-text');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = '\u201C' + q.text + '\u201D';
    el.style.opacity = '1';
    document.getElementById('quote-author').textContent = '\u2014 ' + q.author;
    document.getElementById('quote-author').style.color = q.color;
  }, 200);
  renderQuoteDots();
}
function initQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  qIdx = Math.floor((new Date() - start) / 86400000) % QUOTES.length;
  showQuote();
}
setInterval(() => { qIdx = (qIdx + 1) % QUOTES.length; showQuote(); }, 30000);

// ──────────────────────────────────────────
// SCHEDULE
// ──────────────────────────────────────────
const DAY_NAMES = {
  seg:'Segunda-feira', ter:'Terça-feira', qua:'Quarta-feira',
  qui:'Quinta-feira',  sex:'Sexta-feira', sab:'Sábado', dom:'Domingo'
};

const SCHED = {
  manha: [
    { n:'Estudo de inglês',      s:'Listening + vocabulário',          d:'30 min', a:'06:00', c:'var(--teal)'  },
    { n:'Leitura do livro',      s:'20 páginas mínimo',                d:'30 min', a:'06:30', c:'var(--earth)' },
    { n:'Estudo de guitarra',    s:'Escalas + música em estudo',       d:'45 min', a:'07:00', c:'var(--wine)'  },
    { n:'Treino físico',         s:'Academia / funcional',             d:'60 min', a:'07:45', c:'var(--wine)'  },
    { n:'Café da manhã & dieta', s:'Protocolo alimentar',              d:'20 min', a:'09:00', c:'var(--earth)' },
  ],
  tarde: [
    { n:'Foco — Insid360',       s:'Campanhas, relatórios, reuniões',  d:'3h',     a:'13:00', c:'var(--teal)'  },
    { n:'Revisão de métricas',   s:'Google/Meta Ads — todos projetos', d:'45 min', a:'16:00', c:'var(--teal)'  },
  ],
  noite: [
    { n:'Leitura noturna',       s:'15 páginas antes de dormir',       d:'20 min', a:'21:30', c:'var(--earth)' },
    { n:'Revisão do dia',        s:'O que fiz / fica para amanhã',     d:'10 min', a:'22:00', c:'var(--muted)' },
  ]
};

let currentDay = 'seg';
let notifOn    = false;
const FIRED    = {};

// ──────────────────────────────────────────
// RENDER TASKS
// ──────────────────────────────────────────
function renderTasks(day) {
  ['manha', 'tarde', 'noite'].forEach(p => {
    const el = document.getElementById('t-' + p);
    if (!el) return;
    el.innerHTML = '';
    SCHED[p].forEach((t, i) => {
      const key  = `task-${day}-${p}-${i}`;
      const done = LOCAL.get(key);
      const card = document.createElement('div');
      card.className = 'task-card' + (done ? ' done' : '');
      card.style.borderLeftColor = t.c;
      card.innerHTML = `
        <div class="tc-check">${done ? '✓' : ''}</div>
        <div class="tc-info">
          <div class="tc-name">${t.n}</div>
          <div class="tc-sub">${t.s}</div>
        </div>
        <div class="tc-alarm">${t.a}</div>
        <div class="tc-dur">${t.d}</div>`;
      card.onclick = () => {
        const nv = !LOCAL.get(key);
        LOCAL.set(key, nv);
        schedSave(key, nv);
        renderTasks(day);
        calcStats();
        saveDailySummary();
      };
      el.appendChild(card);
    });
  });
  calcStats();
}

function toggleCard(el) {
  el.classList.toggle('done');
  const c = el.querySelector('.tc-check');
  c.textContent = el.classList.contains('done') ? '✓' : '';
  calcStats();
}

function toggleGoal(el) {
  el.classList.toggle('done');
  el.querySelector('.gc-check').textContent = el.classList.contains('done') ? '✓' : '';
}

// ──────────────────────────────────────────
// STATS
// ──────────────────────────────────────────
function calcStats() {
  const all  = document.querySelectorAll('#page-rotina .task-card').length;
  const done = document.querySelectorAll('#page-rotina .task-card.done').length;
  document.getElementById('s-total').textContent = all;
  document.getElementById('s-done').textContent  = done;
  document.getElementById('s-left').textContent  = all - done;
  document.getElementById('s-pct').textContent   = all > 0 ? Math.round(done / all * 100) + '%' : '0%';
}

// ──────────────────────────────────────────
// DAY SELECT
// ──────────────────────────────────────────
function selDay(btn, day) {
  document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentDay = day;
  document.getElementById('pg-day-title').textContent = DAY_NAMES[day];
  renderTasks(day);
}

function autoSelectToday() {
  const keys = ['dom','seg','ter','qua','qui','sex','sab'];
  const k    = keys[new Date().getDay()];
  const btn  = document.querySelector(`.ds-btn[onclick*="'${k}'"]`);
  if (btn) {
    document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  currentDay = k;
  document.getElementById('pg-day-title').textContent = DAY_NAMES[k];
}

// ──────────────────────────────────────────
// TABS
// ──────────────────────────────────────────
function goTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tnav').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('t-' + name).classList.add('active');
}

// ──────────────────────────────────────────
// CLOCK & DAY PROGRESS
// ──────────────────────────────────────────
function tick() {
  const n   = new Date();
  const hms = n.toTimeString().slice(0, 8);
  document.getElementById('tb-clock').textContent = hms.slice(0, 5);
  const dm = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const mo = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  document.getElementById('tb-date').textContent =
    `${dm[n.getDay()]} ${n.getDate()} ${mo[n.getMonth()]}`;

  const start = 5*60+30, end = 23*60, cur = n.getHours()*60 + n.getMinutes();
  const pct   = Math.min(100, Math.max(0, Math.round((cur - start) / (end - start) * 100)));
  document.getElementById('dp-fill').style.width = pct + '%';
  document.getElementById('dp-pct').textContent  = pct + '%';

  // Alarm check
  if (notifOn) {
    const ts = hms.slice(0, 5);
    const dk = ['dom','seg','ter','qua','qui','sex','sab'][n.getDay()];
    ['manha','tarde','noite'].forEach(p => {
      SCHED[p].forEach((t, i) => {
        const fk = `alarm-${dk}-${p}-${i}`;
        if (t.a === ts && !FIRED[fk]) {
          FIRED[fk] = true;
          showPopup(t.n, t.s + ' · ' + t.d);
          if (Notification.permission === 'granted') {
            new Notification('Gilmar — ' + t.n, { body: t.s });
          }
        }
      });
    });
  }
}
setInterval(tick, 1000);
tick();

// ──────────────────────────────────────────
// HABITS
// ──────────────────────────────────────────
const HABITS = [
  { l:'Inglês',   c:'var(--teal)'  },
  { l:'Leitura',  c:'var(--earth)' },
  { l:'Guitarra', c:'var(--wine)'  },
  { l:'Treino',   c:'var(--wine)'  },
  { l:'Dieta',    c:'var(--earth)' },
  { l:'Oração',   c:'var(--teal)'  },
  { l:'Gratidão', c:'var(--teal)'  },
];
const DDAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

function renderHabits() {
  const wrap = document.getElementById('habit-grid');
  // Header row
  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;gap:10px;padding-bottom:8px;border-bottom:1px solid var(--border2);margin-bottom:4px;';
  hdr.innerHTML = '<div style="width:82px;flex-shrink:0"></div><div style="display:flex;gap:4px">' +
    DDAYS.map(d => `<div style="width:30px;text-align:center;font-size:8px;letter-spacing:1px;font-weight:600;color:var(--muted);text-transform:uppercase">${d}</div>`).join('') +
    '</div>';
  wrap.appendChild(hdr);

  HABITS.forEach((h, hi) => {
    const row  = document.createElement('div');
    row.className = 'habit-row-wrap';
    const lbl  = document.createElement('div');
    lbl.className = 'hr-label';
    lbl.textContent = h.l;
    row.appendChild(lbl);
    const days = document.createElement('div');
    days.className = 'hr-days';
    DDAYS.forEach((_, di) => {
      const k  = `h-${hi}-${di}`;
      const on = LOCAL.get(k);
      const cell = document.createElement('div');
      cell.className = 'hcell' + (on ? ' on' : '');
      if (on) { cell.style.background = h.c; cell.style.borderColor = h.c; }
      cell.onclick = () => {
        const nv = !LOCAL.get(k);
        LOCAL.set(k, nv);
        schedSave(k, nv);
        cell.classList.toggle('on', nv);
        cell.style.background  = nv ? h.c : '';
        cell.style.borderColor = nv ? h.c : '';
      };
      days.appendChild(cell);
    });
    row.appendChild(days);
    wrap.appendChild(row);
  });
}

// ──────────────────────────────────────────
// RINGS (Inglês)
// ──────────────────────────────────────────
const RING_DEFS = [
  { l:'Listening', c:'var(--teal)',  k:'ring-ls', v:50 },
  { l:'Vocab',     c:'var(--earth)', k:'ring-vc', v:25 },
  { l:'Speaking',  c:'var(--wine)',  k:'ring-sp', v:60 },
  { l:'Grammar',   c:'#2A6659',      k:'ring-gr', v:40 },
];

function renderRings() {
  const wrap = document.getElementById('rings-ingles');
  RING_DEFS.forEach(r => {
    const v    = parseInt(LOCAL.get(r.k) || r.v);
    const circ = 2 * Math.PI * 26;
    const off  = circ * (1 - v / 100);
    const card = document.createElement('div');
    card.className = 'ring-card';
    card.innerHTML = `
      <div class="ring-svg-wrap">
        <svg class="rr" width="64" height="64">
          <circle class="rr-track" cx="32" cy="32" r="26" stroke-width="4"/>
          <circle class="rr-fill" cx="32" cy="32" r="26" stroke-width="4"
            stroke="${r.c}" stroke-dasharray="${circ.toFixed(1)}"
            stroke-dashoffset="${off.toFixed(1)}" id="rc-${r.k}"/>
        </svg>
        <div class="ring-num" style="color:${r.c}" id="rn-${r.k}">${v}%</div>
      </div>
      <div class="ring-name">${r.l}</div>
      <input type="range" class="ring-slider" min="0" max="100" value="${v}"
        style="accent-color:${r.c};width:100%" data-key="${r.k}" data-circ="${circ.toFixed(1)}">`;
    card.querySelector('input').oninput = function () {
      const nv = parseInt(this.value);
      const nc = parseFloat(this.dataset.circ);
      document.getElementById('rc-' + this.dataset.key).setAttribute('stroke-dashoffset', (nc * (1 - nv / 100)).toFixed(1));
      document.getElementById('rn-' + this.dataset.key).textContent = nv + '%';
      LOCAL.set(this.dataset.key, nv);
      schedSave(this.dataset.key, nv);
    };
    wrap.appendChild(card);
  });
}

// ──────────────────────────────────────────
// READING WEEK
// ──────────────────────────────────────────
function renderReadWeek() {
  const wrap = document.getElementById('rw-row');
  DDAYS.forEach((d, i) => {
    const k   = `rw-${i}`;
    const on  = LOCAL.get(k);
    const cell = document.createElement('div');
    cell.className = 'rw-cell' + (on ? ' on' : '');
    cell.innerHTML = `<div class="rw-day">${d.charAt(0)}</div>`;
    cell.onclick = () => {
      const nv = !LOCAL.get(k);
      LOCAL.set(k, nv);
      schedSave(k, nv);
      cell.classList.toggle('on', nv);
    };
    wrap.appendChild(cell);
  });
}

// ──────────────────────────────────────────
// BOOK META
// ──────────────────────────────────────────
function saveBookMeta() {
  const t = document.getElementById('book-title').value;
  const a = document.getElementById('book-author').value;
  LOCAL.set('book-title', t);
  LOCAL.set('book-author', a);
  schedSave('book-title', t);
  schedSave('book-author', a);
}

function bkProg(v) {
  document.getElementById('bk-fill').style.width = v + '%';
  document.getElementById('bk-pct').textContent  = v + '%';
  LOCAL.set('book-progress', v);
  schedSave('book-progress', v);
}

function loadBookMeta() {
  const t = LOCAL.get('book-title');
  const a = LOCAL.get('book-author');
  const p = LOCAL.get('book-progress') || 0;
  if (t) document.getElementById('book-title').value  = t;
  if (a) document.getElementById('book-author').value = a;
  document.getElementById('bk-range').value = p;
  bkProg(p);
}

// ──────────────────────────────────────────
// MEALS
// ──────────────────────────────────────────
function renderMeals() {
  const wrap = document.getElementById('meals-wrap');
  ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'].forEach((m, i) => {
    const k   = `meal-${i}`;
    const on  = LOCAL.get(k);
    const row = document.createElement('div');
    row.className = 'meal-row';
    row.innerHTML = `
      <span class="meal-name">${m}</span>
      <span class="meal-status" style="color:${on ? 'var(--teal)' : 'var(--stone-dk)'}" id="ms-${i}">${on ? 'Feito' : '—'}</span>`;
    row.onclick = () => {
      const nv = !LOCAL.get(k);
      LOCAL.set(k, nv);
      schedSave(k, nv);
      const el = document.getElementById('ms-' + i);
      el.textContent  = nv ? 'Feito' : '—';
      el.style.color  = nv ? 'var(--teal)' : 'var(--stone-dk)';
    };
    wrap.appendChild(row);
  });
}

// ──────────────────────────────────────────
// WATER
// ──────────────────────────────────────────
let waterMl = parseInt(LOCAL.get('water') || '0');

function syncWaterUI() {
  const p = waterMl / 3000 * 100;
  document.getElementById('w-bar').style.width = p + '%';
  document.getElementById('w-lbl').textContent = waterMl + ' / 3000ml';
}
function addWater(ml) {
  waterMl = Math.min(3000, waterMl + ml);
  LOCAL.set('water', waterMl);
  schedSave('water', waterMl);
  syncWaterUI();
  if (waterMl >= 3000) showPopup('Hidratação completa', '3L atingidos. Excelente disciplina.');
}
function resetWater() {
  waterMl = 0;
  LOCAL.set('water', 0);
  schedSave('water', 0);
  syncWaterUI();
}

// ──────────────────────────────────────────
// STREAK
// ──────────────────────────────────────────
function calcStreak() {
  const today = new Date().toDateString();
  const last  = localStorage.getItem('g_last');
  let s = parseInt(localStorage.getItem('g_streak') || '1');
  if (last !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    s = last === y.toDateString() ? s + 1 : 1;
    localStorage.setItem('g_streak', s);
    localStorage.setItem('g_last', today);
  }
  document.getElementById('s-streak').textContent = s;
}

// ──────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────
function showPopup(title, body) {
  document.getElementById('popup-title').textContent = title;
  document.getElementById('popup-body').textContent  = body;
  const p = document.getElementById('popup');
  p.classList.add('show');
  setTimeout(() => p.classList.remove('show'), 5500);
}

async function reqNotif() {
  if (!('Notification' in window)) {
    showPopup('Não suportado', 'Use Chrome no Android para notificações.'); return;
  }
  const r   = await Notification.requestPermission();
  const btn = document.getElementById('notif-btn');
  if (r === 'granted') {
    notifOn = true;
    btn.textContent = '🔔 Alertas On';
    btn.classList.add('on');
    showPopup('Alertas ativados', 'Você será lembrado nos horários da rotina.');
    new Notification('Gilmar Dashboard', { body: 'Sistema de lembretes ativo.' });
  } else {
    showPopup('Acesso negado', 'Permita notificações nas configurações do navegador.');
  }
}

// ──────────────────────────────────────────
// SERVICE WORKER (PWA offline)
// ──────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ──────────────────────────────────────────
// BOOT
// ──────────────────────────────────────────
async function boot() {
  setSyncStatus('idle');
  initQuote();
  autoSelectToday();

  // Load cloud state first, then render
  await loadTodayState();

  renderTasks(currentDay);
  renderHabits();
  renderRings();
  renderReadWeek();
  renderMeals();
  loadBookMeta();
  syncWaterUI();
  calcStreak();
  calcStats();

  // Load streak from history
  loadStreakAndHistory();

  // Welcome message
  setTimeout(() => {
    const h  = new Date().getHours();
    const gr = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    showPopup(gr + ', Gilmar.', 'Seu dia está carregado. A disciplina é o caminho.');
  }, 800);
}

boot();
