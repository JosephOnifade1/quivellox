# Quivellox — The Evidence Desk

> **"Answers grounded in evidence."**  
> An enterprise-grade, evidence-first AI knowledge assistant combining semantic retrieval, pgvector cosine search, and strict citation validation.

---

## 1. Product Overview

Quivellox turns unorganized documents (PDF, Markdown, TXT) into a high-precision, searchable knowledge workspace. Rather than asking a general-purpose chatbot that hallucinates or references phantom documentation, Quivellox guarantees:

- **Verified Citations**: Every generated answer contains interactive numbered markers (`[1]`, `[2]`) linked to the exact underlying text passage, document title, and page number.
- **Evidence Inspector**: A side-by-side inspection drawer that reveals verbatim source excerpts and similarity scores without disrupting the reading flow.
- **Multi-Tenant Isolation**: Cryptographic workspace boundaries enforced at the database layer using Supabase Row-Level Security (RLS) and PostgreSQL vector search constraints.
- **Bespoke Editorial Visual Identity**: Built on the *"Evidence Desk"* design system featuring warm paper surfaces, dark ink modes, and electric citron accents.

---

## 2. Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom HSL/CSS tokens & custom editorial serif typography
- **Database & Storage**: [Supabase](https://supabase.com/) PostgreSQL with `pgvector` extension
- **Vector Search**: HNSW cosine similarity index (`vector_cosine_ops`)
- **Authentication**: Supabase Auth (Email/Password + Session Cookies via `@supabase/ssr`)
- **Testing**: Vitest with unit & integration security test suite
- **Icons**: Lucide React

---

## 3. System Architecture & Directory Structure

```
quivellox/
├── public/                 # Static assets, branding, and reviewer avatars
├── src/
│   ├── app/
│   │   ├── (app)/          # Authenticated workspace route group
│   │   │   └── app/
│   │   │       ├── page.tsx                  # Workspace overview dashboard
│   │   │       ├── ask/page.tsx              # Ask Quivellox (RAG conversation interface)
│   │   │       ├── knowledge/page.tsx        # Knowledge library & upload dropzone
│   │   │       ├── knowledge/[documentId]/   # Deep document detail & raw chunk inspector
│   │   │       ├── conversations/page.tsx    # Persisted research sessions
│   │   │       ├── activity/page.tsx         # Chronological audit & ingestion ledger
│   │   │       └── settings/                 # Profile & workspace hyperparameter tuning
│   │   ├── api/            # Server Route Handlers
│   │   │   ├── chat/route.ts                 # Retrieval + Answer synthesis
│   │   │   ├── documents/route.ts            # Document ingestion & management
│   │   │   ├── documents/[id]/route.ts       # Document details & chunks
│   │   │   ├── conversations/route.ts        # Conversation management
│   │   │   ├── activity/route.ts             # Workspace audit events
│   │   │   └── health/route.ts               # Safe system health metrics
│   │   ├── login/page.tsx  # Authentication & 1-Click Portfolio Demo login
│   │   ├── signup/page.tsx # Workspace registration
│   │   └── page.tsx        # Editorial landing page matching reference design
│   ├── components/
│   │   ├── layout/         # AppShell, Navbar, Sidebar
│   │   ├── rag/            # DocumentUploadModal
│   │   └── ui/             # Badge, Button, Logo, ThemeToggle
│   ├── lib/
│   │   ├── rag-store.ts    # In-memory persistence & demo document seed data
│   │   └── supabase/       # Browser, Server, Admin, and Middleware clients
│   ├── server/             # Modular Server-Side RAG Engine
│   │   ├── chunking/       # Deterministic text chunker with heading/overlap preservation
│   │   ├── documents/      # PDF, Markdown, and TXT parser & sanitization
│   │   ├── embeddings/     # OpenAI & unit-normalized vector providers
│   │   ├── retrieval/      # Workspace-scoped vector search & candidate ranking
│   │   ├── rag/            # Prompt context builder, generator, & citation validator
│   │   ├── ingestion/      # Durable document ingestion pipeline & cascading deletion
│   │   └── authorization/  # Tenant access control & cross-workspace defense
│   └── types/              # Domain models (Document, Chunk, Citation, Message)
├── supabase/
│   └── migrations/         # Full PostgreSQL DDL schema, RLS policies, & RPC functions
└── RAG_ARCHITECTURE.md     # In-depth 12-step technical RAG specification
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js >= 20.x
- `pnpm` >= 9.x

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
> **Note**: Quivellox includes a **zero-friction local development engine**. If Supabase or OpenAI credentials are not yet configured in `.env.local`, the application automatically runs in local deterministic mode with 4 pre-seeded documents (`DOC-001` through `DOC-004`) so you can test RAG retrieval, citations, and uploads immediately on localhost!

### Step 3: Run the Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Automated Test Suite

Run the full Vitest unit and security test suite:
```bash
pnpm run test
```

### Verified Test Cases:
- **Chunker Engine**: Preserves Markdown headers, sentence boundaries, applies 64-token overlap, rejects empty input.
- **Citation Validator**: Accepts valid chunk IDs, strictly rejects hallucinated/arbitrary chunk IDs, derives quotes from verified source content.
- **Cross-Tenant Security**: Proves Workspace A cannot retrieve chunks belonging to Workspace B under vector search.
- **Document Parser**: Validates file size limits (25MB), file types, and strips harmful control characters.

---

## 6. Supabase Database Deployment

To deploy to a live Supabase project:
1. Enable the `vector` extension in your Supabase dashboard or via SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Apply the migration file:
   ```bash
   npx supabase db push
   # Or execute the SQL in supabase/migrations/20250101000000_quivellox_core_schema.sql
   ```
3. Set your production environment variables in Vercel or your hosting environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

---

## 7. Portfolio Reviewer Smoke-Test Checklist

1. **Landing Page (`/`)**: Verify editorial design, layered desktop software preview, 4-column feature grid, 3-step workflow, and dark forest testimonial banner.
2. **One-Click Demo (`/login`)**: Click *"Enter as Lead Engineer (1-Click)"* to immediately access the authenticated workspace.
3. **Workspace Dashboard (`/app`)**: View live metrics (4 documents, 20 chunks, 39 pages), hybrid search status, and the ingestion audit ledger.
4. **Ask Quivellox (`/app/ask`)**:
   - Ask: *"What is the refund window and does it apply to digital products?"*
   - Verify answer references `[1]` and `[2]`.
   - Click citation badge `1` to open the **Evidence Inspector** panel showing the verbatim excerpt from `DOC-003` (Page 2) with an 82.4% similarity match.
5. **Knowledge Library (`/app/knowledge`)**:
   - View document rows with status badges (`Ready`).
   - Click on `Quivellox_System_Architecture_v2.4.pdf` to navigate to the **Document Detail Page** (`/app/knowledge/doc-001`) and inspect individual extracted chunks and token counts.
   - Drag and drop or browse a `.txt` or `.md` file to test live ingestion and chunking.
6. **Conversations (`/app/conversations`)**: Review past research dialogues with preserved citations.
7. **Audit Ledger (`/app/activity`)**: View chronological audit trail of document ingestion and executed queries.
