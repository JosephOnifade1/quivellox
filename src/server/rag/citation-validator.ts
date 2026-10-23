import { Citation } from '@/types';
import { RetrievedPassage } from '../retrieval/retriever';

export interface RawCitationInput {
  chunk_id?: string;
  source_index?: number;
  quote?: string;
}

export interface ValidationResult {
  validCitations: Citation[];
  rejectedCount: number;
}

/**
 * Validates candidate citations strictly against the retrieved passage set
 */
export function validateCitations(
  rawCitations: RawCitationInput[],
  retrievedPassages: RetrievedPassage[]
): ValidationResult {
  const validCitations: Citation[] = [];
  let rejectedCount = 0;

  // Build lookup index of retrieved chunks
  const chunkMap = new Map<string, RetrievedPassage>();
  retrievedPassages.forEach((p) => chunkMap.set(p.chunk.id, p));

  for (const raw of rawCitations) {
    let matchedPassage: RetrievedPassage | undefined;

    // Check by chunk_id
    if (raw.chunk_id && chunkMap.has(raw.chunk_id)) {
      matchedPassage = chunkMap.get(raw.chunk_id);
    } else if (
      raw.source_index !== undefined &&
      raw.source_index >= 1 &&
      raw.source_index <= retrievedPassages.length
    ) {
      matchedPassage = retrievedPassages[raw.source_index - 1];
    }

    if (!matchedPassage) {
      rejectedCount++;
      continue;
    }

    // Derive quote excerpt from verified source content, avoiding hallucinated quotes
    const verifiedContent = matchedPassage.chunk.content;
    let quote = raw.quote && verifiedContent.includes(raw.quote)
      ? raw.quote
      : verifiedContent.slice(0, 180) + '…';

    // Prevent duplicate citations for the same chunk
    if (validCitations.some((c) => c.chunk_id === matchedPassage!.chunk.id)) {
      continue;
    }

    validCitations.push({
      chunk_id: matchedPassage.chunk.id,
      document_id: matchedPassage.chunk.document_id,
      document_name: matchedPassage.documentTitle,
      document_index: matchedPassage.documentIndex,
      quote,
      page_number: matchedPassage.chunk.page_number,
      section_title: matchedPassage.chunk.section_title,
      similarity: matchedPassage.score,
    });
  }

  return {
    validCitations,
    rejectedCount,
  };
}
