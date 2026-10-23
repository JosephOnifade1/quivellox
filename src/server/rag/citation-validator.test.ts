import { describe, it, expect } from 'vitest';
import { validateCitations } from './citation-validator';
import { RetrievedPassage } from '../retrieval/retriever';

describe('Citation Validator', () => {
  const mockPassages: RetrievedPassage[] = [
    {
      chunk: {
        id: 'chk-real-1',
        document_id: 'doc-real-1',
        workspace_id: 'ws-demo',
        chunk_index: 0,
        content: 'The standard refund window is 14 calendar days from the date of purchase.',
        page_number: 2,
        section_title: 'Refund Policy',
        created_at: new Date().toISOString(),
      },
      score: 0.92,
      documentTitle: 'Refund_Policy_v3.pdf',
      documentIndex: 'DOC-003',
    },
    {
      chunk: {
        id: 'chk-real-2',
        document_id: 'doc-real-2',
        workspace_id: 'ws-demo',
        chunk_index: 1,
        content: 'Digital products are excluded from the refund window unless defective.',
        page_number: 3,
        section_title: 'Digital Exceptions',
        created_at: new Date().toISOString(),
      },
      score: 0.88,
      documentTitle: 'Customer_Terms.pdf',
      documentIndex: 'DOC-004',
    },
  ];

  it('accepts valid citations mapped to retrieved chunks', () => {
    const raw = [{ chunk_id: 'chk-real-1' }, { source_index: 2 }];
    const result = validateCitations(raw, mockPassages);

    expect(result.validCitations.length).toBe(2);
    expect(result.rejectedCount).toBe(0);
    expect(result.validCitations[0].chunk_id).toBe('chk-real-1');
    expect(result.validCitations[0].document_name).toBe('Refund_Policy_v3.pdf');
    expect(result.validCitations[0].page_number).toBe(2);
  });

  it('rejects hallucinated or arbitrary chunk IDs not in retrieval set', () => {
    const raw = [
      { chunk_id: 'chk-hallucinated-999' },
      { chunk_id: 'chk-real-1' },
      { source_index: 99 }, // out of bounds
    ];
    const result = validateCitations(raw, mockPassages);

    expect(result.validCitations.length).toBe(1);
    expect(result.validCitations[0].chunk_id).toBe('chk-real-1');
    expect(result.rejectedCount).toBe(2);
  });

  it('derives source quote from verified chunk content', () => {
    const raw = [{ chunk_id: 'chk-real-1', quote: 'The standard refund window' }];
    const result = validateCitations(raw, mockPassages);

    expect(result.validCitations.length).toBe(1);
    expect(result.validCitations[0].quote).toBe('The standard refund window');
  });

  it('deduplicates multiple citations pointing to the same chunk', () => {
    const raw = [{ chunk_id: 'chk-real-1' }, { chunk_id: 'chk-real-1' }];
    const result = validateCitations(raw, mockPassages);

    expect(result.validCitations.length).toBe(1);
  });
});
