export interface ChunkOptions {
  targetTokens?: number; // Default 512
  overlapTokens?: number; // Default 64
  charsPerToken?: number; // Default 4
}

export interface ChunkOutput {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber?: number;
  sectionTitle?: string;
}

/**
 * Estimate token count using character length heuristic
 */
export function estimateTokens(text: string, charsPerToken = 4): number {
  if (!text || text.trim().length === 0) return 0;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Splits text recursively using syntactic delimiters:
 * 1. Markdown headings (#, ##, ###)
 * 2. Paragraph breaks (\n\n)
 * 3. Line breaks (\n)
 * 4. Sentence boundaries (.!?)
 * 5. Word boundaries (\s)
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {},
  pageNumber?: number
): ChunkOutput[] {
  const targetTokens = options.targetTokens || 512;
  const overlapTokens = options.overlapTokens || 64;
  const charsPerToken = options.charsPerToken || 4;

  const targetChars = targetTokens * charsPerToken;
  const overlapChars = overlapTokens * charsPerToken;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const chunks: ChunkOutput[] = [];

  // Split on double newlines (paragraphs) first
  const rawParagraphs = cleanText.split(/\n\s*\n/);
  let currentBuffer = '';
  let currentSection = 'Introduction';
  let chunkIndex = 0;

  for (const para of rawParagraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Detect section headers
    if (trimmedPara.startsWith('#')) {
      const headerLine = trimmedPara.split('\n')[0].replace(/^#+\s*/, '').trim();
      if (headerLine.length > 0 && headerLine.length < 80) {
        currentSection = headerLine;
      }
    }

    // If paragraph itself exceeds targetChars, split by sentences
    if (trimmedPara.length > targetChars) {
      if (currentBuffer.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentBuffer.trim(),
          tokenCount: estimateTokens(currentBuffer, charsPerToken),
          pageNumber,
          sectionTitle: currentSection,
        });
        currentBuffer = '';
      }

      const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
      let sentenceBuffer = '';

      for (const sentence of sentences) {
        if ((sentenceBuffer + ' ' + sentence).length > targetChars) {
          if (sentenceBuffer.length > 0) {
            chunks.push({
              chunkIndex: chunkIndex++,
              content: sentenceBuffer.trim(),
              tokenCount: estimateTokens(sentenceBuffer, charsPerToken),
              pageNumber,
              sectionTitle: currentSection,
            });
            // Apply overlap
            const overlapText = sentenceBuffer.slice(-overlapChars);
            sentenceBuffer = overlapText + ' ' + sentence;
          } else {
            // Unusually long sentence
            chunks.push({
              chunkIndex: chunkIndex++,
              content: sentence.trim(),
              tokenCount: estimateTokens(sentence, charsPerToken),
              pageNumber,
              sectionTitle: currentSection,
            });
            sentenceBuffer = '';
          }
        } else {
          sentenceBuffer = sentenceBuffer ? sentenceBuffer + ' ' + sentence : sentence;
        }
      }

      if (sentenceBuffer.trim().length > 0) {
        currentBuffer = sentenceBuffer;
      }
      continue;
    }

    // Normal paragraph accumulation
    if ((currentBuffer + '\n\n' + trimmedPara).length > targetChars) {
      if (currentBuffer.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentBuffer.trim(),
          tokenCount: estimateTokens(currentBuffer, charsPerToken),
          pageNumber,
          sectionTitle: currentSection,
        });
        // Carry over overlap text
        const overlapText = currentBuffer.slice(-overlapChars);
        currentBuffer = overlapText + '\n\n' + trimmedPara;
      } else {
        currentBuffer = trimmedPara;
      }
    } else {
      currentBuffer = currentBuffer ? currentBuffer + '\n\n' + trimmedPara : trimmedPara;
    }
  }

  // Push remaining buffer
  if (currentBuffer.trim().length > 0) {
    chunks.push({
      chunkIndex: chunkIndex++,
      content: currentBuffer.trim(),
      tokenCount: estimateTokens(currentBuffer, charsPerToken),
      pageNumber,
      sectionTitle: currentSection,
    });
  }

  return chunks;
}
