// ═══════════════════════════════════════════════════════════
// GILMAR // OPS — app.js v3
// Planos reais: Guitarra Semana 2 + Treino + Inglês
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
 const all = document.querySelectorAll('#page-rotina .task-card').length;
 const done = document.querySelectorAll('#page-rotina .task-card.done').length;
 const pct = all > 0 ? Math.round(done/all*100) : 0;
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
// ── GUITARRA — SEMANA 2 — NÍVEL AVANÇADO (Consolidação + Integração Total) ──
const GUITAR_PLAN = {
 seg: { tipo:'TÉCNICA', foco:'Alternate Picking — Velocidade Controlada + Musicalidade', dur:'60 min', cor:'#e8ff47',
 exercicios:[
 { n:'Aquecimento: Cromático com aceleração progressiva', bpm:'80→120 BPM / 5 min', desc:'1-2-3-4 em todas as cordas. Comece em 80 BPM e aumente 5 BPM a cada volta. Foco: uniformidade acima de 110 BPM. Se "abrir" o som, volte 10 BPM.' },
 { n:'Sequências de 6 notas — 3 posições pentatônica em loop contínuo', bpm:'120–140 BPM', desc:'Conecte as 5 posições da pentatônica Am sem parar. Semana 1 foi separada — agora é fluída. Metrônomo em colcheias. Grave e compare com S1.' },
 { n:'Inside vs Outside Picking — aplicação musical em progressão real', bpm:'100 BPM', desc:'Aplique inside/outside picking sobre Dm7→G7→Cmaj7. Não apenas o exercício técnico — crie FRASES MUSICAIS usando as trocas de inside/outside. Integração S1+S2.' },
 { n:'Licks de 3 notas/corda — A Mixolídio + A Dórico (intercâmbio modal)', bpm:'110 BPM', desc:'A Mixolídio (sobre D7): A-B-C#-D-E-F#-G-A. Depois A Dórico (sobre Am7): A-B-C-D-E-F#-G-A. Alterne a cada 2 compassos. Ouça como o F#→G vs F#→G# muda completamente o sabor.' },
 { n:'Velocidade máxima honesta — mapeamento do plateau pessoal', bpm:'Máximo limpo', desc:'Descubra seu BPM máximo limpo em 4 notas/corda com alternate picking. Use metrônomo. Anote o número. Semana 3 compare. Não é sobre velocidade agora — é sobre saber onde você está.' },
 ],
 regra:'⚠️ Regra S2: velocidade sem musicalidade é atletismo, não música. Para cada exercício de velocidade, toque 30s de forma musical com backing track depois.'
 },
 ter: { tipo:'TEORIA APLICADA', foco:'Modal Interchange — Empréstimo Modal + Reharmonização', dur:'60 min', cor:'#4ecdc4',
 exercicios:[
 { n:'Empréstimo do modo Dórico paralelo — coloração b3 e 6ª maior', bpm:'Sem tempo', desc:'Em progressão de Cmaj: insira Am Dórico (A-B-C-D-E-F#-G). A diferença do Eólio é o F# natural (6ª maior). Use sobre Am7 e escute como "abre" o som. Técnica central de Guthrie.' },
 { n:'IV grau menor — empréstimo de tonalidade paralela (Imaj7→IVm7)', bpm:'80 BPM', desc:'Em C maior, o acorde Fm7 (IV menor) vem de C menor. Improvise com F Eólio (F-G-Ab-Bb-C-Db-Eb) sobre esse acorde. Regressão clássica Imaj7→IVm7. Ouça a tensão melancólica.' },
 { n:'Flatten 7th — Mixolídio sobre acorde maior dominante', bpm:'Livre', desc:'Onde aparece um G7, use G Mixolídio (G-A-B-C-D-E-F). O F (b7) é o veneno que dá tensão. Compare improvisando com G Jônico (sem F) — perceba a diferença harmônica total.' },
 { n:'Tritone substitution revisitado — improvisação sobre Db7 + resolução', bpm:'70 BPM backing', desc:'S1 introduziu o conceito. Agora IMPROVISE 5 min sobre Db7 usando Db Lídio Dominante (Db-Eb-F-G-Ab-Bb-Cb). Ouça o G natural resolvendo para o C do Imaj7. Jazz fusion aplicado.' },
 { n:'Reharmonização própria — progressão original com intercâmbio modal', bpm:'Backing track', desc:'Crie uma progressão: Am7→D7→Gmaj7. Adicione um acorde emprestado: insira Fm7 antes do D7 (emprestado de Frígio). Improvise 10 min. GRAVE obrigatório — compare com S1.' },
 ],
 regra:'🎵 S2: Modal interchange é o que faz progressões soarem "diferentes mas familiares". Guthrie usa em toda a obra. Ouça "Fives" prestando atenção nas trocas modais hoje.'
 },
 qua: { tipo:'TÉCNICA', foco:'Legato Avançado — 3 Oitavas + Tapping Extenso Integrado', dur:'65 min', cor:'#e8ff47',
 exercicios:[
 { n:'Legato de 3 oitavas — A menor do grave ao agudo sem parar', bpm:'70 BPM tercinas', desc:'Da corda 6 (5ª casa) até a 1ª corda (17ª casa) em A menor natural, legato puro. 14 notas de corrida contínua. Pressão de dedo uniforme — as notas do meio tendem a desaparecer. Grave e verifique.' },
 { n:'Hammer-on from nowhere (HFN) em contexto musical — S2 aplicado', bpm:'Livre / 10 min', desc:'S1: HFN básico na pentatônica. S2: crie frases de 8 compassos onde 30% das notas entram com HFN. A articulação muda completamente o caráter. Toque a mesma melodia com e sem HFN — compare.' },
 { n:'Tapping de 3 pontos — esquerda 2 notas + direita 1 tap + pull sequência', bpm:'80 BPM', desc:'Esquerda: 5h9 na corda 1, direita: tap 12, pull para 9, pull para 5. Repita descendo pela escala. 3 pontos de contato simultâneos. Técnica usada por Hutchings em frases descendentes velozes.' },
 { n:'Legato sobre changes — troca de acorde dentro da frase legato', bpm:'Backing 80 BPM', desc:'Frase de legato que começa em Am7 e termina em Dm7 sem parar. A nota de resolução deve ser parte do novo acorde. Isso é composição em tempo real — legato como frase musical.' },
 { n:'Velocidade máxima limpa em legato — mapeamento pessoal', bpm:'Máximo seu', desc:'Descubra seu BPM teto limpo em legato (como fez no alternate). Anote. Geralmente legato é 10-20% mais veloz que alternate — confirme isso em você. Dado valioso para S3.' },
 ],
 regra:'🎵 S2 Legato: Guthrie disse "legato é quando você pensa melodicamente, não tecnicamente." Cada exercício deve ter uma melodia, não só um padrão de digitação.'
 },
 qui: { tipo:'TÉCNICA', foco:'Sweep Avançado — 6 Cordas Completas + Extensões de Acorde', dur:'60 min', cor:'#e8ff47',
 exercicios:[
 { n:'Sweep 6 cordas — Am7 posição fechada (barre 5ª casa)', bpm:'65 BPM', desc:'Am7 (A-C-E-G) nas 6 cordas: 6ª/5ª casa, 5ª/7ª, 4ª/5ª, 3ª/5ª, 2ª/5ª, 1ª/8ª. Mute total com fraco esquerdo. Cada nota individual. 65 BPM é mais difícil do que parece para 6 cordas limpas.' },
 { n:'Sweep 6 cordas — Amaj9 (adicionar a nona B na 1ª corda)', bpm:'60 BPM', desc:'Amaj7 (A-C#-E-G#) + adicione a nona B na 1ª corda (7ª casa) para Amaj9. Extensão que estudamos na teoria S1. Execute em sweep completo. A 9ª no topo cria o sabor Lídio fusion característico.' },
 { n:'Arpejo + tapping no topo — sweep até a 1ª corda + tap extensão', bpm:'Livre', desc:'Sweep de Am7 completo até a 1ª corda, no topo tap+pulloff 2 casas acima (ex: 8ª tap, pulloff para 5ª). Adiciona extensão harmônica que sweep sozinho não alcança. Phrasing de Alex Hutchings.' },
 { n:'Sweep invertido — descendente completo + retorno em alternate picking', bpm:'70 BPM', desc:'Toque Amaj7 6 cordas descendo em sweep, depois volte subindo em alternate picking. Mistura sweep (down) com alternate (up) — economia máxima de movimento. Grave e analise sincronização.' },
 { n:'Composição: arpejo 6 cordas integrado como elemento musical', bpm:'Livre', desc:'Crie riff ou frase de 8 compassos usando pelo menos 1 sweep de 6 cordas como elemento musical (não técnico). O sweep serve à música — não é exibição. GRAVE e ouça criticamente.' },
 ],
 regra:'💡 S2 Sweep: 6 cordas limpo a 65 BPM > sweep sujo a 130 BPM. Velocidade vem da memorização muscular, não da força — relaxe as mãos completamente antes de começar.'
 },
 sex: { tipo:'EXPRESSIVIDADE', foco:'Phrasing Avançado — Dinâmica, Espaço e Intenção Total', dur:'60 min', cor:'#ff6b35',
 exercicios:[
 { n:'Dinâmica em 4 volumes — pp / mp / mf / ff na mesma frase', bpm:'Lento / livre', desc:'Crie uma frase de 4 notas. Toque pianissimo (quase inaudível), depois mezzo-piano, mezzo-forte, fortissimo. A mesma frase, 4 caracteres diferentes. Volume controlado = emoção controlada.' },
 { n:'Silêncio como nota — frases com pausas intencionais (rests musicais)', bpm:'Livre / 10 min', desc:'Toque 1 nota, espere 2 tempos. Toque 2 notas, espere 1 tempo. A pausa cria tensão — o ouvinte preenche o espaço com expectativa. Guthrie usa silêncio mais que qualquer outro guitarrista fusion.' },
 { n:'Vibrato com intenção emocional — 3 caracteres distintos', bpm:'Metrônomo livre', desc:'A mesma nota (E, 3ª corda 9ª casa) com 3 caracteres: vibrato amplo e lento (melancólico/Gary Moore), vibrato estreito e rápido (tenso/blues), vibrato irregular controlado (raiva). 3 min cada.' },
 { n:'S1 revisitado — micro-bend + vibrato + dinâmica simultâneos', bpm:'Lento', desc:'Combine: micro-bend de 1/4 de tom, vibrato no topo, com volume crescente (pp→ff). As 3 técnicas de expressão juntas. É o "arco completo" de uma nota. Isso separa músico de técnico.' },
 { n:'Melodia real — toque Yesterday (Beatles) com expressão total', bpm:'Lento / livre', desc:'Uma melodia conhecida com todas as ferramentas de expressão: vibrato, bending, dinâmica, silêncio. Imitação de voz cantada na guitarra é a meta de todo grande guitarrista. Grave e ouça.' },
 ],
 regra:'🎵 S2 Phrasing: "Uma nota com intenção vale mais que 100 notas sem alma." Aplique em cada nota hoje — quantidade proibida, qualidade obrigatória.'
 },
 sab: { tipo:'COMPOSIÇÃO FUSION', foco:'Criar Música Própria — 1 Ideia por Técnica da Semana', dur:'90 min', cor:'#ff6b35',
 exercicios:[
 { n:'Aquecimento S1+S2 — 12 min revisão integrada de técnicas', bpm:'Confortável', desc:'2 min cada: alternate picking lick musical, legato 3 oitavas fragmento, sweep 6 cordas 2x, vibrato 3 caracteres, 1 acorde com modal interchange. Confirmação corporal antes de criar.' },
 { n:'Composição — Intro de 4 compassos com modal interchange', bpm:'Livre', desc:'Escreva/grave um intro: progressão com pelo menos 1 acorde emprestado (modal interchange S2). Pode ser simples: Am7→Fmaj7→Dm7→G7sus4. O acorde emprestado é o tempero da composição.' },
 { n:'Composição — Solo de 16 compassos integrando S1+S2 (GRAVADO)', bpm:'Backing track Am 100 BPM', desc:'YouTube: "Am jazz fusion backing 100 BPM". 16 compassos de solo em vídeo. Use: alternate picking avançado, legato 3 oitavas, sweep 6 cordas, phrasing com espaço. Regra: tocar MENOS que S1.' },
 { n:'Restrição criativa: componha usando APENAS ritmo — notas mínimas', bpm:'Groove funk', desc:'Proibido: solos, técnica exibicionista. Apenas 1-2 notas por compasso com ritmo intencional. Staccato, swing, syncopação. Guthrie: "O ritmo vem antes de qualquer técnica."' },
 { n:'Análise crítica + definição das 3 metas para Semana 3', bpm:'25 min', desc:'Ouça tudo que gravou hoje e esta semana. Anote: (1) qual técnica evoluiu mais, (2) qual ainda é gargalo, (3) o que você quer criar na Semana 3. Seja específico. Evolução sem metas é acidente.' },
 ],
 regra:'🏆 S2 sábado: 2 semanas construindo ferramentas. Hoje crie algo que parece SEU. Mesmo imperfeito — autenticidade é mais valiosa que perfeição técnica. Toque como Gilmar, não como Guthrie.'
 },
 dom: { tipo:'REVISÃO + REPERTÓRIO', foco:'Flash Review S2 + Wonderful Slippery Thing — Seção A Completa', dur:'45 min', cor:'#c084fc',
 exercicios:[
 { n:'Flash review S2 — 1 exercício de cada dia (2 min cada)', bpm:'Confortável', desc:'Seg: lick alternate picking 130 BPM. Ter: improvise sobre Fm7 (IVm emprestado). Qua: legato 3 oitavas. Qui: sweep Am7 6 cordas completo. Sex: melodia Yesterday com expressão total.' },
 { n:'Wonderful Slippery Thing — Seção A completa (Intro + Riff principal + Variação)', bpm:'60% velocidade', desc:'S1: aprendeu o intro (4 compassos). S2: seção A completa com riff principal e primeira variação. Metrônomo em 60% e adicione 5% quando limpo. Identifique onde Guthrie usa os modos S2.' },
 { n:'Improviso livre — integração emocional de 2 semanas de estudo', bpm:'Livre / prazer', desc:'Nenhum objetivo técnico. Toque o que sentir. 2 semanas de estudo intenso precisam ser integradas com prazer puro. A guitarra deve ser amiga, não tarefa. Permita-se apenas tocar.' },
 ],
 regra:'✅ Semana 2 completa: alternate picking musical, modal interchange, legato 3 oitavas, sweep 6 cordas, phrasing com dinâmica e espaço. Semana 3: tapping avançado + composição própria.'
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
 qua: { foco:'SPEAKING & ACCENT', aula:"Rachel's English — American Accent", dur:'30 min',
 atividades:[
 "Rachel's English YouTube: 1 vídeo de pronúncia (redução/linking)",
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
 { n:'Estudo de inglês', s:'VER ABA INGLÊS PARA DETALHES', d:'30MIN', a:'06:00' },
 { n:'Leitura do livro', s:'20 PÁGINAS MÍNIMO', d:'30MIN', a:'06:30' },
 { n:'Estudo de guitarra', s:'VER ABA GUITARRA PARA DETALHES', d:'45MIN', a:'07:00' },
 { n:'Treino físico', s:'VER ABA TREINO PARA SPLIT DO DIA', d:'60MIN', a:'07:45' },
 { n:'Café da manhã & dieta', s:'200G PROTEÍNA/DIA · PROTOCOLO MACRO',d:'20MIN', a:'09:00' },
 ],
 tarde: [
 { n:'Foco — Insid360', s:'CAMPANHAS · RELATÓRIOS · REUNIÕES', d:'3H', a:'13:00' },
 { n:'Revisão de métricas', s:'GOOGLE/META ADS — TODOS PROJETOS', d:'45MIN', a:'16:00' },
 ],
 noite: [
 { n:'Leitura noturna', s:'15 PÁGINAS ANTES DE DORMIR', d:'20MIN', a:'21:30' },
 { n:'Revisão do dia', s:'O QUE FIZ / FICA PARA AMANHÃ', d:'10MIN', a:'22:00' },
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
 const key = `task-${day}-${p}-${i}`;
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
 const all = document.querySelectorAll('#page-rotina .task-card').length;
 const done = document.querySelectorAll('#page-rotina .task-card.done').length;
 document.getElementById('s-total').textContent = all;
 document.getElementById('s-done').textContent = done;
 document.getElementById('s-left').textContent = all - done;
 document.getElementById('s-pct').textContent = all > 0 ? Math.round(done/all*100)+'%' : '0%';
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
 const n = new Date();
 const hm = n.toTimeString().slice(0,5);
 document.getElementById('tb-clock').textContent = hm;
 const dm = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
 const mo = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
 document.getElementById('tb-date').textContent = `${dm[n.getDay()]} ${n.getDate()} ${mo[n.getMonth()]}`;
 const start=5*60+30, end=23*60, cur=n.getHours()*60+n.getMinutes();
 const pct = Math.min(100, Math.max(0, Math.round((cur-start)/(end-start)*100)));
 document.getElementById('db-fill').style.width = pct+'%';
 document.getElementById('db-head').style.left = pct+'%';
 document.getElementById('db-pct').textContent = pct+'%';
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
 { l:'Inglês', c:'var(--neon)' },
 { l:'Leitura', c:'var(--amber)' },
 { l:'Guitarra', c:'#c084fc' },
 { l:'Treino', c:'var(--neon)' },
 { l:'Dieta', c:'var(--amber)' },
 { l:'Oração', c:'#38bdf8' },
 { l:'Gratidão', c:'#38bdf8' },
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
 { l:'Listening', c:'var(--neon)', k:'ring-ls', v:50 },
 { l:'Vocab', c:'var(--amber)', k:'ring-vc', v:25 },
 { l:'Speaking', c:'#38bdf8', k:'ring-sp', v:60 },
 { l:'Grammar', c:'#c084fc', k:'ring-gr', v:40 },
];
function renderRings() {
 const wrap = document.getElementById('rings-ingles');
 if (!wrap) return;
 RING_DEFS.forEach(r => {
 const v = parseInt(LOCAL.get(r.k) || r.v);
 const circ = 2*Math.PI*26;
 const off = circ*(1-v/100);
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
 document.getElementById('bk-pct').textContent = v+'%';
 LOCAL.set('bk-p', v); schedSave('bk-p', v);
}
function loadBook() {
 const t = LOCAL.get('bk-t'), a = LOCAL.get('bk-a'), p = LOCAL.get('bk-p')||0;
 if (t) document.getElementById('bk-title').value = t;
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
 document.getElementById('w-lbl').textContent = waterMl+' / 3000ml';
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
 const last = localStorage.getItem('g_last');
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
 document.getElementById('popup-body').textContent = body;
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
 // Renderiza imediatamente com dados locais (não bloqueia na espera do Supabase)
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
 const h = new Date().getHours();
 const gr = h<12 ? 'BOM DIA' : h<18 ? 'BOA TARDE' : 'BOA NOITE';
 showPopup(gr + ', GILMAR.', 'SISTEMA OPERACIONAL. EXECUTE A MISSÃO.');
 }, 800);
 // Sincroniza com Supabase em segundo plano e re-renderiza se houver dados novos
 loadTodayState().then(() => renderTasks(currentDay));
}
boot();
