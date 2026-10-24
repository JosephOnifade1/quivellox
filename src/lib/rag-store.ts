import { Document, DocumentChunk, Citation, Conversation, Message, ActivityEventType, Workspace } from '@/types';

// Pre-seeded demo documents for instant out-of-the-box portfolio evaluation
export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    workspace_id: 'ws-demo',
    uploaded_by: 'usr-lead-architect',
    original_filename: 'Quivellox_System_Architecture_v2.4.pdf',
    storage_path: '/vault/docs/Quivellox_System_Architecture_v2.4.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 1420500,
    checksum: 'sha256:8f4b23c10a',
    status: 'ready',
    page_count: 14,
    chunk_count: 6,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    document_index: 'DOC-001',
  },
  {
    id: 'doc-002',
    workspace_id: 'ws-demo',
    uploaded_by: 'usr-legal-ops',
    original_filename: 'Enterprise_Service_Level_Agreement_2025.pdf',
    storage_path: '/vault/docs/Enterprise_Service_Level_Agreement_2025.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 845200,
    checksum: 'sha256:3a91c01e7b',
    status: 'ready',
    page_count: 8,
    chunk_count: 5,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    document_index: 'DOC-002',
  },
  {
    id: 'doc-003',
    workspace_id: 'ws-demo',
    uploaded_by: 'usr-commercial-lead',
    original_filename: 'Product_Refund_and_Commercial_Terms_v3.1.pdf',
    storage_path: '/vault/docs/Product_Refund_and_Commercial_Terms_v3.1.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 612400,
    checksum: 'sha256:d17482390f',
    status: 'ready',
    page_count: 6,
    chunk_count: 4,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    document_index: 'DOC-003',
  },
  {
    id: 'doc-004',
    workspace_id: 'ws-demo',
    uploaded_by: 'usr-sec-compliance',
    original_filename: 'Security_Compliance_and_SOC2_Summary.pdf',
    storage_path: '/vault/docs/Security_Compliance_and_SOC2_Summary.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 1104800,
    checksum: 'sha256:99cfa488b1',
    status: 'ready',
    page_count: 11,
    chunk_count: 5,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    document_index: 'DOC-004',
  },
];

