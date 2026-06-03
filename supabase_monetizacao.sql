-- ═══════════════════════════════════════════════════════════
--  GILMAR DASHBOARD — supabase_monetizacao.sql
--  Plano de Monetização · 3 Trilhas · Junho 2026
--  Cole no Supabase > SQL Editor > New Query e clique em RUN
-- ═══════════════════════════════════════════════════════════

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS monetizacao_atividades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha       TEXT NOT NULL CHECK (trilha IN ('guitarra','saas','fisico')),
  nome         TEXT NOT NULL,
  tipo         TEXT CHECK (tipo IN ('habito','tarefa','revisao','projeto','operacao','gestao','estrategia')),
  duracao_min  INTEGER,
  frequencia   TEXT CHECK (frequencia IN ('diaria','semanal','3x_semana')),
  horario_bloco TEXT,
  ativo        BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Índice para filtrar por trilha
CREATE INDEX IF NOT EXISTS idx_mon_trilha ON monetizacao_atividades(trilha);

-- RLS
ALTER TABLE monetizacao_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON monetizacao_atividades
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 2. INSERIR ATIVIDADES — TRILHA GUITARRA
-- ═══════════════════════════════════════════════════════════
INSERT INTO monetizacao_atividades (trilha, nome, tipo, duracao_min, frequencia, horario_bloco) VALUES
  ('guitarra', 'Treino técnico fusion (escalas, licks, improvisação)', 'habito',  45, 'diaria',    '11:00-12:00'),
  ('guitarra', 'Gravar 1 vídeo musical para TikTok/Reels',            'tarefa',  15, 'diaria',    '11:00-12:00'),
  ('guitarra', 'Editar vídeo de guitarra + legendas',                  'tarefa',  20, 'diaria',    '15:00-17:00'),
  ('guitarra', 'Agendar post guitarra (TT + IG + YT Shorts)',          'tarefa',  10, 'diaria',    '15:00-17:00'),
  ('guitarra', 'Análise de views e comentários dos vídeos',            'revisao', 15, 'diaria',    '17:00-18:00'),
  ('guitarra', 'Estudo de repertório Guthrie Govan',                   'habito',  30, '3x_semana', '11:00-12:00'),
  ('guitarra', 'Gravação de demo de qualidade (YouTube long-form)',     'projeto', 120,'semanal',   '11:00-12:00');

-- ═══════════════════════════════════════════════════════════
-- 3. INSERIR ATIVIDADES — TRILHA SAAS (MODO BRUTO)
-- ═══════════════════════════════════════════════════════════
INSERT INTO monetizacao_atividades (trilha, nome, tipo, duracao_min, frequencia, horario_bloco) VALUES
  ('saas', 'Build do Modo Bruto (código, features, testes)',      'projeto',   120, 'diaria',  '07:00-09:00'),
  ('saas', 'Gravar 2 vídeos IA/produtividade para TikTok',       'tarefa',     40, 'diaria',  '09:00-11:00'),
  ('saas', 'Editar + agendar posts de produtividade',            'tarefa',     30, 'diaria',  '15:00-17:00'),
  ('saas', 'Responder comentários e engajar audiência',          'habito',     20, 'diaria',  '15:00-17:00'),
  ('saas', 'Revisar métricas do SaaS (usuários, churn, MRR)',   'revisao',    20, 'diaria',  '17:00-18:00'),
  ('saas', 'Atualizar roadmap e backlog do Modo Bruto',          'gestao',     30, 'semanal', '06:00-07:00'),
  ('saas', 'Suporte a usuários e onboarding',                    'operacao',   30, 'diaria',  '07:00-09:00');

-- ═══════════════════════════════════════════════════════════
-- 4. INSERIR ATIVIDADES — TRILHA PRODUTO FÍSICO (PERFUMES)
-- ═══════════════════════════════════════════════════════════
INSERT INTO monetizacao_atividades (trilha, nome, tipo, duracao_min, frequencia, horario_bloco) VALUES
  ('fisico', 'Live de review de perfumes no TikTok Shop',         'operacao',  45,  'diaria',  '13:00-15:00'),
  ('fisico', 'Gravar 1–2 vídeos de review/unboxing',             'tarefa',    30,  'diaria',  '13:00-15:00'),
  ('fisico', 'Atender pedidos e confirmar envios',                'operacao',  30,  'diaria',  '13:00-15:00'),
  ('fisico', 'Gestão de estoque e reposição',                    'gestao',    20,  'diaria',  '13:00-15:00'),
  ('fisico', 'Responder DMs e comentários sobre produtos',        'habito',    20,  'diaria',  '13:00-15:00'),
  ('fisico', 'Análise de faturamento semanal do Shop',            'revisao',   30,  'semanal', '17:00-18:00'),
  ('fisico', 'Pesquisa de novos produtos e fornecedores',         'estrategia',60,  'semanal', '06:00-07:00');

-- ═══════════════════════════════════════════════════════════
-- 5. VERIFICAR
-- ═══════════════════════════════════════════════════════════
-- SELECT trilha, COUNT(*) FROM monetizacao_atividades GROUP BY trilha;
-- SELECT * FROM monetizacao_atividades WHERE trilha = 'fisico';
