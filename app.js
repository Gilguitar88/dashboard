// ═══════════════════════════════════════════════════════════
//  GILMAR // OPS — app.js v3
//  Planos reais: Guitarra Semana 2 + Treino + Inglês
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

// ── SUPABASE SAVE ──
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
  { text: "Você está em perigo de viver uma vida tão confortável e mole que vai morrer sem jamais perceber o seu verdadeiro potencial.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Não pare quando estiver cansado. Pare quando terminar.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "As conversas mais importantes que você terá são as que você terá consigo mesmo.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Motivação é uma merda. Motivação vai e vem. Quando você é movido por propósito, tudo que estiver na sua frente será destruído.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Você precisa construir calos no seu cérebro, assim como constrói calos nas suas mãos.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "A arma mais poderosa da terra é a alma humana em chamas.", author: "DAVID GOGGINS", type: "GOGGINS" },
  { text: "Só você pode dominar sua mente — e é isso que é preciso para viver uma vida ousada, repleta de conquistas que a maioria das pessoas considera impossível.", author: "DAVID GOGGINS", type: "GOGGINS" },
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

// ══════════════════════════════════════════
// PLANOS DETALHADOS
// ══════════════════════════════════════════

// ── GUITARRA — SEMANA 1 — NÍVEL AVANÇADO (Guthrie Govan / Alex Hutchings style) ──
const GUITAR_PLAN = {
  seg: { tipo:'TÉCNICA', foco:'Alternate Picking — Precisão Cirúrgica', dur:'60 min', cor:'#e8ff47',
    exercicios:[
      { n:'Aquecimento: Cromático com muting de palma', bpm:'80 BPM / 5 min', desc:'1-2-3-4 em todas as cordas com palm mute controlado. Foco: ataque uniforme entre palheta pra cima e pra baixo.' },
      { n:'Sequências de 6 notas — pentatônica Am em 3 posições', bpm:'100–120 BPM', desc:'Padrão 1-2-1-2-1-2 em grupos de 6 subindo e descendo o braço. Conecte as 5 posições sem parar. Metrônomo em semínimas.' },
      { n:'Inside vs Outside Picking — troca de cordas deliberada', bpm:'90 BPM', desc:'2 notas por corda, alternando inside (palheta entre as cordas) e outside. Grave e escute: sem ruído nas trocas. Base do som de Guthrie em "Erotic Cakes".' },
      { n:'Licks de 3 notas/corda — modo Lídio (A Lídio)', bpm:'95 BPM', desc:'A-B-C#-D#-E-F#-G#-A com alternate picking puro. O #4 (D#) é o sabor Lídio — destaque-o. 3 notas por corda, todas as 6 cordas.' },
      { n:'Frase fusion: escala + cromatismo de aproximação', bpm:'Livre', desc:'Crie uma frase de 4 compassos usando a escala mais 1 nota cromática antes de cada nota alvo. Técnica central de Alex Hutchings — tensão controlada.' },
    ],
    regra:'⚠️ Regra de ouro: se não está limpo a 100 BPM, não avance. Limpo lento > sujo rápido.'
  },
  ter: { tipo:'TEORIA APLICADA', foco:'Harmonia Funcional — Modos por Acorde', dur:'60 min', cor:'#4ecdc4',
    exercicios:[
      { n:'7 modos — cor sonora por acorde alvo', bpm:'Sem tempo', desc:'Jônico=Maj7, Dórico=m7, Frígio=m7b9, Lídio=Maj7#11, Mixolídio=dom7, Eólio=m7, Lócrio=m7b5. Toque cada um sobre o acorde e ouça a cor. Associe som, não nome.' },
      { n:'Progressão ii-V-I em C com modo correto por acorde', bpm:'80 BPM', desc:'Dm7=Dórico, G7=Mixolídio, Cmaj7=Jônico. Não mude de escala — mude de foco dentro da mesma tonalidade. Técnica central de Guthrie Govan.' },
      { n:'Tritone substitution — G7 substituído por Db7', bpm:'Livre', desc:'Troque G7 por Db7 na progressão ii-V-I. Improvise sobre esse acorde. Note como as notas características resolvem diferente. Jazz aplicado no fusion.' },
      { n:'Arpejos com extensões — Am9, D13, Gmaj7#11', bpm:'70 BPM', desc:'Am9: A-C-E-G-B. D13: D-F#-A-C-B. Gmaj7#11: G-B-D-F#-C#. Toque subindo e descendo com alternate picking. Extensões são o vocabulário do fusion.' },
      { n:'Improviso sobre Dm7→G7→Cmaj7 aplicando modos por acorde', bpm:'Backing track', desc:'YouTube: "jazz fusion backing track C major". 10 min contínuos aplicando os modos por acorde. GRAVE obrigatório — compare com semana anterior.' },
    ],
    regra:'🎵 Referência: "Wonderful Slippery Thing" — Guthrie pensa por acorde, não por tonalidade. Ouça hoje.'
  },
  qua: { tipo:'TÉCNICA', foco:'Legato Total — Técnica Govan Completa', dur:'65 min', cor:'#e8ff47',
    exercicios:[
      { n:'Legato de 4 notas/corda — 3 cordas contínuas', bpm:'80 BPM tercinas', desc:'4 notas por corda (hammer + pull) em 3 cordas sem palheta. Ex Am: corda 1: 5h7h8h10 → corda 2: 5h7h8h10 → corda 3: 5h7h9h10. Volume uniforme é fundamental.' },
      { n:'Hammer-on from nowhere (HFN) — técnica Govan', bpm:'Livre / 10 min', desc:'Martele a 1ª nota sem atacar com palheta. Cria articulação impossível de outro modo. Pratique HFN no início de frases em Am pentatônica e A Dórico.' },
      { n:'Legato com tapping integrado — esquerda + tapping direita', bpm:'75 BPM', desc:'Padrão: esquerda 5h8h10, tapping direita no 13, pull-off 10-8-5. Tapping funcional estilo Hutchings — não decorativo, serve a frase musical.' },
      { n:'Legato cromático + resolução diatônica', bpm:'90 BPM', desc:'4 notas cromáticas (ex: 5-6-7-8 na 1ª corda) resolvendo na nota da escala mais próxima. Cria tensão e resolução automáticas — harmonia implícita.' },
      { n:'Frase Alex Hutchings style — legato over chord changes', bpm:'Backing funk/fusion', desc:'YouTube: "Dm7 funk fusion backing". Improvise com legato puro, trocando conscientemente quando o acorde muda. Palheta proibida por 5 min.' },
    ],
    regra:'🎵 Referência: "Fives" e "Uncle Buck" — Guthrie Govan. Legato não é técnica, é voz.'
  },
  qui: { tipo:'TÉCNICA', foco:'Sweep Picking Integrado + Economy Picking', dur:'60 min', cor:'#e8ff47',
    exercicios:[
      { n:'Sweep 3 cordas — Am, Dm, Em posições fechadas', bpm:'80 BPM', desc:'Am: 5ª corda 7ª casa → 4ª 5ª → 3ª 5ª, sweep down e up. Palm mute leve no início para limpar. Cada nota soa individual — não é acorde.' },
      { n:'Sweep 5 cordas — Amaj7 e Am7 alternados', bpm:'75 BPM', desc:'Amaj7: A-C#-E-G# / Am7: A-C-E-G em 5 cordas. Alterne em loop. Foco na transição no topo — tapping opcional no pico da frase.' },
      { n:'Arpejo + escala integrados — sair do sweep direto na escala', bpm:'Livre', desc:'Sweep de Am7 → topo → direto para lick A Dórico com legato. Isso é o que separa guitarrista de músico: conectar técnicas em frases musicais.' },
      { n:'Economy picking — 3 notas/corda em sequência', bpm:'95 BPM', desc:'Na troca de corda continue o movimento (down→down ou up→up). Mais eficiente para velocidade. Compare com alternate no mesmo lick — sinta a diferença.' },
      { n:'Composição: 8 compassos sweep + legato + picking', bpm:'Livre', desc:'Monte uma frase de 8 compassos combinando as 3 técnicas. Não precisa ser rápido — precisa ser intencional e musical. Grave.' },
    ],
    regra:'💡 Sweep limpo a 80 BPM > sweep sujo a 130 BPM. Guthrie nunca toca sweep de exibição — sempre serve a frase.'
  },
  sex: { tipo:'EXPRESSIVIDADE', foco:'Vibrato & Bending — Voz Própria', dur:'60 min', cor:'#ff6b35',
    exercicios:[
      { n:'Vibrato em 4 velocidades — lento / médio / rápido / wide', bpm:'Metrônomo livre', desc:'Lento e largo (Gary Moore), médio expressivo (Guthrie), rápido tenso (blues), wide com pulso (SRV). 3 min cada. São "palavras" diferentes na sua linguagem.' },
      { n:'Micro-bends — 1/4 de tom intencional (blue note)', bpm:'Livre / 10 min', desc:'Suba apenas 1/4 de tom — nem chega no semitom. Na pentatônica Am, aplique nas notas C e G. Som blue note puro. Isso é o que Guthrie faz em "Wonderful Slippery Thing".' },
      { n:'Pre-bend invisível — sobe antes, ataque, release lento', bpm:'Lento', desc:'Suba o bend ANTES de atacar. Ataque na nota aguda. Desça devagar até a original. Efeito de descida emocional. 10 min na nota G, 3ª corda.' },
      { n:'Vibrato no bend — benda e vibra simultaneamente', bpm:'Livre', desc:'Bend de 1 tom + vibrato no topo do bend. Difícil: a maioria perde a afinação. Foco: manter o bend enquanto oscila. 3 dedos sempre, pulso como eixo.' },
      { n:'Frase de 4 notas — expressão máxima em cada uma', bpm:'Lento/livre', desc:'Apenas 4 notas — mas com vibrato, bend, dinâmica e intenção total. Grave e ouça: você tocou algo ou executou técnica? Hutchings faz isso constantemente.' },
    ],
    regra:'🎵 Referência: Alex Hutchings "At Large" + Guthrie "Fives". Cada nota tem personalidade própria.'
  },
  sab: { tipo:'IMPROVISAÇÃO', foco:'Sessão Fusion Completa — Análise', dur:'90 min', cor:'#ff6b35',
    exercicios:[
      { n:'Warm-up técnico — 10 min percorrendo a semana', bpm:'Confortável', desc:'2 min cada: alternate picking licks, legato 4 notas/corda, sweep 3 cordas, vibrato 4 velocidades. Não pratique — confirme que entrou no corpo.' },
      { n:'Backing fusion Am — 20 min GRAVADO (vídeo ou áudio)', bpm:'Backing track', desc:'YouTube: "Am fusion backing track Guthrie style". Regra absoluta: não pare por nenhum erro. Use tudo: sweep, legato, bends, modos, arpejos, economia de picking.' },
      { n:'Restrição 1: apenas 3 notas por frase — 10 min', bpm:'Lento', desc:'Proibido mais de 3 notas consecutivas sem silêncio ou nota longa. Força pensar melodicamente, não tecnicamente. Isso separa Guthrie de 99% dos guitarristas.' },
      { n:'Restrição 2: apenas groove e timing — 5 min', bpm:'Groove/funk', desc:'Foque no ritmo. Uma nota longa + vibrato no tempo certo é mais musical que 16 notas sem intenção rítmica. Alex Hutchings faz isso constantemente.' },
      { n:'Análise crítica da gravação — 3 metas para semana 2', bpm:'20 min', desc:'Ouça 2x: 1ª como ouvinte (o que soou bem?), 2ª como professor (o que repetiu demais? onde perdeu a musicalidade?). Anote 3 metas específicas para semana 2.' },
    ],
    regra:'🏆 A sessão de sábado é seu espelho real. Gravação honesta é o feedback mais valioso que existe.'
  },
  dom: { tipo:'REVISÃO + REPERTÓRIO', foco:'Música Real + Descanso Mental', dur:'45 min', cor:'#c084fc',
    exercicios:[
      { n:'Flash review — 1 exercício de cada dia (2 min cada)', bpm:'Confortável', desc:'Seg: lick alternate picking inside/outside. Ter: ii-V-I com modos por acorde. Qua: legato 4 notas/corda HFN. Qui: sweep Am7 5 cordas. Sex: vibrato + micro-bend.' },
      { n:'Aprenda o intro de "Wonderful Slippery Thing" — Guthrie Govan', bpm:'50% velocidade', desc:'Riff principal em A Lídio. Identifique o D# (#4). Toque devagar com intenção total. Partitura: Ultimate Guitar ou YouTube cover slow. Velocidade vem depois.' },
      { n:'Improviso livre — sem objetivo técnico — 15 min', bpm:'Livre / prazer', desc:'Toque o que quiser, como quiser. A relação com o instrumento precisa incluir prazer puro. Guitarristas que só estudam perdem a alma do instrumento.' },
    ],
    regra:'✅ Semana 1: alternate picking avançado, harmonia funcional com modos, legato Govan, sweep integrado, expressividade total, sessão fusion gravada.'
  },
};


