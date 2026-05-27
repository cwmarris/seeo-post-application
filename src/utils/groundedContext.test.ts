import { describe, expect, it } from 'vitest';
import {
  buildGroundedTextFromSelection,
  isAllowedGroundedMime,
  toggleSelectedDocId,
  MAX_GROUNDED_FILE_BYTES,
} from './groundedContext';

describe('buildGroundedTextFromSelection', () => {
  it('merges selected documents and manual paste with headers', () => {
    const result = buildGroundedTextFromSelection(
      [
        {
          id: '1',
          name: 'incidents.csv',
          mimeType: 'text/csv',
          textContent: 'INC-1,zone A',
        },
      ],
      'Director note: verify PPE'
    );

    expect(result).toContain('--- incidents.csv ---');
    expect(result).toContain('INC-1,zone A');
    expect(result).toContain('--- Manual context ---');
    expect(result).toContain('Director note: verify PPE');
  });

  it('returns empty string when nothing is selected or pasted', () => {
    expect(buildGroundedTextFromSelection([], '')).toBe('');
    expect(buildGroundedTextFromSelection([], '   ')).toBe('');
  });

  it('skips documents with blank text content', () => {
    const result = buildGroundedTextFromSelection(
      [{ id: '1', name: 'empty.txt', mimeType: 'text/plain', textContent: '   ' }],
      'only manual'
    );
    expect(result).toBe('--- Manual context ---\nonly manual');
  });
});

describe('isAllowedGroundedMime', () => {
  it('allows csv and txt mime types and extensions', () => {
    expect(isAllowedGroundedMime('text/csv', 'log.csv')).toBe(true);
    expect(isAllowedGroundedMime('text/plain', 'notes.txt')).toBe(true);
    expect(isAllowedGroundedMime('', 'audit.csv')).toBe(true);
  });

  it('rejects pdf and unknown types', () => {
    expect(isAllowedGroundedMime('application/pdf', 'report.pdf')).toBe(false);
    expect(isAllowedGroundedMime('application/octet-stream', 'data.bin')).toBe(false);
  });
});

describe('toggleSelectedDocId', () => {
  it('adds and removes ids', () => {
    expect(toggleSelectedDocId([], 'a')).toEqual(['a']);
    expect(toggleSelectedDocId(['a'], 'a')).toEqual([]);
    expect(toggleSelectedDocId(['a'], 'b')).toEqual(['a', 'b']);
  });
});

describe('MAX_GROUNDED_FILE_BYTES', () => {
  it('enforces a 512KB cap', () => {
    expect(MAX_GROUNDED_FILE_BYTES).toBe(512 * 1024);
  });
});
