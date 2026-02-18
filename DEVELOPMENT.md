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

## 7. Aktuelle Aufgaben — PHASE 5: AXON wird zum Ökosystem

> Phase 1–4 sind abgeschlossen. Phase 5 bringt AXON auf v2.0.
> Arbeite die Aufgaben der Reihe nach ab. Jede Aufgabe ist eigenständig testbar.
> Mache nach jeder Aufgabe einen Commit.

---

### Aufgabe 5.1 — Multi-Agent System

**Neue Dateien:** `backend/agent/agent_manager.py`, `backend/api/agents.py`
**Bestehende Dateien:** `backend/db/models.py`, `backend/agent/orchestrator.py`, `backend/api/chat.py`, `frontend/src/components/Chat/ChatContainer.tsx`

**Problem:** AXON hat nur einen einzigen Agent. Kein Weg verschiedene Rollen, Modelle oder Berechtigungen zu trennen.

**Lösung:**

1. Neues Model `Agent` in `models.py`:
   - `id` (UUID)
   - `name` (str, z.B. "Recherche", "Code", "Kommunikation")
   - `description` (str)
   - `system_prompt` (str — eigener System-Prompt pro Agent)
   - `model` (str, z.B. "ollama/mistral", "claude-sonnet" — kann pro Agent anders sein)
   - `allowed_skills` (JSON Array — welche Skills dieser Agent nutzen darf)
   - `allowed_tools` (JSON Array — welche Built-in Tools erlaubt sind)
   - `risk_level_max` (str: "low" / "medium" / "high" — maximales Risiko das der Agent ohne Approval ausführen darf)
   - `auto_approve_tools` (JSON Array — Tools die dieser Agent OHNE Approval nutzen darf, z.B. `["web_search"]` für den Recherche-Agent)
   - `enabled` (boolean)
   - `created_at`, `updated_at`

2. `agent_manager.py` — `AgentManager` Klasse:
   - `create_agent(name, description, system_prompt, model, ...)`
   - `get_agent(id)`
   - `list_agents()`
   - `update_agent(id, ...)`
   - `delete_agent(id)`
   - `get_default_agent()` — Fallback wenn kein Agent gewählt

3. Im `Orchestrator`: Erweiterung um `agent_id` Parameter
   - Lade Agent-Config (System-Prompt, Model, Permissions)
   - Nutze `agent.model` statt globaler Model-Einstellung
   - Prüfe bei Tool-Calls: Ist das Tool in `allowed_tools`? Ist das Risiko-Level ≤ `risk_level_max`?
   - Wenn Tool in `auto_approve_tools`: Überspringe Approval, logge trotzdem im Audit-Trail
   - Wenn Tool NICHT in `auto_approve_tools`: Normaler Approval-Flow

4. API-Endpoints in `api/agents.py`:
   - `GET /api/v1/agents` — Alle Agents auflisten
   - `POST /api/v1/agents` — Neuen Agent erstellen
   - `PUT /api/v1/agents/{id}` — Agent bearbeiten
   - `DELETE /api/v1/agents/{id}` — Agent löschen
   - `GET /api/v1/agents/{id}` — Agent Details

5. Im Chat-Endpoint (`/api/v1/chat/agent`): Neuer Parameter `agent_id`

6. Frontend:
   - Agent-Switcher Dropdown im Chat-Header
   - Neue "Agents"-View in der Sidebar: Liste, Erstellen/Bearbeiten/Löschen
   - Agent-Editor: Formular für Name, Beschreibung, System-Prompt, Model, erlaubte Tools, Risiko-Level, Auto-Approve Tools

7. Telegram/Discord: `/agent <n>` zum Wechseln, `/agents` zum Auflisten

8. 3 Default-Agents:
   - **Assistent** (Default): Alle Tools, alle Skills, Approval für alles
   - **Recherche**: Nur `web_search`, `web_fetch`, `file_read` — `web_search` auto-approved
   - **System**: Alle Tools inkl. `shell_execute` — alles braucht Approval, `risk_level_max: high`

**Test:** Recherche-Agent: "Suche nach Python Tutorials" → `web_search` ohne Approval. "Lies config.py" → Approval. System-Agent: "Führe `ls -la` aus" → High-Risk Approval.

**Commit:** `feat: multi-agent system with per-agent permissions and auto-approve`

---

### Aufgabe 5.2 — Proaktive Aufgaben mit Approval-Gate (Scheduled Tasks)

