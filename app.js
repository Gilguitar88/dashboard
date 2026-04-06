// ═══════════════════════════════════════════════════════════
//  GILMAR // OPS — app.js v9
//  Guitarra S4 · Inglês S4 · Leitura S4 · Treino S4 (Deload)
//  Semana 4 · 30 mar 2026
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


// ── GUITARRA — SEMANA 3 — SWEEP PICKING · ECONOMY · CHORD MELODY (Guthrie Govan / Joe Satriani style) ──
const GUITAR_PLAN_S3 = {
  seg: { tipo:'TÉCNICA', foco:'Sweep Picking — Arpejos 3 e 5 Cordas', dur:'65 min', cor:'#e8ff47',
    exercicios:[
      { n:'Anatomia do sweep: posição da mão direita — palheta deitada a 45°', bpm:'40 BPM / 5 min', desc:'O erro nº1 do sweep é usar alternate picking entre as cordas. A palheta deve DESLIZAR, como varrer. Pratique só a mão direita no ar primeiro. Nenhuma nota soa — apenas o movimento correto.' },
      { n:'Arpejo Am 3 cordas em 2 oitavas — limpeza absoluta', bpm:'50–70 BPM', desc:'Am: A(3ª/2), E(2ª/5), A(1ª/5). Subida: sweep para cima com palheta deslizando. Descida: pull-off + sweep para baixo. Cada nota deve soar separada, não em acorde. Se soar junto, está rápido demais — reduza.' },
      { n:'Arpejo Am 5 cordas — forma completa', bpm:'60 BPM', desc:'5 cordas: A(5ª/0), E(4ª/7), A(3ª/9), C(2ª/10), E(1ª/12). Subida limpa + pull-off no topo + descida. O pull-off no topo é a curva — pratique separado 5 min. É onde quase todo iniciante em sweep trava.' },
      { n:'Arpejos maiores e diminutos — tríades Am, Cmaj, Dm, E°', bpm:'65–80 BPM', desc:'Cmaj 3 cordas: C(3ª/5), G(2ª/8), C(1ª/8). Dm: D(3ª/7), A(2ª/10), D(1ª/10). E dim: E-G-Bb. 4 formas diferentes, mesmo movimento. Trocar de arpejo dentro de uma progressão é o vocabulário fusion.' },
      { n:'Progressão harmônica com sweep: Am→Cmaj→Dm→E7', bpm:'70 BPM / backing', desc:'Backing Am funk. Aplique 1 arpejo sweep por acorde na progressão. 4 acordes × 3 cordas = frase fusion completa. Grave. Ouça: está servindo a progressão ou soando mecânico?' },
    ],
    regra:'⚠️ Sweep limpo a 70 BPM vale mais que sweep sujo a 140 BPM. Satriani levou meses para limpar. Você tem a mesma semana.'
  },
  ter: { tipo:'TÉCNICA', foco:'Economy Picking — Máxima Eficiência de Movimento', dur:'60 min', cor:'#4ecdc4',
    exercicios:[
      { n:'Economy vs Alternate — entenda a diferença em câmera lenta', bpm:'50 BPM / 10 min', desc:'Economy: quando muda de corda para baixo, use downstroke. Quando muda para cima, use upstroke. Elimina o "cruzamento" do alternate picking entre cordas. Frank Gambale base. Analise seu picking atual — onde você está desperdiçando movimento?' },
      { n:'Escala de Lá maior com economy picking — 3 notas por corda', bpm:'70 BPM', desc:'A-B-C#(5ª) / D-E-F#(4ª) / G#-A-B(3ª) / C#-D-E(2ª). 3 notas por corda permite economy perfeito. Subida: tudo downstrokes exceto dentro da corda. Descida: tudo upstrokes. O movimento é ondulado, não em zigue-zague.' },
      { n:'Economy + legato — combinar os dois vocabulários', bpm:'80 BPM', desc:'Regra: se a próxima nota está na mesma corda, use legato (h/p). Se muda de corda, use economy picking. Essa combinação é o que diferencia Guthrie de guitarristas puramente técnicos — fluidez absoluta sem esforço visível.' },
      { n:'Lick de economia de 6 notas em 3 cordas — loop 10 min', bpm:'Confortável até 100 BPM', desc:'Crie um lick: 3 notas (5ª corda) + 3 notas (4ª corda) com economy na mudança. Loop. Aumente 5 BPM cada 2 minutos. Quando sair a limpeza, volte 10 BPM. Nunca pratique sujeira.' },
      { n:'Frase musical de 8 compassos usando economy como base', bpm:'85 BPM / backing Am', desc:'Não pense em picking — pense na frase. A técnica deve ser invisível. Se você está pensando em economy enquanto toca, ainda não entrou no corpo. Grave. Revise onde ainda está consciente do picking.' },
    ],
    regra:'🎵 Economy picking não é sobre velocidade — é sobre elegância. Gambale parece não fazer esforço porque o esforço está no lugar certo.'
  },
  qua: { tipo:'HARMONIA APLICADA', foco:'Chord Melody — Harmonia e Melodia Simultâneas', dur:'70 min', cor:'#c084fc',
    exercicios:[
      { n:'Conceito: melodia na 1ª corda + harmonia nas cordas do meio', bpm:'Lento / sem metrônomo', desc:'Chord melody = você é a banda inteira. A melodia fica na corda mais aguda (1ª ou 2ª) e os acordes embaixo sustentam a harmonia. Base para jazz, bossa nova e qualquer peça solo. Guthrie usa isso em baladas. Escute "Wonderful Slippery Thing" — coda final.' },
      { n:'Melodia simples de Am + harmonização básica (7 posições)', bpm:'40 BPM / muito lento', desc:'Pegue 4 notas da melodia Am: A-C-E-G. Harmonize cada nota com o acorde que contém ela: Am7, Cmaj7, Em7, G7. Toque melodia + acorde simultaneamente. Soa infinitamente maior que só a melodia. Isso é chord melody em seu núcleo.' },
      { n:'Drop 2 voicings — acordes para chord melody', bpm:'Exercício estático', desc:'Drop 2: pegue um acorde de 4 vozes e desça a 2ª nota mais aguda uma oitava. Am7 drop2: A-G-C-E → toque nas cordas 4,3,2,1. Esses voicings abertos permitem que a melodia respire. Aprenda Am7, Dm7, G7, Cmaj7 em drop 2.' },
      { n:'Harm chord melody 8 compassos — progressão ii-V-I em Am', bpm:'Lento / metrônomo livre', desc:'Dm7→G7→Cmaj7 (ii-V-I). Toque cada acorde como chord melody: melodia na parte superior + voicing drop2 embaixo. 8 compassos completos. O objetivo não é velocidade — é que cada nota seja intencional e musical.' },
      { n:'Gravação de chord melody — ouça como ouvinte', bpm:'Livre', desc:'Grave os 8 compassos. Ouça como se fosse outra pessoa tocando. Pergunta: soa completo? A melodia está clara? Os acordes estão sustentando ou atrapalhando? Isso é o feedback mais importante: você é o músico E o crítico.' },
    ],
    regra:'♛ Chord melody é a habilidade que separa guitarristas de músicos completos. Leva anos — começar é o que importa hoje.'
  },
  qui: { tipo:'TÉCNICA', foco:'String Skipping — Intervalos Largos e Saltos', dur:'60 min', cor:'#e8ff47',
    exercicios:[
      { n:'String skipping: pular 1 corda com alternate picking', bpm:'60 BPM / 10 min', desc:'Padrão: 1ª corda + 3ª corda (pula a 2ª). A dificuldade é manter o alternate picking limpo quando pula. A mão direita precisa de um micro-movimento de "salto". Comece devagar — o buraco entre as cordas é físico e mental.' },
      { n:'Intervalos de 6ª e 7ª — o som do string skipping', bpm:'70 BPM', desc:'String skipping cria intervalos maiores naturalmente (6ª, 7ª, oitava). No contexto Am: A(3ª)→F#(1ª) = 6ª maior. Esse som aberto e espaçoso é o que torna o skipping musical. Não é técnica por técnica — é pela cor do intervalo.' },
      { n:'Arpejo em string skipping — Am spread voicing', bpm:'65 BPM', desc:'Am spread: A(5ª/0) + E(3ª/2) + A(1ª/5). Pula a 4ª e a 2ª corda. Som orquestral, maior que o arpejo normal. Toque alternando cordas distantes. Este voicing é o vocabulário Satriani de peças instrumentais.' },
      { n:'Lick string skipping + legato — mistura de vocabulários', bpm:'80 BPM', desc:'4 notas skipping + 4 notas legato na mesma frase. O contraste entre o salto e o fluxo legato cria drama musical. Ouça "Surfing with the Alien" — o intro usa exatamente essa combinação.' },
      { n:'Improvisação usando string skipping intencionalmente', bpm:'Backing Am / 15 min', desc:'Regra de hoje: pelo menos 1 frase com string skipping por compasso. Força você a usar o vocabulário em contexto musical real. Se travar, reduza BPM. Skipping em improvisação leva tempo — comece hoje.' },
    ],
    regra:'💡 Satriani, Guthrie e Nuno Bettencourt usam string skipping como assinatura. O espaço entre as notas é tão importante quanto as notas.'
  },
  sex: { tipo:'INTEGRAÇÃO', foco:'Solo Fusion Completo — 3 Semanas de Vocabulário', dur:'90 min', cor:'#ff6b35',
    exercicios:[
      { n:'Planejamento do solo: harmonia e estrutura emocional', bpm:'20 min / sem guitarra', desc:'Progressão: Am7→Dm7→G7→Cmaj7→Am7 (8 compassos × 2). Mapeie: onde vai usar sweep? Economy? Outside playing? Whammy? Tapping? String skipping? Escreva no papel. A construção começa na mente, não na guitarra.' },
      { n:'Gravar takes do solo — 5 tentativas completas', bpm:'80 BPM / backing', desc:'Sem parar por erros. 5 takes completos do início ao fim. Cada take usa a estrutura planejada mas com improvisação real. O take 5 sempre é melhor que o take 1 — isso é aquecimento criativo, não fracasso.' },
      { n:'Análise: qual take foi o melhor? Por quê?', bpm:'15 min', desc:'Ouça os 5 takes. Anote para cada: 1 ponto forte e 1 fraqueza. Identifique qual take teve mais intenção musical (não mais técnica). Esse é o take de referência para a semana 4.' },
      { n:'Take final — com consciência total de todos os elementos', bpm:'80 BPM', desc:'1 take final incorporando o melhor de todos os anteriores. Foco: musicalidade > técnica. Cada nota tem intenção. Use os silêncios. Este é seu documento de progresso da Semana 3.' },
      { n:'Comparação 3 semanas: ouvir os registros das semanas 1, 2 e 3', bpm:'15 min / escuta', desc:'Ouça a gravação de hoje lado a lado com as semanas anteriores. O que mudou no vocabulário? Na confiança? Na musicalidade? Escreva 3 observações específicas nas notas do app.' },
    ],
    regra:'🏆 3 semanas de prática diária focada = mais progresso que 1 ano de prática aleatória. Você tem evidência sonora disso hoje.'
  },
  sab: { tipo:'CRIAÇÃO', foco:'Demo Pessoal — Composição Própria com Identidade', dur:'90 min', cor:'#ff6b35',
    exercicios:[
      { n:'Definir o conceito da composição: título, clima, narrativa', bpm:'15 min / papel', desc:'Antes de tocar, defina: qual é o clima? (tenso, melancólico, celebrativo?) Qual a narrativa? (partida→jornada→chegada? Conflito→resolução?) Dar nome e narrativa antes de tocar é o que separa composição de improviso aleatório.' },
      { n:'Tema A: 8 compassos — identidade melódica clara e memorável', bpm:'70 BPM', desc:'O tema A deve poder ser cantarolado por quem ouvir. 4-6 notas, ritmo característico. Use os modos da Semana 2 para a harmonia. O tema é sua assinatura nesta peça — trabalhe até ser único.' },
      { n:'Tema B (contraste): 8 compassos — diferente em tom e técnica', bpm:'80 BPM', desc:'O tema B é o contraste dramático: se A é lento e melódico, B pode ser tenso com sweep ou skipping. Se A é em Am, B pode fazer outside playing ou mudar para modo paralelo. Contraste é drama.' },
      { n:'Bridge técnico: 4 compassos — clímax da peça', bpm:'90 BPM', desc:'O pico técnico: tapping, sweep, whammy expression — tudo a serviço da emoção do clímax. Não é exibição — é o momento de maior tensão antes da resolução. Construa o clímax para que a resolução faça sentido.' },
      { n:'Gravação completa da composição (A→B→Bridge→A) em vídeo', bpm:'Livre', desc:'Grave em vídeo (não só áudio). Poste ou guarde como documento da sua evolução. Esta composição é sua assinatura desta fase. Você a ouvirá em 1 ano com orgulho — ou com criticidade construtiva. Ambos são vitórias.' },
    ],
    regra:'🎼 Toda composição tem imperfeições. As de Guthrie também. O que conta é que existe — que saiu da mente para o mundo.'
  },
  dom: { tipo:'REVISÃO + PLANEJAMENTO', foco:'Análise Total + Definir Semana 4', dur:'45 min', cor:'#c084fc',
    exercicios:[
      { n:'Flash review Semana 3: sweep, economy, chord melody, skipping', bpm:'Confortável / 15 min', desc:'2 min cada: sweep Am 5 cordas, economy scale run A maior, chord melody 4 compassos, string skipping lick. Confirme que entrou no corpo. Se travar em algum, esse é o foco extra da Semana 4.' },
      { n:'Escuta analítica: Guthrie Govan "Fives" (completo)', bpm:'YouTube / 15 min', desc:'Ouça "Fives" com papel. Identifique: em quantos momentos usa sweep? Onde usa economy? Tem algum chord melody? String skipping? Anote tudo. Você agora tem o vocabulário para reconhecer o que ele faz.' },
      { n:'Definir 3 metas técnicas específicas para a Semana 4', bpm:'10 min', desc:'"Executar sweep Am 5 cordas limpo a 90 BPM". "Chord melody de 16 compassos gravado". "Economy run em A maior a 120 BPM sem sujar". Métricas reais. O que pode ser medido pode ser melhorado.' },
      { n:'Improviso livre — prazer puro — sem objetivo técnico', bpm:'Livre / 10 min', desc:'Toque apenas pelo prazer. Sem analisar, sem gravar para avaliar, sem técnica em mente. Amor pelo instrumento é o combustível que sustenta 20 anos de prática. Honre isso toda semana.' },
    ],
    regra:'✅ Semana 3 concluída: sweep picking, economy picking, chord melody, string skipping, solo fusion, composição própria gravada.'
  },
};


