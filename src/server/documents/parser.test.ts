import { describe, it, expect } from 'vitest';
import { validateFile, parseDocument, sanitizeText } from './parser';

describe('Document Parser & File Validator', () => {
  it('validates allowed extensions and rejects unsupported types', () => {
    expect(validateFile({ name: 'manual.pdf', size: 1024 }).valid).toBe(true);
    expect(validateFile({ name: 'readme.md', size: 1024 }).valid).toBe(true);
    expect(validateFile({ name: 'data.txt', size: 1024 }).valid).toBe(true);
    expect(validateFile({ name: 'malware.exe', size: 1024 }).valid).toBe(false);
  });

  it('rejects files larger than 25MB or empty files', () => {
    expect(validateFile({ name: 'empty.pdf', size: 0 }).valid).toBe(false);
    expect(validateFile({ name: 'huge.pdf', size: 30 * 1024 * 1024 }).valid).toBe(false);
  });

  it('sanitizes text by stripping control characters and zero-width spaces', () => {
    const dirty = 'Hello\u0000World\u200B!';
    expect(sanitizeText(dirty)).toBe('HelloWorld!');
  });

  it('parses Markdown document and preserves simulated pages', async () => {
    const markdown = '# Project Overview\n\nThis is a test markdown document for Quellivox.';
    const buffer = Buffer.from(markdown, 'utf-8');
    const result = await parseDocument(buffer, 'overview.md', 'text/markdown');

    expect(result.text).toContain('Project Overview');
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.pages[0].pageNumber).toBe(1);
  });
});
