import { describe, it, expect } from 'vitest';
import { chunkText, estimateTokens } from './chunker';

describe('Chunker Engine', () => {
  it('estimates token count accurately from characters', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('Hello world')).toBe(3); // 11 chars / 4 ~ 3
  });

  it('rejects empty input cleanly', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\n  ')).toEqual([]);
  });

  it('preserves small paragraphs within a single chunk', () => {
    const text = 'This is a concise paragraph about system architecture.';
    const chunks = chunkText(text, { targetTokens: 100 });
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe(text);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('extracts Markdown section headings into chunk metadata', () => {
    const text = `
# System Architecture

The core architecture uses pgvector and Next.js.

## Security Boundaries

All data is strictly multi-tenant isolated via Row-Level Security.
`;
    const chunks = chunkText(text, { targetTokens: 50 });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.some((c) => c.sectionTitle === 'System Architecture' || c.sectionTitle === 'Security Boundaries')).toBe(true);
  });

  it('preserves page numbers when supplied', () => {
    const text = 'Paragraph located on page 4 of the enterprise SLA agreement.';
    const chunks = chunkText(text, { targetTokens: 100 }, 4);
    expect(chunks[0].pageNumber).toBe(4);
  });

  it('handles long paragraphs by splitting with overlap', () => {
    const sentence = 'Quivellox guarantees verifiable evidence for every generated answer. ';
    const longText = sentence.repeat(40); // ~2800 chars
    const chunks = chunkText(longText, { targetTokens: 100, overlapTokens: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0);
      expect(chunk.tokenCount).toBeGreaterThan(0);
    }
  });
});