**Neue Dateien:** `backend/agent/scheduler.py`, `backend/api/scheduler.py`
**Bestehende Dateien:** `backend/db/models.py`, `backend/agent/orchestrator.py`, `backend/integrations/telegram.py`, `backend/integrations/discord.py`, `backend/main.py`

**Problem:** AXON ist nur reaktiv. Proaktive Tasks fehlen.

**Lösung:**

1. Neues Model `ScheduledTask` in `models.py`:
   - `id` (UUID), `name`, `cron_expression`, `agent_id` (FK), `prompt`, `approval_required` (boolean), `notification_channel` ("web"/"telegram"/"discord"), `max_retries` (default 1), `last_run`, `last_result`, `next_run`, `enabled`, `created_at`

2. `scheduler.py` — `TaskScheduler` Klasse (nutze `APScheduler`):
   - `start()`, `add_task()`, `remove_task()`, `execute_task()`
   - Bei `approval_required=true`: Sende Approval-Nachricht über Notification-Channel, Timeout 30 Min
   - **Sicherheit:** Max 1/min pro Task, max 10 aktive Tasks, Timeout 5 Min, Fehler im Audit-Log

3. In `main.py`: Scheduler beim Startup starten

4. API: `GET/POST/PUT/DELETE /api/v1/tasks`, `POST /tasks/{id}/run`, `POST /tasks/{id}/toggle`

5. Frontend: "Zeitplan"-View mit Task-Liste, Editor (Cron-Vorlagen-Dropdown), manueller Run-Button

6. Telegram/Discord: Inline-Buttons ("Ausführen" / "Überspringen" / "Deaktivieren")

**Test:** Task erstellen, manuell triggern, Telegram-Approval, Ergebnis prüfen.

**Commit:** `feat: scheduled tasks with cron, approval-gate, and safety limits`

---

### Aufgabe 5.3 — E-Mail Integration (IMAP/SMTP)

**Neue Dateien:** `backend/integrations/email.py`, `skills/email_inbox/skill.yaml`, `skills/email_inbox/handler.py`, `skills/email_send/skill.yaml`, `skills/email_send/handler.py`
**Bestehende Dateien:** `backend/core/config.py`, `backend/core/security.py`, `backend/api/settings.py`

**Problem:** E-Mail ist die Killer-App. AXON macht E-Mail kontrolliert.

**Lösung:**

1. Config: `EMAIL_ENABLED`, `IMAP_HOST/PORT/USER/PASSWORD` (verschlüsselt), `SMTP_HOST/PORT/USER/PASSWORD/FROM`

2. `EmailClient`: `connect_imap()`, `list_unread()`, `read_email()`, `search_emails()`, `send_email()`
   - **BEWUSST NICHT:** `delete_email`, `move_email`, `mark_as_read`
   - Kommentar: `# Bewusst nicht implementiert. AXON verändert den Posteingang nicht.`

3. Als Skills: `email_inbox` (risk: medium, Approval), `email_send` (risk: high, IMMER Approval, zeigt Empfänger+Betreff+Text)

4. Settings-UI: E-Mail Config + "Verbindung testen"

**Test:** "Habe ich ungelesene Mails?" → Approval → Liste. "Schreib Antwort an Max" → Approval zeigt E-Mail-Text.

**Commit:** `feat: email integration (IMAP/SMTP) with read-only inbox and approval-gated sending`

---

### Aufgabe 5.4 — Workflow-Chains

**Neue Dateien:** `backend/agent/workflows.py`, `backend/api/workflows.py`
**Bestehende Dateien:** `backend/db/models.py`, `backend/agent/orchestrator.py`

**Problem:** Einzelne Tool-Calls sind limitiert. Workflows fehlen.

**Lösung:**

1. Model `Workflow`: `id`, `name`, `description`, `trigger_phrase`, `agent_id`, `steps` (JSON Array mit `order`, `prompt`, `store_as`), `approval_mode` ("each_step"/"once_at_start"/"never"), `enabled`

2. `WorkflowEngine`:
   - `execute_workflow()`: Steps sequentiell, Template-Variablen `{{variable}}` aus Context, Fehler = Stopp + Audit
   - `detect_trigger(message)`: Prüfe auf Trigger-Phrase

3. Im Orchestrator: Vor LLM-Call Trigger-Check

4. API: CRUD + `/run` + `/history`

5. Frontend: Workflow-Editor mit Step-Builder, Approval-Mode, "Jetzt testen"

6. 2 Beispiele: **Tagesstart** (E-Mails → Dateien → Übersicht), **Web-Recherche** (URL → Zusammenfassung → Markdown)

