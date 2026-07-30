# Plum.ai — Complete Project Handoff Document

> **Prepared:** July 21, 2026  
> **Purpose:** Full context transfer for resuming development in a new Copilot/IDE session  
> **Repo:** `c:\Users\LENOVO L460\Documents\GitHub\Plum.ai`

---

## 1. Product Vision

**Plum.ai** is a production-ready **multi-tenant SaaS platform** that enables businesses to create, train, and deploy their own **AI Customer Support Agent** without writing any code.

### Core Value Proposition
- Business owners register → create a workspace → upload documents (PDF/DOCX/TXT/CSV/URL) → AI learns from them
- Customers interact with an embedded chat widget powered by RAG (Retrieval-Augmented Generation)
- If the AI can't answer, it auto-creates a support ticket for human handoff
- Business owners get analytics dashboards, conversation history, and deployment embed codes

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + Vite 8)          │
│  Login/Register → Dashboard → Workspace Layout           │
│  (Overview | KB | Analytics | Settings | Deploy)          │
│  + Public ChatPage (standalone widget)                    │
│  Tech: TailwindCSS 4, Recharts, Lucide, Axios            │
└────────────────────────┬─────────────────────────────────┘
                         │  REST + SSE (Server-Sent Events)
┌────────────────────────▼─────────────────────────────────┐
│                  BACKEND (FastAPI 0.111)                  │
│  Routers: auth | business | kb | chat | analytics        │
│  Auth: JWT (python-jose) + bcrypt (passlib)              │
│  Middleware: get_current_user dependency                   │
└──┬──────────────┬──────────────┬─────────────────────────┘
   │              │              │
   ▼              ▼              ▼
┌──────┐   ┌──────────┐   ┌─────────────────────────┐
│SQLite│   │ ChromaDB │   │ AI/RAG Pipeline          │
│(ORM) │   │ (Vectors)│   │ Parser → Chunker →       │
│      │   │ per-     │   │ Embeddings → VectorStore  │
│7 mdls│   │ tenant   │   │ → LLM Stream (OpenRouter/ │
│      │   │ isolated │   │   Gemma 4 31B/Mock)       │
└──────┘   └──────────┘   └─────────────────────────┘
```

---

## 3. Complete Directory Structure

```
Plum.ai/
├── .gitignore
├── README.md
├── HANDOFF.md                     ← THIS FILE
├── venv/                          # Python virtual environment (gitignored)
│
├── backend/
│   ├── main.py                    # FastAPI app entrypoint, CORS, routers
│   ├── requirements.txt           # Python dependencies
│   │
│   ├── api/                       # REST API route handlers
│   │   ├── auth.py                # POST /register, /login, /refresh
│   │   ├── business.py            # CRUD /businesses + logo upload
│   │   ├── kb.py                  # KB upload, URL ingest, list, delete
│   │   ├── chat.py                # Sessions, messages, SSE streaming
│   │   └── analytics.py           # Overview KPIs, timeline, top questions
│   │
│   ├── models/
│   │   └── models.py              # 7 SQLAlchemy models
│   │
│   ├── schemas/
│   │   └── schemas.py             # Pydantic request/response schemas
│   │
│   ├── auth/
│   │   ├── hash.py                # bcrypt password hashing
│   │   └── jwt.py                 # JWT create/decode (access + refresh)
│   │
│   ├── middleware/
│   │   └── auth.py                # get_current_user & superuser dependencies
│   │
│   ├── database/
│   │   └── session.py             # SQLAlchemy engine, SessionLocal, get_db
│   │
│   ├── ai/
│   │   ├── embeddings.py          # SentenceTransformer lazy-loaded engine
│   │   ├── vector_store.py        # ChromaDB wrapper (add/search/delete)
│   │   └── rag.py                 # RAG pipeline: retrieve → prompt → stream → ticket
│   │
│   ├── services/
│   │   ├── parser.py              # File parsers (PDF, DOCX, TXT, CSV, URL)
│   │   └── chunker.py             # Text splitter (800 chars, 150 overlap)
│   │
│   └── utils/
│       └── config.py              # Pydantic Settings (.env, defaults)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    │
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Routing, ProtectedRoute
        ├── App.css / index.css
        │
        ├── contexts/
        │   └── AuthContext.jsx     # login, register, logout, JWT decode
        │
        ├── services/
        │   └── api.js              # Axios + JWT interceptor + auto-refresh
        │
        ├── components/
        │   ├── Navbar.jsx
        │   └── Sidebar.jsx
        │
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── WorkspaceLayout.jsx
            ├── WorkspaceOverview.jsx
            ├── KnowledgeBase.jsx
            ├── Analytics.jsx
            ├── SettingsPage.jsx
            ├── DeployPage.jsx
            └── ChatPage.jsx
