import type { Template } from '@/shared/types';

export const cliToolTemplate: Template = {
  id: 'cli-tool',
  name: 'CLI Tool Spec',
  description: 'Specification and prompt for building command-line tools',
  icon: 'Terminal',
  domain: 'developer',
  audienceHint: 'Developers building CLI applications',
  framework: 'karpathy',
  defaultInput:
    'Design a CLI tool called "repo-summary" that analyzes a git repository and generates a markdown summary of its structure, dependencies, and recent activity. It should support flags for depth, output format, and exclude patterns.',
};
