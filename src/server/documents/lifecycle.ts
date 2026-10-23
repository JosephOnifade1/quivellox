import { DocumentStatus } from '@/types';

/**
 * Valid state transitions for the Quellivox document lifecycle.
 * Prevents invalid state jumps (e.g. ready cannot transition back to queued; failed cannot become ready without re-indexing).
 */
export const VALID_STATUS_TRANSITIONS: Record<DocumentStatus, readonly DocumentStatus[]> = {
  queued: ['extracting', 'chunking', 'indexing', 'failed', 'deleting'],
  extracting: ['chunking', 'indexing', 'failed', 'deleting'],
  chunking: ['indexing', 'failed', 'deleting'],
  indexing: ['ready', 'failed', 'deleting'],
  ready: ['deleting'],
  failed: ['queued', 'deleting'], // Allows authorized retries
  deleting: [], // Terminal deletion state
};

/**
 * Validates whether a requested status transition is allowed by the lifecycle state machine.
 */
export function isValidTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Thrown when an illegal document lifecycle status transition is attempted.
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Asserts a valid transition, throwing an informative error if the state change is invalid.
 */
export function assertValidTransition(from: DocumentStatus, to: DocumentStatus, docId?: string): void {
  if (!isValidTransition(from, to)) {
    throw new InvalidStateTransitionError(
      `[DocumentLifecycle] Invalid document status transition from '${from}' to '${to}'${
        docId ? ` for document ${docId}` : ''
      }. Allowed transitions: [${VALID_STATUS_TRANSITIONS[from]?.join(', ') || 'none'}]`
    );
  }
}

/**
 * Returns true if the status represents a finished terminal state.
 */
export function isTerminalStatus(status: DocumentStatus): boolean {
  return status === 'ready' || status === 'failed';
}

/**
 * Returns true if the document is actively processing in the ingestion pipeline.
 */
export function isProcessingStatus(status: DocumentStatus): boolean {
  return (
    status === 'queued' ||
    status === 'extracting' ||
    status === 'chunking' ||
    status === 'indexing'
  );
}