```

---

## 4. Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111.0 | Web framework |
| Uvicorn | 0.30.1 | ASGI server |
| SQLAlchemy | 2.0.31 | ORM |
| Alembic | 1.13.2 | Migrations (installed, NOT configured) |
| Pydantic | 2.8.2 | Data validation |
| pydantic-settings | 2.3.4 | Environment config |
| python-jose | 3.3.0 | JWT tokens |
| passlib[bcrypt] | 1.7.4 | Password hashing |
| chromadb | 0.5.4 | Vector database |
| sentence-transformers | 3.0.1 | Local embeddings (BAAI/bge-small-en-v1.5) |
| pypdf | 4.2.0 | PDF parsing |
| python-docx | 1.1.2 | DOCX parsing |
| requests | 2.32.3 | HTTP client |
| openai | 2.21.0 | OpenRouter API (Gemma 4 31B) |
| psycopg2-binary | 2.9.9 | PostgreSQL driver (installed, NOT default) |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2.7 | UI framework |
| react-router-dom | 7.18.1 | Client routing |
| Vite | 8.1.1 | Build tool |
| TailwindCSS | 4.3.2 | CSS framework |
| axios | 1.18.1 | HTTP client |
| @tanstack/react-query | 5.101.2 | Server state |
| recharts | 3.9.2 | Charts |
| lucide-react | 1.24.0 | Icons |

---

## 5. Environment Setup

### Prerequisites
- Python 3.11+, Node.js 18+
- OpenRouter API key (free tier available with Google Gemma 4 31B)

### Backend
```bash
cd Plum.ai
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt

# Create .env (optional, defaults work)
uvicorn backend.main:app --reload --port 8000
# Swagger docs: http://localhost:8000/docs
```

### Frontend
```bash
cd Plum.ai/frontend
npm install
npm run dev
# Dev server: http://localhost:5173
```

### ⚠️ CRITICAL: Add Vite proxy to `vite.config.js`:
```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

### .env File (project root)
```env
SECRET_KEY=your-production-secret-key
DATABASE_URL=sqlite:///./plum.db
CHROMA_PERSIST_DIRECTORY=./chroma_db
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 6. API Endpoints Reference

**Base URL:** `http://localhost:8000/api`

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | ❌ | Register → {access_token, refresh_token} |
| POST | /auth/login | ❌ | Login → {access_token, refresh_token} |
| POST | /auth/refresh | ❌ | Refresh access token |

### Businesses (`/api/businesses`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /businesses | ✅ | Create workspace |
| GET | /businesses | ✅ | List user's businesses |
| GET | /businesses/{id} | ✅ | Get business details |
| PUT | /businesses/{id} | ✅ | Update business config |
| DELETE | /businesses/{id} | ✅ | Delete business + data |
| POST | /businesses/{id}/logo | ✅ | Upload logo image |

### Knowledge Base (`/api/businesses/{id}/kb`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /kb/upload | ✅ | Upload file → background ingestion |
| POST | /kb/url | ✅ | Ingest URL → background crawl |
| GET | /kb/documents | ✅ | List KB documents |
| DELETE | /kb/documents/{doc_id} | ✅ | Delete document + vectors |

### Chat (`/api/chat`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /chat/sessions?business_id=X | ❌ | Create chat session (public) |
| GET | /chat/sessions/{id}/messages | ❌ | Get message history |
| POST | /chat/sessions/{id}/stream | ❌ | Send message → SSE AI response |

### Analytics (`/api/businesses/{id}/analytics`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /analytics/overview | ✅ | KPI dashboard metrics |
| GET | /analytics/timeline | ✅ | Conversation volume over time |
| GET | /analytics/top-questions | ✅ | Frequent customer queries |

---

## 7. Database Models (7 tables)

| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| **User** | id, email, hashed_password, full_name, is_active, is_superuser | → Business (1:N) |
| **Business** | id, name, description, logo_url, owner_id, system_prompt, working_hours, social_links | → Document, ChatSession, Ticket, Analytics (1:N each) |
| **Document** | id, business_id, filename, file_type, content_text, char_count, status | ← Business |
| **ChatSession** | id (UUID), business_id, customer_name, customer_email | → Message, Ticket, Analytics (1:N) |
| **Message** | id, session_id, sender, content, citations (JSON) | ← ChatSession |
| **Ticket** | id, business_id, session_id, customer_email, issue_description, status | ← Business, ChatSession |
| **Analytics** | id, business_id, session_id, response_time_seconds, customer_satisfaction | ← Business, ChatSession |

---

## 8. AI/RAG Pipeline

### Ingestion
```
File Upload → Parser (PDF/DOCX/TXT/CSV/URL) → Text Extraction
    → Chunker (800 chars, 150 overlap, sentence-boundary) → Embeddings (BAAI/bge-small-en-v1.5)
    → ChromaDB collection "business_{id}"
```

### Query
```
User Message → Embed Query → ChromaDB Top-4 Search → Confidence Check (distance < 1.3)
    → Build Prompt (system_prompt + context + last 5 messages)
    → Stream LLM (OpenRouter Gemma 4 31B → Mock fallback) → SSE chunks to frontend
    → If low confidence → Auto-create Ticket → Handoff notification in stream
```

### Key Parameters
- Embedding model: `BAAI/bge-small-en-v1.5`
- Chunk: 800 chars, 150 overlap
- RAG Top-K: 4 results
- Low confidence threshold: distance > 1.3
- LLM temperature: 0.3
- JWT: 60min access, 7 day refresh

---

## 9. Frontend Routes

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| / | Redirect → /dashboard | — | |
| /login | Login.jsx | ❌ | |
| /register | Register.jsx | ❌ | |
| /dashboard | Dashboard.jsx | ✅ | Business listing |
| /workspace/:id/overview | WorkspaceOverview.jsx | ✅ | |
| /workspace/:id/kb | KnowledgeBase.jsx | ✅ | Agent Builder |
| /workspace/:id/analytics | Analytics.jsx | ✅ | Recharts |
| /workspace/:id/settings | SettingsPage.jsx | ✅ | |
| /workspace/:id/deploy | DeployPage.jsx | ✅ | Embed code |
| /chat/:businessId | ChatPage.jsx | ❌ | Standalone widget, no Navbar |

---

## 10. Design System

- **Brand colors:** Purple palette (brand-50 `#f5f3ff` → brand-950 `#2c0b61`)
- **Dark mode:** bgDark `#0b0a0f`, panelDark `#121118`
- **Font:** Inter (Google Fonts)
- **Admin pages:** Dark slate background
- **Sidebar:** Light lavender (`#f7f5fa`)
- **Chat widget:** Standalone, branded

---

## 11. Stitch UI Designs (Reference)

Located at: `c:\Users\LENOVO L460\Downloads\stitch_plum.ai_enterprise_agent_platform\`

8 screens: analytics, dashboard, deployment, inbox, knowledge_base, management_flow, support_platform, enterprise

---

## 12. Completion Status

### ✅ Done (35 tasks, ~64%)
- Full backend: API, models, auth, RAG pipeline, vector store
- All 10 frontend pages + components + services
- 8 Stitch UI designs

### 🔴 Pending (20 tasks)

**HIGH:**
1. ~~LLM API key integration~~ ✅ (OpenRouter + Google Gemma 4 31B Free)
2. Vite proxy config fix
3. Inbox page (InboxPage.jsx — design exists in Stitch)
4. WebSocket for real-time chat
5. Email notifications
6. PostgreSQL migration

**MEDIUM:** Alembic migrations, URL scraping UI, cloud storage, rate limiting, user profile, team access, billing

**LOW:** Tests, CI/CD, Docker, landing page, themes, a11y, PWA, error boundaries

---

## 13. Known Issues

1. **Vite proxy NOT configured** — frontend API calls fail without it
2. **Sidebar Inbox links to `#inbox`** — not a real route
3. **Analytics returns mock data** when DB is empty (intentional for demo)
4. **BackgroundTasks for ingestion** — not production-scale (use Celery for prod)
5. **OpenRouter free tier** may have rate limits — monitor for 429 errors
6. **No `__init__.py` files** — run from project root with `uvicorn backend.main:app`