**Test:** "Wochenbericht" → Plan wird angezeigt → Genehmigen → Steps laufen durch.

**Commit:** `feat: workflow chains with step variables, trigger phrases, and approval modes`

---

### Aufgabe 5.5 — MCP-Server Kompatibilität

**Neue Dateien:** `backend/mcp/server.py`, `backend/mcp/protocol.py`, `backend/api/mcp.py`
**Bestehende Dateien:** `backend/agent/tool_registry.py`, `backend/agent/permission_manager.py`

**Problem:** MCP ist der offene Standard von Anthropic. AXON als MCP-Server = **Sicherheits-Layer für andere AI-Tools**. Kein anderer Agent bietet das.

**Lösung:**

1. MCP-Protokoll (JSON-RPC 2.0): `initialize`, `tools/list`, `tools/call` (mit Approval!), `resources/list`

2. `protocol.py`: Request/Response Format, Schema-Konvertierung AXON ↔ MCP

3. `MCPServer`: SSE-Transport, Approval über Telegram/Discord/Web-UI, Audit-Trail

4. Endpoint: `GET /mcp/v1/sse` mit Bearer Token Auth + Rate Limiting

5. Config: `MCP_ENABLED=false`, `MCP_AUTH_TOKEN`

6. Docs: `docs/MCP.md` — Setup für Claude Desktop, Cursor, etc.

**Test:** Claude Desktop + AXON MCP-Server → "Lies README.md" → Approval auf Telegram → Claude Desktop hat den Inhalt.

**Commit:** `feat: MCP server — AXON as controlled tool provider for external AI clients`

---

### Aufgabe 5.6 — Dashboard & Analytics

**Neue Dateien:** `frontend/src/components/Dashboard/Dashboard.tsx`, `AgentStats.tsx`, `CostTracker.tsx`, `TaskOverview.tsx`, `backend/api/analytics.py`
**Bestehende Dateien:** `backend/db/models.py`, `frontend/src/App.tsx`

**Problem:** Admins brauchen Überblick — nicht nur Logs.

**Lösung:**

1. API `analytics.py`:
   - `/overview`: Agents, Conversations, Tool-Calls, Approval-Rate, Tasks
   - `/costs`: Token-Verbrauch pro Provider/Agent/Zeitraum
   - `/tools`: Meistgenutzte Tools, Fehlerrate, Ausführungszeit
   - `/timeline`: 30-Tage Verlauf

2. Token-Tracking: `prompt_tokens` + `completion_tokens` in `Message`-Model

3. Dashboard: Stat-Cards, Liniendiagramm (Recharts), Balkendiagramm, Agent-Übersicht, Task-Status

4. Dashboard als Standard-View in Sidebar

**Test:** 10 Conversations → Dashboard → Statistiken korrekt, Kosten = 0 für Ollama.

**Commit:** `feat: dashboard with analytics, cost tracking, and agent overview`

---

### Aufgabe 5.7 — Code-Sandbox (Docker)

**Neue Dateien:** `backend/sandbox/executor.py`, `backend/sandbox/Dockerfile.sandbox`
**Bestehende Dateien:** `backend/agent/tool_registry.py`, `backend/agent/tool_handlers.py`, `docker-compose.yml`

**Problem:** `code_execute` wurde in Phase 1 entfernt (RestrictedPython unsicher). Code-Ausführung ist aber ein Kern-Feature. Lösung: Docker-basierte Sandbox.

**Lösung:**

1. `Dockerfile.sandbox`:
   ```dockerfile
   FROM python:3.11-slim
   RUN useradd -m -s /bin/bash sandbox
   RUN pip install --no-cache-dir numpy pandas requests matplotlib
   USER sandbox
   WORKDIR /home/sandbox
   ```

2. `SandboxExecutor`:
   - `execute_code(code, language="python", timeout=30)`:
     - Docker-Container: `--network none`, `--memory 256m`, `--cpus 0.5`, `--read-only`, `--rm`
     - Capture stdout/stderr/exit_code/execution_time
   - `execute_bash(command, timeout=10)`: Gleiche Isolation
   - **Sicherheit:** Max 60s Timeout, max 10.000 Zeichen Output, max 3 gleichzeitige Container, kein Host-Filesystem, Fork-Bomb Detection

3. `code_execute` Tool zurück in `ToolRegistry`: `risk_level: high`, IMMER Approval, zeigt Code im Modal

