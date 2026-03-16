// ═══════════════════════════════════════════════════════════
//  GILMAR // OPS — app.js v4
//  Guitarra Semana 2 · Timer · Celebrações · UX melhorado
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

// ── GUITARRA — SEMANA 2 — NÍVEL AVANÇADO (Guthrie Govan / Alex Hutchings style) ──
const GUITAR_PLAN = {
  seg: { tipo:'TÉCNICA', foco:'Outside Playing + Pentatônica Aumentada', dur:'60 min', cor:'#e8ff47',
    exercicios:[
      { n:'Aquecimento: Revisão Semana 1 — lick inside/outside picking', bpm:'100 BPM / 5 min', desc:'Revise o padrão de troca de cordas inside vs outside. Confirme que está limpo e automático antes de avançar. Esta é sua base.' },
      { n:'Outside Playing — sair da tonalidade intencionalmente', bpm:'80 BPM', desc:'Sobre um vamp Dm7, toque 1 compasso em Am pentatônica (inside) e mude para 1 compasso em Ebm pentatônica (outside — meio tom acima). Ouça a tensão e resolução. Isso é o som "errado certo" de Guthrie.' },
      { n:'Pentatônica Aumentada — A-C#-D#-E-G#-A', bpm:'90 BPM', desc:'Substitua o 3º menor pelo 3º maior e adicione o #4. Escala entre pentatônica e escala inteira de tom. Soa exótico e tenso. 3 posições no braço, alternate picking limpo.' },
      { n:'Half-step approach — entrar em qualquer nota por semitom', bpm:'85 BPM', desc:'Antes de cada nota alvo da pentatônica Am, toque a nota um semitom abaixo. A→G#→A, C→B→C, E→Eb→E. Cria cromatismo funcional sem sair do vocabulário fusion.' },
      { n:'Frase outside de 8 compassos — gravada', bpm:'Backing Am / livre', desc:'YouTube: "Am funk fusion backing". 4 compassos inside → 4 compassos outside → resolva de volta. Grave e escute: a tensão soa intencional ou perdida? Essa distinção define o nível.' },
    ],
    regra:'⚠️ Outside playing SÓ funciona se você resolve de volta. Sair sem resolver é erro. Sair e resolver é arte.'
  },
  ter: { tipo:'TEORIA APLICADA', foco:'Progressões Modais — Dorian e Lydian Vamps', dur:'60 min', cor:'#4ecdc4',
    exercicios:[
      { n:'Dorian Vamp — Am7→G7 (I→bVII) — reconheça a cor', bpm:'Backing track', desc:'A Dórico: A-B-C-D-E-F#-G. O F# natural (6ª maior) é o sabor característico. Sobre Am7→G7, improvise focando no F#. YouTube: "A Dorian vamp backing". Compare com Eólico.' },
      { n:'Lydian Vamp — Dmaj7→E (I→II) — leveza pura', bpm:'Backing track', desc:'D Lídio: D-E-F#-G#-A-B-C#. O G# (#4) é o sabor Lídio — puro, levitante. Sobre Dmaj7→E, destaque o G#. Isso é o som de abertura e espaço que Guthrie usa em composições.' },
      { n:'Mixolídio — A7→G (I7→bVII) — groove e blues fusion', bpm:'Backing track', desc:'A Mixolídio: A-B-C#-D-E-F#-G. O G natural (b7) é o sabor. Sobre A7→G, improvise como uma mistura de blues e fusion. É o modo que conecta rock e jazz.' },
      { n:'Troca modal em tempo real — 3 modos em 1 frase', bpm:'80 BPM', desc:'Crie uma frase de 12 compassos: 4 Dórico + 4 Lídio + 4 Mixolídio. Mude de modo quando o acorde mudar. Não pause para pensar — treine a percepção instintiva de cor modal.' },
      { n:'Análise: identifique o modo usado por Guthrie em "Wonderful Slippery Thing"', bpm:'30 min estudo', desc:'Ouça a música 3x. Identifique: qual modo é o intro? Quando muda? Tente reproduzir 8 compassos lentamente. Não é cópia — é vocabulário. Anote o que descobriu.' },
    ],
    regra:'🎵 Modo não é escala. Modo é perspectiva sobre a mesma escala. Pense em cores, não em fórmulas.'
  },
  qua: { tipo:'TÉCNICA', foco:'Tapping Avançado — 2 Dedos + Integração Musical', dur:'65 min', cor:'#e8ff47',
    exercicios:[
      { n:'Tapping com 2 dedos da mão direita — posições independentes', bpm:'60 BPM', desc:'Dedo 1 (indicador) no 12, dedo 2 (médio) no 15. Esquerda no 5. Padrão: esq5-tap12-pull-tap15-pull. Tapping em duas posições diferentes muda o vocabulário completamente. Comece lento.' },
      { n:'Arpejos de 3 oitavas com tapping — Am Em Dm', bpm:'70 BPM', desc:'Am 3 oitavas: esq A(5ª/5), C(4ª/5), E(3ª/5), tap A(1ª/17). Soa quase clássico. Requer precisão milimétrica. Diminua para 50 BPM se necessário — limpeza primeiro.' },
      { n:'Legato + tapping integrado — sem costuras audíveis', bpm:'75 BPM', desc:'4 notas legato (esq) + tap + pull-off voltando para legato. A junção não pode soar como "transição de técnica". É uma frase contínua. Hutchings faz isso invisível.' },
      { n:'Tapping cromático — tensão máxima', bpm:'80 BPM', desc:'Padrão: esq 5h6h7h8, tap 12, pull-off 8-7-6-5. O cromatismo embaixo + tap alto cria tensão intensa. Resolva na nota A. Contraste entre tensão e resolução é a emoção.' },
      { n:'Composição: frase musical com tapping como elemento central', bpm:'Livre', desc:'30 min: crie uma frase de 8 compassos onde o tapping serve a melodia, não é exibição. Se tirar o tapping e a frase perde sentido musical, ele está integrado. Grave obrigatório.' },
    ],
    regra:'🎵 Referência: Joe Satriani "Midnight" + Hutchings "Live in Japan". Tapping que serve a melodia, nunca o contrário.'
  },
  qui: { tipo:'TÉCNICA', foco:'Whammy Bar — Expressão e Microtones', dur:'60 min', cor:'#e8ff47',
    exercicios:[
      { n:'Flutter/dive bomb controlado — com retorno perfeito à afinação', bpm:'Backing track livre', desc:'Dip curto (1/4 de tom, 1/2 tom) com retorno imediato à nota original. A afinação de retorno é tudo. Se não volta na nota, é efeito de impacto, não expressão. Guthrie retorna sempre.' },
      { n:'Vibrato com whammy — tom mais largo que dedos permitem', bpm:'Lento / expressivo', desc:'Mantenha nota longa + whammy em oscilação regular. Mais largo que vibrato de dedo (1 tom completo de variação). Cria voz de instrumento de sopro. Controle de velocidade é fundamental.' },
      { n:'Microtones — notas entre os semitons (blue notes avançadas)', bpm:'Livre / 10 min', desc:'Com whammy, desça 1/4 de tom de qualquer nota da pentatônica. São as "notas fantasma" que não existem no piano. Pure blues e world music. Guthrie usa extensivamente em solos lentos.' },
      { n:'Chord swells com whammy + volume knob', bpm:'Backing pad', desc:'Ataque acorde + dip imediato no whammy + volume knob subindo. Imita seção de cordas de orquestra. 2 técnicas integradas criando timbre completamente novo. Contexto: partes lentas e cinematográficas.' },
      { n:'Frase expressiva de 4 compassos — apenas whammy e vibrato', bpm:'Lento e emocional', desc:'Proibido: picking rápido, legato extenso, sweep. Permitido: notas longas, whammy, vibrato, bends. 4 compassos. Prove que velocidade não é expressão. Grave e ouça como ouvinte.' },
    ],
    regra:'💡 Whammy bar no Stratocaster é extensão da voz, não efeito. Guthrie Govan tem o vibrato de whammy mais musical da cena fusion.'
  },
  sex: { tipo:'COMPOSIÇÃO', foco:'16 Compassos Completos — Fusão de Técnicas', dur:'75 min', cor:'#ff6b35',
    exercicios:[
      { n:'Planejamento estrutural — harmonia primeiro, técnica depois', bpm:'20 min / sem guitarra', desc:'Decida: progressão de 4 acordes (ex: Am7→Dm7→G7→Cmaj7). Desenhe a jornada emocional: intro tenso → desenvolvimento → climax → resolução. Anote em papel. A técnica serve a estrutura.' },
      { n:'Construção: compassos 1-4 — estabelecer o tema melódico', bpm:'70 BPM', desc:'Crie uma melodia de 4 notas que defina a peça. Simples e memorável. Não toque mais de 6 notas por compasso. O tema principal deve poder ser cantarolado.' },
      { n:'Desenvolvimento: compassos 5-8 — variar o tema com técnicas', bpm:'75 BPM', desc:'Pegue o tema dos compassos 1-4 e transforme: adicione legato, mude o ritmo, inverta. É o mesmo tema mas com novo vocabulário técnico. Coerência temática é o que separa solo de composição.' },
      { n:'Climax: compassos 9-12 — ponto de maior tensão e velocidade', bpm:'90 BPM', desc:'Agora libere: sweep, tapping, outside playing, whammy — mas servindo à progressão harmônica. O clímax funciona porque foi construído, não porque é tecnicamente impressionante.' },
      { n:'Resolução + gravação completa: compassos 13-16 — retorno e conclusão', bpm:'70 BPM', desc:'Volte ao tema original, mas transformado pelo que a peça viveu. Grave todos os 16 compassos do início ao fim. Ouça 3x. Analise: existe narrativa? A peça conta uma história?' },
    ],
    regra:'🏆 Composição é a maior habilidade musical. Todo técnico é substituível. Um compositor com voz própria é único.'
  },
  sab: { tipo:'IMPROVISAÇÃO', foco:'Sessão Análise + Integração Total — Metas Semana 3', dur:'90 min', cor:'#ff6b35',
    exercicios:[
      { n:'Warm-up: revisão das técnicas novas da semana 2', bpm:'Confortável', desc:'2 min cada: outside playing (pentatônica aumentada), progressão modal (dórico), tapping 2 dedos, whammy expression. Não pratique — confirme que entrou no corpo desta semana.' },
      { n:'Backing fusion Am — 30 min GRAVADO em vídeo', bpm:'Backing track', desc:'YouTube: "Am fusion backing track Guthrie style". Grave em vídeo (não só áudio). Regra: não pare por nenhum erro. Use TUDO das 2 semanas. A câmera não mente sobre a linguagem corporal.' },
      { n:'Restrição criativa: improviso com apenas 3 notas — 10 min', bpm:'Lento', desc:'A, C, E (Am). Nada mais. Explore vibrato, whammy, tapping dessas 3 notas. Crie dinâmicas, silêncios, swells. Isso força pensar em timbre e expressão, não em notas.' },
      { n:'Análise crítica da gravação em vídeo — comparação com semana 1', bpm:'20 min', desc:'Ouça a gravação de hoje E a da semana passada. O que melhorou especificamente? O que ainda está mecânico? Onde perdeu a musicalidade? Identifique 3 padrões que você repete demais.' },
      { n:'Definir 3 metas específicas e técnicas para a Semana 3', bpm:'10 min', desc:'Não escreva "melhorar velocidade". Escreva: "Executar sweep Am7 5 cordas limpo a 95 BPM" ou "Integrar outside playing em 1 frase por solo". Métricas reais. Anote no app de notas ou papel.' },
    ],
    regra:'🏆 A gravação em vídeo da sessão de sábado é o feedback mais honesto que existe. Assista sem cringe — com análise fria de músico.'
  },
  dom: { tipo:'REVISÃO + REPERTÓRIO', foco:'Música Real + Escuta Profunda + Descanso', dur:'45 min', cor:'#c084fc',
    exercicios:[
      { n:'Flash review semanal — 1 exercício chave de cada dia', bpm:'Confortável', desc:'Seg: frase outside playing. Ter: lick modal (Dórico + Lídio). Qua: tapping 2 dedos em Am. Qui: dive bomb controlado. Sex: tema principal da composição. Tudo junto, 2 min cada.' },
      { n:'Repertório: aprender o intro completo de "Fives" — Guthrie Govan', bpm:'50% velocidade', desc:'Riff em E pentatônica com elementos Lídios. Identifique o sweep e os legato fills. YouTube: "Fives Guthrie Govan full lesson" ou "Fives tab slow". Você não precisa velocidade — precisa a frase.' },
      { n:'Escuta ativa — análise de 10 min de Alex Hutchings', bpm:'YouTube / livre', desc:'YouTube: "Alex Hutchings live". Ouça com papel na mão. Anote: 3 técnicas identificadas, 1 frase que quer aprender, 1 escolha harmônica surpreendente. Ouvido ativo é prática também.' },
      { n:'Improviso livre — prazer puro — 10 min', bpm:'Livre / prazer', desc:'Sem objetivo técnico. Toque o que quiser, como quiser. Relação com o instrumento precisa incluir prazer puro e sem julgamento. Descanso mental é parte do protocolo avançado.' },
    ],
    regra:'✅ Semana 2: outside playing, progressões modais, tapping 2 dedos, whammy expression, composição completa, sessão gravada analisada.'
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

// ── CELEBRATION ──
let celebrationShown = false;
function triggerCelebration() {
  if (celebrationShown) return;
  const cel = document.getElementById('celebration');
  if (!cel) return;
  cel.style.display = 'flex';
  cel.classList.add('show');
  celebrationShown = true;
  // Confetti
  const colors = ['#FF6B00','#F59E0B','#ff4444','#38bdf8','#c084fc','#e8ff47'];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = `
        left:${Math.random()*100}vw;
        top:${20 + Math.random()*30}vh;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-duration:${0.6 + Math.random()*0.6}s;
        animation-delay:${Math.random()*0.3}s;
        transform:rotate(${Math.random()*360}deg);
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }, i * 80);
  }
  setTimeout(() => {
    cel.classList.remove('show');
    setTimeout(() => { cel.style.display = 'none'; celebrationShown = false; }, 400);
  }, 3500);
}

function checkCelebration() {
  const all  = document.querySelectorAll('#page-rotina .task-card').length;
  const done = document.querySelectorAll('#page-rotina .task-card.done').length;
  if (all > 0 && done === all) {
    setTimeout(triggerCelebration, 400);
  }
}

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
        // Flash animation on completion
        if (nv) { card.classList.add('just-done'); setTimeout(() => card.classList.remove('just-done'), 600); }
        renderTasks(day); calcStats(); saveDailySummary();
        checkCelebration();
      };
      el.appendChild(card);
    });
  });
  calcStats();
}

function toggleCard(el) {
  el.classList.toggle('done');
  el.querySelector('.tck').textContent = el.classList.contains('done') ? '✓' : '';
  if (el.classList.contains('done')) {
    el.classList.add('just-done');
    setTimeout(() => el.classList.remove('just-done'), 600);
  }
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
  // Update progress bar if present
  const ps = document.getElementById('ps-fill');
  if (ps) ps.style.width = (all > 0 ? Math.round(done/all*100) : 0) + '%';
  const pn = document.getElementById('ps-number');
  if (pn) pn.textContent = all > 0 ? Math.round(done/all*100)+'%' : '0%';
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
  // Session timer tick
  if (timerRunning) timerTick();
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

// ── SESSION TIMER ──
let timerSeconds = 0;
let timerRunning = false;
let timerTarget = 0;
let timerLastTick = 0;

function timerTick() {
  const now = Date.now();
  if (timerLastTick === 0) { timerLastTick = now; return; }
  const elapsed = Math.floor((now - timerLastTick) / 1000);
  if (elapsed < 1) return;
  timerLastTick = now;
  timerSeconds += elapsed;
  updateTimerDisplay();
  // Check if reached target
  if (timerTarget > 0 && timerSeconds >= timerTarget) {
    stopTimer();
    showPopup('TEMPO COMPLETO! ✓', 'Sessão de ' + formatTime(timerTarget) + ' concluída. MISSÃO EXECUTADA.');
    const disp = document.getElementById('timer-disp');
    if (disp) disp.classList.add('done-timer');
  }
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2,'0');
  const s = (secs % 60).toString().padStart(2,'0');
  return m + ':' + s;
}

function updateTimerDisplay() {
  const disp = document.getElementById('timer-disp');
  if (!disp) return;
  if (timerTarget > 0) {
    const remaining = Math.max(0, timerTarget - timerSeconds);
    disp.textContent = formatTime(remaining);
  } else {
    disp.textContent = formatTime(timerSeconds);
  }
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerLastTick = Date.now();
  const disp = document.getElementById('timer-disp');
  if (disp) { disp.classList.add('running'); disp.classList.remove('done-timer'); }
  const startBtn = document.getElementById('timer-start-btn');
  const pauseBtn = document.getElementById('timer-pause-btn');
  if (startBtn) startBtn.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = '';
}

function pauseTimer() {
  timerRunning = false;
  timerLastTick = 0;
  const disp = document.getElementById('timer-disp');
  if (disp) disp.classList.remove('running');
  const startBtn = document.getElementById('timer-start-btn');
  const pauseBtn = document.getElementById('timer-pause-btn');
  if (startBtn) startBtn.style.display = '';
  if (pauseBtn) pauseBtn.style.display = 'none';
}

function stopTimer() {
  timerRunning = false;
  timerLastTick = 0;
  const disp = document.getElementById('timer-disp');
  if (disp) disp.classList.remove('running');
  const startBtn = document.getElementById('timer-start-btn');
  const pauseBtn = document.getElementById('timer-pause-btn');
  if (startBtn) startBtn.style.display = '';
  if (pauseBtn) pauseBtn.style.display = 'none';
}

function resetTimer() {
  stopTimer();
  timerSeconds = 0;
  timerTarget = 0;
  updateTimerDisplay();
  const disp = document.getElementById('timer-disp');
  if (disp) { disp.classList.remove('done-timer'); disp.textContent = '00:00'; }
}

function setTimerPreset(minutes) {
  resetTimer();
  timerTarget = minutes * 60;
  updateTimerDisplay();
}

function renderTimer() {
  const wrap = document.getElementById('timer-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="timer-card">
      <div class="timer-label">CRONÔMETRO DA SESSÃO</div>
      <div class="timer-display" id="timer-disp">00:00</div>
      <div class="timer-presets">
        <button class="timer-preset" onclick="setTimerPreset(25)">25 MIN</button>
        <button class="timer-preset" onclick="setTimerPreset(30)">30 MIN</button>
        <button class="timer-preset" onclick="setTimerPreset(45)">45 MIN</button>
        <button class="timer-preset" onclick="setTimerPreset(60)">60 MIN</button>
        <button class="timer-preset" onclick="setTimerPreset(90)">90 MIN</button>
      </div>
      <div class="timer-btns">
        <button class="timer-btn primary" id="timer-start-btn" onclick="startTimer()">▶ INICIAR</button>
        <button class="timer-btn" id="timer-pause-btn" onclick="pauseTimer()" style="display:none">⏸ PAUSAR</button>
        <button class="timer-btn" onclick="resetTimer()">↺ RESET</button>
      </div>
    </div>`;
}

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
  p.classList.remove('show');
  void p.offsetWidth; // reflow to restart animation
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
  renderTimer();
  setTimeout(() => {
    const h  = new Date().getHours();
    const gr = h<12 ? 'BOM DIA' : h<18 ? 'BOA TARDE' : 'BOA NOITE';
    showPopup(gr + ', GILMAR.', 'SISTEMA OPERACIONAL — SEMANA 2. EXECUTE A MISSÃO.');
  }, 800);
  loadTodayState().then(() => renderTasks(currentDay));
}
boot();
