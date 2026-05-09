<?php
/**
 * Plugin Name:       UniverCert × FluentCommunity
 * Plugin URI:        https://univercert.com.br
 * Description:       Emite certificado UniverCert automaticamente quando aluno conclui curso no FluentCommunity. Inclui shortcode [univercert_certificates] pra mostrar certificados do aluno no perfil.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            UniverCert
 * Author URI:        https://univercert.com.br
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       univercert-fluent
 * Network:           false
 *
 * @package UniverCert_Fluent
 */

if (!defined('ABSPATH')) {
    exit;
}

define('UNIVERCERT_FLUENT_VERSION', '1.0.0');
define('UNIVERCERT_FLUENT_OPT', 'univercert_fluent_settings');
define('UNIVERCERT_FLUENT_DEFAULT_API', 'https://univercert.com.br');

/* =============================================================================
 * 1. SETTINGS PAGE
 * ========================================================================== */

add_action('admin_menu', function () {
    add_options_page(
        'UniverCert × Fluent',
        'UniverCert',
        'manage_options',
        'univercert-fluent',
        'univercert_fluent_render_settings'
    );
});

add_action('admin_init', function () {
    register_setting('univercert_fluent_group', UNIVERCERT_FLUENT_OPT, [
        'type' => 'array',
        'sanitize_callback' => 'univercert_fluent_sanitize_settings',
        'default' => univercert_fluent_default_settings(),
    ]);
});

function univercert_fluent_default_settings() {
    return [
        'api_base'         => UNIVERCERT_FLUENT_DEFAULT_API,
        'workspace_slug'   => '',
        'webhook_secret'   => '',
        'auto_approve'     => 1,
        'default_template' => '',
        'send_email'       => 1,
        'enabled'          => 1,
    ];
}

function univercert_fluent_get_settings() {
    $stored = get_option(UNIVERCERT_FLUENT_OPT, []);
    return wp_parse_args($stored, univercert_fluent_default_settings());
}

function univercert_fluent_sanitize_settings($input) {
    $out = univercert_fluent_default_settings();
    if (!is_array($input)) return $out;

    if (isset($input['api_base']))         $out['api_base'] = esc_url_raw(rtrim(trim($input['api_base']), '/'));
    if (isset($input['workspace_slug']))   $out['workspace_slug'] = sanitize_title($input['workspace_slug']);
    if (isset($input['webhook_secret']))   $out['webhook_secret'] = sanitize_text_field(trim($input['webhook_secret']));
    if (isset($input['default_template'])) $out['default_template'] = sanitize_text_field(trim($input['default_template']));
    $out['auto_approve'] = !empty($input['auto_approve']) ? 1 : 0;
    $out['send_email']   = !empty($input['send_email']) ? 1 : 0;
    $out['enabled']      = !empty($input['enabled']) ? 1 : 0;

    return $out;
}