4. `docker-compose.yml`: Sandbox-Image als Build-Target

5. Config: `SANDBOX_ENABLED=false`, `SANDBOX_TIMEOUT=30`, `SANDBOX_MEMORY=256m`

**Test:** "Berechne Fibonacci in Python" → Approval zeigt Code → Ergebnis im Chat. "HTTP-Anfrage an google.com" → Fehlschlag (kein Netzwerk).

**Commit:** `feat: docker-based code sandbox with network isolation and resource limits`

---

### Aufgabe 5.8 — Dokument-Upload & Chat

**Neue Dateien:** `backend/api/upload.py`, `backend/agent/document_handler.py`
**Bestehende Dateien:** `backend/db/models.py`, `backend/agent/orchestrator.py`, `frontend/src/components/Chat/MessageInput.tsx`, `frontend/src/hooks/useChat.ts`

**Problem:** User können keine Dateien hochladen und darüber chatten. Kein RAG nötig — einfaches Context-Loading.

**Lösung:**

1. Model `UploadedDocument`: `id`, `conversation_id`, `filename`, `mime_type`, `file_size`, `extracted_text`, `file_path`, `created_at`

2. API `upload.py`:
   - `POST /api/v1/upload` (multipart, max 10 MB)
   - Erlaubte Typen: `.pdf`, `.txt`, `.md`, `.csv`, `.json`, `.py`, `.js`, `.ts`, `.html`, `.xml`, `.yaml`, `.png`, `.jpg`, `.jpeg`
   - Speichere in `data/uploads/{conversation_id}/`

3. `DocumentHandler`:
   - `extract_text(file_path, mime_type)`:
     - PDF: `pymupdf` (fitz)
     - Text/Code: UTF-8
     - CSV: Tabelle (erste 100 Zeilen)
     - Bilder: Base64 für Claude Vision ODER Tesseract OCR
   - `truncate_text(text, max_tokens=4000)`
   - `format_for_context(document)`: Formatierter Context-Block

4. Im Orchestrator: Dokumente der Session als Context zwischen System-Prompt und Chat-History laden. Bei Bildern + Claude: Vision-API nutzen.

5. Frontend `MessageInput.tsx`:
   - Büroklammer-Icon + Drag & Drop
   - Upload-Progress, Datei-Badge (mit X zum Entfernen)
   - Max 5 Dateien pro Nachricht

6. Frontend `MessageList.tsx`:
   - Attachment-Cards (Dateiname, Icon, Größe)
   - Bild-Thumbnails

7. Config: `UPLOAD_ENABLED=true`, `UPLOAD_MAX_SIZE_MB=10`, `UPLOAD_DIR=data/uploads`

**Test:** PDF hochladen → "Fasse zusammen" → Agent fasst zusammen. Python-File → "Bugs?" → Analyse. Bild + Claude → "Was siehst du?" → Beschreibung.

**Commit:** `feat: document upload with PDF/image/code extraction and context injection`

---

## Reihenfolge

5.1 (Multi-Agent) → 5.2 (Scheduled Tasks) → 5.3 (E-Mail) → 5.4 (Workflows) → 5.5 (MCP-Server) → 5.6 (Dashboard) → 5.7 (Code-Sandbox) → 5.8 (Dokument-Upload)

---

## 8. Hinweise für Claude Code

- **Immer erst die betroffenen Dateien lesen** bevor du Änderungen machst
- **Keine Breaking Changes** an bestehenden API-Endpoints — neue Endpoints hinzufügen
- **Deutsche Kommentare** im Code sind OK, Variablen/Funktionen englisch
- **Nach jeder Aufgabe:** `pytest` laufen lassen, Fehler fixen
- **Audit-Trail für alles** — jede neue Aktion wird geloggt
- **Deutsche UI-Texte** für alle neuen Views
- **Verschlüsselung** für alle neuen Credentials — nutze `encrypt_value`/`decrypt_value` aus `security.py`
- **Safety First:** Scheduled Tasks: max 10, Timeout 5min, max 1/min. Workflows: stoppen bei Fehler. E-Mail: kein Delete/Move/Mark. MCP: Rate Limiting + Auth. Sandbox: kein Netzwerk, Memory-Limit.
- `__pycache__` und `.pyc` nicht committen
- Bei Unsicherheit: Lieber fragen als kaputt machen

**Gesamter Commit nach Phase 5:** `feat: v2.0.0 — multi-agent, scheduler, email, workflows, MCP server, dashboard, code sandbox, document upload`
