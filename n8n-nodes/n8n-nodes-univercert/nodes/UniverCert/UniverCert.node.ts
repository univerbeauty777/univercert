import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class UniverCert implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'UniverCert',
    name: 'univerCert',
    icon: 'file:univercert.svg',
    group: ['transform'],
    version: 1,
    description: 'Emita e gerencie certificados digitais via UniverCert',
    defaults: { name: 'UniverCert' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'univerCertApi', required: true }],

    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Certificate', value: 'certificate' },
          { name: 'Recipient', value: 'recipient' },
          { name: 'Template', value: 'template' },
        ],
        default: 'certificate',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['certificate'] } },
        options: [
          { name: 'Emit', value: 'emit', description: 'Emit a new certificate', action: 'Emit a certificate' },
          { name: 'Get', value: 'get', description: 'Get a single certificate', action: 'Get a certificate' },
          { name: 'List', value: 'list', description: 'List certificates', action: 'List certificates' },
          { name: 'Revoke', value: 'revoke', description: 'Revoke a certificate', action: 'Revoke a certificate' },
        ],
        default: 'emit',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['recipient'] } },
        options: [
          { name: 'Create', value: 'create', action: 'Create a recipient' },
          { name: 'Get', value: 'get', action: 'Get a recipient' },
          { name: 'List', value: 'list', action: 'List recipients' },
        ],
        default: 'create',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['template'] } },
        options: [{ name: 'List', value: 'list', action: 'List templates' }],
        default: 'list',
      },

      // Emit certificate fields
      {
        displayName: 'Recipient Email',
        name: 'recipientEmail',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'aluno@example.com',
        displayOptions: { show: { resource: ['certificate'], operation: ['emit'] } },
      },
      {
        displayName: 'Recipient Name',
        name: 'recipientName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['certificate'], operation: ['emit'] } },
      },
      {
        displayName: 'CPF (BR)',
        name: 'recipientCpf',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['certificate'], operation: ['emit'] } },
      },
      {
        displayName: 'Course Name',
        name: 'courseName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['certificate'], operation: ['emit'] } },
      },
      {
        displayName: 'Course Hours',
        name: 'courseHours',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['certificate'], operation: ['emit'] } },
      },
      {
        displayName: 'Template ID (optional)',
        name: 'templateId',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['certificate'], operation: ['emit'] } },
      },

      // Get / Revoke
      {
        displayName: 'Certificate ID',
        name: 'credentialId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['certificate'], operation: ['get', 'revoke'] } },
      },
      {
        displayName: 'Revoke Reason',
        name: 'revokeReason',
        type: 'string',
        default: 'Revoked via n8n workflow',
        displayOptions: { show: { resource: ['certificate'], operation: ['revoke'] } },
      },

      // List
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 50,
        typeOptions: { minValue: 1, maxValue: 500 },
        displayOptions: { show: { operation: ['list'] } },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('univerCertApi');
    const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let response: any;

        if (resource === 'certificate') {
          if (operation === 'emit') {
            response = await this.helpers.requestWithAuthentication.call(this, 'univerCertApi', {
              method: 'POST',
              url: `${baseUrl}/api/v1/credentials/emit`,
              body: {
                recipient: {
                  email: this.getNodeParameter('recipientEmail', i) as string,
                  name: this.getNodeParameter('recipientName', i) as string,
                  cpf: this.getNodeParameter('recipientCpf', i) as string,
                },
                courseName: this.getNodeParameter('courseName', i) as string,
                courseHours: this.getNodeParameter('courseHours', i) as number,
                templateId: this.getNodeParameter('templateId', i) as string || undefined,
              },
              json: true,
            });
          } else if (operation === 'get') {
            const id = this.getNodeParameter('credentialId', i) as string;
            response = await this.helpers.requestWithAuthentication.call(this, 'univerCertApi', {
              method: 'GET',
              url: `${baseUrl}/api/v1/credentials/${id}`,
              json: true,
            });
          } else if (operation === 'list') {
            const limit = this.getNodeParameter('limit', i) as number;
            response = await this.helpers.requestWithAuthentication.call(this, 'univerCertApi', {
              method: 'GET',
              url: `${baseUrl}/api/v1/credentials`,
              qs: { limit },
              json: true,
            });
          } else if (operation === 'revoke') {
            const id = this.getNodeParameter('credentialId', i) as string;
            const reason = this.getNodeParameter('revokeReason', i) as string;
            response = await this.helpers.requestWithAuthentication.call(this, 'univerCertApi', {
              method: 'POST',
              url: `${baseUrl}/api/v1/credentials/${id}/revoke`,
              body: { reason },
              json: true,
            });
          }
        } else if (resource === 'recipient') {
          if (operation === 'create') {
            response = await this.helpers.requestWithAuthentication.call(this, 'univerCertApi', {
              method: 'POST',
              url: `${baseUrl}/api/v1/recipients`,
              body: {
                email: this.getNodeParameter('recipientEmail', i, '') as string,
                name: this.getNodeParameter('recipientName', i, '') as string,
              },
              json: true,
            });
          }
        } else if (resource === 'template' && operation === 'list') {
          response = await this.helpers.requestWithAuthentication.call(this, 'univerCertApi', {
            method: 'GET',
            url: `${baseUrl}/api/v1/templates`,
            json: true,
          });
        }

        returnData.push({ json: response });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message } });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