function univercert_fluent_render_settings() {
    $s = univercert_fluent_get_settings();
    $webhook_url = $s['api_base'] . '/api/webhooks/fluent?ws=' . urlencode($s['workspace_slug']);
    ?>
    <div class="wrap">
        <h1 style="display:flex;align-items:center;gap:10px;">
            <span style="display:inline-block;width:36px;height:36px;background:linear-gradient(135deg,#1B2D5E,#D4A937);border-radius:8px;"></span>
            UniverCert × FluentCommunity
        </h1>
        <p style="font-size:14px;color:#555;margin-bottom:24px;">
            Emite certificado profissional automaticamente quando aluno conclui curso no FluentCommunity.
            Configure abaixo, salve e teste — alunos vão receber certificado verificável por email em segundos.
        </p>

        <form method="post" action="options.php" style="max-width:800px;">
            <?php settings_fields('univercert_fluent_group'); ?>

            <h2 style="margin-top:32px;">1. Conexão</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th><label for="ws">Workspace slug</label></th>
                    <td>
                        <input id="ws" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[workspace_slug]" type="text"
                               value="<?php echo esc_attr($s['workspace_slug']); ?>" class="regular-text" placeholder="univerhair">
                        <p class="description">Identificador da sua escola no UniverCert. Vem do painel UniverCert → Integrações → Fluent.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="secret">Webhook secret</label></th>
                    <td>
                        <input id="secret" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[webhook_secret]" type="password"
                               value="<?php echo esc_attr($s['webhook_secret']); ?>" class="regular-text" autocomplete="new-password">
                        <p class="description">Segredo HMAC. Gere no UniverCert → Integrações → Fluent → "Gerar secret".</p>
                    </td>
                </tr>
                <tr>
                    <th>URL do webhook (auto)</th>
                    <td>
                        <code style="display:inline-block;padding:8px 12px;background:#f1f1f1;border-radius:4px;font-size:12px;">
                            <?php echo esc_html($webhook_url); ?>
                        </code>
                        <p class="description">URL pra onde os eventos são postados. Não precisa colar em lugar nenhum — é interno.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="api_base">API base (avançado)</label></th>
                    <td>
                        <input id="api_base" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[api_base]" type="text"
                               value="<?php echo esc_attr($s['api_base']); ?>" class="regular-text">
                        <p class="description">Padrão: <code><?php echo UNIVERCERT_FLUENT_DEFAULT_API; ?></code>. Mude só se for self-hosted.</p>
                    </td>
                </tr>
            </table>

            <h2 style="margin-top:32px;">2. Comportamento</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th>Plugin ativo</th>
                    <td>
                        <label>
                            <input type="checkbox" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[enabled]" value="1" <?php checked($s['enabled'], 1); ?>>
                            Disparar webhook quando aluno completar curso
                        </label>
                    </td>
                </tr>
                <tr>
                    <th>Auto-aprovar</th>
                    <td>
                        <label>
                            <input type="checkbox" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[auto_approve]" value="1" <?php checked($s['auto_approve'], 1); ?>>
                            Emitir certificado automaticamente (sem revisão manual)
                        </label>
                        <p class="description">Recomendado pra escolas que confiam na conclusão registrada no FluentCommunity. Desligue se quiser que alguém revise antes na fila do UniverCert.</p>
                    </td>
                </tr>
                <tr>
                    <th>Email automático</th>
                    <td>
                        <label>
                            <input type="checkbox" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[send_email] " value="1" <?php checked($s['send_email'], 1); ?>>
                            Enviar email com link do certificado pro aluno
                        </label>
                    </td>
                </tr>
                <tr>
                    <th><label for="tpl">Template default</label></th>
                    <td>
                        <input id="tpl" name="<?php echo UNIVERCERT_FLUENT_OPT; ?>[default_template]" type="text"
                               value="<?php echo esc_attr($s['default_template']); ?>" class="regular-text" placeholder="classic">
                        <p class="description">Variante usada se o curso não tem mapeamento específico. Opções: classic, modern, gold, minimal, executive, creative, ou ID de template customizado.</p>
                    </td>
                </tr>
            </table>

            <?php submit_button('Salvar configurações'); ?>
        </form>

        <hr style="margin:32px 0;">

        <h2>3. Testar conexão</h2>
        <p>Dispara um evento de teste pra confirmar que o UniverCert está recebendo. Use seu próprio email.</p>
        <p>
            <button type="button" class="button button-primary" id="univercert-test-btn">Enviar evento de teste</button>
            <span id="univercert-test-result" style="margin-left:12px;font-weight:600;"></span>
        </p>

        <h2 style="margin-top:32px;">4. Mostrar certificados no perfil do aluno</h2>
        <p>Use o shortcode abaixo em qualquer página/post do FluentCommunity ou perfil de membro:</p>
        <p><code>[univercert_certificates]</code></p>
        <p>Mostra todos os certificados do usuário logado. Customizações disponíveis:</p>
        <ul style="list-style:disc;padding-left:24px;">
            <li><code>[univercert_certificates email="user@x.com"]</code> — força um email específico</li>
            <li><code>[univercert_certificates limit="5"]</code> — limita a 5 certificados</li>
        </ul>

        <h2 style="margin-top:32px;">5. Diagnostico</h2>
        <p>Últimos 5 disparos pra UniverCert:</p>
        <ul style="font-family:monospace;font-size:12px;background:#f6f7f7;padding:12px;border-left:4px solid #2271b1;">
            <?php
            $log = get_option('univercert_fluent_log', []);
            if (empty($log)) {
                echo '<li>Nenhum disparo ainda.</li>';
            } else {
                foreach (array_reverse(array_slice($log, -5)) as $entry) {
                    $when = date('d/m H:i:s', $entry['t']);
                    $status = $entry['ok'] ? '✓' : '✗';
                    echo '<li>' . esc_html($status . ' ' . $when . ' — ' . $entry['msg']) . '</li>';
                }
            }
            ?>
        </ul>
    </div>

    <script>
    (function () {
        var btn = document.getElementById('univercert-test-btn');
        var out = document.getElementById('univercert-test-result');
        if (!btn) return;
        btn.addEventListener('click', function () {
            out.textContent = 'Enviando…';
            out.style.color = '#666';
            fetch(ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=univercert_fluent_test&_wpnonce=<?php echo wp_create_nonce('univercert_fluent_test'); ?>',
            }).then(function (r) { return r.json(); }).then(function (d) {
                if (d.success) {
                    out.textContent = '✓ ' + (d.data.message || 'OK');
                    out.style.color = '#00a32a';
                } else {
                    out.textContent = '✗ ' + (d.data.message || 'erro');
                    out.style.color = '#d63638';
                }
            }).catch(function (e) {
                out.textContent = '✗ ' + e.message;
                out.style.color = '#d63638';
            });
        });
    })();
    </script>
    <?php
}