// ── TREINO ACADEMIA — SPLITS ──
const TREINO_SPLITS = {
  seg: { grupo:'PEITO + TRÍCEPS + HIIT', cor:'var(--neon)',
    exercicios:[
      'Supino reto — barra ou halteres (4x8-12)',
      'Supino inclinado halteres (3x10-12)',
      'Crucifixo polia ou halteres (3x12)',
      'Tríceps corda (3x12-15)',
      'Tríceps francês halteres (3x10-12)',
      'HIIT bike: 6-8 rounds 20s máximo / 40s leve (~12 min)',
    ]
  },
  ter: { grupo:'COSTAS + BÍCEPS', cor:'#38bdf8',
    exercicios:[
      'Puxada frontal aberta (4x10-12)',
      'Remada curvada barra (4x8-10)',
      'Remada sentada polia (3x12)',
      'Pullover haltere (3x12)',
      'Rosca direta barra (3x10-12)',
      'Rosca martelo halteres (3x12)',
    ]
  },
  qua: { grupo:'CARDIO BIKE + CORE', cor:'var(--amber)',
    exercicios:[
      'LISS bike 30-40 min (130-140 bpm — ritmo conversacional)',
      'Prancha frontal 3x60s',
      'Prancha lateral 3x45s cada lado',
      'Abdominal infra elevação de pernas (3x15)',
      'Crunch bicicleta (3x20)',
    ]
  },
  qui: { grupo:'PERNAS + GLÚTEO', cor:'#c084fc',
    exercicios:[
      'Agachamento livre ou hack squat (4x8-12)',
      'Leg press 45º (4x12-15)',
      'Stiff halteres (3x12) — glúteo e isquiotibiais',
      'Cadeira extensora (3x15)',
      'Cadeira flexora (3x12)',
      'Panturrilha em pé (4x15-20)',
    ]
  },
  sex: { grupo:'OMBROS + TRAPÉZIO + CARDIO', cor:'var(--neon)',
    exercicios:[
      'Desenvolvimento halteres sentado (4x10-12)',
      'Elevação lateral (4x12-15)',
      'Elevação frontal alternada (3x12)',
      'Remada alta barra (3x12) — trapézio',
      'Encolhimento halteres (4x15)',
      'HIIT bike ou 20 min LISS após treino',
    ]
  },
  sab: { grupo:'DESCANSO ATIVO / ESPORTE', cor:'var(--amber)',
    exercicios:[
      'Futebol, natação ou corrida — esporte preferido',
      'Aumentar carboidratos em 50-80g nesse dia',
      'Refeeding day: comer na manutenção calórica (não déficit)',
      'Mobilidade e alongamento 15-20 min',
    ]
  },
  dom: { grupo:'DESCANSO TOTAL', cor:'var(--muted)',
    exercicios:[
      'Descanso e recuperação muscular',
      'Manter proteína alta (200g/dia)',
      'Refeeding calórico se sábado não foi possível',
      'Sono 8h — GH noturno é fundamental no cutting',
    ]
  },
};

