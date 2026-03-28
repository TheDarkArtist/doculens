# DocuLens AI

Enterprise document intelligence platform. Extracts, validates, and routes structured data from documents using AI with human-in-the-loop review.

**Built by [TDACorp](https://tdacorp.in)**

---

## What It Does

Upload any document (invoice, ID, medical record, contract) and DocuLens AI:

1. **Classifies** — auto-detects document type
2. **Extracts** — pulls structured data using AI (field-level confidence scores)
3. **Validates** — runs business rules, flags low-confidence fields
4. **Routes** — auto-approves high-confidence docs, sends the rest to human reviewers
5. **Logs** — every action recorded in a compliance-grade audit trail

## Key Features

- **6-stage async pipeline** — queue-based processing with real-time status updates
- **HITL review** — side-by-side PDF viewer with editable extracted fields
- **Field-level confidence** — auto-approve/review/flag thresholds per tenant
- **Hybrid search** — semantic + full-text across all extracted content
- **Multi-tenant** — isolated data, RBAC, API keys
- **Audit trail** — every touch logged with before/after values
- **Template system** — schema-driven extraction for any document type

## Tech Stack

Next.js 16, TypeScript, PostgreSQL + pgvector, BullMQ + Redis, OpenAI, MinIO/S3, Tailwind + shadcn/ui, Socket.io, Recharts

## Quick Start

```bash
# Prerequisites: Docker, Node 20+, pnpm

# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# 4. Set up database
pnpm db:push
pnpm db:seed

# 5. Start the app
pnpm dev          # Terminal 1: Next.js
pnpm worker:dev   # Terminal 2: BullMQ worker

# Open http://localhost:3000
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@meridian.demo | demo1234 |
| Reviewer | reviewer@meridian.demo | demo1234 |
| Viewer | viewer@meridian.demo | demo1234 |

## Documentation

- [PRD](docs/PRD.md) — Full product requirements
- [Architecture](docs/ARCHITECTURE.md) — System design and data flow
- [Decisions](DECISIONS.md) — Architecture decisions with rationale

## License

Proprietary. TDACorp Private Limited.