// ── GUITARRA — FUNÇÃO DINÂMICA POR SEMANA ──
// ── GUITARRA — SEMANA 4: LEGATO · HYBRID PICKING · HARMÔNICOS ──
const GUITAR_PLAN_S4 = {
  seg: { tipo:'TÉCNICA', foco:'Legato Completo — Cascatas & Fluidez Guthrie', dur:'65 min', cor:'#4ecdc4',
    exercicios:[
      { n:'Hammer-ons em cascata: 5 notas por corda sem palhetar', bpm:'50 BPM / 10 min', desc:'Dedo 1 faz o anchor, dedos 2-3-4 fazem hammer-on em sequência na mesma corda. A nota deve soar igual com ou sem palheta. Se estiver fraca, o dedo não está caindo com força suficiente — corrija antes de acelerar.' },
      { n:'Pull-offs em cascata: ligado descendente limpo', bpm:'55 BPM / 10 min', desc:'Pull-off correto: o dedo que sai "puxa" levemente a corda para baixo antes de soltar. Isso amplifica o som. Sem esse movimento, o pull-off morre no silêncio. Pratique até a última nota soar tão forte quanto a primeira.' },
      { n:'Legato de 3 oitavas na escala Am — sem palheta', bpm:'60–80 BPM', desc:'Am pentatônica, 3 oitavas, apenas legato. Subida: hammer-ons. Descida: pull-offs. Nenhuma nota palheta exceto a primeira de cada corda. Esse exercício revela onde seus dedos são fracos — é aí que o trabalho está.' },
      { n:'Guthrie lick: legato + string skipping (H-S-P pattern)', bpm:'70 BPM', desc:'Hammer + skip + pull-off na próxima corda. Padrão HSP em Am: 5ª(7h9)→3ª(9p7)→5ª(7). É a construção básica do vocabulário fusion de Guthrie. Grave a 70 BPM e ouça: está fluido ou mecânico? A resposta dita o trabalho.' },
      { n:'Improviso 10 min — legato como principal vocabulário', bpm:'Backing Am 80 BPM', desc:'Regra: cada frase deve ter pelo menos 4 notas em legato. Use palheta apenas para atacar a primeira nota de cada frase. Pense em sopro — cada "ar" é uma frase legato. A guitarra deve soar como saxofone.' },
    ],
    regra:'🎵 Legato puro é o que dá à guitarra a ilusão de ser outro instrumento. Guthrie, Holdsworth e Satriani construíram identidade sobre isso.'
  },
  ter: { tipo:'TÉCNICA', foco:'Hybrid Picking — Palheta + Dedos Simultâneos', dur:'65 min', cor:'#ff6b35',
    exercicios:[
      { n:'Anatomia do hybrid: palheta no indicador + médio e anelar livres', bpm:'Sem metrônomo / 10 min', desc:'Posição: palheta entre polegar e indicador como sempre. Médio (m) e anelar (a) ficam curvados prontos para puxar cordas. Pratique apenas o movimento dos dedos livres — puxe a 1ª corda com o médio sem palheta. O som deve ser limpo e forte.' },
      { n:'Padrão básico: palheta na grave + dedo na aguda simultaneamente', bpm:'60 BPM', desc:'Corda 4 (palheta downstroke) + corda 1 (médio puxando) ao mesmo tempo. Depois corda 4 (upstroke) + corda 1. O desafio é a coordenação: palheta e dedo em sincronia perfeita. Comece devagar até virar automático.' },
      { n:'Arpejo em hybrid picking: baixo + 3 notas em arpejo com dedos', bpm:'65 BPM', desc:'Am: A(5ª/palheta) + E(3ª/médio) + A(2ª/anelar) + E(1ª/mindinho). Som de violão fingerstyle na guitarra elétrica. Eric Johnson usa isso em "Cliffs of Dover". Com distorção soa cinematográfico. Experimente nos dois.' },
      { n:'Chicken picking: o som country / Guthrie / Brent Mason', bpm:'75 BPM', desc:'Alternate picking na grave + snap do dedo médio na aguda com leve mute. O "snap" cria o som percussivo característico do country. Guthrie usa em contexto fusion para adicionar textura rítmica. Pratique o snap isolado primeiro.' },
      { n:'Composição de 8 compassos usando hybrid como assinatura', bpm:'80 BPM / backing', desc:'Crie uma frase onde hybrid picking é obrigatório — não pode ser tocada igual com só palheta. Isso força integração real da técnica. Grave. Ouça: o hybrid está adicionando cor ou só dificultando? Deve soar diferente.' },
    ],
    regra:'🤌 Hybrid picking é o que separa guitarristas "de palheta" de guitarristas completos. Expande o vocabulário de cor e dinâmica infinitamente.'
  },
  qua: { tipo:'EXPRESSÃO', foco:'Harmônicos — Natural, Artificial e Tap', dur:'60 min', cor:'#c084fc',
    exercicios:[
      { n:'Harmônicos naturais: 12ª, 7ª, 5ª e 4ª casa — mapa completo', bpm:'Livre / 10 min', desc:'Casa 12: oitava. Casa 7: quinta. Casa 5: segunda oitava. Casa 4: terça maior. Toque cada um nas 6 cordas. Perceba as diferenças de timbre. Harmônicos naturais são o "sino" da guitarra — usados com whammy criam texturas orquestrais.' },
      { n:'Harmônicos artificiais: toque + pinch harmonic no ponto exato', bpm:'Exercício estático', desc:'Pinch harmonic: palheta toca a corda e o polegar imediatamente roça o nó da série harmônica. O "squeal" que você ouve em Zakk Wylde e Billy Gibbons. O ponto exato muda por nota — experimente mover a mão para cima/baixo da captação para achar o nó certo.' },
      { n:'Tap harmonics: mão direita toca levemente a 12ª acima da nota fretada', bpm:'Slow / 10 min', desc:'Frete a 5ª casa do Mi. Toque levemente (tap) com o dedo indicador direito na 17ª casa (5+12). Soa a oitava do Mi fretado em timbre cristalino. Harp harmonics = fazer isso em sequência de notas. Lindo em melodias limpas.' },
      { n:'Sequência harmônica em Am: melodia com harmônicos artificiais', bpm:'50 BPM / backing suave', desc:'Toque a melodia Am (A-C-E-G) usando pinch harmonics em cada nota. A melodia ganha timbre completamente diferente — etéreo, vocal. Pipa Gonzalez e Eddie Van Halen usam muito. É a mesma nota, outra dimensão sonora.' },
      { n:'Composição ambient: whammy + harmônicos naturais', bpm:'Livre / sem metrônomo', desc:'10 minutos de exploração livre. Whammy bar + harmônicos naturais + volume knob para swells. Sem palheta. Deixe o som guiar. Às vezes os melhores licks nascem sem intenção técnica — apenas escuta e reação. Grave tudo.' },
    ],
    regra:'✨ Harmônicos transformam a guitarra em um instrumento de outra dimensão. São a "cor extra" na paleta de qualquer guitarrista com identidade.'
  },
  qui: { tipo:'TÉCNICA', foco:'Alternate Picking Extremo — Velocidade com Controle', dur:'65 min', cor:'#e8ff47',
    exercicios:[
      { n:'Tremolo picking: nota única a 150–180 BPM — relaxamento total', bpm:'60 → 180 BPM / 10 min', desc:'1 nota (corda 1, casa 12). Alternate picking contínuo. Aumente o metrônomo 10 BPM a cada 2 min. A regra de ouro: se o antebraço ficar tenso, voltou 20 BPM. Velocidade sustentável é construída no relaxamento, não na tensão.' },
      { n:'Inside picking: mudança de corda para dentro da palheta', bpm:'80 BPM', desc:'Inside = upstroke em corda grave + downstroke em corda aguda. É o movimento mais difícil do alternate picking. Petrucci e Gambale passaram anos nisso. Padrão: 2 notas na 4ª corda + 2 notas na 3ª corda alternando. 100% alternate.' },
      { n:'Escala cromática com alternate picking em 4 oitavas', bpm:'100 BPM', desc:'1-2-3-4 em cada corda subindo e descendo. 4 oitavas completas, alternate picking perfeito. É o exercício de John Petrucci do Guitar World Lessons. Não há atalho — apenas repetição limpa constrói o circuito motor.' },
      { n:'Lick de Petrucci estilo: 6 notas por compasso, 3 por corda', bpm:'90 BPM', desc:'Padrão 3-3 em cordas adjacentes: 3 notas na 5ª + 3 notas na 4ª, alternate puro. Repita em todo o braço. Esse padrão é a espinha dorsal do picking técnico de dream theater. A 90 BPM limpo é o objetivo da semana.' },
      { n:'Aplicar alternate picking numa frase musical real', bpm:'95 BPM / backing Am', desc:'Não é sobre exercícios mecânicos — é sobre transportar a técnica para música. Improvise 5 minutos com a intenção explícita de usar alternate picking como base. A técnica deve estar tão internalizada que você não pensa nela.' },
    ],
    regra:'⚡ Picking extremo sem relaxamento é lesão. Picking com relaxamento é velocidade sustentável por décadas. Escolha o segundo.'
  },
  sex: { tipo:'INTEGRAÇÃO S4', foco:'Composição Completa — 4 Semanas de Vocabulário', dur:'90 min', cor:'#ff6b35',
    exercicios:[
      { n:'Planejamento: mapa técnico de 16 compassos com todas as técnicas S1–S4', bpm:'20 min / papel', desc:'Divida 16 compassos em seções: compassos 1-4 (legato + economy), 5-8 (sweep S3), 9-12 (hybrid picking), 13-16 (alternate picking + harmônicos). Cada técnica tem seu espaço. A estrutura não limita — libera, porque elimina a paralisia de escolha.' },
      { n:'Record session: 5 takes sem parar', bpm:'85 BPM / backing Am7→Dm7→G7→Cmaj7', desc:'5 takes completos. Sem editar, sem parar por erros. O take 3 será o melhor na maioria das vezes — o cérebro já internalizou a estrutura mas ainda está em modo "exploratório". Após os 5 takes, escolha o melhor e analise.' },
      { n:'Análise comparativa: S3 vs S4 — o vocabulário cresceu?', bpm:'15 min / escuta', desc:'Coloque o solo da S4 lado a lado com o da S3. Pergunta: quantas técnicas diferentes você usou? A frase soou mais intencional? O silêncio foi usado? Uma técnica nova entrou no vocabulário real (não só no exercício)? Escreva nas notas.' },
      { n:'Take final refinado: integração com consciência total', bpm:'85 BPM', desc:'1 take final incorporando o que aprendeu dos 5 anteriores. Foco em musicalidade: cada nota tem intenção, cada técnica serve a frase, não o contrário. Se uma técnica parecer forçada, tire. Autenticidade > demonstração.' },
    ],
    regra:'🏆 4 semanas = 28 sessões de prática focada. Cada técnica saiu do exercício e entrou na música. Este é o documento sonoro dessa jornada.'
  },
  sab: { tipo:'CRIAÇÃO', foco:'Repertório — Gravar 3 Covers ou Composições', dur:'120 min', cor:'#e8ff47',
    exercicios:[
      { n:'Escolha 3 músicas: 1 técnica, 1 melódica, 1 livre', bpm:'Preparação 20 min', desc:'Técnica: algo que desafia seu picking ou legato. Melódica: algo que expressa emoção sobre técnica. Livre: uma improvisação ou composição própria. O equilíbrio dos 3 tipos define a completude do seu repertório atual.' },
      { n:'Gravação 1 — música técnica: 3 takes, escolha o melhor', bpm:'Tempo da música', desc:'Sem edição entre takes. Cada take completo do início ao fim. Ouça os 3 e escolha por musicalidade, não por menor quantidade de erros. Erros musicais em boas frases valem mais que limpeza mecânica em frases sem alma.' },
      { n:'Gravação 2 — música melódica: foco em dinâmica e expressão', bpm:'Tempo da música', desc:'Volume knob, vibrato controlado, whammy se tiver. A dinâmica (forte/piano) é o que transforma uma boa melodia em uma grande performance. 3 takes. Avalie: onde a emoção apareceu? Como replicar isso intencionalmente?' },
      { n:'Gravação 3 — improvisação ou composição: 3 min livres', bpm:'Livre / backing ou sem', desc:'Sem estrutura predeterminada além do primeiro acorde. 3 minutos contínuos. Após, ouça do começo ao fim sem parar. Identifique 1 momento onde você se surpreendeu com o que tocou. Esse momento é o próximo vocabulário a desenvolver.' },
    ],
    regra:'🎙️ Gravar é o espelho mais honesto. Você pensa que está tocando X — o áudio mostra Y. A lacuna entre os dois é exatamente o que estudar na S5.'
  },
  dom: { tipo:'REVISÃO + PLANEJAMENTO', foco:'Avaliação 4 Semanas + Metas S5', dur:'45 min', cor:'#4ecdc4',
    exercicios:[
      { n:'Flash review técnico: 2 min cada — sweep, economy, chord melody, legato, hybrid', bpm:'70 BPM / confortável', desc:'Não para avaliar — para confirmar que entrou no corpo. Se travar em alguma técnica, ela é o foco extra da S5. Se fluir em todas, a S5 pode avançar para ritmo fusion, improvisação avançada ou composição de série.' },
      { n:'Escuta analítica: Guthrie Govan "Erotic Cakes" — álbum completo', bpm:'YouTube / 40 min', desc:'Ouça o álbum completo com foco técnico nas primeiras 2 faixas. Identifique: sweep, economy, legato, hybrid picking, chord melody. Você agora tem o vocabulário para reconhecer tudo que ele faz. Anote 3 coisas que quer desenvolver.' },
      { n:'Definir 3 metas específicas e mensuráveis para a Semana 5', bpm:'10 min / reflexão', desc:'Ex: "Sweep Am 5 cordas limpo a 100 BPM". "Chord melody de 32 compassos gravado". "Hybrid picking em 1 música de repertório gravada". Metas mensuráveis são cumpridas. Metas vagas são esquecidas.' },
    ],
    regra:'✅ S4 concluída: legato cascata, hybrid picking, harmônicos, alternate extremo, composição 16c, repertório gravado. Evolução documentada.'
  },
};

