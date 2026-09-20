export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ClauseIQX API',
    version: '1.0.0',
    description:
      'API specification for ClauseIQX — an enterprise AI-powered legal document assistant with strict grounding and zero hallucination.',
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        description: 'Returns health status of the API, AI providers, and infrastructure.',
        responses: {
          '200': {
            description: 'Health status object',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string' },
                    request_id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/projects': {
      get: {
        summary: 'List user projects',
        responses: {
          '200': { description: 'List of projects' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create project',
        responses: {
          '201': { description: 'Project created' },
          '400': { description: 'Validation failed' },
        },
      },
    },
    '/projects/{project_id}': {
      get: {
        summary: 'Get project details',
        responses: {
          '200': { description: 'Project details' },
          '404': { description: 'Resource not found (non-enumerating)' },
        },
      },
      delete: {
        summary: 'Delete project',
        responses: {
          '200': { description: 'Project deleted' },
          '404': { description: 'Resource not found' },
        },
      },
    },
    '/projects/{project_id}/documents': {
      post: {
        summary: 'Upload document to project',
        responses: {
          '201': { description: 'Document uploaded and processed' },
          '400': { description: 'Invalid file format or size' },
        },
      },
    },
  },
  components: {
    schemas: {
      ApiError: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'request_id'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              request_id: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
