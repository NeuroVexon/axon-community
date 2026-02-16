# CLAUDE.md - Axon by NeuroVexon

> Instruktionsdatei für Claude Code. Lies diese Datei vollständig bevor du am Projekt arbeitest.

---

## 1. Projekt-Übersicht

**Name:** Axon by NeuroVexon - Community Edition
**Typ:** Open-Source Agentic AI mit kontrollierten Tool-Fähigkeiten
**Ziel:** Die sichere, kontrollierte Alternative für Agentic AI (OpenClaw-Konkurrent)
**Tagline:** "Agentic AI - ohne Kontrollverlust."

### Mission

Axon ist ein **eigenständiges Produkt** — kein abgespeckter NeuroVexon Assistant.
Kernfeature ist das **kontrollierte Agent-System**: Jede Tool-Aktion wird dem User zur
Genehmigung vorgelegt, geloggt und ist nachvollziehbar. DSGVO-konform, On-Premise möglich.

### Abgrenzung zum NeuroVexon Assistant

| | AXON Community | NeuroVexon Assistant |
|---|---|---|
| Fokus | Agentic AI mit Tool-Kontrolle | RAG-basierte Dokumentenassistenz |
| Zielgruppe | Entwickler, Power-User, Community | B2B/B2G Enterprise (Sozialsektor, KMU) |
| Modell | Open Source (BSL 1.1) | Kommerzielles Produkt |
| Funktion | Funnel → NeuroVexon Brand Awareness | Umsatz |

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
│   │   ├── chat.py                # Chat-Endpoints (send, stream, conversations)
│   │   ├── audit.py               # Audit-Log Endpoints + CSV Export
│   │   ├── settings.py            # Settings CRUD + Health Check
│   │   └── tools.py               # Tool-Approval + Permissions API
│   ├── agent/
│   │   ├── orchestrator.py        # ⭐ Agent-Loop: LLM → Tool → Approval → Execute → Feedback
│   │   ├── tool_registry.py       # Tool-Definitionen + LLM-Format Conversion
│   │   ├── tool_handlers.py       # Konkrete Tool-Implementierungen
│   │   ├── permission_manager.py  # Session-basierte Permissions + Blocking
│   │   └── audit_logger.py        # DB-basiertes Audit-Logging
│   ├── llm/
│   │   ├── provider.py            # Base Class + Datenmodelle
│   │   ├── router.py              # Provider-Routing + Runtime-Switching
│   │   ├── ollama.py              # Ollama Provider
│   │   ├── claude.py              # Anthropic Claude Provider
│   │   └── openai_provider.py     # OpenAI Provider
│   ├── db/
│   │   ├── database.py            # Async Engine + Session Management
│   │   └── models.py              # Conversation, Message, AuditLog, Settings
│   └── core/
│       ├── config.py              # Pydantic Settings + Env-Config
│       └── security.py            # Path/URL/Shell Validation, Rate Limiter
├── frontend/
│   └── src/
│       ├── App.tsx                # Root + Settings View
│       ├── components/
│       │   ├── Chat/              # ChatContainer, MessageList, MessageInput, StreamingMessage
│       │   ├── Layout/            # Sidebar, Header, SettingsPanel
│       │   ├── Tools/             # ToolApprovalModal, ToolExecutionBadge
│       │   └── Monitoring/        # AuditDashboard, AuditTable, AuditExport
│       ├── hooks/                 # useChat, useToolApproval, useAudit
│       ├── services/api.ts        # API Client
│       └── types/index.ts         # TypeScript Definitionen
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

## 7. Aktuelle Aufgaben

> Priorisierte Aufgabenliste. Arbeite diese der Reihe nach ab.
> Jede Aufgabe ist eigenständig testbar. Mache nach jeder Aufgabe einen Commit.

---

### PHASE 1: Security Fixes (KRITISCH)

#### Aufgabe 1.1 — Security-Funktionen in Tool-Handlers verdrahten
**Datei:** `backend/agent/tool_handlers.py`, `backend/core/security.py`
**Problem:** `handle_file_read` hat eine eigene hardcodierte `blocked_paths`-Liste statt `validate_path()` aus `security.py` zu nutzen. `handle_shell_execute` reimplementiert die Whitelist-Prüfung statt `validate_shell_command()` zu nutzen. `handle_web_fetch` hat eigene URL-Checks statt `validate_url()`.
**Lösung:**
1. In `handle_file_read`: Ersetze den manuellen `blocked_paths`-Check durch `validate_path(path)` aus `core.security`
2. In `handle_shell_execute`: Ersetze die manuelle Whitelist-Prüfung durch `validate_shell_command(command)` aus `core.security`
3. In `handle_web_fetch`: Ersetze die manuelle `blocked_hosts`-Prüfung durch `validate_url(url)` aus `core.security`
4. In `handle_file_write`: Nutze `sanitize_filename()` aus `core.security` statt `Path(filename).name`
**Test:** Versuche Pfade wie `../../etc/passwd`, URLs wie `http://127.0.0.1`, und Commands wie `ls; rm -rf /` — alle müssen blockiert werden.

