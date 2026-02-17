# Axon — Testing

Axon nutzt **pytest** mit pytest-asyncio fuer automatisierte Tests.

## Schnellstart

```bash
cd backend
pip install pytest pytest-asyncio
pytest tests/ -v
```

## Test-Kategorien

### Unit Tests (lokal ausfuehrbar, keine externen Dependencies)

| Datei | Tests | Beschreibung |
|-------|-------|-------------|
| `test_security.py` | 37 | Path-Traversal, SSRF, Shell-Injection, Encryption, Sanitization |
| `test_tools.py` | 9 | ToolRegistry, PermissionManager |
| `test_models.py` | 16 | Alle 11 DB-Models: Erstellung, Defaults, Beziehungen |
| `test_memory.py` | 18 | MemoryManager CRUD, Suche, Prompt-Building, Embedding-Serialisierung |
| `test_agents.py` | 25 | AgentManager CRUD, Defaults, Permissions, Risk-Levels |
| `test_embeddings.py` | 14 | Cosine Similarity, EmbeddingProvider Verhalten |
| `test_rate_limiter.py` | 7 | Rate Limiting: Limits, Fenster, Reset |
| `test_tool_handlers.py` | 36 | Alle Tool-Handler: Security, Parameter, Fehlerbehandlung |
| `test_orchestrator.py` | 28 | Agent-Loop: Approval-Flow, Auto-Approve, Permissions, Iterations, Audit |

### Integration Tests (Server-Dependencies erforderlich)

| Datei | Tests | Beschreibung |
|-------|-------|-------------|
| `test_api.py` | 5 | Health, Settings, Audit Endpoints |
| `test_api_extended.py` | 22 | Agents, Memory, Conversations, Analytics API |

Integration Tests werden automatisch uebersprungen wenn Dependencies fehlen (z.B. `apscheduler`).

**Gesamt: 230 Tests** (203 Unit + 27 Integration)

## Architektur

### Fixtures (`conftest.py`)

```python
# In-Memory SQLite fuer isolierte Tests
@pytest.fixture
async def db():
    # Erstellt temporaere DB, rollback nach jedem Test

# Mock fuer Ollama Embedding Provider
@pytest.fixture
def mock_embedding():
    # Verhindert Ollama-Abhaengigkeit in Tests

# FastAPI TestClient
@pytest.fixture
def client():
    # TestClient fuer API-Endpoint Tests
```

### Patterns

**Async DB Tests:**
```python
@pytest.mark.asyncio
async def test_create_memory(self, db, mock_embedding):
    manager = MemoryManager(db)
    mem = await manager.add("Key", "Value")
    assert mem.key == "Key"
```

**Security Tests (kein DB noetig):**
```python
def test_path_traversal_blocked(self):
    assert validate_path("../../etc/passwd") is False
```

**API Integration Tests:**
```python
def test_list_agents(self, client):
    response = client.get("/api/v1/agents")
    assert response.status_code == 200
```

## Was wird getestet?

### Security (OWASP Top 10)

- **Path Traversal** — `../../etc/passwd`, Windows-Pfade, sensitive Dateien (.env, .ssh, credentials)
- **SSRF** — localhost, 127.0.0.1, interne IPs (10.x, 172.x, 192.168.x), AWS IMDS (169.254.169.254), IPv6
- **Command Injection** — Chaining (`&&`, `||`, `;`, `|`), Substitution (`` ` ``, `$()`, `${}`), Whitelist
- **Encryption** — Fernet-Roundtrip, leere Werte, ungueltige Ciphertexts
- **Sanitization** — Dateinamen: Pfad-Separatoren, fuehrende Punkte, Null-Bytes, Laengenbegrenzung

### Agent System

- Default-Agents werden korrekt erstellt (Assistent, Recherche, System)
- CRUD: Erstellen, Lesen, Aktualisieren, Loeschen
- Default-Agent kann nicht geloescht werden
- Tool-Berechtigungen: `allowed_tools`, `auto_approve_tools`
- Risk-Level: low < medium < high < critical

### Memory System

- CRUD: Hinzufuegen, Lesen, Aktualisieren (Upsert), Loeschen
- Key/Content-Truncation bei Ueberschreitung
- ILIKE-Suche (Fallback ohne Embeddings)
- Case-insensitive Suche
- Prompt-Building: Markdown und Plain-Text Format
- Embedding-Serialisierung: float32 Roundtrip

### Rate Limiting

- Erlaubt Requests bis zum Limit
- Blockiert bei Ueberschreitung
- Verschiedene Keys sind unabhaengig
- Fenster-Ablauf: alte Requests zaehlen nicht
- Reset setzt Zaehler zurueck

### Tool Handlers

- **file_read**: Existierende Dateien, fehlende Parameter, Path-Traversal, sensitive Dateien blockiert
- **file_write**: Erstellen, korrekter Inhalt, fehlende Parameter, Path-Traversal sanitized
- **file_list**: Directory-Listing, Typ-Erkennung, blockierte Pfade
- **web_fetch**: SSRF-Schutz (localhost, interne IPs, AWS IMDS, Docker, file://)
- **shell_execute**: Command-Injection (&&, ||, ;, |, Backticks, $()-Substitution), Whitelist
- **memory_save/search/delete**: Parameter-Validierung, DB-Session-Check, CRUD

### Orchestrator (Agent-Loop)

- **Basic Flow**: Text-Antwort ohne Tools, leerer Content, LLM erhaelt Tool-Definitionen
- **Auto-Approve**: Tools mit `requires_approval=False` werden automatisch ausgefuehrt
- **Approval Flow**: Genehmigung, Ablehnung, `approval_id` und `risk_level` im Request
- **Session Permissions**: Zweiter Call ueberspringt Approval nach Session-Genehmigung
- **Agent Permissions**: Gesperrte Tools, Agent-Auto-Approve, Default-Agent erlaubt alles
- **Iterationen**: Max-Iterations-Warning, Custom Limits, Multi-Tool-Responses
- **Fehlerbehandlung**: ToolExecutionError, unerwartete Exceptions
- **Audit-Logging**: Tool-Requests, Ausfuehrungen, Ablehnungen, Fehler werden geloggt

### API Endpoints

- Health Check: `/` und `/health`
- Settings: App-Info, Provider-Status, API-Key-Maskierung
- Agents: CRUD, Default-Schutz
- Memory: CRUD, Suche
- Analytics: Overview-Statistiken

## CI

Tests laufen automatisch im CI-Workflow (`.github/workflows/ci.yml`):

```yaml
- name: Run tests
  run: |
    cd backend
    pytest tests/ -v || echo "No tests found yet"
```

## Tests auf dem Server ausfuehren

```bash
ssh root@78.46.106.190
cd /opt/axon/backend
pip3 install pytest pytest-asyncio
python3 -m pytest tests/ -v
```