// ── INGLÊS — PLANO INTERMEDIÁRIO-AVANÇADO ──
const INGLES_PLAN = {
  seg: { foco:'LISTENING AVANÇADO', aula:'BBC Learning English — 6 Minute English', dur:'30 min',
    atividades:[
      'BBC Learning English "6 Minute English" — 1 episódio (6 min)',
      'Anote 5 expressões idiomáticas do episódio',
      'Repita as frases em voz alta (shadowing) 2x',
      'Duolingo — mínimo 10 min (manter streak)',
    ]
  },
  ter: { foco:'VOCABULÁRIO AVANÇADO', aula:'Anki — Deck Business & Academic English', dur:'30 min',
    atividades:[
      'Anki: 20 palavras novas (nível B2-C1)',
      'Foco: collocations e phrasal verbs em contexto',
      'Escreva 3 frases usando as palavras novas',
      'App: Vocabulary.com — nível intermediário-avançado',
    ]
  },
  qua: { foco:'SPEAKING & ACCENT', aula:'Rachel\'s English — American Accent', dur:'30 min',
    atividades:[
      'Rachel\'s English YouTube: 1 vídeo de pronúncia (redução/linking)',
      'Shadowing: repita o vídeo 3x pausando e imitando',
      'Grave sua voz 2 min falando sobre qualquer assunto',
      'Compare com o nativo — identifique 1 diferença para corrigir',
    ]
  },
  qui: { foco:'LEITURA — NÍVEL C1', aula:'The Economist ou Harvard Business Review', dur:'30 min',
    atividades:[
      'Leia 1 artigo do The Economist ou HBR (400-600 palavras)',
      'Sublinhe 5 expressões desconhecidas — busque no contexto',
      'Resuma o artigo em 3 frases em inglês (escrita)',
      'Podcast paralelo: How I Built This (NPR) — 20 min enquanto faz algo',
    ]
  },
  sex: { foco:'GRAMÁTICA EM CONTEXTO', aula:'EnglishClass101 — B2/C1 Grammar', dur:'30 min',
    atividades:[
      'Foco: conditionals avançadas (3rd, mixed) ou subjunctive mood',
      'EnglishClass101 ou Perfect English Grammar — 1 lição',
      'Exercícios práticos: 10 frases escrevendo com a estrutura nova',
      'Revise erros da semana — patterns que você repete',
    ]
  },
  sab: { foco:'OUTPUT — FALA OU ESCRITA LIVRE', aula:'Sessão livre ou italki/Tandem', dur:'30 min',
    atividades:[
      'Opção A: italki ou Tandem — 30 min de conversa com nativo/tutor',
      'Opção B: grave um vídeo ou áudio de 5 min falando sobre um tema',
      'Opção C: escreva um texto de 200 palavras sobre qualquer assunto',
      'Revise o que produziu — identifique 2 erros recorrentes',
    ]
  },
  dom: { foco:'REVISÃO + EXPOSIÇÃO PASSIVA', aula:'Série ou filme sem legenda PT', dur:'20 min',
    atividades:[
      'Revise os vocabulários da semana (Anki review)',
      'Assista 20 min de série/filme em inglês — legenda em inglês (não PT)',
      'Anote 2 expressões novas que ouviu e entendeu',
      'Planeje o foco da semana seguinte',
    ]
  },
};

