import { describe, it, expect } from 'vitest';
import { Citation } from '@/types';

// Pure logic helpers mirroring the AnswerRenderer and EvidenceInspector logic
function extractCitationsFromAnswer(
  content: string,
  citations: Citation[]
): {
  matchedCitations: { index: number; citation: Citation }[];
  unresolvedIndices: number[];
} {
  const matches = content.match(/\[(\d+)\]/g) || [];
  const matchedCitations: { index: number; citation: Citation }[] = [];
  const unresolvedIndices: number[] = [];

  for (const m of matches) {
    const num = parseInt(m.slice(1, -1), 10);
    const found =
      citations[num - 1] ||
      citations.find((c, idx) => idx + 1 === num);

    if (found) {
      if (!matchedCitations.some((item) => item.index === num)) {
        matchedCitations.push({ index: num, citation: found });
      }
    } else {
      if (!unresolvedIndices.includes(num)) {
        unresolvedIndices.push(num);
      }
    }
  }

  return { matchedCitations, unresolvedIndices };
}

function formatEvidenceMetadata(citation: Citation) {
  const matchPercentage = citation.similarity
    ? `${(citation.similarity * 100).toFixed(1)}%`
    : 'N/A';
  const pageLabel = `Page ${citation.page_number || 1}`;
  const catalogTag = citation.document_index || 'DOC';
  const hasValidLink = Boolean(citation.document_id);

  return {
    matchPercentage,
    pageLabel,
    catalogTag,
    hasValidLink,
  };
}

describe('Evidence Desk: Citation & Evidence Inspector Logic', () => {
  const mockCitations: Citation[] = [
    {
      chunk_id: 'chk-001',
      document_id: 'doc-sla-2025',
      document_name: 'Enterprise_SLA_Agreement.pdf',
      document_index: 'DOC-001',
      quote: 'The Service Provider guarantees 99.95% monthly uptime for production clusters.',
      page_number: 4,
      section_title: 'Section 4.1: High Availability',
      similarity: 0.942,
    },
    {
      chunk_id: 'chk-002',
      document_id: 'doc-privacy-2025',
      document_name: 'Data_Processing_Addendum.md',
      document_index: 'DOC-002',
      quote: 'Customer data is encrypted in transit using TLS 1.3 and at rest with AES-256.',
      page_number: 2,
      section_title: 'Security Measures',
      similarity: 0.887,
    },
  ];

  it('correctly maps inline [1] and [2] citations to verified backend citations', () => {
    const answer =
      'Quivellox guarantees 99.95% uptime [1] and enforces AES-256 encryption at rest [2].';

    const { matchedCitations, unresolvedIndices } = extractCitationsFromAnswer(
      answer,
      mockCitations
    );

    expect(matchedCitations.length).toBe(2);
    expect(unresolvedIndices.length).toBe(0);

    expect(matchedCitations[0].index).toBe(1);
    expect(matchedCitations[0].citation.document_index).toBe('DOC-001');
    expect(matchedCitations[0].citation.chunk_id).toBe('chk-001');

    expect(matchedCitations[1].index).toBe(2);
    expect(matchedCitations[1].citation.document_index).toBe('DOC-002');
    expect(matchedCitations[1].citation.page_number).toBe(2);
  });

  it('identifies unresolved or unavailable citations without failing or hallucinating sources', () => {
    const answerWithPhantom =
      'This statement references a valid source [1] and an unverified phantom source [99].';

    const { matchedCitations, unresolvedIndices } = extractCitationsFromAnswer(
      answerWithPhantom,
      mockCitations
    );

    expect(matchedCitations.length).toBe(1);
    expect(matchedCitations[0].index).toBe(1);
    expect(unresolvedIndices).toEqual([99]);
  });

  it('formats verified evidence inspector metadata accurately', () => {
    const meta = formatEvidenceMetadata(mockCitations[0]);

    expect(meta.matchPercentage).toBe('94.2%');
    expect(meta.pageLabel).toBe('Page 4');
    expect(meta.catalogTag).toBe('DOC-001');
    expect(meta.hasValidLink).toBe(true);
  });

  it('handles citations with missing optional metadata gracefully', () => {
    const minimalCitation: Citation = {
      chunk_id: 'chk-sparse',
      document_id: 'doc-sparse',
      document_name: 'Raw_Notes.txt',
      quote: 'Preliminary research notes.',
      similarity: null,
      page_number: null,
    };

    const meta = formatEvidenceMetadata(minimalCitation);

    expect(meta.matchPercentage).toBe('N/A');
    expect(meta.pageLabel).toBe('Page 1'); // defaults to Page 1
    expect(meta.catalogTag).toBe('DOC');   // defaults to DOC
    expect(meta.hasValidLink).toBe(true);
  });

  it('handles empty citation sets when no sources match query', () => {
    const emptyAnswer = 'The requested information was not found in the indexed documents.';
    const { matchedCitations, unresolvedIndices } = extractCitationsFromAnswer(emptyAnswer, []);

    expect(matchedCitations.length).toBe(0);
    expect(unresolvedIndices.length).toBe(0);
  });
});
