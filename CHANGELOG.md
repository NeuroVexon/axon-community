# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Geplant
- Multi-User Support
- RAG / Dokumentenverarbeitung
- Voice Input/Output
- Docker-Sandbox für Skills und Code-Execution
- Mobile App

## [1.1.0] - 2026-02-16

### Added
- **Persistentes Memory** — KI merkt sich Fakten über Konversationen hinweg
  - Memory-Tools: `memory_save`, `memory_search`, `memory_delete`
  - Memory wird automatisch in den System-Prompt injiziert
  - Frontend: Gedächtnis-View mit Suche, Kategorien, CRUD
  - API: Vollständige CRUD-Endpoints unter `/api/v1/memory`

- **Skills System** — Erweiterbare Fähigkeiten mit Sicherheits-Gate
  - Plugin-basierte Architektur (`backend/skills/`)
  - SHA-256 Hash-Prüfung bei jedem Laden
  - Automatische Revocation bei Dateiänderungen
  - Frontend: Skills-View mit Approve/Toggle/Delete
  - 3 mitgelieferte Skills: `summarize`, `word_count`, `json_formatter`
  - Dokumentation: [docs/SKILLS.md](docs/SKILLS.md)

- **Telegram Integration** — Bot mit Inline-Keyboard für Tool-Approvals
  - SSE-Stream Anbindung an den Agent-Endpoint
  - User-Whitelist und Session-Management
  - Befehle: `/start`, `/new`, `/status`

- **Discord Integration** — Bot mit Button-Components für Tool-Approvals
  - Embeds mit farbcodiertem Risiko-Level
  - Channel- und User-Whitelist
  - Auto-Timeout (120s) für ausstehende Approvals
  - Dokumentation: [docs/MESSENGER.md](docs/MESSENGER.md)

- **Agent-Endpoint** — Neuer SSE-Endpoint `/api/v1/chat/agent`
  - Nutzt AgentOrchestrator mit Tool-Approval Loop
  - Frontend komplett auf Agent-Streaming umgestellt

- **Konversationshistorie** — Letzte 50 Messages werden geladen
- **Konversations-Sidebar** — History mit klickbaren Einträgen, Delete-Button
- **ExamplePrompts** — Klickbar, senden direkt eine Nachricht
- **Verschlüsselte API-Keys** — Fernet-Verschlüsselung in der SQLite DB

### Changed
- Frontend nutzt jetzt ausschließlich den Agent-Endpoint (SSE)
- Security-Funktionen zentralisiert in `core/security.py`
- Tool-Handlers nutzen jetzt zentrale Validierungsfunktionen

### Removed
- `code_execute` Tool — RestrictedPython ist keine sichere Sandbox
- `RestrictedPython` Dependency

### Security
- Command-Chaining blockiert (`&&`, `||`, `;`, `|`, Backticks, `$()`)
- Path-Traversal Schutz über `validate_path()`
- SSRF-Schutz über `validate_url()` (localhost, interne IPs, AWS IMDS)
- API-Keys verschlüsselt in DB (Fernet)
- Skills: Hash-basiertes Sicherheits-Gate mit Auto-Revocation
- 30+ Security-Tests

## [1.0.0] - 2026-02-04

### Added
- **Chat Interface** - Modernes React UI mit Streaming-Support
- **Multi-Provider LLM** - Unterstützung für Ollama, Claude API und OpenAI API
- **Controlled Tools** - Tool-System mit expliziter Benutzer-Genehmigung
  - `file_read` - Dateien lesen
  - `file_write` - Dateien schreiben (nur in /outputs/)
  - `file_list` - Verzeichnisse auflisten
  - `web_fetch` - URLs abrufen
  - `web_search` - Web-Suche mit DuckDuckGo
  - `shell_execute` - Shell-Commands (Whitelist)
- **Tool Approval Modal** - UI für Tool-Genehmigungen mit Risiko-Anzeige
- **Permission Manager** - Session-basierte Berechtigungen
- **Audit Dashboard** - Vollständiges Logging aller Tool-Ausführungen
- **Audit Export** - CSV-Export für Compliance
- **Docker Support** - One-Command Deployment mit docker-compose
- **Dark Theme** - Modernes Dark UI mit Cyan-Akzenten

### Security
- Shell-Commands nur über Whitelist
- File-Write nur in /outputs/ Verzeichnis
- Audit-Trail für alle Aktionen

---

## Versioning

- **MAJOR**: Inkompatible API-Änderungen
- **MINOR**: Neue Features (abwärtskompatibel)
- **PATCH**: Bug Fixes (abwärtskompatibel)

## Links

- [GitHub Releases](https://github.com/neurovexon/axon-community/releases)
- [Dokumentation](https://github.com/neurovexon/axon-community/wiki)
