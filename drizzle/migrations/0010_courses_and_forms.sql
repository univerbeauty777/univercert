-- UniverCert · Migration 0010 · S22 Cursos + Forms de solicitação + Extras

-- 1. NOVA TABELA: courses
-- Hoje "curso" eh string livre em credentials.courseName / requests.courseName.
-- Sprint 22 introduz courses como entidade formal: cada workspace cadastra os
-- cursos que oferece, define template default, horas, e o FORM de requisitos
-- (fotos antes/depois, link video, etc) pra solicitacao de cert.
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                       -- url-friendly (ex: 'coloracao-avancada')
  name TEXT NOT NULL,                       -- display ('Coloração Avançada')
  description TEXT,
  hours INTEGER,                            -- default course hours
  default_template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  requirements_json TEXT,                   -- form schema (array de fields)
  vertical TEXT,                            -- 'cabelo', 'estetica', etc
  is_public INTEGER NOT NULL DEFAULT 1,    -- pode receber solicitacoes via /solicitar/<ws>/<slug>
  is_active INTEGER NOT NULL DEFAULT 1,
  auto_approve INTEGER NOT NULL DEFAULT 0,  -- override: auto-approve mesmo com requirements
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_ws_slug ON courses(workspace_id, slug);
CREATE INDEX IF NOT EXISTS idx_courses_ws_active ON courses(workspace_id, is_active);

-- 2. certificate_requests ganha referencia opcional ao curso + extras + revisoes
ALTER TABLE certificate_requests ADD COLUMN course_id TEXT REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE certificate_requests ADD COLUMN extras_json TEXT;          -- respostas do form
ALTER TABLE certificate_requests ADD COLUMN revisions_json TEXT;       -- historico de revisoes
ALTER TABLE certificate_requests ADD COLUMN request_token TEXT;        -- magic link pra reenvio
ALTER TABLE certificate_requests ADD COLUMN submitter_email TEXT;      -- email confirmado
ALTER TABLE certificate_requests ADD COLUMN submitter_name TEXT;

-- Status: alem de pending/approved/rejected/emitted, agora pode ser 'needs_revision'.
-- Como SQLite nao tem ENUM rigido, validamos em codigo.

-- 3. Indices novos
CREATE INDEX IF NOT EXISTS idx_requests_course ON certificate_requests(course_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_token ON certificate_requests(request_token);
CREATE INDEX IF NOT EXISTS idx_requests_email ON certificate_requests(submitter_email);