// ── GUITARRA — SEMANA 5: IMPROVISAÇÃO FUSION · IDENTIDADE SONORA ──
const GUITAR_PLAN_S5 = {
  seg: { tipo:'IMPROVISAÇÃO', foco:'Fusion Vocabulary — Frases com Identidade Própria', dur:'65 min', cor:'#ff6b35',
    exercicios:[
      { n:'Análise de 3 licks favoritos: desconstrua por que funcionam', bpm:'30 min / escuta ativa', desc:'Escolha 3 frases que você ama (de qualquer guitarrista). Toque lentamente. Identifique: qual técnica usa? Que escala? Qual o contorno melódico? A dissecação transforma admiração em vocabulário próprio. Copiar para entender não é copiar — é aprender.' },
      { n:'Crie 5 frases originais com o vocabulário S1–S4', bpm:'60–80 BPM / backing Am', desc:'Sem tocar o que você já sabe — combine técnicas de semanas diferentes numa única frase. Legato + sweep, ou hybrid + harmônico, ou alternate + economy. Crossover de vocabulário é onde a identidade começa.' },
      { n:'Call & response: 4 compassos pergunta, 4 compassos resposta', bpm:'75 BPM', desc:'Improvisação em diálogo interno. Os 4 compassos de "resposta" devem usar técnica diferente da "pergunta". Isso força variação e evita o loop mecânico que torna improvisos previsíveis.' },
      { n:'10 min de improviso livre — sem repetir a mesma frase 2x', bpm:'Backing Am7 a 80 BPM', desc:'Regra brutal: se você ouvir que está repetindo uma frase, mude imediatamente. Isso força expansão de vocabulário em tempo real. Grave tudo — o melhor lick que você já criou pode ter aparecido acidentalmente.' },
    ],
    regra:'🎯 Identidade sonora não é ter um som diferente — é ter frases que só você pensa. Essa semana, caça essas frases.'
  },
  ter: { tipo:'TÉCNICA', foco:'Ritmo Fusion — Polirritmo e Groove Assimétrico', dur:'65 min', cor:'#4ecdc4',
    exercicios:[
      { n:'Grupos de 3 sobre beat de 4 — deslocamento rítmico', bpm:'70 BPM / clique', desc:'Toque tríades (3 notas) em loop sobre um beat de 4/4. O acento cai em lugar diferente a cada vez, criando tensão rítmica. Frank Gambale e Guthrie usam isso constantemente. Soa complexo mas é simples: 3 contra 4.' },
      { n:'Hemíola: 3 em 2 — agrupamentos de semínimas em ternário', bpm:'80 BPM', desc:'Agrupe suas frases de 3 em 3 notas em compasso de 4/4. Soa como se o tempo mudou mas o clique é o mesmo. É o truque rítmico favorito de Wayne Krantz. Desorientador para quem ouve, libertador para quem toca.' },
      { n:'Ghost notes e dinâmica — toque o silêncio', bpm:'85 BPM / groove', desc:'Alterne notas reais com ghost notes (som abafado, sem pitch). A percussão entra na guitarra. Toque uma frase de 4 compassos onde metade das notas são ghost notes. Isso dá groove — a maioria dos guitarristas não sabe fazer.' },
      { n:'Frase de 5 notas em loop — cria polirritmo natural', bpm:'90 BPM', desc:'Toque uma frase de 5 notas em repeat contínuo sobre 4/4. A cada 20 notas (4 compassos), a frase completa um ciclo. Esse polirritmo natural cria tensão e resolução automáticas. É matemática que soa como música.' },
    ],
    regra:'⏱️ Ritmo é o que separa guitarrista de músico. Técnica sem groove é ginástica. Técnica com groove é arte.'
  },
  qua: { tipo:'HARMONIA', foco:'Modos e Superimposição — Além da Pentatônica', dur:'60 min', cor:'#c084fc',
    exercicios:[
      { n:'Dórico vs Eólio sobre Am — perceba a diferença do 6º grau', bpm:'Backing Am / 15 min', desc:'Am Dórico tem F# (6º maior) — som Santana, jazz fusion. Am Eólio tem F natural — som clássico, metal. Toque a mesma frase, mude só o 6º grau. A diferença emocional é imediata. Isso é o poder do modo.' },
      { n:'Lídio sobre Cmaj7 — o som "flutuante" e cinematográfico', bpm:'Backing Cmaj7 / 10 min', desc:'C Lídio tem F# (4º aumentado). Esse único # transforma um acorde comum num som de trilha sonora de ficção científica. Joe Satriani e Steve Vai vivem no Lídio. Toque e sinta por que.' },
      { n:'Superimposição: Am pentatônica sobre G7 — tensão e resolução', bpm:'Backing G7–Cmaj7 / 15 min', desc:'Toque Am pentatônica sobre G7 dominante. Cria tensão intensa (b9, #11, b13 soam todos). Resolva em Cmaj7 com C pentatônica. Isso é superimposição básica — o recurso harmônico mais poderoso do jazz-fusion.' },
      { n:'Crie 1 frase de 8 compassos usando 3 modos diferentes', bpm:'70 BPM', desc:'Mude o "sabor" melódico a cada 2 compassos mudando o modo. Planeje no papel antes: compasso 1-2 Dórico, 3-4 Frígio, 5-6 Lídio, 7-8 Mixolídio. A transição entre modos é o desafio — não pode soar aleatório.' },
    ],
    regra:'🎼 Modo é emoção específica em forma de escala. Escolher o modo certo é como um diretor de cinema escolhe a luz da cena.'
  },
  qui: { tipo:'REPERTÓRIO', foco:'Deep Work — 1 Música Completa Dominada', dur:'75 min', cor:'#e8ff47',
    exercicios:[
      { n:'Escolha 1 música desafiadora e divida em 4 seções', bpm:'20 min / análise', desc:'Nada de "aprender toda a música". Divida em: intro, verso, refrão/solo, outro. Cada seção tem seu desafio técnico isolado. Aprender por seções é 3x mais eficiente que do início ao fim — o cérebro consolida em partes.' },
      { n:'Seções 1 e 2: a 50% da velocidade, 10 vezes cada', bpm:'50% do original', desc:'10 repetições limpas de cada seção a 50% é mais valioso que 100 repetições na velocidade certa mas com erros. O sistema motor não diferencia velocidade — ele grava o padrão. Grave o padrão certo.' },
      { n:'Seções 3 e 4: mesma metodologia', bpm:'50% do original', desc:'Se a seção tem um solo ou parte difícil, isole os 4 compassos mais difíceis e trabalhe só eles por 15 min antes de fazer a seção completa. O problema nunca é a música — é sempre aqueles 4 compassos específicos.' },
      { n:'Juntando tudo: 5 takes da música inteira', bpm:'70% do original', desc:'5 takes sem parar, do início ao fim. Não interrompa por erros — continue. O cérebro aprende as transições entre seções apenas quando as enfrenta em sequência. Após os 5 takes, só o take 1 e o 5 — qual melhorou mais?' },
    ],
    regra:'📀 Dominar 1 música inteira vale mais que saber 10 pela metade. Repertório sólido é a prova real do músico.'
  },
  sex: { tipo:'COMPOSIÇÃO', foco:'Estrutura de Música Própria — Do Riff ao Arranjo', dur:'90 min', cor:'#ff6b35',
    exercicios:[
      { n:'Grave 5 riffs de 4 compassos — sem filtro, apenas crie', bpm:'Qualquer BPM', desc:'5 riffs diferentes em 10 minutos. Não julgue. Não corrija. O objetivo é quantidade — entre os 5, 1 vai ser bom o suficiente para construir. Criatividade sob pressão de tempo elimina o perfeccionismo que paralisa.' },
      { n:'Escolha o melhor riff e crie uma progressão de acordes por baixo', bpm:'Riff escolhido', desc:'Não precisa ser sofisticado: I-IV-V, I-VI-IV-V, ou i-VII-VI-VII. Coloque o riff sobre cada acorde e veja onde soa melhor. O contraponto entre riff fixo e harmonia que muda é o DNA do rock e fusion.' },
      { n:'Adicione uma seção B diferente (bridge ou solo)', bpm:'Progressão definida', desc:'A seção B cria contraste. Se o riff é denso e rítmico, a seção B pode ser melódica e espaçada. Contraste é o que faz uma música memorável — sem ele, é um loop, não uma composição.' },
      { n:'Grave a estrutura completa: A-A-B-A', bpm:'Estrutura final', desc:'4 seções, 12-16 compassos cada. Grave o esqueleto mesmo que rudimentar. Uma música com começo, meio e fim — mesmo simples — é uma composição completa. Isso é o que a maioria dos guitarristas nunca faz.' },
    ],
    regra:'✍️ Todo grande álbum começou com alguém gravando um riff numa sexta à noite sem plano. Você não precisa de um plano — precisa começar.'
  },
  sab: { tipo:'EXPRESSÃO', foco:'Gravação com Qualidade — Registro Profissional', dur:'120 min', cor:'#4ecdc4',
    exercicios:[
      { n:'Setup de gravação: nível de entrada, EQ básico, metronômo de referência', bpm:'30 min / setup', desc:'Sinal limpo antes de qualquer processamento. Distorção de entrada = lixo na gravação. Ajuste o gain para o pico não passar de -6dB. Metrônomo audível no fone para manter groove. Setup leva tempo — é investimento, não perda.' },
      { n:'Grave a composição da sexta: 3 takes completos', bpm:'Composição S5', desc:'Take 1: para aquecer e ouvir o que precisa ajustar. Take 2: o mais focado. Take 3: o mais relaxado. Profissionais gravam 20+ takes. Amadores esperam que 1 take seja perfeito. Entre os 3, você já tem algo útil.' },
      { n:'Grave 1 improvisação de 3 min — tema livre', bpm:'Backing Am7 a 85 BPM', desc:'3 minutos contínuos de improviso. Depois ouça inteiro. Identifique: onde você perdeu a conexão com o groove? Onde você se surpreendeu? Onde entrou em loop? Esses são os dados brutos da sua evolução.' },
      { n:'Ouça tudo e escreva 3 observações honestas nas notas', bpm:'Escuta crítica', desc:'Não "foi bem" ou "foi mal". Específico: "o legato perdeu velocidade nos pulls", "o vibrato sumiu quando acelerou", "o rhythm ficou sólido durante 2 compassos". Observação específica gera melhoria específica.' },
    ],
    regra:'🎙️ Gravar não é documentar — é aprender. O microfone não mente e o ouvido critico só funciona quando você não está tocando.'
  },
  dom: { tipo:'REVISÃO + PLANEJAMENTO', foco:'Síntese S5 e Definição do Próximo Ciclo', dur:'45 min', cor:'var(--amber)',
    exercicios:[
      { n:'Ouça os melhores momentos das gravações da semana', bpm:'20 min', desc:'Sem crítica — apenas escuta. O que soa como você? O que ainda soa como imitação? Essa distinção é o teste da identidade sonora. Quanto mais "você" soar, mais a evolução está sendo incorporada.' },
      { n:'Inventário técnico completo: do que você é capaz hoje?', bpm:'15 min / escrita', desc:'Liste: técnicas dominadas, técnicas em progresso, técnicas ainda não tocadas. Seja honesto e específico. "Sweep 5 cordas a 110 BPM limpo" é mensurável. "Sweep bom" não diz nada. O inventário honesto é o mapa do próximo mês.' },
      { n:'Defina 1 meta musical concreta para as próximas 4 semanas', bpm:'10 min', desc:'Ex: "Gravar 1 música própria de 3 min com intro, verso e solo". "Aprender inteiro 1 música de Guthrie". "Desenvolver 1 solo em 3 partes com dinâmica intencional". Uma meta, específica, com prazo. É o que separa desenvolvimento de hobby.' },
    ],
    regra:'🏁 5 semanas de prática focada. Você não é o mesmo guitarrista de março. Prove isso para você mesmo — grave algo hoje que seria impossível na S1.'
  },
};

function getGuitarPlano() {
  const s = getCurrentSemana();
  if (s >= 5) return GUITAR_PLAN_S5;
  if (s === 4) return GUITAR_PLAN_S4;
  if (s === 3) return GUITAR_PLAN_S3;
  return GUITAR_PLAN;
}


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

