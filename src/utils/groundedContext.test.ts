import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildGroundedTextFromSelection,
  formatGroundedSizeLimit,
  getGroundedFileKind,
  getMaxGroundedFileBytes,
  isAllowedGroundedMime,
  readGroundedFileAsText,
  toggleSelectedDocId,
  MAX_GROUNDED_IMAGE_BYTES,
  MAX_GROUNDED_PDF_BYTES,
  MAX_GROUNDED_TEXT_BYTES,
} from './groundedContext';

vi.mock('./groundedFileExtract', () => ({
  extractPdfText: vi.fn(async () => 'pdf body'),
  extractDocxText: vi.fn(async () => 'docx body'),
}));

vi.mock('./groundedImageApi', () => ({
  extractGroundedImageText: vi.fn(async () => ({
    textContent: '[Image: photo.jpg]\n\nA safety sign.',
    model: 'gpt-4o-mini',
  })),
  fileToBase64DataUrl: vi.fn(async () => 'data:image/jpeg;base64,abc'),
}));

import { extractPdfText, extractDocxText } from './groundedFileExtract';
import { extractGroundedImageText } from './groundedImageApi';

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

describe('getGroundedFileKind', () => {
  it('routes by extension when mime is missing or generic', () => {
    expect(getGroundedFileKind('report.pdf', '')).toBe('pdf');
    expect(getGroundedFileKind('sop.docx', 'application/octet-stream')).toBe('docx');
    expect(getGroundedFileKind('scan.jpeg', '')).toBe('image');
    expect(getGroundedFileKind('notes.txt', '')).toBe('text');
  });

  it('routes by mime type', () => {
    expect(getGroundedFileKind('file', 'application/pdf')).toBe('pdf');
    expect(getGroundedFileKind('file', 'image/png')).toBe('image');
  });

  it('returns null for unknown types', () => {
    expect(getGroundedFileKind('data.bin', 'application/octet-stream')).toBeNull();
  });
});

describe('isAllowedGroundedMime', () => {
  it('allows csv, txt, pdf, docx, and images', () => {
    expect(isAllowedGroundedMime('text/csv', 'log.csv')).toBe(true);
    expect(isAllowedGroundedMime('text/plain', 'notes.txt')).toBe(true);
    expect(isAllowedGroundedMime('application/pdf', 'report.pdf')).toBe(true);
    expect(
      isAllowedGroundedMime(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'sop.docx'
      )
    ).toBe(true);
    expect(isAllowedGroundedMime('image/png', 'photo.png')).toBe(true);
    expect(isAllowedGroundedMime('', 'audit.csv')).toBe(true);
  });

  it('allows .doc extension for kind detection but upload rejects legacy format', () => {
    expect(isAllowedGroundedMime('application/msword', 'legacy.doc')).toBe(true);
  });

  it('rejects unknown types', () => {
    expect(isAllowedGroundedMime('application/octet-stream', 'data.bin')).toBe(false);
  });
});

describe('getMaxGroundedFileBytes', () => {
  it('uses tiered limits per kind', () => {
    expect(getMaxGroundedFileBytes('text')).toBe(MAX_GROUNDED_TEXT_BYTES);
    expect(getMaxGroundedFileBytes('image')).toBe(MAX_GROUNDED_IMAGE_BYTES);
    expect(getMaxGroundedFileBytes('pdf')).toBe(MAX_GROUNDED_PDF_BYTES);
    expect(getMaxGroundedFileBytes('docx')).toBe(MAX_GROUNDED_PDF_BYTES);
  });
});

describe('formatGroundedSizeLimit', () => {
  it('formats KB and MB', () => {
    expect(formatGroundedSizeLimit('text')).toBe('512KB');
    expect(formatGroundedSizeLimit('image')).toBe('5MB');
    expect(formatGroundedSizeLimit('pdf')).toBe('10MB');
  });
});

describe('toggleSelectedDocId', () => {
  it('adds and removes ids', () => {
    expect(toggleSelectedDocId([], 'a')).toEqual(['a']);
    expect(toggleSelectedDocId(['a'], 'a')).toEqual([]);
    expect(toggleSelectedDocId(['a'], 'b')).toEqual(['a', 'b']);
  });
});

describe('readGroundedFileAsText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads plain text files in the browser', async () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    await expect(readGroundedFileAsText(file)).resolves.toBe('hello');
  });

  it('delegates pdf files to pdf extraction', async () => {
    const file = new File(['%PDF'], 'report.pdf', { type: 'application/pdf' });
    await expect(readGroundedFileAsText(file)).resolves.toBe('pdf body');
    expect(extractPdfText).toHaveBeenCalledWith(file);
  });

  it('delegates docx files to mammoth extraction', async () => {
    const file = new File(['pk'], 'sop.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(readGroundedFileAsText(file)).resolves.toBe('docx body');
    expect(extractDocxText).toHaveBeenCalledWith(file);
  });

  it('delegates images to the vision API helper', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(readGroundedFileAsText(file)).resolves.toContain('safety sign');
    expect(extractGroundedImageText).toHaveBeenCalled();
  });

  it('rejects legacy .doc with a clear message', async () => {
    const file = new File(['doc'], 'old.doc', { type: 'application/msword' });
    await expect(readGroundedFileAsText(file)).rejects.toThrow(/\.docx/i);
  });

  it('rejects oversize images', async () => {
    const big = new Uint8Array(MAX_GROUNDED_IMAGE_BYTES + 1);
    const file = new File([big], 'huge.jpg', { type: 'image/jpeg' });
    await expect(readGroundedFileAsText(file)).rejects.toThrow(/5MB/i);
  });
});