#### Aufgabe 1.2 — code_execute Tool entfernen
**Dateien:** `backend/agent/tool_registry.py`, `backend/agent/tool_handlers.py`, `README.md`, `docs/TOOLS.md`
**Problem:** RestrictedPython mit `exec()` ist keine sichere Sandbox. Mehrfach gebrochene Security-Boundary.
**Lösung:**
1. Entferne `code_execute` aus `_register_builtin_tools()` in `tool_registry.py`
2. Entferne `handle_code_execute` und den Eintrag in `execute_tool()` aus `tool_handlers.py`
3. Entferne `RestrictedPython` aus `requirements.txt`
4. Aktualisiere die Tool-Tabelle in `README.md` und `docs/TOOLS.md`
5. Füge einen Kommentar hinzu: `# code_execute: Entfernt in v1.0 — Docker-Sandbox geplant für v1.1`

#### Aufgabe 1.3 — API-Keys verschlüsselt speichern
**Dateien:** `backend/core/security.py`, `backend/api/settings.py`, `backend/api/chat.py`
**Problem:** `anthropic_api_key` und `openai_api_key` werden im Klartext in der SQLite DB gespeichert.
**Lösung:**
1. Füge `cryptography` zu `requirements.txt` hinzu
2. Implementiere in `security.py` zwei Funktionen: `encrypt_value(value: str, key: str) -> str` und `decrypt_value(encrypted: str, key: str) -> str` — nutze `cryptography.fernet` mit dem `SECRET_KEY`
3. In `settings.py` `update_settings`: Verschlüssele API-Keys vor dem Speichern
4. In `settings.py` `get_settings` und `chat.py` `load_settings_to_router`: Entschlüssele API-Keys nach dem Laden
**Test:** Prüfe die SQLite-DB direkt — Keys dürfen nicht lesbar sein.

**→ Nach Phase 1: Commit "fix: security hardening — validate functions, remove code_execute, encrypt API keys"**

---

### PHASE 2: Orchestrator verdrahten (KERN-FEATURE)

#### Aufgabe 2.1 — Konversationshistorie in Chat-Endpoints laden
**Datei:** `backend/api/chat.py`
**Problem:** Sowohl `send_message` als auch `stream_message` bauen nur `system_prompt + aktuelle Nachricht`. Vorherige Messages gehen verloren — das LLM hat keinen Konversationskontext.
**Lösung:**
1. In beiden Endpoints: Lade alle bisherigen Messages der `conversation_id` aus der DB (sortiert nach `created_at`)
2. Baue die `messages`-Liste korrekt: `[system_prompt] + alle gespeicherten Messages + neue User-Message`
3. Begrenze auf die letzten 50 Messages um Token-Limits zu respektieren
**Test:** Sende 3 Nachrichten in einer Session — die dritte Antwort muss Kontext aus den ersten beiden haben.

#### Aufgabe 2.2 — Neuen SSE-Endpoint für Agent-Loop erstellen
**Datei:** `backend/api/chat.py`
**Problem:** Die Chat-Endpoints rufen `provider.chat()` direkt auf und umgehen den `AgentOrchestrator` komplett. Das gesamte Tool-Approval-System wird nie getriggert.
**Lösung:**
1. Erstelle neuen Endpoint `POST /api/v1/chat/agent` als SSE-Stream
2. Dieser Endpoint nutzt `AgentOrchestrator.process_message()` statt direktem Provider-Aufruf
3. SSE-Events:
   - `{"type": "text", "content": "..."}` — LLM-Text (inkrementell)
   - `{"type": "tool_request", "tool": "...", "params": {...}, "description": "...", "risk_level": "...", "approval_id": "..."}` — Tool wartet auf Genehmigung
   - `{"type": "tool_result", "tool": "...", "result": "...", "execution_time_ms": N}` — Tool-Ergebnis
   - `{"type": "tool_rejected", "tool": "..."}` — Tool abgelehnt
   - `{"type": "tool_error", "tool": "...", "error": "..."}` — Tool-Fehler
   - `{"type": "done", "session_id": "..."}` — Fertig
4. Für die Approval-Callback: Nutze `permission_manager.create_approval_request()` und pausiere den Stream bis `/api/v1/tools/approve` aufgerufen wird (`asyncio.Event` oder `asyncio.Queue` pro Approval-ID)
5. Lade Konversationshistorie aus DB (wie in 2.1)
**Wichtig:** Der bestehende `/chat/send` und `/chat/stream` Endpoint bleibt erhalten (kein Breaking Change). Der neue `/chat/agent` Endpoint ist der primäre für das Frontend.

