# Quellivox — Grounded Retrieval-Augmented Generation (RAG) Architecture

## 1. Overview & Core Philosophy

Quellivox is an evidence-first AI knowledge assistant designed to solve the critical trust deficiency in generative AI: **hallucination, citation drift, and cross-tenant data leakage**.

Unlike generic chatbot wrappers that stuff arbitrary documents into prompts or rely on unchecked LLM-generated citations, Quellivox treats **evidence as a verified database entity**. Every rendered citation must resolve to a real, authorized, and stored chunk from the user's workspace.

```
                      [ User Upload: PDF / TXT / MD ]
                                     │
                                     ▼
                      [ Ingestion Service & Validator ]
                                     │
              ┌──────────────────────┴──────────────────────┐
              ▼                                             ▼
     [ Text Extraction ]                            [ Chunking Engine ]
    (Sanitization & Pages)                      (512 tokens / 64 overlap)
              │                                             │
              └──────────────────────┬──────────────────────┘
                                     ▼
                       [ Vector Embedding Service ]
                       (text-embedding-3-small: 1536d)
                                     │
                                     ▼
                     [ Supabase PostgreSQL + pgvector ]
                     (HNSW Cosine Index & Tenant RLS)
                                     │
─── RETRIEVAL & ANSWER PIPELINE ─────┼──────────────────────────────────────────
                                     │
                             [ User Question ]
                                     │
                                     ▼
                       [ Query Embedding Generator ]
                                     │
                                     ▼
                   [ Workspace-Scoped Vector Search ]
                     (`match_document_chunks` RPC)
                                     │
                                     ▼
                        [ Context Bounded Builder ]
                     (Untrusted Evidence Delimiters)
                                     │
                                     ▼
                     [ LLM Generation (gpt-4o-mini) ]
                     (Strict Evidence-Only Grounding)
                                     │
                                     ▼
                       [ Strict Citation Validator ]
                     (Verifies chunk IDs & verbatim quote)
                                     │
                                     ▼
                      [ Persisted Response & UI ]
                     (Interactive Citation Badges &
                       Evidence Inspector Drawer)
```

---

## 2. Ingestion Lifecycle & Idempotency

1. **Authentication & Authorization**: The server verifies the uploader's session and verifies membership in the target workspace.
2. **File Sanitization**: Files are validated against MIME type, byte header signatures, and a 25 MB ceiling. Control characters and zero-width injection tokens are stripped.
3. **Page-Preserving Parsing**: PDF and Markdown texts are extracted while maintaining simulated or native page boundaries (`page_number`).
4. **Deterministic Chunking**: Text is split recursively along Markdown headings (`#`, `##`), paragraph breaks (`\n\n`), and sentence boundaries (`.!?`). The target window is **512 tokens** with a **64-token overlap**.
5. **Embedding Generation**: Chunks are embedded in batches into 1536-dimensional unit vectors.
6. **Storage with pgvector**: Vectors and chunk metadata are inserted into `document_chunks`.
7. **Status Transition**: The document status transitions from `queued` → `extracting` → `chunking` → `indexing` → `ready`.

---

## 3. Cross-Tenant Security & Isolation

Multi-tenancy is enforced at three distinct layers:

1. **Application Layer**: All route handlers verify user session and call `verifyWorkspaceAccess(userId, workspaceId)` before initiating queries.
2. **Database Layer (RLS)**: Row-Level Security policies on `documents`, `document_chunks`, `conversations`, and `messages` check `public.has_workspace_access(workspace_id)`.
3. **Retrieval RPC (`match_document_chunks`)**: The vector search stored procedure executes with explicit `WHERE dc.workspace_id = filter_workspace_id`. Cross-workspace vector leakage is impossible even under approximate nearest neighbor (ANN) graph traversal.

---

## 4. Citation Validation Guarantee

To eliminate hallucinated citations:
- The model is instructed to output citations referencing supplied indices (`[1]`, `[2]`).
- The server extracts these indices and resolves them to the candidate chunk array.
- The server verifies:
  1. The cited chunk ID was in the retrieval set returned for this specific prompt.
  2. The chunk belongs to the authorized document and workspace.
  3. The rendered quote is derived directly from stored source text, not trusting arbitrary text generated by the model.
- Any citation that fails validation is rejected from the response before presentation.

---

## 5. Failure Modes & Graceful Fallbacks

| Failure Scenario | Mitigation Strategy |
| :--- | :--- |
| **No relevant documents found** | System explicitly outputs: *"The indexed documents do not contain sufficient evidence to answer this question."* No speculation permitted. |
| **Document upload failure** | Ingestion status set to `failed` with diagnostic error message. Partial chunks are cleaned up. |
| **API Provider outage** | Gracefully falls back to deterministic local synthesis or returns structured 503 error; message persistence remains atomic. |
| **Document deleted after chat** | Citation preview displays an *"Unavailable / Deleted Source"* badge rather than silently misdirecting. |

---

## 6. Dify-Powered Primary Engine Architecture (Option B)

Quellivox integrates **Dify** as its primary RAG workflow and vector indexing engine via a provider-independent server abstraction (`IRAGProvider`).

```
                    ┌────────────────────────────────────────────────────────┐
                    │            QUELLIVOX (System of Record)                │
                    │  • Auth & Session Security (Supabase SSR)              │
                    │  • Workspace Access Control & Tenancy                  │
                    │  • Private File Storage (Supabase Storage)             │
                    │  • Strict Citation Validation & Evidence Desk UI       │
                    └───────────────────────────┬────────────────────────────┘
                                                │ Server-Side Only
                                                │ (Bearer DIFY_DATASET_API_KEY)
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               DIFY KNOWLEDGE ENGINE                    │
                    │  • Document Text Extraction & Clean Splitting          │
                    │  • High-Quality Vector Embeddings                      │
                    │  • Asynchronous Ingestion & Batch Status Tracking      │
                    │  • Hybrid Semantic Retrieval (`/v1/datasets/retrieve`) │
                    └────────────────────────────────────────────────────────┘
```

### Core Architecture Principles:
1. **Zero Client Leakage**: Browser clients never receive Dify dataset IDs or API keys.
2. **Strict Tenant Isolation**: Each Quellivox Workspace maps 1:1 to an isolated Dify Knowledge Base (`dify_dataset_id`). All retrieval queries strictly scope to the authorized workspace dataset.
3. **Audited Lifecycle**:
   - `POST /v1/datasets/{id}/document/create-by-file`: Asynchronous upload returning `{ document.id, batch }`.
   - `GET /v1/datasets/{id}/documents/{batch}/indexing-status`: Status transitions mapped to Quellivox state machine (`queued` → `extracting` → `chunking` → `indexing` → `ready`).
   - `POST /v1/datasets/{id}/retrieve`: Workspace-isolated chunk retrieval.
   - `DELETE /v1/datasets/{id}/documents/{doc_id}`: Cascading deletion reconciling Dify index, Supabase Storage, and local database records.
4. **Citation Grounding**: Dify `retriever_resources` are cross-referenced with Quellivox's trusted document library; foreign or unmapped references are discarded before rendering.

