import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
  IAuthenticateGeneric,
} from 'n8n-workflow';

export class UniverCertApi implements ICredentialType {
  name = 'univerCertApi';
  displayName = 'UniverCert API';
  documentationUrl = 'https://univercert.net/docs/api';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Crie uma API key em /integrations/api-keys (requer plano Pro+)',
      placeholder: 'uc_live_XXXXXXXXXXXXXX',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://univercert.net',
      description: 'Use https://staging.univercert.net pra testes',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/api/v1/credentials',
      method: 'GET',
      qs: { limit: 1 },
    },
  };
}