// ── SCHEDULE ROTINA ──
const DAYS = { seg:'SEGUNDA-FEIRA', ter:'TERÇA-FEIRA', qua:'QUARTA-FEIRA', qui:'QUINTA-FEIRA', sex:'SEXTA-FEIRA', sab:'SÁBADO', dom:'DOMINGO' };
const SCHED = {
  manha: [
    { n:'Estudo de inglês',      s:'VER ABA INGLÊS PARA DETALHES',      d:'30MIN', a:'06:00' },
    { n:'Leitura do livro',      s:'20 PÁGINAS MÍNIMO',                  d:'30MIN', a:'06:30' },
    { n:'Estudo de guitarra',    s:'VER ABA GUITARRA PARA DETALHES',     d:'45MIN', a:'07:00' },
    { n:'Treino físico',         s:'VER ABA TREINO PARA SPLIT DO DIA',   d:'60MIN', a:'07:45' },
    { n:'Café da manhã & dieta', s:'200G PROTEÍNA/DIA · PROTOCOLO MACRO',d:'20MIN', a:'09:00' },
  ],
  tarde: [
    { n:'Foco — Insid360',       s:'CAMPANHAS · RELATÓRIOS · REUNIÕES',  d:'3H',    a:'13:00' },
    { n:'Revisão de métricas',   s:'GOOGLE/META ADS — TODOS PROJETOS',   d:'45MIN', a:'16:00' },
  ],
  noite: [
    { n:'Leitura noturna',       s:'15 PÁGINAS ANTES DE DORMIR',         d:'20MIN', a:'21:30' },
    { n:'Revisão do dia',        s:'O QUE FIZ / FICA PARA AMANHÃ',       d:'10MIN', a:'22:00' },
  ],
};

