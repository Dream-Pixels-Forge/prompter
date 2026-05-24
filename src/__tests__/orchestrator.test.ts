import { buildSectionContent, extractAudienceTone, extractDomain, extractGoal } from '@/main/llm/orchestrator';
import { describe, expect, it } from 'vitest';

describe('extractDomain', () => {
  it('detects SaaS/product domain', () => {
    expect(extractDomain('build a saas platform')).toBe('SaaS/product');
  });

  it('detects content/writing domain', () => {
    expect(extractDomain('write a blog post')).toBe('content/writing');
  });

  it('returns "general" for unrecognized input', () => {
    expect(extractDomain('random text')).toBe('general');
  });
});

describe('extractGoal', () => {
  it('strips "create" prefix and capitalizes', () => {
    expect(extractGoal('create a blog post about AI')).toBe('A blog post about AI');
  });

  it('strips "write" prefix and capitalizes', () => {
    expect(extractGoal('write documentation for the API')).toBe('Documentation for the API');
  });

  it('extracts first sentence only', () => {
    expect(extractGoal('Hello world. Second sentence.')).toBe('Hello world');
  });
});

describe('extractAudienceTone', () => {
  it('detects professional authority for enterprise/b2b', () => {
    expect(extractAudienceTone('enterprise b2b solution')).toBe('professional authority');
  });

  it('detects approachable warmth for casual/fun content', () => {
    expect(extractAudienceTone('fun creative project')).toBe('approachable warmth');
  });

  it('detects technical precision for developer/API content', () => {
    expect(extractAudienceTone('developer API integration')).toBe('technical precision');
  });

  it('returns clear professionalism as default', () => {
    expect(extractAudienceTone('regular text')).toBe('clear professionalism');
  });
});

describe('buildSectionContent', () => {
  it('substitutes {goal} in the template', () => {
    const sections = [{ key: 'goal', defaultContent: 'Goal: {goal}' }];
    expect(buildSectionContent('goal', 'create a blog post', sections)).toBe('Goal: A blog post');
  });

  it('substitutes multiple tokens in the template', () => {
    const sections = [{ key: 'goal', defaultContent: 'Goal: {goal}, Domain: {domain}' }];
    expect(buildSectionContent('goal', 'build a saas platform for developers', sections)).toBe(
      'Goal: A saas platform for developers, Domain: SaaS/product',
    );
  });

  it('falls through with {goal} template when section key is not found (goal gets replaced)', () => {
    const sections = [{ key: 'goal', defaultContent: '{goal}' }];
    // extractGoal("hello") = "Hello", so the fallback template "{goal}" becomes "Hello"
    expect(buildSectionContent('missing', 'hello', sections)).toBe('Hello');
  });
});
