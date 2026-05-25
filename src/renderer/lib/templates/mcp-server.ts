import type { Template } from '@/shared/types';

export const mcpServerTemplate: Template = {
  id: 'mcp-server',
  name: 'MCP Server Design',
  description: 'Specification for Model Context Protocol servers with tools, resources, and prompts',
  icon: 'Server',
  domain: 'developer',
  audienceHint: 'Engineers building MCP integrations',
  framework: 'karpathy',
  defaultInput:
    'Design an MCP server that connects to a PostgreSQL database. It should provide tools for running queries, a resource for schema inspection, and a prompt template for generating common SQL patterns. Use TypeScript with the MCP SDK.',
};