let currentDay = 'seg';
let notifOn = false;
const FIRED = {};
const PERIOD_COLORS = { manha: 'var(--amber)', tarde: '#38bdf8', noite: 'var(--neon)' };

// ── RENDER TASKS ──
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
        LOCAL.set(key, nv); schedSave(key, nv);
        renderTasks(day); calcStats(); saveDailySummary();
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

// ── RENDER GUITARRA ──
function renderGuitarTab(day) {
  const wrap = document.getElementById('guitar-detail');
  if (!wrap) return;
  const plan = GUITAR_PLAN[day] || GUITAR_PLAN['seg'];
  wrap.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border2);border-left:3px solid ${plan.cor};padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-family:var(--condensed);font-size:11px;font-weight:800;letter-spacing:3px;color:${plan.cor}">${plan.tipo}</span>
        <span style="font-family:var(--condensed);font-size:9px;color:var(--muted);font-weight:600">${plan.dur}</span>
      </div>
      <div style="font-family:var(--condensed);font-size:20px;font-weight:900;letter-spacing:1px;color:var(--text)">${plan.foco}</div>
    </div>
    ${plan.exercicios.map((ex, i) => `
      <div class="task-card" onclick="toggleCard(this)" style="--lc:${plan.cor};margin-bottom:4px">
        <div class="tck"></div>
        <div class="tb2">
          <div class="tn">${i+1}. ${ex.n}</div>
          <div class="ts2">${ex.desc}</div>
        </div>
        <div class="td" style="background:${plan.cor};color:#000;box-shadow:0 0 8px ${plan.cor}44">${ex.bpm}</div>
      </div>
    `).join('')}
    <div style="margin-top:12px;padding:10px 14px;background:var(--bg3);border-left:2px solid ${plan.cor};font-family:var(--condensed);font-size:11px;color:var(--muted)">
      ${plan.regra}
    </div>`;
}

// ── RENDER TREINO ──
function renderTreinoTab(day) {
  const wrap = document.getElementById('treino-detail');
  if (!wrap) return;
  const split = TREINO_SPLITS[day] || TREINO_SPLITS['seg'];
  wrap.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border2);border-left:3px solid ${split.cor};padding:14px;margin-bottom:12px">
      <div style="font-family:var(--condensed);font-size:9px;font-weight:800;letter-spacing:3px;color:var(--muted);margin-bottom:3px">SPLIT DE HOJE</div>
      <div style="font-family:var(--condensed);font-size:22px;font-weight:900;letter-spacing:2px;color:${split.cor}">${split.grupo}</div>
    </div>
    ${split.exercicios.map((ex, i) => `
      <div class="task-card" onclick="toggleCard(this)" style="--lc:${split.cor};margin-bottom:4px">
        <div class="tck"></div>
        <div class="tb2"><div class="tn">${ex}</div></div>
      </div>
    `).join('')}
    <div style="margin-top:16px;background:var(--bg2);border:1px solid var(--border2);padding:14px">
      <div style="font-family:var(--condensed);font-size:9px;font-weight:800;letter-spacing:2px;color:var(--muted);margin-bottom:8px">MACROS DO DIA</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div><div style="font-family:var(--condensed);font-size:20px;font-weight:900;color:var(--neon)">200g</div><div style="font-family:var(--condensed);font-size:8px;color:var(--muted);letter-spacing:1px">PROTEÍNA</div></div>
        <div><div style="font-family:var(--condensed);font-size:20px;font-weight:900;color:var(--amber)">220g</div><div style="font-family:var(--condensed);font-size:8px;color:var(--muted);letter-spacing:1px">CARBOIDRATO</div></div>
        <div><div style="font-family:var(--condensed);font-size:20px;font-weight:900;color:#38bdf8">75g</div><div style="font-family:var(--condensed);font-size:8px;color:var(--muted);letter-spacing:1px">GORDURA</div></div>
      </div>
    </div>`;
}

