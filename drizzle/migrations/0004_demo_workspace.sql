-- UniverCert · Sprint 10 · Workspace 'demo' para landing demo pública
-- Roda 1x: provisiona o workspace que recebe certificados de teste

INSERT OR IGNORE INTO workspaces (id, slug, name, plan, status, created_at, updated_at)
VALUES (
  'ws_demo',
  'demo',
  'UniverCert · Demo',
  'free',
  'active',
  unixepoch(),
  unixepoch()
);

INSERT OR IGNORE INTO brand_kits (
  id, workspace_id, primary_color, secondary_color, font_family, email_sender_name, updated_at
) VALUES (
  'bk_demo',
  'ws_demo',
  '#6366F1',
  '#EC4899',
  'Inter',
  'UniverCert Demo',
  unixepoch()
);

-- Template default demo
INSERT OR IGNORE INTO templates (
  id, workspace_id, name, vertical, layout_json, is_published, created_at, updated_at
) VALUES (
  'tpl_demo_default',
  'ws_demo',
  'Demo · Padrão',
  'cursos-livres',
  '{"version":1,"orientation":"landscape"}',
  1,
  unixepoch(),
  unixepoch()
);
