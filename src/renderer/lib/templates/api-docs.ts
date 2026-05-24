import type { Template } from '@/shared/types';

export const apiDocsTemplate: Template = {
  id: 'api-docs',
  name: 'API Documentation',
  description: 'Comprehensive API documentation for REST/GraphQL endpoints',
  icon: 'BookOpen',
  domain: 'developer',
  audienceHint: 'Software engineers, API consumers',
  framework: 'openai',
  defaultInput:
    'Document a REST API endpoint POST /api/v1/orders that creates a new order. Include request body schema, response format, error codes, authentication requirements, and a curl example.',
};