// ── TREINO — SEMANA 3: SOBRECARGA PROGRESSIVA + INTENSIDADE ──
const TREINO_S3 = {
  seg: { grupo:'PEITO + TRÍCEPS — SOBRECARGA', cor:'var(--neon)',
    exercicios:[
      'Supino reto barra — aumente 5% do peso da S2 (4x6-8)',
      'Supino inclinado halteres — drop set na última série (3x10 → falha)',
      'Crucifixo polia baixa — tempo 3s excêntrico (3x12)',
      'Tríceps corda supinado — isometria 2s no pico (3x15)',
      'Tríceps testa barra EZ (3x10-12)',
      'HIIT avançado: 10 rounds 20s sprint / 40s leve (~15 min)',
    ]
  },
  ter: { grupo:'COSTAS + BÍCEPS — VOLUME +', cor:'#38bdf8',
    exercicios:[
      'Puxada frontal fechada supinada (4x10-12) — contrai 1s no pico',
      'Remada curvada halteres alternada (4x10 cada) — ROM completo',
      'Remada sentada polia — pausa 2s na contração (3x12)',
      'Pull-over haltere pegada neutra (3x12) — foco no grande dorsal',
      'Rosca direta concentrada (3x12 cada) — sem swing',
      'Rosca 21s barra EZ — 1 série = 7 baixo + 7 cima + 7 completo × 3',
    ]
  },
  qua: { grupo:'CARDIO AVANÇADO + CORE FUNCIONAL', cor:'var(--amber)',
    exercicios:[
      'Bike MISS 20 min (155-165 bpm — intensidade moderada-alta)',
      'Circuit core: 4 rounds sem descanso entre exercícios',
      'Prancha RKC (contração total): 3x30s',
      'Dead bug com haltere (3x10 cada lado)',
      'Rollout roda abdominal (3x8-10)',
      'Mountain climber controlado (3x30s)',
    ]
  },
  qui: { grupo:'PERNAS — FORÇA + HIPERTROFIA', cor:'#c084fc',
    exercicios:[
      'Agachamento livre — PR de S2 +5% (5x5)',
      'Bulgarian split squat halteres (3x10 cada perna) — equilíbrio e força unilateral',
      'Leg press 45º — pause rep 2s no fundo (4x12)',
      'Stiff halteres — excêntrico 4s (3x12)',
      'Cadeira extensora drop set (3x15 → falha)',
      'Panturrilha em pé unilateral — 4x20 cada perna',
    ]
  },
  sex: { grupo:'OMBROS + TRAPÉZIO — DEFINIÇÃO', cor:'var(--neon)',
    exercicios:[
      'Desenvolvimento Arnold (4x10-12) — pronação completa',
      'Elevação lateral cabos (face-to-face): 4x15 — isometria no topo',
      'Elevação frontal haltere — alternada (3x12)',
      'Face pull cabo — retração escapular (4x15)',
      'Encolhimento barra atrás (4x15) — range completo',
      'Finalizador: 20 min LISS bike zona 2',
    ]
  },
  sab: { grupo:'FULL BODY FUNCIONAL + ESPORTE', cor:'var(--amber)',
    exercicios:[
      'Aquecimento: 10 min mobilidade quadril, ombro e torácica',
      'Clean & Press halteres (3x8) — potência funcional',
      'Farmer carry: 4 percursos de 20m — carga máxima controlada',
      'Esporte livre: futebol, natação ou corrida 30 min',
      'Refeeding day: carbs +80g — massa muscular prioritária',
      'Alongamento completo pós-esporte: 15 min',
    ]
  },
  dom: { grupo:'DESCANSO ATIVO — RECUPERAÇÃO INTENCIONAL', cor:'var(--muted)',
    exercicios:[
      'Caminhada 20-30 min (ritmo confortável — ativa circulação)',
      'Foam roller: quadríceps, IT band, costas — 2 min cada',
      'Mobilidade: 10 min protocolo de recuperação',
      'Proteína alta (220g/dia) — síntese proteica ativa no descanso',
      'Sono 8h+ — GH noturno é o principal anabolizante natural',
    ]
  },
};

// ── TREINO — FUNÇÃO DINÂMICA ──
// ── TREINO — SEMANA 4: DELOAD + TESTE DE PRs ──
const TREINO_S4 = {
  seg: { grupo:'PEITO + TRÍCEPS — DELOAD', cor:'var(--neon)',
    exercicios:[
      'Supino reto — teste de 5RM (peso máximo em 5 reps limpas)',
      'Supino inclinado halteres — 2x10 (60% da carga da S3)',
      'Crucifixo polia — 2x12, foco em alongamento e contração',
      'Tríceps corda — 2x15 leve, foco em sentir o músculo',
      'Sem HIIT — caminhada 15 min pós-treino',
    ]
  },
  ter: { grupo:'COSTAS + BÍCEPS — DELOAD', cor:'#38bdf8',
    exercicios:[
      'Puxada frontal — teste de 5RM (carga máxima em 5 reps)',
      'Remada curvada barra — 2x8 (60% da carga S3)',
      'Remada sentada polia — 2x12 leve, pausa 3s na contração',
      'Rosca direta — 2x12 leve, ROM completo',
      'Foam roller costas + bíceps: 5 min de recuperação ativa',
    ]
  },
  qua: { grupo:'MOBILIDADE + CORE — RECUPERAÇÃO ATIVA', cor:'var(--amber)',
    exercicios:[
      'Yoga ou mobilidade: 30 min (quadril, ombros, coluna torácica)',
      'Prancha frontal: 3x30s (intensidade reduzida)',
      'Dead bug lento: 3x8 cada lado — qualidade máxima',
      'Caminhada 30 min (zona 1 — recuperação total)',
      'Sem cardio intenso — deixe o corpo recuperar',
    ]
  },
  qui: { grupo:'PERNAS — DELOAD + TESTE', cor:'#c084fc',
    exercicios:[
      'Agachamento livre — teste de 3RM (máximo em 3 reps)',
      'Leg press — 2x12 (50% da carga S3)',
      'Stiff halteres — 2x12 leve, foco em flexibilidade',
      'Panturrilha em pé: 3x20 leve',
      'Alongamento quadríceps + isquiotibiais: 10 min',
    ]
  },
  sex: { grupo:'OMBROS + FULL BODY LEVE', cor:'var(--neon)',
    exercicios:[
      'Desenvolvimento halteres — 2x10 (60% da carga S3)',
      'Elevação lateral leve: 3x15 sem carga excessiva',
      'Face pull: 3x20 — saúde do manguito rotador',
      'Core: 10 min de prancha + dead bug',
      'Cardio leve: 20 min bike zona 1',
    ]
  },
  sab: { grupo:'ESPORTE LIVRE + REFEEDING', cor:'var(--amber)',
    exercicios:[
      'Esporte preferido: futebol, natação, tenis — 40-60 min',
      'Refeeding completo: carbs +100g, come na manutenção calórica',
      'Sem peso — apenas prazer e movimento espontâneo',
      'Alongamento completo + foam roller após esporte',
      'Sono 9h — deload de verdade é no sono, não só na academia',
    ]
  },
  dom: { grupo:'DESCANSO TOTAL — PREPARAÇÃO PARA S5', cor:'var(--muted)',
    exercicios:[
      'Descanso total — zero treino',
      'Avalie os PRs da semana: supino, puxada, agachamento',
      'Defina cargas iniciais da Semana 5 com base nos PRs',
      'Proteína: 220g — síntese proteica ativa mesmo no descanso',
      'Planejamento S5: nova divisão ou continuidade do split?',
    ]
  },
};

// ── TREINO — SEMANA 5: VOLUME TOTAL · NOVAS CARGAS PÓS-PRs ──
const TREINO_S5 = {
  seg: { grupo:'PEITO + TRÍCEPS — VOLUME TOTAL · CARGA DOS PRs', cor:'var(--neon)',
    exercicios:[
      'Supino reto — 4x6 com 90% do 5RM testado na S4 (foco em força)',
      'Supino inclinado halteres — 4x10 · aumente 2kg vs S3',
      'Crucifixo polia — 3x15 · tempo 3-1-3 (descida controlada)',
      'Tríceps corda — 4x12 + drop set na última série',
      'HIIT 15 min pós-treino: 40s on / 20s off · bike ou corda',
    ]
  },
  ter: { grupo:'COSTAS + BÍCEPS — VOLUME TOTAL · FORÇA BASE', cor:'#38bdf8',
    exercicios:[
      'Puxada frontal — 4x6 com 90% do 5RM testado na S4',
      'Remada curvada barra — 4x8 · aumente 5kg vs S3',
      'Remada sentada polia — 3x12 · pausa 2s na contração',
      'Rosca direta — 3x10 · alternado com martelo 3x12',
      'Face pull — 3x20 · saúde do manguito + finalização',
    ]
  },
  qua: { grupo:'CORE + MOBILIDADE — RECUPERAÇÃO ATIVA', cor:'var(--amber)',
    exercicios:[
      'Prancha frontal progressiva: 4x40s (10s a mais que S3)',
      'Ab wheel rollout: 3x10 — controle total na descida',
      'Dead bug lento: 3x10 cada lado com respiração nasal',
      'Mobilidade quadril + ombros: 20 min (yoga ou rotina própria)',
      'Caminhada 30 min + alongamento completo pós-sessão',
    ]
  },
  qui: { grupo:'PERNAS — FORÇA + HIPERTROFIA', cor:'#c084fc',
    exercicios:[
      'Agachamento livre — 4x5 com 90% do 3RM testado na S4',
      'Leg press — 4x12 · aumente 10kg vs S3',
      'Stiff halteres — 3x10 · foco em amplitude máxima',
      'Cadeira extensora — 3x15 + drop set para finalizar quadríceps',
      'Panturrilha em pé: 4x20 com pausa 2s no topo',
    ]
  },
  sex: { grupo:'OMBROS + TRAPÉZIO — VOLUME + DEFINIÇÃO', cor:'var(--neon)',
    exercicios:[
      'Desenvolvimento halteres — 4x10 · aumente 2kg vs S3',
      'Elevação lateral: 4x15 com controle total (sem impulso)',
      'Elevação frontal alternada: 3x12 cada braço',
      'Encolhimento halteres: 3x15 · 2s no topo',
      'Cardio: 25 min zona 2 (conversa + suor leve)',
    ]
  },
  sab: { grupo:'FULL BODY FUNCIONAL + ESPORTE', cor:'var(--amber)',
    exercicios:[
      'Kettlebell swing ou thruster: 5x10 (potência total)',
      'Pull-up máximo: 3 séries até a falha (registre as reps)',
      'Burpee: 3x10 sem pausa — teste de condicionamento',
      'Esporte preferido: futebol, natação ou tenis — 40 min',
      'Foam roller completo + 10 min de respiração diafragmática',
    ]
  },
  dom: { grupo:'DESCANSO TOTAL + NUTRIÇÃO ESTRATÉGICA', cor:'var(--muted)',
    exercicios:[
      'Zero treino — descanso ativo: caminhada leve 20 min se quiser',
      'Refeeding: carbs +80g na manutenção calórica (glicogênio muscular)',
      'Proteína: mínimo 220g — síntese proteica não para no descanso',
      'Registre as cargas da semana — base para progressão da S6',
      'Sono: 8h mínimo · O músculo cresce no sono, não na academia',
    ]
  },
};

function getTreinoPlano() {
  const s = getCurrentSemana();
  if (s >= 5) return TREINO_S5;
  if (s === 4) return TREINO_S4;
  if (s === 3) return TREINO_S3;
  return TREINO_SPLITS;
}


// ── SEMANA DETECTION SYSTEM ──
// Datas de início explícitas por semana — sem aritmética de datas (mais robusto)
function getCurrentSemana() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // meia-noite local
  // Cada item = primeiro dia (seg) da semana correspondente
  const inicios = [
    new Date(2026, 2,  9), // S1 — 09 Mar
    new Date(2026, 2, 16), // S2 — 16 Mar
    new Date(2026, 2, 23), // S3 — 23 Mar
    new Date(2026, 2, 30), // S4 — 30 Mar ← semana atual
    new Date(2026, 3,  6), // S5 — 06 Abr
    new Date(2026, 3, 13), // S6 — 13 Abr
    new Date(2026, 3, 20), // S7 — 20 Abr
    new Date(2026, 3, 27), // S8 — 27 Abr
  ];
  let s = 1;
  for (let i = 0; i < inicios.length; i++) {
    if (today >= inicios[i]) s = i + 1; else break;
  }
  return s;
}

// ── INGLÊS — SEMANA 1 (BASE) ──
const INGLES_S1 = {
  seg: { foco:'LISTENING — IMERSÃO INICIAL', aula:'BBC Learning English — 6 Minute English', dur:'30 min',
    atividades:[
      'BBC Learning English "6 Minute English" — 1 episódio completo (6 min)',
      'Anote 5 expressões idiomáticas do episódio — escreva no caderno',
      'Shadowing básico: repita as frases em voz alta pausando o vídeo 2x',
      'Duolingo — mínimo 10 min para manter streak ativo',
    ]
  },
  ter: { foco:'VOCABULÁRIO B2 — CONSTRUÇÃO DE BASE', aula:'Anki — Deck Business & Academic English', dur:'30 min',
    atividades:[
      'Anki: 20 palavras novas (nível B2) — sem pular',
      'Foco: collocations e phrasal verbs mais comuns em contexto',
      'Escreva 3 frases originais usando as palavras novas do dia',
      'Vocabulary.com — 10 min no nível intermediário para fixar',
    ]
  },
  qua: { foco:'PRONÚNCIA — SONS BÁSICOS', aula:"Rachel's English — American Accent Training", dur:'30 min',
    atividades:[
      "Rachel's English YouTube: 1 vídeo sobre sounds específicos (linking words)",
      'Shadowing: repita o vídeo completo 3x imitando o ritmo e tom',
      'Grave sua voz por 2 min falando sobre o dia — sem parar',
      'Ouça a gravação e identifique 1 som que precisa corrigir',
    ]
  },
  qui: { foco:'LEITURA — TEXTOS INTERMEDIÁRIOS', aula:'The Guardian ou BBC News em inglês', dur:'30 min',
    atividades:[
      'Leia 1 artigo de notícias em inglês (300-500 palavras)',
      'Sublinhe 5 palavras desconhecidas — adivinhe pelo contexto antes de buscar',
      'Escreva um resumo do artigo em 2 frases em inglês',
      'Podcast: This American Life — 15 min de exposição passiva',
    ]
  },
  sex: { foco:'GRAMÁTICA — ESTRUTURAS ESSENCIAIS', aula:'Perfect English Grammar — B2 Level', dur:'30 min',
    atividades:[
      'Foco: present perfect vs simple past — regras e uso natural',
      'Perfect English Grammar (site gratuito) — 1 lição com exercícios',
      '10 frases escritas aplicando a estrutura no contexto do dia a dia',
      'Revise e corrija seus próprios erros — identifique o padrão',
    ]
  },
  sab: { foco:'OUTPUT — PRIMEIRA PRODUÇÃO LIVRE', aula:'Gravação ou escrita guiada', dur:'30 min',
    atividades:[
      'Opção A: grave um áudio de 3 min descrevendo sua semana em inglês',
      'Opção B: escreva 150 palavras sobre um tema que você domina',
      'Opção C: Tandem/HelloTalk — encontre 1 parceiro de conversação',
      'Avalie o que produziu — o que foi fácil? O que travou?',
    ]
  },
  dom: { foco:'REVISÃO + EXPOSIÇÃO LEVE', aula:'Série/filme em inglês', dur:'20 min',
    atividades:[
      'Revise os Anki cards desta semana — reforce os que erraram',
      'Assista 20 min de série em inglês com legenda em inglês (não PT)',
      'Anote 2 expressões novas que ouviu e entendeu no contexto',
      'Planeje: qual é sua maior dificuldade? Foco da semana 2.',
    ]
  },
};

