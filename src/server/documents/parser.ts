export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ParseResult {
  text: string;
  pageCount: number;
  pages: ExtractedPage[];
  mimeType: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Sanitizes raw extracted text, stripping harmful control codes
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Non-printable control characters
    .replace(/\u200B/g, '') // Zero-width spaces
    .trim();
}

/**
 * Validates file constraints before processing
 */
export function validateFile(file: { name: string; size: number; type?: string }): {
  valid: boolean;
  error?: string;
  ext: string;
} {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (!['pdf', 'txt', 'md', 'markdown'].includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format: .${ext}. Only PDF, TXT, and Markdown are supported.`,
      ext,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty.', ext };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      ext,
    };
  }

  return { valid: true, ext };
}

/**
 * Parses supported document formats into extracted pages and text
 */
export async function parseDocument(
  buffer: Buffer | ArrayBuffer,
  filename: string,
  mimeType?: string
): Promise<ParseResult> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // Markdown or plain text parsing
  if (['txt', 'md', 'markdown'].includes(ext) || mimeType?.includes('text')) {
    const rawContent = nodeBuffer.toString('utf-8');
    const cleanContent = sanitizeText(rawContent);

    if (cleanContent.length === 0) {
      throw new Error('Extracted text is empty or could not be decoded.');
    }

    // Split text into simulated pages every ~3000 chars for clean page attribution
    const pageLength = 3000;
    const pages: ExtractedPage[] = [];
    const totalSimulatedPages = Math.max(1, Math.ceil(cleanContent.length / pageLength));

    for (let i = 0; i < totalSimulatedPages; i++) {
      pages.push({
        pageNumber: i + 1,
        text: cleanContent.slice(i * pageLength, (i + 1) * pageLength),
      });
    }

    return {
      text: cleanContent,
      pageCount: totalSimulatedPages,
      pages,
      mimeType: ext === 'md' ? 'text/markdown' : 'text/plain',
    };
  }

  // PDF Parsing
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    // Read textual blocks from PDF buffer safely
    const rawString = nodeBuffer.toString('binary');
    
    // Extract stream content or text objects
    const textChunks: string[] = [];
    const textObjectRegex = /BT[\s\S]*?ET/g;
    let match;
    
    while ((match = textObjectRegex.exec(rawString)) !== null) {
      // Extract string literals in parentheses
      const literalMatches = match[0].match(/\((.*?)\)/g);
      if (literalMatches) {
        const line = literalMatches
          .map((m) => m.slice(1, -1))
          .join(' ')
          .replace(/\\([0-9]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\[nrtbf\\()]/g, ' ');
        textChunks.push(line);
      }
    }

    let extracted = textChunks.join('\n').trim();

    // If PDF text streams were compressed or unreadable with basic parser, fallback to UTF-8 extraction
    if (extracted.length < 50) {
      extracted = nodeBuffer
        .toString('utf-8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const cleanContent = sanitizeText(extracted);

    if (cleanContent.length === 0) {
      throw new Error('PDF contains no extractable text or is a scanned image requiring OCR.');
    }

    // Estimate page count based on /Type /Page occurrences or length
    const pageMatches = (rawString.match(/\/Type\s*\/Page[^s]/g) || []).length;
    const estimatedPages = Math.max(1, pageMatches || Math.ceil(cleanContent.length / 2500));

    const pages: ExtractedPage[] = [];
    const sliceSize = Math.ceil(cleanContent.length / estimatedPages);

    for (let p = 0; p < estimatedPages; p++) {
      pages.push({
        pageNumber: p + 1,
        text: cleanContent.slice(p * sliceSize, (p + 1) * sliceSize),
      });
    }

    return {
      text: cleanContent,
      pageCount: estimatedPages,
      pages,
      mimeType: 'application/pdf',
    };
  }

  throw new Error(`Unsupported document format: ${ext}`);
}
