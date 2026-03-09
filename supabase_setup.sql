-- ═══════════════════════════════════════════════════════════
--  GILMAR DASHBOARD — supabase_setup.sql
--  Cole este SQL no Supabase > SQL Editor > New Query
--  e clique em RUN
-- ═══════════════════════════════════════════════════════════

-- Tabela principal: estados de cada elemento (tarefas, hábitos, etc.)
CREATE TABLE IF NOT EXISTS dashboard_state (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT        NOT NULL DEFAULT 'gilmar',
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  key         TEXT        NOT NULL,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, key)
);

-- Tabela de resumo diário (para acompanhar evolução)
CREATE TABLE IF NOT EXISTS daily_summary (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT    NOT NULL DEFAULT 'gilmar',
  date            DATE    NOT NULL DEFAULT CURRENT_DATE,
  tasks_done      INTEGER DEFAULT 0,
  tasks_total     INTEGER DEFAULT 0,
  efficiency_pct  INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_state_user_date ON dashboard_state(user_id, date);
CREATE INDEX IF NOT EXISTS idx_summary_user_date ON daily_summary(user_id, date);

-- Habilitar RLS (Row Level Security) - segurança básica
ALTER TABLE dashboard_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary   ENABLE ROW LEVEL SECURITY;

-- Política: anon key pode ler e escrever (uso pessoal)
-- Para uso somente por você, isso é suficiente
CREATE POLICY "Allow all for anon" ON dashboard_state
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON daily_summary
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- VERIFICAR SE FUNCIONOU:
-- SELECT * FROM dashboard_state LIMIT 5;
-- SELECT * FROM daily_summary LIMIT 5;
-- ═══════════════════════════════════════════════════════════
