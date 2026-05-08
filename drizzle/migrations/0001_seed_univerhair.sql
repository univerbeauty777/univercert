-- UniverCert · seed UniverHair · já aplicado no D1 univercert-mvp em 2026-05-08
-- Para reaplicar localmente: wrangler d1 execute univercert-mvp --local --file=./drizzle/migrations/0001_seed_univerhair.sql

INSERT OR IGNORE INTO workspaces (id, slug, name, plan, status)
VALUES ('ws_univerhair', 'univerhair', 'UniverHair', 'free', 'active');

INSERT OR IGNORE INTO users (id, email, name, email_verified)
VALUES ('usr_diego', 'diegoxp12@me.com', 'Diego', 1);

INSERT OR IGNORE INTO workspace_members (id, workspace_id, user_id, role, accepted_at)
VALUES ('wm_uh_diego', 'ws_univerhair', 'usr_diego', 'admin', unixepoch());

INSERT OR IGNORE INTO brand_kits (id, workspace_id, primary_color, secondary_color, font_family, email_sender_name)
VALUES ('bk_univerhair', 'ws_univerhair', '#6366F1', '#EC4899', 'Inter', 'UniverHair Certificados');

INSERT OR IGNORE INTO templates (id, workspace_id, name, vertical, layout_json, is_published, created_by)
VALUES ('tpl_uh_color_avancada', 'ws_univerhair', 'Coloração Avançada', 'cabelo',
        '{"version":1,"orientation":"landscape","fields":["nome","cpf","curso","ch","data"]}', 1, 'usr_diego');

INSERT OR IGNORE INTO integrations (id, workspace_id, provider, config_json, is_active)
VALUES ('int_uh_fluent', 'ws_univerhair', 'fluent',
        '{"base_url":"https://univerhair.com.br","auto_create_request":true}', 1);
