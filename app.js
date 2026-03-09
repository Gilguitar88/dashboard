// ═══════════════════════════════════════════════════════════
//  GILMAR // OPS — app.js
// ═══════════════════════════════════════════════════════════

// ── SUPABASE ──
let sb = null;
try {
  if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'COLE_SUA_URL_AQUI') {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
} catch(e) {}

function setSyncStatus(s) {
  const el = document.getElementById('sync-dot');
  if (!el) return;
  el.className = 'sdot sdot-' + s;
}

// ── LOCAL STATE ──
const LOCAL = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem('g_ops') || '{}'); } catch(e) {}
  return {
    get: k => d[k],
    set: (k,v) => { d[k]=v; try { localStorage.setItem('g_ops', JSON.stringify(d)); } catch(e) {} },
  };
})();

// ── SAVE TO SUPABASE ──
let saveTimer = null;
function schedSave(key, value) {
  LOCAL.set(key, value);
  if (!sb) return;
  clearTimeout(saveTimer);
  setSyncStatus('saving');
  saveTimer = setTimeout(() => doSave(key, value), 900);
}
async function doSave(key, value) {
  if (!sb) return;
  try {
    const today = new Date().toISOString().slice(0,10);
    await sb.from('dashboard_state').upsert(
      { user_id: USER_ID, date: today, key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,key' }
    );
    setSyncStatus('ok');
    setTimeout(() => setSyncStatus('idle'), 3000);
  } catch(e) { setSyncStatus('error'); }
}
async function loadTodayState() {
  if (!sb) { setSyncStatus('idle'); return; }
  try {
    setSyncStatus('saving');
    const today = new Date().toISOString().slice(0,10);
    const { data } = await sb.from('dashboard_state').select('key,value').eq('user_id', USER_ID).eq('date', today);
    if (data) data.forEach(r => { try { LOCAL.set(r.key, JSON.parse(r.value)); } catch(e) {} });
    setSyncStatus('ok');
    setTimeout(() => setSyncStatus('idle'), 2000);
  } catch(e) { setSyncStatus('error'); }
}
async function saveDailySummary() {
  if (!sb) return;
  const all  = document.querySelectorAll('#page-rotina .task-card').length;
  const done = document.querySelectorAll('#page-rotina .task-card.done').length;
  const pct  = all > 0 ? Math.round(done/all*100) : 0;
  try {
    const today = new Date().toISOString().slice(0,10);
    await sb.from('daily_summary').upsert(
      { user_id: USER_ID, date: today, tasks_done: done, tasks_total: all, efficiency_pct: pct, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    );
  } catch(e) {}
}

// ── QUOTES ──
const QUOTES = [
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "The most important conversations you'll ever have are the ones you'll have with yourself.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Motivation is crap. Motivation comes and goes. When you're driven, whatever is in front of you will get destroyed.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "You have to build calluses on your brain just like how you build calluses on your hands.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "The most powerful weapon on earth is the human soul on fire.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Only you can master your mind, which is what it takes to live a bold life filled with accomplishments most people consider beyond their capability.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Posso fazer tudo através daquele que me fortalece.", author: "FILIPENSES 4:13", type: "ESCRITURA" },
  { text: "Tudo o que você fizer, façam de todo o coração, como se fosse para o Senhor.", author: "COLOSSENSES 3:23", type: "ESCRITURA" },
  { text: "Seja forte e corajoso! Não se apavore, pois o Senhor, o seu Deus, estará com você por onde você andar.", author: "JOSUÉ 1:9", type: "ESCRITURA" },
  { text: "Comprometei vossos atos ao Senhor e vossos planos se realizarão.", author: "PROVÉRBIOS 16:3", type: "ESCRITURA" },
  { text: "O que é impossível para os homens é possível para Deus.", author: "LUCAS 18:27", type: "ESCRITURA" },
  { text: "Aprendi a estar contente em qualquer estado em que me encontre.", author: "FILIPENSES 4:11", type: "ESCRITURA" },
];

let qIdx = 0;
function showQuote() {
  const q = QUOTES[qIdx];
  const el = document.getElementById('quote-text');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = '\u201C' + q.text + '\u201D';
    el.style.opacity = '1';
    document.getElementById('quote-author').textContent = '\u2014 ' + q.author;
    document.getElementById('qh-tag').textContent = q.type;
    document.getElementById('qh-count').textContent = (qIdx+1) + ' / ' + QUOTES.length;
  }, 200);
}
function nextQuote() { qIdx = (qIdx+1) % QUOTES.length; showQuote(); }
function prevQuote() { qIdx = (qIdx - 1 + QUOTES.length) % QUOTES.length; showQuote(); }
function initQuote() {
  const start = new Date(new Date().getFullYear(),0,0);
  qIdx = Math.floor((new Date()-start)/86400000) % QUOTES.length;
  showQuote();
}
setInterval(nextQuote, 30000);