// ── INGLÊS — SEMANA 2 (PROGRESSÃO B2 AVANÇADO) ──
const INGLES_S2 = {
  seg: { foco:'LISTENING AVANÇADO — TED TALKS + NOTE-TAKING', aula:'TED.com — Talk de 10-15 min com transcrição', dur:'35 min',
    atividades:[
      'TED.com: escolha um talk sobre negócios, tecnologia ou comportamento (10-15 min)',
      'Ouça 1x sem parar — anote as ideias principais em inglês (não traduza)',
      'Ouça 2x prestando atenção no vocabulário técnico e nas transições ("moreover", "however", "consequently")',
      'Leia a transcrição oficial do TED e compare com suas notas — quantas ideias capturou?',
      'Escreva 1 parágrafo em inglês resumindo o ponto mais importante do talk',
    ]
  },
  ter: { foco:'VOCABULÁRIO EM CONTEXTO — CHUNKS & COLLOCATIONS', aula:'EnglishClass101 — Advanced Vocabulary + Ludwig Guru', dur:'35 min',
    atividades:[
      'Ludwig Guru (ludwig.guru): pesquise 5 expressões que você usa errado — veja como nativos usam',
      'Estude 10 collocations de negócios: "make a decision", "take responsibility", "drive results" — em contexto de frase',
      'Anki: adicione as 10 collocations como novos cards — exemplo de frase obrigatório',
      'Escreva um e-mail fictício de trabalho (5 frases) usando pelo menos 4 das collocations do dia',
    ]
  },
  qua: { foco:'FALA CONECTADA — INTONAÇÃO & RITMO AVANÇADO', aula:'Pronunciation Pro — Sentence Stress & Connected Speech', dur:'35 min',
    atividades:[
      'YouTube: "English connected speech for advanced learners" — 1 vídeo sobre reduction & linking',
      'Escolha 5 frases complexas do seu dia a dia de trabalho e pratique a redução de palavras funcionais (a→uh, and→n, of→uh)',
      'Shadowing avançado: grave você falando e compare com o nativo — foco no ritmo, não nas palavras individuais',
      'Pratique dizer 3 frases de opinião complex: "I believe that...", "What strikes me most is...", "It\'s worth noting that..."',
      'Grave 2 min descrevendo um projeto de trabalho — ouça e identifique onde seu ritmo trava',
    ]
  },
  qui: { foco:'LEITURA ANALÍTICA — THE ECONOMIST NÍVEL C1', aula:'The Economist ou Harvard Business Review', dur:'35 min',
    atividades:[
      'Leia 1 artigo completo do The Economist (assine free trial ou busque artigos gratuitos)',
      'Identifique a tese principal, os argumentos de suporte e a conclusão — anote em inglês',
      'Sublinhe 8 expressões sofisticadas que você nunca usaria: "amid growing concerns", "a watershed moment", "to pivot strategy"',
      'Resuma o artigo em 5 frases: 1 tese + 3 argumentos + 1 sua opinião — tudo em inglês',
      'Adicione as 8 expressões ao Anki com contexto da frase original',
    ]
  },
  sex: { foco:'ESCRITA AVANÇADA — COESÃO & ARGUMENTAÇÃO', aula:'Purdue OWL — Academic Writing + Hemingway Editor', dur:'35 min',
    atividades:[
      'Escreva 1 parágrafo argumentativo de 120 palavras sobre qualquer tema que você domina (marketing, música, saúde)',
      'Estrutura obrigatória: Topic sentence → 2 evidências → análise → concluding sentence',
      'Cole o texto no Hemingway Editor (hemingwayapp.com) — reduza até grade 8 ou menos',
      'Reescreva eliminando frases passivas e palavras fracas — substitua por verbos de ação',
      'Foco em transitions: "As a result,", "In contrast,", "This suggests that," — use pelo menos 3',
    ]
  },
  sab: { foco:'CONVERSAÇÃO DE ALTO NÍVEL — DEBATE & OPINIÃO', aula:'italki / Tandem — Sessão de conversação avançada', dur:'40 min',
    atividades:[
      'italki ou Tandem: marque sessão com tutor ou parceiro — tema: current events ou business',
      'Prepare 3 perguntas complexas antes da sessão para não ficar sem assunto',
      'Durante a conversa: use pelo menos 5 expressões novas da semana — anote quando usar',
      'Discuta um tópico polêmico (AI, marketing, saúde mental): pratique discordar educadamente: "That\'s an interesting point, but..."',
      'Após a sessão: escreva 3 coisas que melhorou em relação à semana 1',
    ]
  },
  dom: { foco:'AUTOAVALIAÇÃO + ESTRATÉGIA SEMANA 3', aula:'Revisão profunda de progresso', dur:'25 min',
    atividades:[
      'Revise TODOS os Anki cards desta semana — foque nos que errou 2x ou mais',
      'Assista 20 min de série/filme em inglês — desta vez sem legenda por 5 min, depois inglês',
      'Avaliação honesta: rate seu progresso de Listening / Speaking / Reading / Writing de 1-10',
      'Identifique sua maior fraqueza atual e planeje 1 ação específica para a Semana 3 corrigir',
    ]
  },
};

// ── INGLÊS — SEMANA 3 (FLUÊNCIA C1) ──
const INGLES_S3 = {
  seg: { foco:'LISTENING IMERSIVO — PODCASTS NATIVOS SEM TRANSCRIÇÃO', aula:'Lex Fridman Podcast ou Tim Ferriss Show', dur:'40 min',
    atividades:[
      'Escolha 30 min de podcast com 2 falantes nativos (não educativo — conversa natural)',
      'Escute sem parar — aceite não entender tudo, foque no fluxo e confiança',
      'Anote 10 expressões ou frases que ouviu e entendeu pelo contexto — sem pausar',
      'Pesquise 3 das expressões no Ludwig Guru e adicione ao Anki com exemplo de uso natural',
      'Desafio: resuma o tema do podcast em 1 minuto de áudio gravado — sem preparação',
    ]
  },
  ter: { foco:'VOCABULÁRIO ESPECIALIZADO — ÁREA DE TRABALHO', aula:'Jargão de marketing digital / business em inglês', dur:'35 min',
    atividades:[
      'Liste 10 termos técnicos do seu trabalho (marketing, vendas, gestão) que você usa em PT',
      'Pesquise como profissionais nativos usam esses termos — LinkedIn, HBR, Hubspot blog',
      'Monte um "pitch" de 60 segundos sobre seu trabalho usando os 10 termos técnicos em inglês',
      'Grave o pitch 3x — cada vez mais fluido e confiante — sem olhar para o texto na 3ª vez',
    ]
  },
  qua: { foco:'ACCENT REDUCTION — SONS PROBLEMÁTICOS DO PT-BR', aula:'Minimal pairs + Mouth position training', dur:'35 min',
    atividades:[
      'Identifique seus 3 sons mais problemáticos (comuns para BR: TH, V/W, vowel reduction)',
      'YouTube: "minimal pairs for Brazilian learners" — pratique TH/D, V/B, short vs long vowels',
      'Grave 10 frases com os sons problemáticos — compare com nativo frame a frame',
      'Pratique "mouth position" físico na frente do espelho — língua, lábios e mandíbula',
      'Sessão de 5 min de tongue twisters avançados para agilidade articulatória',
    ]
  },
  qui: { foco:'LEITURA CRÍTICA — ANÁLISE E CONTRA-ARGUMENTO', aula:'Long-form journalism: The Atlantic, Wired, Vox', dur:'40 min',
    atividades:[
      'Leia 1 artigo longo (800-1200 palavras) de The Atlantic ou Wired',
      'Identifique: qual é o argumento principal? Quais as premissas? O que está faltando?',
      'Escreva 1 parágrafo concordando E 1 parágrafo discordando — use evidências do texto',
      'Pesquise 1 dado ou fonte que contradiz o artigo — pratique pensamento crítico em inglês',
      'Adicione 5 novas expressões acadêmicas ao Anki com contexto completo',
    ]
  },
  sex: { foco:'ESCRITA PROFISSIONAL — E-MAILS & RELATÓRIOS', aula:'Business Writing Pro — HBR Writing Tips', dur:'35 min',
    atividades:[
      'Escreva 1 e-mail profissional completo em inglês (para cliente ou parceiro imaginário)',
      'Inclua: subject line forte, abertura formal, 3 pontos principais, call to action, fechamento',
      'Revise usando Grammarly (free) para erros gramaticais e tom profissional',
      'Reescreva o e-mail sendo 30% mais conciso — elimine advérbios e frases redundantes',
      'Estude 5 frases padrão de e-mail business que todo profissional C1 usa',
    ]
  },
  sab: { foco:'APRESENTAÇÃO EM INGLÊS — SIMULE UMA PITCH MEETING', aula:'Simulação de reunião profissional', dur:'45 min',
    atividades:[
      'Prepare uma mini-apresentação de 5 min sobre um projeto seu (real ou imaginário)',
      'Use estrutura: Hook → Problem → Solution → Results → Next Steps',
      'Grave a apresentação completa em vídeo — sem cortes, sem parar',
      'Assista o vídeo com olhar crítico: postura, clareza, velocidade, vocabulário',
      'Refaça a apresentação integrando as melhorias — grave novamente e compare',
    ]
  },
  dom: { foco:'FLUÊNCIA TOTAL — IMERSÃO LIVRE', aula:'Dia de imersão voluntária', dur:'30 min',
    atividades:[
      'Mude o idioma do celular para inglês por 24h — leia tudo em inglês',
      'Assista 30 min de conteúdo em inglês SEM legenda — aceite o desconforto',
      'Pense em inglês por 10 min — descreva mentalmente o que está fazendo no momento',
      'Revise Anki: foco total nos cards que errou esta semana — reforce com frases novas',
      'Escreva: o que você consegue fazer em inglês hoje que não conseguia na Semana 1?',
    ]
  },
};

// ── INGLÊS — PLANO ATIVO (auto-detecta semana) ──
// ── INGLÊS — SEMANA 4: MAESTRIA C1 · INTEGRAÇÃO REAL ──
const INGLES_S4 = {
  seg: { foco:'LISTENING NATIVO — REUNIÕES E CALLS EM INGLÊS', aula:'Real business calls · Harvard Business Review Podcast', dur:'45 min',
    atividades:[
      'Ouça 1 episódio completo do HBR IdeaCast (20–25 min) sem parar',
      'Anote 5 expressões que profissionais nativos usam em contexto de negócios que você nunca usaria',
      'Transcreva 3 frases do episódio de memória (sem reouvir) — teste de retenção auditiva real',
      'Simule: grave 2 min respondendo à tese principal do episódio como se fosse uma reunião',
      'Identifique: qual foi a ideia mais complexa que você entendeu sem precisar pausar?',
    ]
  },
  ter: { foco:'VOCABULÁRIO AVANÇADO — IDIOMS & PHRASAL VERBS PROFISSIONAIS', aula:'Idioms in Use Advanced (Cambridge) · Merriam-Webster', dur:'40 min',
    atividades:[
      'Estude 8 idioms de negócios de alto nível: "move the needle", "boil the ocean", "circle back", "low-hanging fruit", "bandwidth", "skin in the game", "double down", "needle-mover"',
      'Para cada idiom: escreva 1 frase no contexto exato da Insid360 — campanhas, clientes, resultados',
      'Grave um áudio de 3 min simulando uma reunião de briefing usando pelo menos 5 dos 8 idioms naturalmente',
      'Pesquise 3 expressões que você usa em português no trabalho — como profissionais nativos diriam?',
    ]
  },
  qua: { foco:'PRONÚNCIA C1 — REDUÇÃO, LINKING E STRESS AVANÇADO', aula:"Accent's Way · Rachel's English (YouTube) · YouGlish", dur:'40 min',
    atividades:[
      'YouGlish.com: pesquise 5 palavras que você pronuncia com sotaque forte — veja como 10 falantes nativos diferentes pronunciam',
      'Foco hoje: word stress em palavras de 3+ sílabas (PREsent vs preSENT, REcord vs reCORD)',
      'Shadowing avançado: escolha 3 min de um podcast e repita frase por frase com o mesmo ritmo, velocidade e entonação',
      'Grave você lendo 1 parágrafo de um artigo em inglês — compare com a leitura de um nativo no Speechify ou similar',
    ]
  },
  qui: { foco:'LEITURA C1 — ARGUMENTAÇÃO DENSA E VOCABULÁRIO ACADÊMICO', aula:'The Economist · Nature · Foreign Affairs', dur:'45 min',
    atividades:[
      'Leia 1 artigo completo do The Economist ou Foreign Affairs (800–1200 palavras) sem dicionário',
      'Identifique: qual a linha argumentativa? Quais as premissas implícitas? Qual o viés do autor?',
      'Sublinhe 10 palavras ou expressões que você raramente usaria — pesquise e adicione ao Anki',
      'Escreva 3 frases de resposta ao artigo em inglês usando vocabulário equivalente ao do texto',
    ]
  },
  sex: { foco:'ESCRITA EXECUTIVA — RELATÓRIO E ANÁLISE PROFISSIONAL', aula:'HBR Writing · Plain Language Guidelines', dur:'40 min',
    atividades:[
      'Escreva um relatório de performance fictício de 250 palavras (sobre qualquer cliente da Insid360) em inglês',
      'Estrutura: Executive Summary (2 frases) → Key Metrics → Insights → Recommendations → Next Steps',
      'Revise eliminando: adjetivos fracos, voz passiva excessiva, frases com mais de 25 palavras',
      'Traduza 1 parágrafo do seu português profissional mais sofisticado — veja o que você perde/ganha em inglês',
    ]
  },
  sab: { foco:'CONVERSAÇÃO DE ELITE — DEBATE E PERSUASÃO', aula:'italki tutor nativo · ou Tandem parceiro avançado', dur:'60 min',
    atividades:[
      'Sessão com tutor ou parceiro: debata 1 tema de negócios ou tecnologia (AI, marketing digital, saúde corporativa)',
      'Objetivo: fale 60% do tempo. Se o parceiro falar mais que você, você não está praticando suficientemente',
      'Use pelo menos 5 idioms estudados esta semana em contexto natural — não force, espere o momento certo',
      'Após a sessão: escreva 3 frases que você quis dizer mas não conseguiu — esses são os gaps reais',
    ]
  },
  dom: { foco:'AVALIAÇÃO 4 SEMANAS — PROGRESSO REAL E PLANO S5', aula:'Self-assessment profundo', dur:'30 min',
    atividades:[
      'Compare: o que você consegue fazer em inglês hoje vs na S1? Seja específico (listening, speaking, writing, vocab)',
      'Rate honestamente de 1–10: Listening / Speaking / Reading / Writing / Pronunciation / Vocabulary',
      'Identifique sua maior evolução e sua maior lacuna ainda existente',
      'Defina 1 meta de inglês para o próximo mês: um resultado concreto (ex: gravar 1 video de 5 min em inglês sobre marketing)',
    ]
  },
};