#### Aufgabe 2.3 — Frontend auf Agent-Endpoint umstellen
**Dateien:** `frontend/src/services/api.ts`, `frontend/src/hooks/useChat.ts`
**Problem:** `useChat` nutzt den Non-Streaming `/send` Endpoint. Die Agent-Loop und das Approval-System werden nie getriggert.
**Lösung:**
1. In `api.ts`: Neue Funktion `streamAgentMessage()` die `/api/v1/chat/agent` als SSE-Stream konsumiert
2. In `useChat.ts`:
   - Wechsle von `api.sendMessage()` auf `api.streamAgentMessage()`
   - Verarbeite SSE-Events:
     - `text` → Streaming-Anzeige mit `StreamingMessage`-Komponente
     - `tool_request` → `setPendingApproval()` — Approval-Modal öffnen
     - `tool_result` → Tool-Ergebnis in Chat anzeigen
     - `tool_rejected` → Status aktualisieren
     - `done` → Session-ID aktualisieren
   - Bei `tool_request`: Pausiere die Anzeige, zeige `ToolApprovalModal`, sende Entscheidung via `/api/v1/tools/approve`, Stream geht dann automatisch weiter
3. Nutze die `StreamingMessage`-Komponente für die LLM-Antwort (wird aktuell nie verwendet)
**Test:** Schicke "Lies die Datei README.md" — das Approval-Modal muss erscheinen. Nach Genehmigung muss das Ergebnis im Chat landen und das LLM darauf antworten.

**→ Nach Phase 2: Commit "feat: wire orchestrator — agent endpoint, conversation history, frontend SSE integration"**

---

### PHASE 3: UX Polish für GitHub-Launch

#### Aufgabe 3.1 — ExamplePrompts klickbar machen
**Datei:** `frontend/src/components/Chat/ChatContainer.tsx`
**Problem:** `ExamplePrompt`-Buttons haben keinen `onClick`-Handler — sie tun nichts.
**Lösung:**
1. Übergib `sendMessage` als Prop an `ExamplePrompt`
2. Bei Klick: `sendMessage(text)` aufrufen

#### Aufgabe 3.2 — Konversations-Sidebar mit History
**Dateien:** `frontend/src/components/Layout/Sidebar.tsx`, `frontend/src/App.tsx`
**Problem:** Die Sidebar zeigt keine gespeicherten Konversationen an.
**Lösung:**
1. In `Sidebar.tsx`: Lade Konversationen via `api.getConversations()` beim Mount
2. Zeige sie als klickbare Liste unter dem "Neuer Chat"-Button
3. Bei Klick: `onViewChange('chat')` + Session-ID setzen
4. Aktive Session hervorheben (Cyan-Akzent)
5. Delete-Button (Mülleimer-Icon) pro Konversation
6. Auto-Titel: Nutze die erste User-Nachricht als Titel (abgeschnitten auf 40 Zeichen)

#### Aufgabe 3.3 — .gitignore bereinigen
**Dateien:** `.gitignore`
**Problem:** Build-Artefakte und sensible Dateien könnten im Repository landen.
**Lösung:** Stelle sicher dass folgende Einträge in `.gitignore` sind:
```
frontend/dist/
frontend/node_modules/
backend/__pycache__/
backend/**/__pycache__/
*.pyc
backend/*.db
data/*.db
.env
outputs/
```
Danach: `git rm -r --cached frontend/dist/ data/ backend/axon.db` (falls tracked)

#### Aufgabe 3.4 — Basis-Tests für Security
**Datei:** `backend/tests/`
**Problem:** Keine Test-Coverage — vor allem die Security-Funktionen sind ungetestet.
**Lösung:**
1. `test_security.py`: Teste `validate_path`, `validate_url`, `validate_shell_command`, `sanitize_filename` mit bösartigen Inputs (Path Traversal, SSRF, Command Injection)
2. `test_tool_registry.py`: Teste Tool-Registrierung und `get_tools_for_llm()` Format
3. `test_api_health.py`: Teste `/health` und `/api/v1/settings` Endpoints mit `httpx.AsyncClient`
4. Nutze `pytest` + `pytest-asyncio` + `httpx`
**Ziel:** Mindestens die Security-Funktionen müssen getestet sein bevor wir auf GitHub veröffentlichen.

**→ Nach Phase 3: Commit "feat: UX polish — clickable prompts, conversation sidebar, tests, gitignore"**

---

## 8. Hinweise für Claude Code

- **Immer erst die betroffenen Dateien lesen** bevor du Änderungen machst
- **Keine Breaking Changes** an bestehenden API-Endpoints — neue Endpoints hinzufügen
- **Deutsche Kommentare** im Code sind OK, Variablen/Funktionen englisch
- **Nach jeder Phase:** `pytest` laufen lassen, Fehler fixen
- **Backup:** Vor Phase 2 einen Git-Commit machen
- **Kein Frontend-Build** nötig — der Dev-Server (`npm start`) reicht
- Die `__pycache__`-Ordner und `.pyc`-Dateien nicht committen
- Bei Unsicherheit: Lieber fragen als kaputt machen
