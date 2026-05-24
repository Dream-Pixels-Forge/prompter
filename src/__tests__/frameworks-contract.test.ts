import { templates } from '@/renderer/lib/templates';
import { frameworks } from '@/shared/frameworks';
import { describe, expect, it } from 'vitest';

describe('frameworks contract', () => {
  it('every framework has all required fields', () => {
    for (const f of frameworks) {
      expect(typeof f.id).toBe('string');
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(Array.isArray(f.sections)).toBe(true);
      expect(f.sections.length).toBeGreaterThanOrEqual(1);
      expect(typeof f.color).toBe('string');
      expect(f.color).toBeTruthy();
    }
  });

  it('every section in each framework has required fields with non-empty values', () => {
    for (const f of frameworks) {
      for (const section of f.sections) {
        expect(typeof section.key).toBe('string');
        expect(section.key).toBeTruthy();
        expect(section.label).toBeTruthy();
        expect(section.placeholder).toBeTruthy();
        expect(section.defaultContent).toBeTruthy();
      }
    }
  });

  it('has no duplicate framework IDs', () => {
    const ids = frameworks.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('templates contract', () => {
  const frameworkIds = new Set(frameworks.map((f) => f.id));

  it('every template has all required fields', () => {
    for (const t of templates) {
      expect(typeof t.id).toBe('string');
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(typeof t.icon).toBe('string');
      expect(t.domain).toBeTruthy();
      expect(t.audienceHint).toBeTruthy();
      expect(t.defaultInput).toBeTruthy();
    }
  });

  it('every template references a valid framework', () => {
    for (const t of templates) {
      expect(frameworkIds.has(t.framework)).toBe(true);
    }
  });

  it('has no duplicate template IDs', () => {
    const ids = templates.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