// ── INGLÊS — SEMANA 5: STORYTELLING · OUTPUT DE ALTO NÍVEL ──
const INGLES_S5 = {
  seg: { foco:'STORYTELLING PROFISSIONAL — CONTE HISTÓRIAS QUE VENDEM', aula:'TED Talk análise + prática de narrativa', dur:'40 min',
    atividades:[
      'Assista 1 TED Talk de 10-15 min com legenda em inglês (tema: negócios ou liderança)',
      'Identifique a estrutura narrativa: problema → jornada → solução → chamada para ação',
      'Reconte a história do TED em 2 minutos — para o espelho, em inglês, sem notas',
      'Grave o seu reconto e ouça: onde você travou? Que palavras faltaram? Esse é o vocabulário a estudar hoje.',
    ]
  },
  ter: { foco:'CONVERSAÇÃO DE ELITE — NEGÓCIOS E MARKETING DIGITAL', aula:'italki / Tandem ou simulação gravada', dur:'50 min',
    atividades:[
      'Sessão de conversação de 30 min: tema obrigatório — "my best marketing campaign result this year"',
      'Explique uma estratégia de performance marketing em inglês (CPA, ROAS, conversion funnel)',
      'Pratique: "Let me walk you through..." / "The data showed that..." / "What we found was..."',
      'Escreva 5 frases técnicas de marketing que você usou mal ou não conseguiu usar — corrija e memorize',
    ]
  },
  qua: { foco:'ESCRITA EXECUTIVA — EMAIL E RELATÓRIO C1', aula:'Grammarly + Harvard Business Review style', dur:'35 min',
    atividades:[
      'Reescreva 1 email importante da semana em inglês (pode ser fictício, mas baseado em real)',
      'Use a estrutura: Context (1 linha) → Key finding (2-3 linhas) → Recommendation (1-2 linhas) → Next step (1 linha)',
      'Elimine: "I wanted to", "Please be advised", "As per". Substitua por linguagem direta e executiva',
      'Leia 1 artigo curto do HBR (hbr.org) e copie 3 construções de frase que você quer incorporar',
    ]
  },
  qui: { foco:'LISTENING DE ELITE — SOTAQUE E VELOCIDADE NATIVA', aula:'Lex Fridman / Patrick Bet-David / How I Built This', dur:'45 min',
    atividades:[
      'Ouça 30 min de podcast sem legenda — escolha 1 episódio com tema de negócios ou tecnologia',
      'A cada 5 min, pause e resuma em voz alta (em inglês) o que acabou de ouvir — 30 segundos',
      'Identifique 5 expresões novas. Anote no campo INTEL abaixo com a tradução e contexto',
      'Shadowing: pegue 1 trecho de 1 min do podcast e repita junto com o falante — foco no ritmo e entonação',
    ]
  },
  sex: { foco:'APRESENTAÇÃO EXECUTIVA — PITCH DE 5 MINUTOS', aula:'Preparação e gravação de apresentação', dur:'60 min',
    atividades:[
      'Prepare um pitch de 5 min em inglês sobre 1 cliente ou projeto da Insid360 (real ou fictício)',
      'Estrutura: quem é o cliente → qual era o problema → o que você fez → qual foi o resultado → próximo passo',
      'Grave o pitch completo. Ouça e avalie: clareza / fluência / ritmo / vocabulário técnico',
      'Refaça o pitch incorporando as melhorias. Compare os 2 takes — a diferença é seu aprendizado do dia',
    ]
  },
  sab: { foco:'CONTEÚDO NATIVO — IMERSÃO E PRAZER REAL', aula:'Série, filme ou podcast sem esforço', dur:'60 min',
    atividades:[
      'Assista 1 episódio de série ou 1 filme em inglês sem legenda (se possível) ou com legenda em inglês',
      'Escolha algo que você genuinamente gostaria de assistir — imersão com prazer grava mais que estudo com esforço',
      'Anote 3-5 expressões coloquiais que ouviu e quer usar — sem compromisso de memorizar tudo',
      'Ao final: quanto você entendeu? Mais que na S4? Esse número sobe a cada semana de imersão consistente.',
    ]
  },
  dom: { foco:'AVALIAÇÃO 5 SEMANAS — VOCÊ EVOLUIU?', aula:'Self-assessment honesto + planejamento S6', dur:'30 min',
    atividades:[
      'Rate de 1-10 as 4 habilidades: Listening / Speaking / Reading / Writing — compare com sua avaliação da S4',
      'Grave 2 minutos falando sobre qualquer tema em inglês — sem preparação. Ouça e avalie sem piedade',
      'Identifique: qual habilidade cresceu mais? Qual ainda é seu maior gargalo?',
      'Defina 1 meta específica e mensurável para as próximas 3 semanas de inglês',
    ]
  },
};

function getInglesPlano() {
  const s = getCurrentSemana();
  if (s >= 5) return INGLES_S5;
  if (s === 4) return INGLES_S4;
  if (s === 3) return INGLES_S3;
  if (s === 2) return INGLES_S2;
  return INGLES_S1;
}
const INGLES_PLAN = INGLES_S2; // compatibilidade — sobrescrito em boot

// ── LEITURA — PLANO DIÁRIO ──
const LEITURA_PLAN = {
  seg: { foco:'LEITURA ATIVA — ABSORÇÃO PROFUNDA', meta:'20 páginas mínimo', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 20 páginas mínimo sem interrupção — telefone no silencioso', desc:'Blocos de 25 min (Pomodoro). Aceite não entender tudo de início — leia até o fim do trecho antes de voltar. Compreensão aumenta com o contexto completo.' },
      { n:'Sublinhe no máximo 5 frases por capítulo — as que mais impactam', desc:'Regra de ouro: se você sublinhou tudo, não sublinhou nada. Escolha as frases que mudaram como você pensa sobre o assunto. Menos é mais.' },
      { n:'Escreva 1 insight da leitura de hoje nas NOTAS abaixo', desc:'Uma frase sua, não do autor. O que você vai fazer diferente por causa do que leu? Isso é o que transforma leitura em ação.' },
    ]
  },
  ter: { foco:'LEITURA + ANOTAÇÕES ESTRATÉGICAS', meta:'20 páginas + notas', cor:'var(--amber)',
    tarefas:[
      { n:'Leia o trecho de hoje — foco nos argumentos centrais do autor', desc:'Pergunte: qual é a tese principal deste capítulo? O autor está tentando mudar sua crença, seu comportamento ou sua perspectiva? Identifique a intenção.' },
      { n:'Anote 3 ideias-chave com suas próprias palavras (não copie)', desc:'Se você não consegue explicar a ideia com suas palavras, ainda não entendeu. Reescreva como explicaria para um amigo. Esse é o teste real de compreensão.' },
      { n:'Relacione 1 ideia do livro com algo que viveu ou observou', desc:'Conhecimento que não conecta com experiência não fica. Escreva: "Isso me lembra quando..." ou "Isso explica por que..." nas notas. Essa conexão é a memória.' },
    ]
  },
  qua: { foco:'LEITURA CRÍTICA — QUESTIONE O AUTOR', meta:'20 páginas + análise', cor:'var(--amber)',
    tarefas:[
      { n:'Leia o trecho de hoje com postura de advogado do diabo', desc:'Enquanto lê, anote onde discorda ou onde o argumento parece fraco. Livros bons resistem ao questionamento. Livros medíocres não. Descobrir qual é esse já é aprendizado.' },
      { n:'Identifique 1 ponto que o autor não considera ou ignora', desc:'Todo autor tem viés. Qual contexto, pessoa ou situação contraria o argumento? Escreva nas notas. Você está desenvolvendo pensamento independente, não aceitação passiva.' },
      { n:'Pesquise rapidamente 1 referência que o autor cita (5 min)', desc:'Veja se a fonte diz o que o autor diz que diz. Isso desenvolve pensamento crítico real e frequentemente leva a leituras ainda melhores.' },
    ]
  },
  qui: { foco:'REVISÃO + CONTEXTO — CONSOLIDE O APRENDIZADO', meta:'Revisão + 15 novas páginas', cor:'var(--amber)',
    tarefas:[
      { n:'Releia suas anotações dos últimos 3 dias antes de continuar', desc:'A revisão espaçada é a única técnica de memorização com respaldo científico sólido. 5 minutos de revisão valem mais que 30 minutos de releitura.' },
      { n:'Leia 15 novas páginas — foco em conectar com o que já leu', desc:'O objetivo hoje não é velocidade, é coerência. Como o capítulo de hoje se encaixa com o que o autor construiu antes? Onde ele está indo?' },
      { n:'Pesquise brevemente quem é o autor — 10 min no máximo', desc:'Entender o contexto e a experiência do autor ilumina por que ele pensa assim. Não é gossip — é hermenêutica. O livro muda quando você sabe de onde veio.' },
    ]
  },
  sex: { foco:'LEITURA RÁPIDA — AVANÇO E RITMO', meta:'25+ páginas', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 25 páginas hoje — deixe o ritmo fluir sem parar para anotar', desc:'Sexta é dia de avanço. Leia com velocidade, confie na sua compreensão. Anote só o que for absolutamente urgente — o cérebro filtra o importante com familiaridade.' },
      { n:'Ao final, escreva 1 parágrafo resumindo os capítulos da semana', desc:'Sem abrir o livro. Escreva o que você lembra. O que ficou é o que importou. O que esqueceu talvez não precisasse ficar. Esse exercício calibra o que absorveu.' },
      { n:'Defina a meta de páginas para o fim de semana', desc:'Quantas páginas para terminar o capítulo ou a parte atual? Escreva o número exato nas notas. Meta específica é executada — meta vaga é esquecida.' },
    ]
  },
  sab: { foco:'LEITURA PROFUNDA — RELEITURA E EXTRAÇÃO', meta:'20 páginas + extração', cor:'var(--amber)',
    tarefas:[
      { n:'Releia o trecho mais importante da semana — aquele que você sublinhou', desc:'Segunda leitura de um trecho difícil ou poderoso revela camadas que a primeira não captou. Grandes leitores releem. Leitores mediocres só avançam.' },
      { n:'Escreva 3 aplicações práticas do livro na sua vida e trabalho', desc:'"Isso poderia mudar como faço X", "Vou aplicar Y quando Z acontecer", "Preciso parar de fazer W porque...". Concreto, específico, acionável.' },
      { n:'Atualize o progresso no slider acima e celebre o avanço', desc:'Progresso visível é motivação sustentável. Rastrear é respeitar o próprio esforço. Veja o quanto avançou desde o início do livro.' },
    ]
  },
  dom: { foco:'REVISÃO TOTAL + PLANEJAMENTO', meta:'Revisão + planejamento', cor:'var(--amber)',
    tarefas:[
      { n:'Folheie todo o livro lido até aqui — veja os seus grifos e notas', desc:'10 minutos de revisão de tudo que sublinhou. É como rever uma viagem pelas fotos. Consolida a narrativa do livro na sua memória de longo prazo.' },
      { n:'Escreva nas notas: qual é a tese central do livro até agora?', desc:'Uma ou duas frases. Se você não consegue, o livro está te derrotando na compreensão — mude a estratégia de leitura. Se consegue, está internalizando o argumento.' },
      { n:'Planeje: quantas páginas por dia para terminar o livro em X semanas?', desc:'Divida as páginas restantes pelos dias disponíveis. Coloque no campo de progresso. Leitura com prazo é leitura que termina. Sem prazo é intenção sem comprometimento.' },
    ]
  },
};