export const INITIAL_CHUNKS: DocumentChunk[] = [
  // DOC-001 Architecture Chunks
  {
    id: 'chk-101',
    document_id: 'doc-001',
    workspace_id: 'ws-demo',
    chunk_index: 0,
    page_number: 2,
    section_title: 'Chunking Strategy & Semantic Boundary Preservation',
    content: 'Quivellox utilizes recursive character splitting with a target window of 512 tokens and an overlap of 64 tokens. Boundary heuristics prioritize Markdown headers, paragraph breaks, and sentence delimiters to preserve semantic cohesion across chunk boundaries.',
    token_count: 85,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chk-102',
    document_id: 'doc-001',
    workspace_id: 'ws-demo',
    chunk_index: 1,
    page_number: 4,
    section_title: 'Hybrid Retrieval & Cross-Encoder Reranking',
    content: 'Retrieval queries undergo a dual-channel search: dense vector similarity via pgvector (HNSW index with cosine distance metric) combined with sparse BM25 keyword matching via PostgreSQL full-text search. Top 20 candidate passages are reranked using a lightweight cross-encoder before prompt injection.',
    token_count: 94,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chk-103',
    document_id: 'doc-001',
    workspace_id: 'ws-demo',
    chunk_index: 2,
    page_number: 7,
    section_title: 'Multi-Tenant Isolation & Row-Level Security',
    content: 'Strict multi-tenancy is enforced at the database layer using Supabase Row-Level Security (RLS). Every query automatically injects `auth.uid()` and filters on `workspace_id`. Even in hybrid search, vector embeddings never cross workspace boundaries.',
    token_count: 82,
    created_at: new Date().toISOString(),
  },

  // DOC-002 SLA Chunks
  {
    id: 'chk-201',
    document_id: 'doc-002',
    workspace_id: 'ws-demo',
    chunk_index: 0,
    page_number: 1,
    section_title: 'Service Availability Commitment',
    content: 'The Quivellox Enterprise Service guarantees a monthly uptime percentage of at least 99.95% excluding scheduled maintenance windows announced at least 72 hours in advance. Downtime is measured from automated health check probes evaluated every 30 seconds.',
    token_count: 78,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chk-202',
    document_id: 'doc-002',
    workspace_id: 'ws-demo',
    chunk_index: 1,
    page_number: 3,
    section_title: 'Incident Severity Levels & Response Times',
    content: 'Priority 1 (Critical / Full Outage) incidents require initial response within 15 minutes and updates every 30 minutes. Priority 2 (Major Feature Impairment) carries a 1-hour initial response SLA. Priority 3 (Minor Inconvenience) carries a 4-business-hour response SLA.',
    token_count: 88,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chk-203',
    document_id: 'doc-002',
    workspace_id: 'ws-demo',
    chunk_index: 2,
    page_number: 5,
    section_title: 'Service Credits for SLA Breaches',
    content: 'If monthly availability drops below 99.95% but remains above 99.0%, the customer receives a 10% invoice credit. For availability between 95.0% and 99.0%, the credit is 25%. For availability below 95.0%, a 50% credit applies upon written request within 30 days of the incident.',
    token_count: 92,
    created_at: new Date().toISOString(),
  },

  // DOC-003 Refund & Commercial Terms Chunks
  {
    id: 'chk-301',
    document_id: 'doc-003',
    workspace_id: 'ws-demo',
    chunk_index: 0,
    page_number: 2,
    section_title: 'General Refund Window',
    content: 'Customers are entitled to initiate a return or refund within 14 calendar days from the date of initial purchase or contract execution. Refunds requested within this period are remitted to the original payment method within 5 to 7 banking days.',
    token_count: 80,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chk-302',
    document_id: 'doc-003',
    workspace_id: 'ws-demo',
    chunk_index: 1,
    page_number: 3,
    section_title: 'Digital Goods & SaaS Exceptions',
    content: 'Digital product licenses, API consumption tiers, and active subscription seats are explicitly excluded from standard return policies once usage exceeds 50 queries or 10 document uploads, unless a reproducible system defect is verified by technical support within 7 days of provisioning.',
    token_count: 89,
    created_at: new Date().toISOString(),
  },

  // DOC-004 Security & Compliance Chunks
  {
    id: 'chk-401',
    document_id: 'doc-004',
    workspace_id: 'ws-demo',
    chunk_index: 0,
    page_number: 2,
    section_title: 'Data Encryption Standards',
    content: 'All customer data at rest is encrypted using FIPS 140-2 validated AES-256 encryption. All network transmission in transit is enforced over TLS 1.3 with forward secrecy. Cryptographic keys are rotated automatically every 90 days via AWS KMS / HashiCorp Vault.',
    token_count: 81,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chk-402',
    document_id: 'doc-004',
    workspace_id: 'ws-demo',
    chunk_index: 1,
    page_number: 4,
    section_title: 'Zero Training Policy on Customer Data',
    content: 'Quivellox contractual agreements strictly prohibit using customer-uploaded documents, vector embeddings, or user prompts to fine-tune or train any foundation AI models. Data residency is locked to the selected enterprise region.',
    token_count: 76,
    created_at: new Date().toISOString(),
  },
];

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act-001',
    type: 'document.ready',
    description: 'Indexed Security_Compliance_and_SOC2_Summary.pdf (5 chunks, 11 pages)',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'act-002',
    type: 'document.ready',
    description: 'Indexed Product_Refund_and_Commercial_Terms_v3.1.pdf (4 chunks, 6 pages)',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'act-003',
    type: 'document.ready',
    description: 'Indexed Enterprise_Service_Level_Agreement_2025.pdf (5 chunks, 8 pages)',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'act-004',
    type: 'document.ready',
    description: 'Indexed Quivellox_System_Architecture_v2.4.pdf (6 chunks, 14 pages)',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// In-memory runtime state for development and serverless requests
