import { describe, it, expect } from 'vitest';
import { extractKeywords } from '@/renderer/lib/intent-parser';

describe('extractKeywords', () => {
  it('removes stop words and returns empty array when all words are stop/short', () => {
    expect(extractKeywords('a an the is for to')).toEqual([]);
  });

  it('extracts meaningful keywords, filtering stop words and short words', () => {
    // "about" is a stop word, "a" is too short — both filtered out
    expect(extractKeywords('create a blog post about writing')).toEqual([
      'create',
      'blog',
      'post',
      'writing',
    ]);
  });

  it('removes punctuation and stop words, keeps content words > 2 chars', () => {
    // "this" is a stop word, "is" is 2 chars, "a" is 1 char — all filtered out
    expect(extractKeywords('Hello, world! This is a test.')).toEqual([
      'hello',
      'world',
      'test',
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(extractKeywords('   ')).toEqual([]);
  });
});