// ── LEITURA — SEMANA 3: SÍNTESE, VELOCIDADE E APLICAÇÃO ──
const LEITURA_S3 = {
  seg: { foco:'LEITURA ESTRATÉGICA — MAPA MENTAL DO LIVRO', meta:'25 páginas + mapeamento', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 25 páginas — rastreie a estrutura do argumento do autor', desc:'Na S3 você já conhece o livro. Leia com o mapa na cabeça: onde estamos na narrativa? O autor está construindo, aprofundando ou resolvendo? Isso acelera a compreensão e elimina releitura desnecessária.' },
      { n:'Construa um mapa mental de 1 capítulo nas notas (texto ou tópicos)', desc:'Escreva: ideia central → 3 sub-ideias → 1 exemplo por sub-ideia. Esse exercício força síntese ativa — você não pode mapear o que não entendeu. É o teste de compreensão mais honesto.' },
      { n:'Identifique o padrão narrativo do livro inteiro até aqui', desc:'O autor repete estruturas? Usa exemplos → princípio → aplicação? Ou dado → hipótese → conclusão? Reconhecer o padrão reduz o esforço cognitivo das próximas leituras em 40%.' },
    ]
  },
  ter: { foco:'LEITURA PROFUNDA — EXTRAÇÃO DE INSIGHTS ACIONÁVEIS', meta:'20 páginas + extração', cor:'var(--amber)',
    tarefas:[
      { n:'Leia com foco único: o que daqui eu aplicaria amanhã?', desc:'Filtre cada página por praticidade imediata. Não todo conhecimento é acionável — mas quando for, pare, sublinhe e escreva "AÇÃO:" nas notas. Insights sem ação são apenas entretenimento intelectual.' },
      { n:'Escreva 3 insights acionáveis do tipo "Vou fazer X quando Y"', desc:'Específico e condicional. "Vou aplicar a técnica de priorização toda segunda-feira ao planejar campanhas." Quanto mais específico o gatilho (quando Y), maior a chance de execução real.' },
      { n:'Compare 1 ideia do livro com sua realidade atual na Insid360', desc:'Conectar teoria ao seu trabalho transforma leitura em vantagem competitiva. O que o autor diz sobre estratégia, liderança ou resultado se aplica a algum cliente seu agora?' },
    ]
  },
  qua: { foco:'LEITURA VELOZ — AVANÇO SEM PERDA DE COMPREENSÃO', meta:'30+ páginas', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 30 páginas usando o método "primeira e última frase"', desc:'Leia a 1ª e última frase de cada parágrafo antes de ler o parágrafo inteiro. Se você já entende o argumento, avance. Se não, leia completo. Acelera 30-40% sem perder a tese principal dos capítulos.' },
      { n:'Pratique suprimir a subvocalização por 10 minutos', desc:'Subvocalização (falar mentalmente enquanto lê) limita a velocidade à da fala (~150 ppm). Para suprimi-la: masque chiclete, conte 1-2-3 mentalmente ou foque na imagem da palavra, não no som. Treino diário muda o padrão em semanas.' },
      { n:'Ao final: você entendeu o argumento principal de hoje sem reler?', desc:'Sim = sua velocidade está certa. Não = lentifique até a compreensão voltar. Velocidade de leitura correta é a máxima velocidade em que você retém. Não há atalho para isso.' },
    ]
  },
  qui: { foco:'REVISÃO ESPAÇADA — CONSOLIDAR AS 3 SEMANAS', meta:'Revisão + 15 páginas novas', cor:'var(--amber)',
    tarefas:[
      { n:'Releia todas as suas notas e grifos desde a S1 deste livro', desc:'15 minutos. Não leia o livro — leia suas notas. O que ainda ressoa? O que perdeu relevância? O que você ainda não aplicou? Essa varredura ativa a memória de longo prazo de forma mais eficiente que qualquer releitura.' },
      { n:'Escreva a "tese em 3 frases" do livro inteiro até agora', desc:'3 frases: 1) O problema que o livro resolve. 2) A solução ou argumento central. 3) A implicação prática para você. Se consegue fazer isso, internalizou o livro. Se não, identifique onde a compreensão quebrou.' },
      { n:'Leia 15 páginas novas com atenção à confirmação ou contradição da sua tese', desc:'Autores evoluem o argumento. A tese do meio pode contradizer a introdução. Rastrear esse movimento é leitura crítica avançada — e é o que diferencia quem leu do quem entendeu.' },
    ]
  },
  sex: { foco:'OUTPUT — ENSINAR PARA APRENDER DE VERDADE', meta:'20 páginas + output escrito', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 20 páginas — anote apenas o que explicaria para outra pessoa', desc:'O filtro "eu explicaria isso" é o mais rigoroso. Só fica o que você realmente entendeu, não o que achou interessante mas não processou. Qualidade sobre quantidade de grifos.' },
      { n:'Escreva uma explicação de 150 palavras do capítulo mais relevante da semana', desc:'Como se explicasse para um colega que não leu o livro. Sem jargão do autor. Nas suas palavras. Esse exercício é chamado de "the Feynman technique" — a melhor ferramenta de aprendizado profundo que existe.' },
      { n:'Identifique 1 crença que o livro mudou ou desafiou em você', desc:'Se o livro não mudou nenhuma crença ou comportamento até agora, ou ele é fraco, ou você está lendo em modo passivo. Qual ideia do livro está em conflito com o que você acreditava? Explore essa tensão nas notas.' },
    ]
  },
  sab: { foco:'SÍNTESE FINAL — CONSTRUIR O DOCUMENTO DE APRENDIZADO', meta:'Síntese completa', cor:'var(--amber)',
    tarefas:[
      { n:'Crie um resumo pessoal do livro lido até agora (300-500 palavras)', desc:'Nas notas abaixo ou num documento externo. Estrutura: problema → argumento central → 3 ideias-chave → 3 aplicações práticas → sua avaliação (1-10, por quê). Esse documento é seu ativo intelectual — não o livro.' },
      { n:'Liste 5 ações concretas que vai tomar por causa do livro', desc:'Com prazo. "Esta semana vou...", "No próximo mês vou...", "Antes de terminar o livro vou...". Sem prazo é intenção. Com prazo é compromisso. A diferença é toda.' },
      { n:'Atualize o slider de progresso e defina data para terminar o livro', desc:'Se falta menos de 20% → termine essa semana. Se falta 20-50% → próximos 3 dias. Se falta mais → recalibra o ritmo diário. Livro sem data de conclusão tem alta chance de virar DNF (did not finish).' },
    ]
  },
  dom: { foco:'PLANEJAMENTO — PRÓXIMO LIVRO E LISTA DE LEITURA', meta:'Planejamento intencional', cor:'var(--amber)',
    tarefas:[
      { n:'Defina qual será o próximo livro antes de terminar o atual', desc:'Leitores sérios têm fila. Não ficam sem livro nem um dia. Sua próxima leitura deve conectar-se ao atual (aprofundar o tema) ou contrastar (perspectiva oposta). Curar sua biblioteca é tão importante quanto ler.' },
      { n:'Avalie seu ritmo de leitura das últimas 3 semanas', desc:'Quantas páginas por dia em média? Quantos dias perdeu? O que causou as interrupções? Um dado honesto sobre seu comportamento real é o ponto de partida para ajustar o protocolo da S4.' },
      { n:'Revise as notas da semana e adicione 1 reflexão final sobre o livro', desc:'Uma frase que capture o que este livro representa para você agora. Não para o autor, não para ninguém mais. Sua relação com o conhecimento adquirido. Isso ancora a memória de forma única.' },
    ]
  },
};

// ── LEITURA — FUNÇÃO DINÂMICA ──
// ── LEITURA — SEMANA 4: CONCLUSÃO + ENSINAR + PRÓXIMO LIVRO ──
const LEITURA_S4 = {
  seg: { foco:'SPRINT FINAL — TERMINE O LIVRO ESTA SEMANA', meta:'30+ páginas', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 30 páginas — o ritmo de conclusão é diferente do de absorção', desc:'Quando você está perto do fim, o cérebro acelera naturalmente. Use isso. O objetivo hoje não é extrair cada insight — é terminar o arco. A síntese vem depois. Por agora: avance.' },
      { n:'Atualize o slider de progresso e calcule as páginas restantes', desc:'Se restam 60 páginas e você lê 30 hoje e 30 amanhã, o livro termina quarta. Coloque isso no calendário. Livros sem data de conclusão raramente terminam. A data transforma intenção em compromisso.' },
      { n:'Anote 1 insight novo — algo que a S4 trouxe que a S1 não teria captado', desc:'4 semanas de leitura progressiva desenvolveram sua capacidade analítica sobre este livro. O que você vê agora que era invisível na primeira semana? Essa evolução de leitura é tão valiosa quanto o conteúdo do livro.' },
    ]
  },
  ter: { foco:'LEITURA INTENSIVA — PENÚLTIMA SESSÃO', meta:'25-30 páginas', cor:'var(--amber)',
    tarefas:[
      { n:'Leia focando na resolução do argumento do autor', desc:'Todo livro não-ficcional tem uma promessa implícita na introdução. As últimas páginas são onde o autor entrega (ou não) essa promessa. Leia com essa pergunta: o autor cumpriu o que prometeu no início?' },
      { n:'Sublinhe a frase mais poderosa do livro inteiro — aquela que ficará', desc:'Não a mais bonita literariamente — a mais transformadora para você. Essa frase é o epicentro do aprendizado deste livro. Ela merece um lugar especial nas notas. Escreva-a do livro, depois escreva por que ela importa.' },
      { n:'Prepare-se para terminar amanhã: defina o próximo livro', desc:'O próximo livro deve estar escolhido antes de fechar o atual. Se você tem uma "fila" de leitura, avance ela. Se não tem, dedique 10 min hoje a pesquisar 3 opções. A continuidade da leitura depende da próxima escolha já estar pronta.' },
    ]
  },
  qua: { foco:'CONCLUSÃO — FECHE O LIVRO COM INTENÇÃO', meta:'Páginas restantes', cor:'var(--amber)',
    tarefas:[
      { n:'Termine o livro — última sessão de leitura desta obra', desc:'Termine sem pressa. As últimas páginas merecem a mesma atenção que as primeiras. Autores frequentemente colocam a síntese mais poderosa na conclusão — é onde tudo converge. Leia devagar.' },
      { n:'Imediatamente após: escreva de memória as 3 principais ideias do livro', desc:'Sem abrir o livro. O que você lembra agora, imediatamente após terminar, é o que ficou de verdade. Esse exercício calibra o que absorveu. O que não está nessa lista provavelmente não ficou — e não precisava ficar.' },
      { n:'Atualize o slider para 100% e registre a data de conclusão nas notas', desc:'Data de início → data de conclusão. Quantas semanas levou? Qual foi o ritmo médio de páginas por dia? Esses dados constroem seu "perfil de leitor" e ajudam a calibrar os próximos livros com mais precisão.' },
    ]
  },
  qui: { foco:'SÍNTESE TOTAL — O DOCUMENTO FINAL DO LIVRO', meta:'Síntese escrita completa', cor:'var(--amber)',
    tarefas:[
      { n:'Escreva o resumo definitivo do livro: 400-600 palavras', desc:'Estrutura: 1) O problema que o livro resolve. 2) O argumento central. 3) As 3 ideias mais importantes. 4) As 3 aplicações práticas para sua vida/trabalho. 5) Sua avaliação honesta (o que funcionou, o que não funcionou, nota 1-10 e por quê). Esse documento é seu ativo intelectual — não o livro.' },
      { n:'Liste 5 ações concretas com prazo que nasceram deste livro', desc:'Cada ação com: O QUÊ + QUANDO + COMO MEDIR. Sem essas 3 partes, não é uma ação — é uma intenção. Intenções não mudam comportamento. Ações com prazo e métrica mudam.' },
      { n:'Indique este livro (ou não): você recomendaria? Para quem? Por quê?', desc:'Esse exercício força uma avaliação honesta e consolida o aprendizado através da argumentação. "Recomendo para gestores de marketing porque..." é uma frase que exige que você saiba o que o livro realmente diz.' },
    ]
  },
  sex: { foco:'TÉCNICA FEYNMAN — ENSINE O LIVRO PARA FIXAR', meta:'Output ensinável', cor:'var(--amber)',
    tarefas:[
      { n:'Grave um áudio de 5 min ensinando o livro como se fosse para um amigo', desc:'Sem roteiro, sem consultar o livro. Apenas fale. O que sair espontaneamente é o que você realmente aprendeu. O que travar é o que você achou que aprendeu mas não interiorizou. Essa lacuna é o próximo estudo.' },
      { n:'Identifique 1 ideia do livro que você consegue explicar e 1 que você não consegue', desc:'A que você não consegue explicar revela onde a compreensão é superficial. Volte para essa parte específica do livro por 10 minutos. Uma releitura focada vale mais que uma releitura completa.' },
      { n:'Compartilhe 1 insight com alguém (mensagem, conversa ou post)', desc:'Ensinar para uma pessoa real é o nível mais alto de aprendizado. A pergunta "o que você leu de bom?" é uma das oportunidades mais subutilizadas de consolidação. Use.' },
    ]
  },
  sab: { foco:'INÍCIO DO PRÓXIMO LIVRO — PRIMEIRAS 30 PÁGINAS', meta:'30 páginas do novo livro', cor:'var(--amber)',
    tarefas:[
      { n:'Abra o próximo livro e leia as primeiras 30 páginas sem parar', desc:'O começo de um novo livro é o momento de maior evasão. A inércia do livro anterior ainda está no sistema. Force as primeiras 30 páginas — após isso, a curiosidade natural toma conta. Nunca feche o atual sem já começar o próximo.' },
      { n:'Registre o título, autor e data de início no slider', desc:'Data de início + meta de páginas/dia = data estimada de conclusão. Coloque isso agora. Um livro com data de início e data projetada de fim tem 3x mais chance de ser terminado que um sem.' },
      { n:'Qual é a sua expectativa? O que você quer aprender com este livro?', desc:'Escreva 2 frases nas notas antes de mergulhar. Ler com intenção específica aumenta a retenção porque o cérebro filtra ativamente o que é relevante para a pergunta que você trouxe. Sem pergunta, tudo parece igualmente importante — e portanto nada realmente fica.' },
    ]
  },
  dom: { foco:'PLANEJAMENTO — LISTA DE LEITURA DO TRIMESTRE', meta:'Curadoria intencional', cor:'var(--amber)',
    tarefas:[
      { n:'Monte a lista dos próximos 3 livros com justificativa para cada escolha', desc:'Não leia aleatoriamente. Cada livro deve ter um motivo: aprofundar um tema, contrastar uma perspectiva, resolver um problema real. Uma biblioteca curada é uma vantagem competitiva intelectual que poucos constroem conscientemente.' },
      { n:'Avalie seu ritmo de leitura das últimas 4 semanas', desc:'Total de páginas lidas / 28 dias = páginas por dia. Com esse ritmo, quantos livros por ano você leria? Compare com o que você quer ler. Ajuste o protocolo diário se necessário.' },
      { n:'Revise o resumo que escriu hoje — adicione 1 reflexão extra com 7 dias de distância', desc:'O que você nota agora, com 7 dias de distância do fim do livro, que não estava na síntese imediata? A distância temporal revela o que realmente ficou versus o que pareceu importante no calor da leitura.' },
    ]
  },
};