// ── RENDER INGLÊS ──
function renderInglesTab(day) {
  const wrap = document.getElementById('ingles-detail');
  if (!wrap) return;
  const plan = INGLES_PLAN[day] || INGLES_PLAN['seg'];
  wrap.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border2);border-left:3px solid var(--neon);padding:14px;margin-bottom:12px">
      <div style="font-family:var(--condensed);font-size:9px;font-weight:800;letter-spacing:3px;color:var(--muted);margin-bottom:3px">FOCO DO DIA · ${plan.dur}</div>
      <div style="font-family:var(--condensed);font-size:18px;font-weight:900;letter-spacing:1px;color:var(--neon)">${plan.foco}</div>
      <div style="font-family:var(--condensed);font-size:11px;color:var(--muted);margin-top:4px">${plan.aula}</div>
    </div>
    ${plan.atividades.map((at, i) => `
      <div class="task-card" onclick="toggleCard(this)" style="--lc:var(--neon);margin-bottom:4px">
        <div class="tck"></div>
        <div class="tb2"><div class="tn">${at}</div></div>
      </div>
    `).join('')}`;
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
  // Render detail tabs with today's data
  renderGuitarTab(k);
  renderTreinoTab(k);
  renderInglesTab(k);
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
  document.getElementById('tb-clock').textContent = hm;
  const dm = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const mo = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  document.getElementById('tb-date').textContent = `${dm[n.getDay()]} ${n.getDate()} ${mo[n.getMonth()]}`;
  const start=5*60+30, end=23*60, cur=n.getHours()*60+n.getMinutes();
  const pct = Math.min(100, Math.max(0, Math.round((cur-start)/(end-start)*100)));
  document.getElementById('db-fill').style.width  = pct+'%';
  document.getElementById('db-head').style.left   = pct+'%';
  document.getElementById('db-pct').textContent   = pct+'%';
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
const DDKEYS = ['seg','ter','qua','qui','sex','sab','dom'];
const DDLBLS = ['S','T','Q','Q','S','S','D'];

function renderHabits() {
  const wrap = document.getElementById('habit-grid');
  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;gap:8px;padding-bottom:8px;border-bottom:1px solid var(--border);margin-bottom:2px;';
  hdr.innerHTML = '<div style="width:76px;flex-shrink:0"></div><div style="display:flex;gap:3px">' +
    DDLBLS.map(d=>`<div style="width:28px;text-align:center;font-family:var(--condensed);font-size:8px;font-weight:800;color:var(--muted);letter-spacing:1px">${d}</div>`).join('') + '</div>';
  wrap.appendChild(hdr);
  HABITS.forEach((h, hi) => {
    const row = document.createElement('div');
    row.className = 'habit-row';
    const lbl = document.createElement('div');
    lbl.className = 'habit-lbl'; lbl.textContent = h.l;
    row.appendChild(lbl);
    const days = document.createElement('div');
    days.className = 'habit-days';
    DDKEYS.forEach((dk, di) => {
      const k = `h-${hi}-${di}`, on = LOCAL.get(k);
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
  if (!wrap) return;
  RING_DEFS.forEach(r => {
    const v = parseInt(LOCAL.get(r.k) || r.v);
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
  if (!wrap) return;
  ['S','T','Q','Q','S','S','D'].forEach((d,i) => {
    const k = `rw-${i}`, on = LOCAL.get(k);
    const cell = document.createElement('div');
    cell.className = 'rw-cell' + (on ? ' on' : '');
    cell.textContent = d;
    cell.onclick = () => { const nv = !LOCAL.get(k); LOCAL.set(k, nv); schedSave(k, nv); cell.classList.toggle('on', nv); };
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
  if (!wrap) return;
  ['Café da manhã','Almoço','Lanche','Jantar'].forEach((m,i) => {
    const k = `meal-${i}`, on = LOCAL.get(k);
    const row = document.createElement('div');
    row.className = 'meal-row';
    row.innerHTML = `<span class="meal-name">${m}</span><span class="meal-status" style="color:${on?'var(--neon)':'var(--muted)'}" id="ms-${i}">${on?'✓ FEITO':'—'}</span>`;
    row.onclick = () => {
      const nv = !LOCAL.get(k); LOCAL.set(k, nv); schedSave(k, nv);
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
function resetWater() { waterMl = 0; LOCAL.set('water',0); schedSave('water',0); syncWater(); }

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
  if (r==='granted') {
    notifOn = true;
    document.getElementById('notif-btn').classList.add('on');
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
  }, 800);loadTodayState().then(() => renderTasks(currentDay));
}
boot();
