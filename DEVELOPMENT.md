# DEVELOPMENT.md - Axon by NeuroVexon

> Entwicklerdokumentation. Lies diese Datei vollständig bevor du am Projekt arbeitest.

---

## 1. Projekt-Übersicht

**Name:** Axon by NeuroVexon - Community Edition
**Typ:** Open-Source Agentic AI mit kontrollierten Tool-Fähigkeiten
**Ziel:** Die sichere, kontrollierte Alternative für Agentic AI
**Tagline:** "Agentic AI - ohne Kontrollverlust."

### Mission

Kernfeature ist das **kontrollierte Agent-System**: Jede Tool-Aktion wird dem User zur
Genehmigung vorgelegt, geloggt und ist nachvollziehbar. DSGVO-konform, On-Premise möglich.

---

## 2. Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy + aiosqlite (SQLite)
- Pydantic

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons

**LLM:**
- Ollama (lokal)
- Claude API (Anthropic)
- OpenAI API

---

## 3. Projektstruktur

```
axon-community/
├── backend/
│   ├── main.py                    # FastAPI Entry Point
│   ├── api/
│   │   ├── chat.py                # Chat-Endpoints (send, stream, agent)
│   │   ├── audit.py               # Audit-Log Endpoints + CSV Export
│   │   ├── settings.py            # Settings CRUD + Health Check
│   │   ├── tools.py               # Tool-Approval + Permissions API
│   │   ├── agents.py              # Multi-Agent CRUD
│   │   ├── scheduler.py           # Scheduled Tasks API
│   │   ├── workflows.py           # Workflow-Chains API
│   │   ├── analytics.py           # Dashboard & Kosten-Tracking
│   │   ├── upload.py              # Dokument-Upload API
│   │   └── mcp.py                 # MCP-Server Endpoint
│   ├── agent/
│   │   ├── orchestrator.py        # ⭐ Agent-Loop: LLM → Tool → Approval → Execute → Feedback
│   │   ├── agent_manager.py       # Multi-Agent Verwaltung + Permissions
│   │   ├── tool_registry.py       # Tool-Definitionen + LLM-Format Conversion
│   │   ├── tool_handlers.py       # Konkrete Tool-Implementierungen
│   │   ├── permission_manager.py  # Session-basierte Permissions + Blocking
│   │   ├── audit_logger.py        # DB-basiertes Audit-Logging
│   │   ├── memory.py              # Persistentes Memory
│   │   ├── scheduler.py           # Task-Scheduler (APScheduler)
│   │   ├── workflows.py           # Workflow-Engine
│   │   ├── skills.py              # Skill-Manager
│   │   ├── skill_loader.py        # Skill-Discovery + Hash-Verification
│   │   └── document_handler.py    # Dokument-Extraktion + Context-Loading
│   ├── llm/
│   │   ├── provider.py            # Base Class + Datenmodelle
│   │   ├── router.py              # Provider-Routing + Runtime-Switching
│   │   ├── ollama.py              # Ollama Provider
│   │   ├── anthropic_provider.py   # Anthropic Claude Provider
│   │   └── openai_provider.py     # OpenAI Provider
│   ├── integrations/
│   │   ├── telegram.py            # Telegram Bot
│   │   ├── discord.py             # Discord Bot
│   │   └── email.py               # IMAP/SMTP Client
│   ├── mcp/
│   │   ├── server.py              # MCP-Server (SSE Transport)
│   │   └── protocol.py            # JSON-RPC 2.0 Nachrichtenformat
│   ├── sandbox/
│   │   ├── executor.py            # Docker-basierte Code-Sandbox
│   │   └── Dockerfile.sandbox     # Sandbox Container Image
│   ├── db/
│   │   ├── database.py            # Async Engine + Session Management
│   │   └── models.py              # Alle DB Models
│   └── core/
│       ├── config.py              # Pydantic Settings + Env-Config
│       └── security.py            # Path/URL/Shell Validation, Encryption, Rate Limiter
├── frontend/
│   └── src/
│       ├── App.tsx                # Root + Routing
│       ├── components/
│       │   ├── Chat/              # ChatContainer, MessageList, MessageInput, StreamingMessage
│       │   ├── Layout/            # Sidebar, Header, SettingsPanel
│       │   ├── Tools/             # ToolApprovalModal, ToolExecutionBadge
│       │   ├── Monitoring/        # AuditDashboard, AuditTable, AuditExport
│       │   ├── Dashboard/         # Dashboard, AgentStats, CostTracker, TaskOverview
│       │   ├── Agents/            # AgentList, AgentEditor
│       │   ├── Workflows/         # WorkflowList, WorkflowEditor, StepBuilder
│       │   └── Skills/            # SkillList, SkillReview
│       ├── hooks/                 # useChat, useToolApproval, useAudit, useAgents, useWorkflows
│       ├── services/api.ts        # API Client
│       └── types/index.ts         # TypeScript Definitionen
├── skills/                        # Community Skills (mit skill.yaml + handler.py)
├── docs/
├── docker-compose.yml
└── README.md
```

---

## 4. Code Standards

### Python
- Type Hints überall
- Async wo sinnvoll
- Pydantic für Schemas
- Keine print(), nur logging
- Security-Funktionen aus `core/security.py` nutzen — NICHT in Handlern reimplementieren

### TypeScript
- Functional Components mit Hooks
- Strict TypeScript
- Tailwind für Styling
- Deutsche UI-Texte

### Allgemein
- Englische Variablen/Funktionen
- Deutsche UI-Texte und Docs
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`)

---

## 5. Starten

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start
```

---

## 6. Branding

- **Primärfarbe:** Cyan `#00d4ff`
- **Hintergrund:** `#0a0a0a` (Dark)
- **Logo:** Futuristischer Rabe mit Cyan-Akzenten
- **Font Display:** Orbitron
- **Font Sans:** Space Grotesk
- **Font Mono:** JetBrains Mono
- **CSS-Variablen:** `nv-accent`, `nv-black`, `nv-black-lighter`, `nv-gray-light`, `nv-success`

---

## 7. Hinweise für Entwickler

- **Immer erst die betroffenen Dateien lesen** bevor du Änderungen machst
- **Keine Breaking Changes** an bestehenden API-Endpoints — neue Endpoints hinzufügen
- **Deutsche Kommentare** im Code sind OK, Variablen/Funktionen englisch
- **Audit-Trail für alles** — jede neue Aktion wird geloggt
- **Deutsche UI-Texte** für alle neuen Views
- **Verschlüsselung** für alle neuen Credentials — nutze `encrypt_value`/`decrypt_value` aus `security.py`
- `__pycache__` und `.pyc` nicht committen
- Bei Unsicherheit: Lieber fragen als kaputt machen