/* =============================================================================
 * 2. WEBHOOK DISPATCH (HMAC-signed POST pro UniverCert)
 * ========================================================================== */

/**
 * Posta um evento assinado pro UniverCert.
 * @return array{ok:bool, message:string, status?:int}
 */
function univercert_fluent_dispatch($payload) {
    $s = univercert_fluent_get_settings();
    if (empty($s['enabled'])) {
        return ['ok' => false, 'message' => 'plugin desativado'];
    }
    if (empty($s['workspace_slug']) || empty($s['webhook_secret'])) {
        return ['ok' => false, 'message' => 'workspace_slug ou webhook_secret nao configurados'];
    }

    // Enriquece o payload
    $payload = array_merge([
        'event'    => 'course.completed',
        'event_id' => 'wp_' . wp_generate_uuid4(),
        'source'   => [
            'platform' => 'fluentcommunity',
            'site'     => home_url(),
            'plugin'   => 'univercert-fluent',
            'version'  => UNIVERCERT_FLUENT_VERSION,
        ],
        'options'  => [
            'auto_approve'     => (bool) $s['auto_approve'],
            'send_email'       => (bool) $s['send_email'],
            'default_template' => $s['default_template'],
        ],
    ], $payload);

    $body = wp_json_encode($payload);
    $sig  = hash_hmac('sha256', $body, $s['webhook_secret']);

    $url = $s['api_base'] . '/api/webhooks/fluent?ws=' . urlencode($s['workspace_slug']);
    $resp = wp_remote_post($url, [
        'method'  => 'POST',
        'timeout' => 10,
        'headers' => [
            'Content-Type'       => 'application/json',
            'X-Fluent-Signature' => 'sha256=' . $sig,
            'User-Agent'         => 'UniverCert-Fluent/' . UNIVERCERT_FLUENT_VERSION,
        ],
        'body'    => $body,
    ]);

    if (is_wp_error($resp)) {
        univercert_fluent_log(false, 'wp_error: ' . $resp->get_error_message());
        return ['ok' => false, 'message' => $resp->get_error_message()];
    }

    $code = wp_remote_retrieve_response_code($resp);
    $rbody = wp_remote_retrieve_body($resp);
    if ($code >= 200 && $code < 300) {
        univercert_fluent_log(true, 'POST ' . $code . ' ' . substr($rbody, 0, 100));
        return ['ok' => true, 'message' => 'enviado (HTTP ' . $code . ')', 'status' => $code];
    }
    univercert_fluent_log(false, 'HTTP ' . $code . ' ' . substr($rbody, 0, 200));
    return ['ok' => false, 'message' => 'HTTP ' . $code . ' — ' . substr($rbody, 0, 200), 'status' => $code];
}

function univercert_fluent_log($ok, $msg) {
    $log = get_option('univercert_fluent_log', []);
    $log[] = ['t' => time(), 'ok' => $ok, 'msg' => $msg];
    if (count($log) > 50) $log = array_slice($log, -50);
    update_option('univercert_fluent_log', $log, false);
}

