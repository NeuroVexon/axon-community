# AXON Roadmap — Hybrid Controls

> Feature-Request aus der Hacker News Community:
> *"Wie geht AXON mit Nacht-/Wochenend-Betrieb um, wenn niemand da ist um Aktionen zu genehmigen?"*

## Motivation

Agents laufen nicht nur waehrend der Arbeitszeit. Scheduled Tasks, Telegram-Trigger und automatische Workflows koennen jederzeit aktiv werden. Das aktuelle Approval-System setzt voraus, dass ein Mensch online ist. Hybrid Controls schliessen diese Luecke mit intelligenten Sicherheitsnetzen.

---

## 1. Rate-Limits pro Agent/Tool

**Problem:** Ein Agent koennte in einer Endlos-Schleife hunderte Tool-Aufrufe machen.

**Loesung:**

### Datenmodell
```python
class RateLimit(Base):
    __tablename__ = "rate_limits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True)  # None = global
    tool_name = Column(String(100), nullable=True)  # None = alle Tools
    max_calls = Column(Integer, nullable=False, default=50)
    window_seconds = Column(Integer, nullable=False, default=3600)  # 1 Stunde
    action_on_limit = Column(String(20), default="pause")  # pause, block, notify_only
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Logik
- Zaehler pro Agent+Tool in Redis/Memory (oder SQLite-basiert fuer Single-Node)
- Sliding Window: Zaehle Aufrufe der letzten N Sekunden via `audit_logs`
- Bei Ueberschreitung:
  - `pause` → Agent wird pausiert, Nutzer wird benachrichtigt
  - `block` → Tool-Aufruf wird abgelehnt, Agent laeuft weiter
  - `notify_only` → Tool laeuft, aber Warnung wird gesendet

### UI
- Settings-Seite: Rate-Limits pro Agent konfigurierbar
- Dashboard-Widget: Aktueller Verbrauch vs. Limit (Balken/Gauge)

### API Endpoints
```
GET    /api/v1/rate-limits              — Alle Limits auflisten
POST   /api/v1/rate-limits              — Neues Limit anlegen
PUT    /api/v1/rate-limits/{id}         — Limit aendern
DELETE /api/v1/rate-limits/{id}         — Limit entfernen
GET    /api/v1/rate-limits/usage        — Aktueller Verbrauch pro Agent/Tool
```

---

## 2. Budget-Caps

**Problem:** Cloud-API-Aufrufe (Claude, OpenAI, Gemini) kosten Geld. Ohne Limits kann ein Agent unkontrolliert Kosten verursachen.

**Loesung:**

### Datenmodell
```python
class BudgetCap(Base):
    __tablename__ = "budget_caps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scope = Column(String(20), nullable=False)  # global, agent, session
    scope_id = Column(String(36), nullable=True)  # agent_id oder session_id
    max_cost_usd = Column(Float, nullable=False, default=10.0)
    period = Column(String(20), default="daily")  # daily, weekly, monthly, session
    current_cost_usd = Column(Float, default=0.0)
    action_on_limit = Column(String(20), default="stop")  # stop, notify, downgrade
    reset_at = Column(DateTime, nullable=True)
    enabled = Column(Boolean, default=True)
```

### Kosten-Tracking
- Nach jedem LLM-Aufruf: Token-Count * Preis pro Token berechnen
- Preistabelle pro Provider/Modell (konfigurierbar in Settings)
- Kosten werden in `budget_usage` Tabelle aggregiert

### Aktionen bei Limit
- `stop` → Agent wird sofort gestoppt, Nachricht an User
- `notify` → Warnung senden, Agent laeuft weiter
- `downgrade` → Automatisch auf guenstigeres Modell wechseln (z.B. Claude → Ollama lokal)

### UI
- Dashboard: Kosten-Uebersicht pro Tag/Woche/Monat (Chart)
- Settings: Budget-Limits konfigurieren
- Alert-Banner wenn >80% des Budgets verbraucht

### API Endpoints
```
GET    /api/v1/budget                   — Budget-Status
POST   /api/v1/budget/caps              — Cap anlegen
PUT    /api/v1/budget/caps/{id}         — Cap aendern
GET    /api/v1/budget/usage             — Verbrauch (Timeline)
GET    /api/v1/budget/usage/{agent_id}  — Verbrauch pro Agent
```

---

## 3. Automatischer Rollback bei Anomalien

**Problem:** Ein Agent verhaelt sich ungewoehnlich — z.B. ploetzlich 100x `shell_execute` oder `file_write` in kurzer Zeit.

**Loesung:**

### Anomalie-Erkennung
```python
class AnomalyRule(Base):
    __tablename__ = "anomaly_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tool_name = Column(String(100), nullable=True)  # None = alle
    threshold_count = Column(Integer, nullable=False)  # z.B. 20
    window_seconds = Column(Integer, nullable=False)  # z.B. 300 (5 Min)
    baseline_multiplier = Column(Float, nullable=True)  # z.B. 5.0 = 5x ueber Normal
    action = Column(String(20), default="stop_and_rollback")  # stop, stop_and_rollback, notify
    notify_channels = Column(JSON, default=["web"])  # web, telegram, discord, email
    enabled = Column(Boolean, default=True)