// ── SCHEDULE ──
const DAYS = { seg:'SEGUNDA-FEIRA', ter:'TERÇA-FEIRA', qua:'QUARTA-FEIRA', qui:'QUINTA-FEIRA', sex:'SEXTA-FEIRA', sab:'SÁBADO', dom:'DOMINGO' };
const SCHED = {
  manha: [
    { n:'Estudo de inglês',      s:'LISTENING + VOCABULÁRIO',          d:'30MIN', a:'06:00' },
    { n:'Leitura do livro',      s:'20 PÁGINAS MÍNIMO',                d:'30MIN', a:'06:30' },
    { n:'Estudo de guitarra',    s:'ESCALAS + MÚSICA EM ESTUDO',       d:'45MIN', a:'07:00' },
    { n:'Treino físico',         s:'ACADEMIA / FUNCIONAL',             d:'60MIN', a:'07:45' },
    { n:'Café da manhã & dieta', s:'PROTOCOLO ALIMENTAR',              d:'20MIN', a:'09:00' },
  ],
  tarde: [
    { n:'Foco — Insid360',       s:'CAMPANHAS · RELATÓRIOS · REUNIÕES', d:'3H',   a:'13:00' },
    { n:'Revisão de métricas',   s:'GOOGLE/META ADS — TODOS PROJETOS', d:'45MIN', a:'16:00' },
  ],
  noite: [
    { n:'Leitura noturna',       s:'15 PÁGINAS ANTES DE DORMIR',       d:'20MIN', a:'21:30' },
    { n:'Revisão do dia',        s:'O QUE FIZ / FICA PARA AMANHÃ',     d:'10MIN', a:'22:00' },
  ],
};

let currentDay = 'seg';
let notifOn = false;
const FIRED = {};

// ── RENDER TASKS ──
const PERIOD_COLORS = { manha: 'var(--amber)', tarde: '#38bdf8', noite: 'var(--neon)' };