/* =============================================================================
 * 3. HOOKS NO FLUENT COMMUNITY
 * Suportamos varios formatos de hook que diferentes versoes do plugin emitem.
 * ========================================================================== */

// FluentCommunity novo (v3+)
add_action('fluent_community/course/completed', 'univercert_fluent_handle_course_completed', 10, 2);
// FluentCommunity legacy
add_action('fluent_community_course_completed', 'univercert_fluent_handle_course_completed', 10, 2);
// FluentCommunity por slug variavel
add_action('fluent_community_course/completed', 'univercert_fluent_handle_course_completed', 10, 2);

function univercert_fluent_handle_course_completed($course, $user) {
    // Normaliza diferentes formatos
    $course_arr = is_object($course) ? (array) $course : (array) $course;
    $user_id = is_object($user) ? ($user->ID ?? $user->id ?? 0) : (is_array($user) ? ($user['ID'] ?? $user['id'] ?? 0) : (int) $user);

    if (!$user_id) {
        univercert_fluent_log(false, 'user_id ausente no hook');
        return;
    }
    $wp_user = get_userdata($user_id);
    if (!$wp_user) {
        univercert_fluent_log(false, 'wp user nao encontrado: ' . $user_id);
        return;
    }

    $payload = [
        'course' => [
            'id'    => $course_arr['id'] ?? $course_arr['ID'] ?? null,
            'name'  => $course_arr['title'] ?? $course_arr['name'] ?? '',
            'slug'  => $course_arr['slug'] ?? null,
            'hours' => isset($course_arr['hours']) ? (int) $course_arr['hours'] : null,
        ],
        'student' => [
            'name'  => $wp_user->display_name ?: trim($wp_user->first_name . ' ' . $wp_user->last_name) ?: $wp_user->user_login,
            'email' => $wp_user->user_email,
            'phone' => get_user_meta($user_id, 'phone', true) ?: get_user_meta($user_id, 'whatsapp', true) ?: '',
            'cpf'   => get_user_meta($user_id, 'cpf', true) ?: '',
        ],
        'completed_at' => time(),
    ];

    univercert_fluent_dispatch($payload);
}

/* =============================================================================
 * 4. AJAX TEST EVENT
 * ========================================================================== */

add_action('wp_ajax_univercert_fluent_test', function () {
    check_ajax_referer('univercert_fluent_test');
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'sem permissao'], 403);
    }
    $u = wp_get_current_user();
    $payload = [
        'course'  => ['id' => 'test', 'name' => 'Curso de Teste UniverCert', 'hours' => 8],
        'student' => [
            'name'  => $u->display_name ?: 'Admin',
            'email' => $u->user_email,
        ],
        'is_test' => true,
    ];
    $r = univercert_fluent_dispatch($payload);
    if ($r['ok']) {
        wp_send_json_success(['message' => $r['message'] . ' — verifique o email em ~30s']);
    } else {
        wp_send_json_error(['message' => $r['message']]);
    }
});

/* =============================================================================
 * 5. SHORTCODE: [univercert_certificates]
 * Renderiza iframe responsivo do embed UniverCert pro user logado.
 * ========================================================================== */

add_shortcode('univercert_certificates', function ($atts) {
    $a = shortcode_atts([
        'email' => '',
        'limit' => '20',
    ], $atts, 'univercert_certificates');

    $email = $a['email'];
    if (!$email) {
        $u = wp_get_current_user();
        if (!$u || !$u->ID) {
            return '<p style="font-size:14px;color:#666;">Faça login para ver seus certificados.</p>';
        }
        $email = $u->user_email;
    }

    $s = univercert_fluent_get_settings();
    $base = $s['api_base'];
    $ws = urlencode($s['workspace_slug']);
    $email_enc = urlencode($email);
    $limit = max(1, (int) $a['limit']);

    $src = $base . '/embed/student/' . $email_enc . '?ws=' . $ws . '&limit=' . $limit;

    return sprintf(
        '<div class="univercert-embed" style="width:100%%;max-width:880px;margin:16px auto;">' .
        '<iframe src="%s" style="width:100%%;min-height:480px;border:0;border-radius:12px;" loading="lazy" title="Meus certificados"></iframe>' .
        '</div>',
        esc_url($src)
    );
});
