import type { Template } from '@/shared/types';

export const dbSchemaTemplate: Template = {
  id: 'db-schema',
  name: 'Database Schema',
  description: 'Design database schemas with tables, relationships, indexes, and migrations',
  icon: 'Database',
  domain: 'developer',
  audienceHint: 'Backend engineers and data architects',
  framework: 'openai',
  defaultInput:
    'Design a PostgreSQL schema for a multi-tenant SaaS booking platform. Include tables for organizations, users, services, availability slots, reservations, and payments. Add indexes for common query patterns and row-level security policies for tenant isolation.',
};