// ── LEITURA — SEMANA 5: NOVO LIVRO · PROFUNDIDADE MÁXIMA ──
const LEITURA_S5 = {
  seg: { foco:'NOVO LIVRO — IMERSÃO ESTRATÉGICA INICIAL', meta:'30 páginas + mapeamento do livro', cor:'var(--amber)',
    tarefas:[
      { n:'Leia as primeiras 30 páginas sem parar — capture o tom e tese do autor', desc:'As primeiras 30 páginas entregam o contrato do livro: qual é a promessa? O que o autor quer mudar em você? Leia com essa pergunta ativa. A resposta é o filtro pelo qual você vai ler o resto.' },
      { n:'Mapeie o livro: leia o índice, introdução e últimas páginas de cada capítulo', desc:'O mapa do livro revela a estrutura antes de entrar nela. Você sabe para onde vai, então cada capítulo faz sentido no contexto maior. Leitores lentos leem linear. Leitores rápidos leem o mapa primeiro.' },
      { n:'Escreva nas notas: qual é sua expectativa? O que você quer extrair?', desc:'Leitura com intenção específica é 2x mais eficiente. "Quero entender como aplicar X na Insid360" é um filtro ativo que o cérebro usa para reter o relevante e descartar o ruído. Sem intenção, tudo parece importante e nada fica.' },
    ]
  },
  ter: { foco:'LEITURA PROFUNDA — CONCEITOS CENTRAIS', meta:'25 páginas + anotações por capítulo', cor:'var(--amber)',
    tarefas:[
      { n:'Leia com caneta: sublinhe apenas a frase mais importante de cada página', desc:'1 frase por página. Essa restrição força a priorização — você não pode sublinhar tudo. Escolher a frase central de cada página é um ato de compreensão, não de leitura passiva.' },
      { n:'Após cada capítulo, escreva 1 parágrafo com suas palavras — sem olhar o livro', desc:'O teste da compreensão real: você consegue explicar sem o livro? Se não conseguir, o capítulo não entrou. Volte ao ponto específico onde a compreensão falhou, não ao capítulo inteiro.' },
      { n:'Conecte 1 ideia do livro ao seu trabalho real na Insid360', desc:'Qual cliente, campanha ou desafio atual se beneficia do que você acabou de ler? Conhecimento sem conexão com a realidade decai em 48h. Conexão com prática real dura meses.' },
    ]
  },
  qua: { foco:'LEITURA CRÍTICA — ARGUMENTE COM O AUTOR', meta:'20 páginas + pensamento crítico', cor:'var(--amber)',
    tarefas:[
      { n:'Leia com postura de cético amigável: onde o argumento é forte? Onde é fraco?', desc:'Todo livro tem pontos cegos. Identifique 1 argumento forte (e explique por que) e 1 argumento fraco (e qual a lacuna). Isso é pensamento crítico — não ceticismo destrutivo, mas escrutínio intelectual respeitoso.' },
      { n:'Escreva 1 contra-argumento para a tese principal do livro', desc:'Se você consegue refutar o autor, entendeu o argumento profundamente. Se não consegue, não entendeu bem o suficiente. O contra-argumento não precisa ser correto — precisa ser fundamentado.' },
      { n:'Pesquise 1 referência que o autor cita — confirme se é usada corretamente', desc:'Autores às vezes citam estudos fora de contexto. 5 minutos de pesquisa revela se a fonte suporta a afirmação. Isso não é desconfiança — é literacia intelectual. Você se tornará leitor muito melhor com esse hábito.' },
    ]
  },
  qui: { foco:'REVISÃO E SÍNTESE SEMANAL', meta:'15 novas páginas + revisão', cor:'var(--amber)',
    tarefas:[
      { n:'Releia todas as notas e grifos da semana — 10 minutos', desc:'A revisão espaçada na quinta-feira de uma leitura que começou segunda tem exatamente o espaçamento ideal para consolidação de longo prazo. Esse hábito isolado pode dobrar sua retenção de leitura.' },
      { n:'Leia 15 páginas novas — foco em como se conectam ao que já leu', desc:'Você não está lendo capítulo 5 isolado — está construindo sobre o que os capítulos 1-4 estabeleceram. Leia como arquiteto que olha o edifício, não como operário que olha só o tijolo atual.' },
      { n:'Escreva a tese central do livro até aqui em 2 frases', desc:'Se precisar de mais de 2 frases, a compreensão ainda está difusa. O teste da síntese é brutal mas honesto. Se você consegue, está pronto para extrair aplicações. Se não consegue, precisa de mais leitura ativa.' },
    ]
  },
  sex: { foco:'APLICAÇÃO DIRETA — DO LIVRO PARA A PRÁTICA', meta:'25 páginas + plano de ação', cor:'var(--amber)',
    tarefas:[
      { n:'Leia 25 páginas focado exclusivamente em: o que eu faria diferente amanhã?', desc:'Filtro brutal de praticidade. Para cada ideia que passar nesse filtro, escreva "AÇÃO:" nas notas com a ação específica. Uma ação real extraída de uma leitura vale mais que 10 livros lidos sem ação.' },
      { n:'Monte um mini-plano de ação de 3 itens baseado no livro', desc:'3 ações específicas, com gatilho claro: "Quando X acontecer, farei Y". Escreva nas notas. Encaminhe para seu sistema de tarefas. Um livro que gera 3 ações concretas mudou sua vida — independente de quantas páginas tem.' },
      { n:'Compartilhe 1 insight do livro com alguém relevante (mensagem, reunião, post)', desc:'Ensinar é a última etapa do aprendizado. Compartilhar força articulação — e articulação é compreensão. A pessoa que mais aprende quando você explica algo é você mesmo.' },
    ]
  },
  sab: { foco:'LEITURA PROFUNDA — RELEITURA INTENCIONAL', meta:'20 páginas + extração profunda', cor:'var(--amber)',
    tarefas:[
      { n:'Volte ao capítulo que mais impactou você até agora — releia', desc:'A segunda leitura do melhor capítulo revela o que o cérebro filtrou na primeira. Grandes leitores releem os melhores trechos. Não releram o livro inteiro — releram as pepitas de ouro.' },
      { n:'Extraia a ideia central desse capítulo e escreva como você a aplicaria em 3 contextos diferentes', desc:'3 contextos: trabalho na Insid360 / vida pessoal / interação com família. Uma ideia que funciona em 3 contextos não é teoria — é princípio. Princípios são os ativos intelectuais mais valiosos que existem.' },
      { n:'Atualize o slider de progresso e projete quando vai terminar o livro', desc:'Páginas lidas / dias desde o início = ritmo atual. Páginas restantes / ritmo = dias para terminar. Coloque uma data. Livros com data de conclusão são lidos. Sem data, ficam na mesinha de cabeceira por meses.' },
    ]
  },
  dom: { foco:'PLANEJAMENTO + CURADORIA DE LEITURA', meta:'Reflexão e próximos passos', cor:'var(--amber)',
    tarefas:[
      { n:'Avalie o livro até aqui: está entregando o que prometeu? Você está no ritmo certo?', desc:'Honestidade é mais importante que consistência. Se o livro está decepcionando, tudo bem mudar. Se o ritmo está baixo, o problema é o protocolo — ajuste agora, não na próxima semana.' },
      { n:'Monte a lista dos próximos 2 livros com justificativa intencional', desc:'Qual gap intelectual ou desafio prático cada livro vai resolver? Leitura curada por intenção específica é 3x mais acionável que leitura por recomendação aleatória.' },
      { n:'Calcule seu ritmo de leitura das últimas 5 semanas — qual é sua média real?', desc:'Total de páginas lidas desde S1 / 35 dias. Com esse ritmo, quantos livros por ano? Compare com o que você quer ler. A matemática simples revela se o protocolo está funcionando ou precisa de ajuste.' },
    ]
  },
};

function getLeituraPlano() {
  const s = getCurrentSemana();
  if (s >= 5) return LEITURA_S5;
  if (s === 4) return LEITURA_S4;
  if (s === 3) return LEITURA_S3;
  return LEITURA_PLAN;
}


// ── RENDER LEITURA ──
function renderLeituraTab(day) {
  const wrap = document.getElementById('leitura-detail');
  if (!wrap) return;
  const semanaAtual = getCurrentSemana();
  const plan = getLeituraPlano()[day] || getLeituraPlano()['seg'];
  wrap.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border2);border-left:3px solid ${plan.cor};padding:14px;margin-bottom:12px">
      <div style="font-family:var(--condensed);font-size:9px;font-weight:800;letter-spacing:3px;color:var(--muted);margin-bottom:3px">MISSÃO DE HOJE · ${plan.meta}</div>
      <div style="font-family:var(--condensed);font-size:18px;font-weight:900;letter-spacing:1px;color:${plan.cor}">${plan.foco}</div>
    </div>
    ${plan.tarefas.map((t, i) => `
      <div class="task-card" onclick="toggleCard(this)" style="--lc:${plan.cor};margin-bottom:4px">
        <div class="tck"></div>
        <div class="tb2">
          <div class="tn">${i+1}. ${t.n}</div>
          <div class="ts2">${t.desc}</div>
        </div>
      </div>
    `).join('')}`;
}

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
  const semanaAtual = getCurrentSemana();
  const activePlan  = getGuitarPlano();
  const plan = activePlan[day] || activePlan['seg'];
  // Atualiza label de semana no header (se existir o elemento)
  const semanaLbl = document.getElementById('guitar-semana-lbl');
  if (semanaLbl) semanaLbl.textContent = 'SEMANA ' + semanaAtual;
  wrap.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border2);border-left:3px solid ${plan.cor};padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-family:var(--condensed);font-size:11px;font-weight:800;letter-spacing:3px;color:${plan.cor}">${plan.tipo}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-family:var(--condensed);font-size:9px;font-weight:800;letter-spacing:2px;background:${plan.cor};color:#000;padding:2px 7px;border-radius:2px">SEMANA ${semanaAtual}</span>
          <span style="font-family:var(--condensed);font-size:9px;color:var(--muted);font-weight:600">${plan.dur}</span>
        </div>
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
  const semanaAtual = getCurrentSemana();
  const split = getTreinoPlano()[day] || getTreinoPlano()['seg'];
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
  const activePlan = getInglesPlano();
  const plan = activePlan[day] || activePlan['seg'];
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
  renderGuitarTab(day);
  renderTreinoTab(day);
  renderInglesTab(day);
  renderLeituraTab(day);
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
  renderLeituraTab(k);
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
  renderLeituraTab(currentDay);
  // Update semana labels on page (guitarra, inglês, outros)
  const semanaAtual = getCurrentSemana();
  const semanaEls = document.querySelectorAll('.semana-label');
  semanaEls.forEach(el => { el.textContent = 'SEMANA ' + semanaAtual; });
  // Atualiza label específico do inglês
  const inglesLbl = document.getElementById('ingles-semana-lbl');
  if (inglesLbl) {
    const nivelMap = { 1:'SEMANA 1 · B2 BASE', 2:'SEMANA 2 · B2 AVANÇADO', 3:'SEMANA 3 · C1 FLUÊNCIA', 4:'SEMANA 4 · C1 MAESTRIA', 5:'SEMANA 5 · C1 STORYTELLING' };
    inglesLbl.textContent = nivelMap[semanaAtual] || 'SEMANA ' + semanaAtual + ' · C1 AVANÇADO';
  }
  // Mensagem de boot com contexto da semana
  setTimeout(() => {
    const h  = new Date().getHours();
    const gr = h<12 ? 'BOM DIA' : h<18 ? 'BOA TARDE' : 'BOA NOITE';
    const guitarFocoMap = { 1:'FUNDAMENTOS FUSION', 2:'OUTSIDE PLAY · MODAL · TAPPING', 3:'SWEEP · ECONOMY · CHORD MELODY', 4:'LEGATO · HYBRID PICKING · HARMÔNICOS', 5:'IMPROVISAÇÃO FUSION · COMPOSIÇÃO' };
    const guitarFoco = guitarFocoMap[semanaAtual] || 'MAESTRIA CONTÍNUA';
    showPopup(gr + ', GILMAR.', 'SEMANA ' + semanaAtual + ' · GUITARRA: ' + guitarFoco + ' · EXECUTE A MISSÃO.');
  }, 800);
  loadTodayState().then(() => renderTasks(currentDay));
}
boot();
