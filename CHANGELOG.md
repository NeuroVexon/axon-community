# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned
- Multi-user support with roles and permissions
- RAG / vector search over documents
- Voice Input/Output
- Mobile App (React Native)
- Plugin Marketplace

## [2.0.0] - 2026-02-17

### Added

- **Multi-Agent System** — Multiple agents with their own roles, permissions, and models
  - 3 default agents: Assistant (all tools), Research (web-focused), System (shell)
  - Per-agent: allowed tools, auto-approve list, risk level
  - Agent switcher in chat, agent editor in frontend
  - API: CRUD under `/api/v1/agents`

- **Scheduled Tasks** — Proactive tasks with cron and approval gate
  - APScheduler-based with cron expressions
  - Approval via Web/Telegram/Discord before execution
  - Security: Max 10 active tasks, 5min timeout, max 1/min
  - API: CRUD + manual run under `/api/v1/tasks`

- **Email Integration** — IMAP/SMTP with deliberate restrictions
  - Read: List unread, search, read individual emails
  - Send: Always with approval (shows recipient + text)
  - Deliberately NOT: delete, move, mark_as_read — Axon does not modify the inbox
  - Encrypted credentials in DB

- **Workflow Chains** — Multi-step processes with template variables
  - Steps with `{{variable}}` context passing
  - Trigger phrases for automatic activation
  - Approval modes: each_step / once_at_start / never
  - API: CRUD + Run + History under `/api/v1/workflows`

- **MCP Server** — Axon as a controlled tool provider for external AI clients
  - JSON-RPC 2.0 protocol (initialize, tools/list, tools/call)
  - SSE transport with Bearer Token Auth
  - Tool calls go through the Axon approval system
  - Compatible with Claude Desktop, Cursor, etc.
  - Endpoint: `GET /mcp/v1/sse`

- **Dashboard & Analytics** — Admin overview with key metrics
  - Overview: Conversations, Messages, Agents, Tool Calls, Approval Rate
  - Tool statistics: Usage, error rate, execution time
  - Timeline: 30-day history
  - Agent statistics
  - API under `/api/v1/analytics`

- **Code Sandbox** — Docker-based code execution
  - Network isolation (`--network none`)
  - Resource limits: 256MB RAM, 0.5 CPU, 60s timeout
  - Read-only filesystem, no host access
  - `code_execute` tool returned with risk_level: high

- **Document Upload** — Upload files and analyze them in chat
  - PDF (PyMuPDF), text, code, CSV, images
  - Max 10 MB, automatic text extraction
  - Context injection into agent prompt
  - Drag & drop in frontend
  - API: `POST /api/v1/upload`

- **CLI** — Terminal control for power users
  - SSE streaming with live text output
  - Tool approval directly in terminal
  - Interactive REPL mode with persistent session
  - Pipe support: `cat datei.txt | axon chat`
  - Commands: chat, agents, memory, config, status, version
  - Standalone HTTP client (typer + httpx + rich)
  - Cross-platform: Windows, macOS, Linux

- **6 LLM Providers** — Ollama, Claude, OpenAI, Gemini, Groq, OpenRouter
  - Runtime switching via Settings
  - Per-agent model configuration
  - Health check for all providers

- **i18n** — German + English in frontend and CLI

### Changed
- Agent orchestrator uses per-agent permissions and auto-approve
- Chat endpoint accepts `agent_id` parameter
- Frontend: Sidebar with Dashboard, Agents, Workflows, Skills, Schedule
- Telegram/Discord: `/agent` and `/agents` commands

### Security
- Docker sandbox: Network isolation, memory limits, read-only FS
- MCP server: Bearer Token Auth + Rate Limiting
- Email: No delete/move/mark — read and send only
- Scheduled tasks: Max 10, timeout 5min, audit trail
- Workflows: Stop on error, audit trail per step

## [1.1.0] - 2026-02-16

### Added
- **Persistent Memory** — AI remembers facts across conversations
  - Memory tools: `memory_save`, `memory_search`, `memory_delete`
  - Memory is automatically injected into the system prompt
  - Frontend: Memory view with search, categories, CRUD
  - API: Full CRUD endpoints under `/api/v1/memory`

- **Skills System** — Extensible capabilities with security gate
  - Plugin-based architecture (`backend/skills/`)
  - SHA-256 hash verification on every load
  - Automatic revocation on file changes
  - Frontend: Skills view with Approve/Toggle/Delete
  - 3 included skills: `summarize`, `word_count`, `json_formatter`
  - Documentation: [docs/SKILLS.md](docs/SKILLS.md)

- **Telegram Integration** — Bot with inline keyboard for tool approvals
  - SSE stream connection to the agent endpoint
  - User whitelist and session management
  - Commands: `/start`, `/new`, `/status`

- **Discord Integration** — Bot with button components for tool approvals
  - Embeds with color-coded risk level
  - Channel and user whitelist
  - Auto-timeout (120s) for pending approvals
  - Documentation: [docs/MESSENGER.md](docs/MESSENGER.md)

- **Agent Endpoint** — New SSE endpoint `/api/v1/chat/agent`
  - Uses AgentOrchestrator with tool approval loop
  - Frontend completely switched to agent streaming

- **Conversation History** — Last 50 messages are loaded
- **Conversation Sidebar** — History with clickable entries, delete button
- **ExamplePrompts** — Clickable, directly sends a message
- **Encrypted API Keys** — Fernet encryption in the SQLite DB

### Changed
- Frontend now exclusively uses the agent endpoint (SSE)
- Security functions centralized in `core/security.py`
- Tool handlers now use centralized validation functions

### Removed
- `code_execute` tool — RestrictedPython is not a secure sandbox
- `RestrictedPython` dependency

### Security
- Command chaining blocked (`&&`, `||`, `;`, `|`, backticks, `$()`)
- Path traversal protection via `validate_path()`
- SSRF protection via `validate_url()` (localhost, internal IPs, AWS IMDS)
- API keys encrypted in DB (Fernet)
- Skills: Hash-based security gate with auto-revocation
- 30+ security tests

## [1.0.0] - 2026-02-04

### Added
- **Chat Interface** - Modern React UI with streaming support
- **Multi-Provider LLM** - Support for Ollama, Claude API, and OpenAI API
- **Controlled Tools** - Tool system with explicit user approval
  - `file_read` - Read files
  - `file_write` - Write files (only to /outputs/)
  - `file_list` - List directories
  - `web_fetch` - Fetch URLs
  - `web_search` - Web search with DuckDuckGo
  - `shell_execute` - Shell commands (whitelist)
- **Tool Approval Modal** - UI for tool approvals with risk display
- **Permission Manager** - Session-based permissions
- **Audit Dashboard** - Complete logging of all tool executions
- **Audit Export** - CSV export for compliance
- **Docker Support** - One-command deployment with docker-compose
- **Dark Theme** - Modern dark UI with cyan accents

### Security
- Shell commands only via whitelist
- File write only to /outputs/ directory
- Audit trail for all actions

---

## Versioning

- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

## Links

- [GitHub Releases](https://github.com/NeuroVexon/axon-community/releases)
- [Documentation](https://github.com/NeuroVexon/axon-community/wiki)