class GlobalStore {
  documents: Document[] = [...INITIAL_DOCUMENTS];
  chunks: DocumentChunk[] = [...INITIAL_CHUNKS];
  activity: ActivityEvent[] = [...INITIAL_ACTIVITY];
  workspaces: Workspace[] = [
    {
      id: 'ws-demo',
      name: 'Personal Knowledge',
      owner_id: 'usr-demo',
      dify_dataset_id: process.env.DIFY_DEFAULT_DATASET_ID || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  conversations: Conversation[] = [
    {
      id: 'conv-001',
      workspace_id: 'ws-demo',
      user_id: 'usr-demo',
      title: 'Refund Policy & Digital Exceptions Query',
      last_message: 'The refund window is 14 calendar days from the date of purchase...',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'conv-002',
      workspace_id: 'ws-demo',
      user_id: 'usr-demo',
      title: 'Enterprise SLA & Severity 1 Response Times',
      last_message: 'Priority 1 incidents guarantee initial technical response within 15 minutes...',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];
  messages: Record<string, Message[]> = {
    'conv-001': [
      {
        id: 'msg-101',
        conversation_id: 'conv-001',
        role: 'user',
        content: 'What is the refund window and does it apply to digital products?',
        created_at: new Date(Date.now() - 3600000 * 4 - 60000).toISOString(),
      },
      {
        id: 'msg-102',
        conversation_id: 'conv-001',
        role: 'assistant',
        content: 'The standard refund window is **14 calendar days** from the date of purchase. [1] However, digital products and active subscription seats are **explicitly excluded** from standard refunds once usage exceeds 50 queries or 10 uploads, unless a reproducible system defect is verified within 7 days. [2]',
        citations: [
          {
            chunk_id: 'chk-301',
            document_id: 'doc-003',
            document_name: 'Product_Refund_and_Commercial_Terms_v3.1.pdf',
            document_index: 'DOC-003',
            page_number: 2,
            section_title: 'General Refund Window',
            quote: 'Customers are entitled to initiate a return or refund within 14 calendar days from the date of initial purchase or contract execution.',
            similarity: 0.94,
          },
          {
            chunk_id: 'chk-302',
            document_id: 'doc-003',
            document_name: 'Product_Refund_and_Commercial_Terms_v3.1.pdf',
            document_index: 'DOC-003',
            page_number: 3,
            section_title: 'Digital Goods & SaaS Exceptions',
            quote: 'Digital product licenses, API consumption tiers, and active subscription seats are explicitly excluded from standard return policies once usage exceeds 50 queries...',
            similarity: 0.89,
          },
        ],
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  };

  addDocument(doc: Document, chunks: DocumentChunk[]) {
    this.documents.unshift(doc);
    this.chunks.push(...chunks);
    this.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'document.ready',
      description: `Indexed ${doc.original_filename} (${chunks.length} chunks, ${doc.page_count || 1} pages)`,
      timestamp: new Date().toISOString(),
    });
  }

  deleteDocument(id: string) {
    const doc = this.documents.find((d) => d.id === id);
    this.documents = this.documents.filter((d) => d.id !== id);
    this.chunks = this.chunks.filter((c) => c.document_id !== id);
    if (doc) {
      this.activity.unshift({
        id: `act-${Date.now()}`,
        type: 'document.deleted',
        description: `Removed ${doc.original_filename} from knowledge library`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  resetToDefault() {
    this.documents = [...INITIAL_DOCUMENTS];
    this.chunks = [...INITIAL_CHUNKS];
    this.activity = [...INITIAL_ACTIVITY];
  }
}

// Global singleton across hot-reloads in Node / Next dev
declare global {
  // eslint-disable-next-line no-var
  var __quivelloxStore: GlobalStore | undefined;
}

export const getStore = (): GlobalStore => {
  if (!global.__quivelloxStore) {
    global.__quivelloxStore = new GlobalStore();
  }
  return global.__quivelloxStore;
};