function renderTasks(day) {
  ['manha','tarde','noite'].forEach(p => {
    const el = document.getElementById('t-'+p);
    if (!el) return;
    el.innerHTML = '';
    SCHED[p].forEach((t, i) => {
      const key  = `task-${day}-${p}-${i}`;
      const done = LOCAL.get(key);
      const card = document.createElement('div');
      card.className = 'task-card' + (done ? ' done' : '');
      card.style.setProperty('--lc', PERIOD_COLORS[p]);
      card.innerHTML = `
        <div class="tck">${done ? '✓' : ''}</div>
        <div class="tb2"><div class="tn">${t.n}</div><div class="ts2">${t.s}</div></div>
        <div class="tt">${t.a}</div>
        <div class="td">${t.d}</div>`;
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
  el.querySelector('.tck').textContent = el.classList.contains('done') ? '✓' : '';
  calcStats();
}
function toggleGoal(el) {
  el.classList.toggle('done');
  el.querySelector('.gck').textContent = el.classList.contains('done') ? '✓' : '';
}

// ── STATS ──
function calcStats() {
  const all  = document.querySelectorAll('#page-rotina .task-card').length;
  const done = document.querySelectorAll('#page-rotina .task-card.done').length;
  document.getElementById('s-total').textContent = all;
  document.getElementById('s-done').textContent  = done;
  document.getElementById('s-left').textContent  = all - done;
  document.getElementById('s-pct').textContent   = all > 0 ? Math.round(done/all*100)+'%' : '0%';
}

// ── DAY SELECT ──
function selDay(btn, day) {
  document.querySelectorAll('.ds').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentDay = day;
  document.getElementById('pg-day-title').textContent = DAYS[day];
  renderTasks(day);
}
function autoSelectToday() {
  const keys = ['dom','seg','ter','qua','qui','sex','sab'];
  const k = keys[new Date().getDay()];
  const btn = document.querySelector(`.ds[onclick*="'${k}'"]`);
  if (btn) { document.querySelectorAll('.ds').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
  currentDay = k;
  document.getElementById('pg-day-title').textContent = DAYS[k];
}

// ── TABS ──
function goTab(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tnav').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('t-'+name).classList.add('active');
}

// ── CLOCK + DAY PROGRESS ──
function tick() {
  const n   = new Date();
  const hm  = n.toTimeString().slice(0,5);
  const hms = n.toTimeString().slice(0,8);
  document.getElementById('tb-clock').textContent = hm;
  const dm = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const mo = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  document.getElementById('tb-date').textContent = `${dm[n.getDay()]} ${n.getDate()} ${mo[n.getMonth()]}`;

  const start=5*60+30, end=23*60, cur=n.getHours()*60+n.getMinutes();
  const pct = Math.min(100, Math.max(0, Math.round((cur-start)/(end-start)*100)));
  document.getElementById('db-fill').style.width  = pct+'%';
  document.getElementById('db-head').style.left   = pct+'%';
  document.getElementById('db-pct').textContent   = pct+'%';

  // Alarms
  if (notifOn) {
    const dk = ['dom','seg','ter','qua','qui','sex','sab'][n.getDay()];
    ['manha','tarde','noite'].forEach(p => {
      SCHED[p].forEach((t,i) => {
        const fk = `alarm-${dk}-${p}-${i}`;
        if (t.a === hm && !FIRED[fk]) {
          FIRED[fk] = true;
          showPopup(t.n, t.s + ' · ' + t.d);
          if (Notification.permission==='granted') new Notification('OPS: '+t.n, { body: t.s });
        }
      });
    });
  }
}
setInterval(tick, 1000);
tick();

// ── HABITS ──
const HABITS = [
  { l:'Inglês',   c:'var(--neon)'  },
  { l:'Leitura',  c:'var(--amber)' },
  { l:'Guitarra', c:'#c084fc'      },
  { l:'Treino',   c:'var(--neon)'  },
  { l:'Dieta',    c:'var(--amber)' },
  { l:'Oração',   c:'#38bdf8'      },
  { l:'Gratidão', c:'#38bdf8'      },
];
const DDLBLS = ['S','T','Q','Q','S','S','D'];
const DDKEYS = ['seg','ter','qua','qui','sex','sab','dom'];

function renderHabits() {
  const wrap = document.getElementById('habit-grid');
  // Header
  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;gap:8px;padding-bottom:8px;border-bottom:1px solid var(--border);margin-bottom:2px;';
  hdr.innerHTML = '<div style="width:76px;flex-shrink:0"></div><div style="display:flex;gap:3px">' +
    DDLBLS.map(d=>`<div style="width:28px;text-align:center;font-family:var(--condensed);font-size:8px;font-weight:800;color:var(--muted);letter-spacing:1px">${d}</div>`).join('') + '</div>';
  wrap.appendChild(hdr);
  HABITS.forEach((h, hi) => {
    const row = document.createElement('div');
    row.className = 'habit-row';
    const lbl = document.createElement('div');
    lbl.className = 'habit-lbl';
    lbl.textContent = h.l;
    row.appendChild(lbl);
    const days = document.createElement('div');
    days.className = 'habit-days';
    DDKEYS.forEach((dk, di) => {
      const k  = `h-${hi}-${di}`;
      const on = LOCAL.get(k);
      const cell = document.createElement('div');
      cell.className = 'hcell' + (on ? ' on' : '');
      if (on) { cell.style.background = h.c; cell.style.color = '#000'; cell.style.boxShadow = `0 0 6px ${h.c}`; }
      cell.onclick = () => {
        const nv = !LOCAL.get(k);
        LOCAL.set(k, nv); schedSave(k, nv);
        cell.classList.toggle('on', nv);
        cell.style.background = nv ? h.c : '';
        cell.style.color = nv ? '#000' : '';
        cell.style.boxShadow = nv ? `0 0 6px ${h.c}` : '';
      };
      days.appendChild(cell);
    });
    row.appendChild(days);
    wrap.appendChild(row);
  });
}

// ── RINGS ──
const RING_DEFS = [
  { l:'Listening', c:'var(--neon)',  k:'ring-ls', v:50 },
  { l:'Vocab',     c:'var(--amber)', k:'ring-vc', v:25 },
  { l:'Speaking',  c:'#38bdf8',      k:'ring-sp', v:60 },
  { l:'Grammar',   c:'#c084fc',      k:'ring-gr', v:40 },
];
function renderRings() {
  const wrap = document.getElementById('rings-ingles');
  RING_DEFS.forEach(r => {
    const v    = parseInt(LOCAL.get(r.k) || r.v);
    const circ = 2*Math.PI*26;
    const off  = circ*(1-v/100);
    const card = document.createElement('div');
    card.className = 'ring-card';
    card.innerHTML = `
      <div class="ring-svg-wrap">
        <svg class="rsvg" width="64" height="64">
          <circle class="rtrack" cx="32" cy="32" r="26" stroke-width="4"/>
          <circle class="rfill" cx="32" cy="32" r="26" stroke-width="4"
            stroke="${r.c}" stroke-dasharray="${circ.toFixed(1)}"
            stroke-dashoffset="${off.toFixed(1)}" id="rc-${r.k}"/>
        </svg>
        <div class="ring-pct-txt" style="color:${r.c}" id="rn-${r.k}">${v}%</div>
      </div>
      <div class="ring-name">${r.l}</div>
      <input type="range" min="0" max="100" value="${v}" style="width:100%;margin-top:4px;accent-color:${r.c}" data-key="${r.k}" data-circ="${circ.toFixed(1)}">`;
    card.querySelector('input').oninput = function() {
      const nv = parseInt(this.value), nc = parseFloat(this.dataset.circ);
      document.getElementById('rc-'+this.dataset.key).setAttribute('stroke-dashoffset', (nc*(1-nv/100)).toFixed(1));
      document.getElementById('rn-'+this.dataset.key).textContent = nv+'%';
      LOCAL.set(this.dataset.key, nv); schedSave(this.dataset.key, nv);
    };
    wrap.appendChild(card);
  });
}

// ── READING WEEK ──
function renderReadWeek() {
  const wrap = document.getElementById('rw-row');
  ['S','T','Q','Q','S','S','D'].forEach((d,i) => {
    const k  = `rw-${i}`;
    const on = LOCAL.get(k);
    const cell = document.createElement('div');
    cell.className = 'rw-cell' + (on ? ' on' : '');
    cell.textContent = d;
    cell.onclick = () => {
      const nv = !LOCAL.get(k);
      LOCAL.set(k, nv); schedSave(k, nv);
      cell.classList.toggle('on', nv);
    };
    wrap.appendChild(cell);
  });
}

// ── BOOK ──
function saveBookMeta() {
  const t = document.getElementById('bk-title').value;
  const a = document.getElementById('bk-author').value;
  LOCAL.set('bk-t', t); LOCAL.set('bk-a', a);
  schedSave('bk-t', t); schedSave('bk-a', a);
}
function bkProg(v) {
  document.getElementById('bk-fill').style.width = v+'%';
  document.getElementById('bk-pct').textContent  = v+'%';
  LOCAL.set('bk-p', v); schedSave('bk-p', v);
}
function loadBook() {
  const t = LOCAL.get('bk-t'), a = LOCAL.get('bk-a'), p = LOCAL.get('bk-p')||0;
  if (t) document.getElementById('bk-title').value  = t;
  if (a) document.getElementById('bk-author').value = a;
  document.getElementById('bk-range').value = p; bkProg(p);
}

// ── MEALS ──
function renderMeals() {
  const wrap = document.getElementById('meals-wrap');
  ['Café da manhã','Almoço','Lanche','Jantar'].forEach((m,i) => {
    const k  = `meal-${i}`;
    const on = LOCAL.get(k);
    const row = document.createElement('div');
    row.className = 'meal-row';
    row.innerHTML = `<span class="meal-name">${m}</span><span class="meal-status" style="color:${on?'var(--neon)':'var(--muted)'}" id="ms-${i}">${on?'✓ FEITO':'—'}</span>`;
    row.onclick = () => {
      const nv = !LOCAL.get(k);
      LOCAL.set(k, nv); schedSave(k, nv);
      const el = document.getElementById('ms-'+i);
      el.textContent = nv ? '✓ FEITO' : '—';
      el.style.color = nv ? 'var(--neon)' : 'var(--muted)';
    };
    wrap.appendChild(row);
  });
}

// ── WATER ──
let waterMl = parseInt(LOCAL.get('water')||'0');
function syncWater() {
  const p = waterMl/3000*100;
  document.getElementById('w-fill').style.width = p+'%';
  document.getElementById('w-lbl').textContent  = waterMl+' / 3000ml';
}
function addWater(ml) {
  waterMl = Math.min(3000, waterMl+ml);
  LOCAL.set('water', waterMl); schedSave('water', waterMl); syncWater();
  if (waterMl>=3000) showPopup('HIDRATAÇÃO COMPLETA', '3L ATINGIDOS. DISCIPLINA TOTAL.');
}
function resetWater() {
  waterMl = 0; LOCAL.set('water',0); schedSave('water',0); syncWater();
}

// ── STREAK ──
function calcStreak() {
  const today = new Date().toDateString();
  const last  = localStorage.getItem('g_last');
  let s = parseInt(localStorage.getItem('g_streak')||'1');
  if (last !== today) {
    const y = new Date(); y.setDate(y.getDate()-1);
    s = last === y.toDateString() ? s+1 : 1;
    localStorage.setItem('g_streak', s);
    localStorage.setItem('g_last', today);
  }
  document.getElementById('s-streak').textContent = s;
}

// ── NOTIFICATIONS ──
function showPopup(title, body) {
  document.getElementById('popup-title').textContent = title;
  document.getElementById('popup-body').textContent  = body;
  const p = document.getElementById('popup');
  p.classList.add('show');
  setTimeout(() => p.classList.remove('show'), 5500);
}
async function reqNotif() {
  if (!('Notification' in window)) { showPopup('NÃO SUPORTADO','Use Chrome Android.'); return; }
  const r = await Notification.requestPermission();
  const btn = document.getElementById('notif-btn');
  if (r==='granted') {
    notifOn = true; btn.classList.add('on');
    showPopup('ALERTAS ATIVADOS','SISTEMA DE LEMBRETES OPERACIONAL.');
    new Notification('GILMAR OPS', { body: 'Sistema de alertas ativo.' });
  } else {
    showPopup('ACESSO NEGADO','Permita notificações nas configurações.');
  }
}

// ── PWA ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

// ── BOOT ──
async function boot() {
  setSyncStatus('idle');
  initQuote();
  autoSelectToday();
  await loadTodayState();
  renderTasks(currentDay);
  renderHabits();
  renderRings();
  renderReadWeek();
  renderMeals();
  loadBook();
  syncWater();
  calcStreak();
  calcStats();
  setTimeout(() => {
    const h  = new Date().getHours();
    const gr = h<12 ? 'BOM DIA' : h<18 ? 'BOA TARDE' : 'BOA NOITE';
    showPopup(gr + ', GILMAR.', 'SISTEMA OPERACIONAL. EXECUTE A MISSÃO.');
  }, 800);
}
boot();