```

### Rollback-Mechanismus
- Jeder Tool-Aufruf mit Seiteneffekt wird im Audit-Log mit `rollback_data` gespeichert:
  - `file_write` → vorheriger Dateiinhalt
  - `shell_execute` → kein automatischer Rollback (zu gefaehrlich), nur Stopp
  - `web_search` → kein Rollback noetig
- Bei Anomalie-Trigger:
  1. Agent sofort stoppen
  2. Letzte N Aktionen rueckgaengig machen (wo moeglich)
  3. Benachrichtigung ueber alle konfigurierten Kanaele
  4. Audit-Log Eintrag: `anomaly_detected`

### UI
- Monitoring-Dashboard: Anomalie-Timeline
- Alert-System: Push-Benachrichtigungen
- Rollback-History: Was wurde zurueckgerollt

### API Endpoints
```
GET    /api/v1/anomaly/rules            — Alle Regeln
POST   /api/v1/anomaly/rules            — Neue Regel
PUT    /api/v1/anomaly/rules/{id}       — Regel aendern
GET    /api/v1/anomaly/events           — Erkannte Anomalien
POST   /api/v1/anomaly/rollback/{id}    — Manueller Rollback
```

---

## 4. Auto-Rules basierend auf Audit-Trail

**Problem:** Admins sollen Regeln definieren koennen, die auf Muster im Audit-Trail reagieren — ohne Code zu schreiben.

**Loesung:**

### Datenmodell
```python
class AutoRule(Base):
    __tablename__ = "auto_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Trigger-Bedingung (JSON-basiert)
    trigger = Column(JSON, nullable=False)
    # Beispiel:
    # {
    #   "type": "count_threshold",
    #   "tool": "file_write",
    #   "count": 10,
    #   "window_minutes": 5,
    #   "agent_id": null  (null = alle)
    # }

    # Aktion
    action = Column(JSON, nullable=False)
    # Beispiel:
    # {
    #   "type": "auto_approve",
    #   "scope": "session",
    #   "notify": true
    # }
    # Oder:
    # {
    #   "type": "block_tool",
    #   "tool": "shell_execute",
    #   "duration_minutes": 60
    # }

    priority = Column(Integer, default=100)  # Niedrig = hoehere Prioritaet
    enabled = Column(Boolean, default=True)
    times_triggered = Column(Integer, default=0)
    last_triggered = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Regel-Typen

| Trigger | Beschreibung |
|---------|-------------|
| `count_threshold` | Wenn Tool X mehr als N-mal in M Minuten aufgerufen wird |
| `error_rate` | Wenn Fehlerrate ueber X% steigt |
| `time_based` | Nachts (22-06 Uhr) bestimmte Tools blockieren |
| `cost_threshold` | Wenn Kosten ueber X USD in Zeitraum |
| `pattern_match` | Wenn bestimmter Text in Tool-Parametern auftaucht |

| Aktion | Beschreibung |
|--------|-------------|
| `auto_approve` | Tool automatisch genehmigen (fuer bekannte sichere Muster) |
| `block_tool` | Tool fuer Zeitraum sperren |
| `pause_agent` | Agent pausieren |
| `notify` | Nur benachrichtigen |
| `downgrade_risk` | Risk-Level des Agents senken |
| `require_approval` | Approval erzwingen (auch fuer auto-approved Tools) |

### UI
- Rule-Builder: Visueller Editor (Trigger + Aktion auswaehlen)
- Rule-Log: Welche Regel hat wann gefeuert
- Templates: Vorgefertigte Regeln (z.B. "Nachtmodus", "Wochenend-Sicherheit")

### API Endpoints
```
GET    /api/v1/auto-rules               — Alle Regeln
POST   /api/v1/auto-rules               — Neue Regel
PUT    /api/v1/auto-rules/{id}          — Regel aendern
DELETE /api/v1/auto-rules/{id}          — Regel entfernen
GET    /api/v1/auto-rules/log           — Trigger-Historie
POST   /api/v1/auto-rules/test          — Regel trocken testen
```

---

## Implementierungs-Reihenfolge

| Prio | Feature | Aufwand | Abhaengigkeiten |
|------|---------|---------|-----------------|
| 1 | Rate-Limits | Mittel | Audit-Log (existiert) |
| 2 | Budget-Caps | Mittel | Token-Counting im LLM-Router |
| 3 | Anomalie-Erkennung | Hoch | Rate-Limits, Audit-Log |
| 4 | Auto-Rules | Hoch | Alle obigen Features |

### Phase 7a: Rate-Limits + Budget-Caps
- DB Models + Migrations
- Backend API Endpoints
- Enforcement im AgentOrchestrator
- Frontend: Settings UI + Dashboard Widgets

### Phase 7b: Anomalie-Erkennung + Auto-Rules
- Anomalie-Detection Engine
- Rollback-System (file_write History)
- Rule-Engine + Evaluator
- Frontend: Rule-Builder + Monitoring Dashboard
- Notification Integration (Telegram/Discord/E-Mail)

---

## Offene Design-Entscheidungen

1. **Zaehler-Backend**: SQLite-basiert (einfach) vs. Redis (performant)?
   → Empfehlung: SQLite fuer Single-Node, Redis als optionales Upgrade
2. **Token-Counting**: Exakt (API-Response) vs. Schaetzung (tiktoken)?
   → Empfehlung: API-Response wenn verfuegbar, tiktoken als Fallback
3. **Rollback-Tiefe**: Letzte N Aktionen vs. gesamte Session?
   → Empfehlung: Letzte 10 Aktionen, konfigurierbar
4. **Rule-Evaluation**: Synchron (vor Tool-Aufruf) vs. Asynchron (nach Audit-Write)?
   → Empfehlung: Synchron fuer Block-Regeln, Asynchron fuer Notify-Regeln
