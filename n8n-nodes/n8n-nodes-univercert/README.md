# n8n-nodes-univercert

UniverCert nodes for n8n. Emit and manage digital certificates from any workflow.

## Install

In your n8n instance, go to **Settings** → **Community Nodes** → **Install** and paste:

```
n8n-nodes-univercert
```

Or via npm in your self-hosted n8n:

```bash
npm install n8n-nodes-univercert
```

## Setup

1. Get your UniverCert API key at `/integrations/api-keys` (requires Pro+ plan)
2. In n8n, create new credential of type **UniverCert API**
3. Paste your API key (`uc_live_...`)

## Operations

### Certificate
- **Emit** — issue a new certificate to a recipient
- **Get** — retrieve a specific cert
- **List** — list all certs in workspace
- **Revoke** — revoke a cert with reason

### Recipient
- **Create** — add a new student/recipient
- **Get** — retrieve recipient info
- **List** — list all recipients

### Template
- **List** — list available templates

## Example: Auto-emit cert from form

1. **Trigger**: Webhook node receives form submit
2. **Action**: UniverCert → Certificate → Emit
   - Recipient Email: `{{$json.email}}`
   - Recipient Name: `{{$json.name}}`
   - Course Name: `{{$json.course}}`
   - Course Hours: `{{$json.hours}}`
3. **Action**: Email node sends cert link to student

## Links

- UniverCert: https://univercert.com.br
- API docs: https://univercert.com.br/docs/api
- Support: contato@univercert.com.br

## License

MIT
