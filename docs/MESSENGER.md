# Messenger Integration

Axon kann über Telegram und Discord gesteuert werden. Die Tool-Approvals werden über Inline-Keyboards (Telegram) bzw. Button-Components (Discord) abgewickelt.

## Architektur

```
Telegram/Discord User
        │
        ▼
  Messenger Bot (Python)
        │
        ▼
  Axon Backend (localhost:8000)
        │
        ├── /api/v1/chat/agent (SSE Stream)
        └── /api/v1/chat/approve/{id} (Tool-Approval)
```

Die Bots verbinden sich **lokal** mit dem Axon-Backend. Kein zusätzlicher Exposed Port nötig.

## Telegram

### Voraussetzungen

1. Bot bei [@BotFather](https://t.me/BotFather) erstellen
2. Token in `.env` eintragen
3. `python-telegram-bot` installiert (in requirements.txt enthalten)

### Konfiguration

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrstUVWxyz
TELEGRAM_ALLOWED_USERS=123456789,987654321
```

- `TELEGRAM_BOT_TOKEN`: Token vom BotFather
- `TELEGRAM_ALLOWED_USERS`: Komma-getrennte Telegram User-IDs (leer = alle erlaubt)

### Starten

```bash
cd backend
python -m integrations.telegram
```

### Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `/start` | Begrüßung und Hilfe |
| `/new` | Neuen Chat starten |
| `/status` | Aktuelle Session-Info |

### Tool-Approvals

Wenn ein Tool ausgeführt werden soll, erscheint eine Nachricht mit drei Buttons:

- **Erlauben** — Einmalig für diesen Call
- **Session** — Für die gesamte Chat-Session
- **Ablehnen** — Tool wird nicht ausgeführt

## Discord

### Voraussetzungen

1. Bot in der [Discord Developer Console](https://discord.com/developers/applications) erstellen
2. Bot-Berechtigungen: `Send Messages`, `Read Message History`, `Message Content Intent`
3. Token in `.env` eintragen
4. `discord.py` installiert (in requirements.txt enthalten)

### Konfiguration

```env
DISCORD_BOT_TOKEN=MTIz...
DISCORD_ALLOWED_CHANNELS=123456789012345678
DISCORD_ALLOWED_USERS=123456789012345678
```

- `DISCORD_BOT_TOKEN`: Bot-Token aus der Developer Console
- `DISCORD_ALLOWED_CHANNELS`: Komma-getrennte Channel-IDs (leer = alle)
- `DISCORD_ALLOWED_USERS`: Komma-getrennte User-IDs (leer = alle)

### Starten

```bash
cd backend
python -m integrations.discord
```

### Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `!new` | Neuen Chat starten |
| `!status` | Aktuelle Session-Info |

Normale Nachrichten (ohne `!` Prefix) werden als Chat-Nachrichten an Axon weitergeleitet.

### Tool-Approvals

Tool-Anfragen werden als Discord Embeds mit farbcodiertem Risiko-Level angezeigt.
Drei Buttons zur Entscheidung:

- **Erlauben** (grün) — Einmalig
- **Session** (blau) — Für die Session
- **Ablehnen** (rot) — Nicht ausführen

Timeout: 120 Sekunden — danach wird automatisch abgelehnt.

## Hinweise

- Die Bots sind **separate Prozesse** — sie laufen unabhängig vom Web-Frontend
- Mehrere Bots können gleichzeitig laufen (Telegram + Discord + Web-UI)
- Jeder Messenger-User hat seine eigene Session
- Das Audit-Log erfasst auch Aktionen über Messenger-Bots
- Für Produktion: Bots als systemd-Service oder Docker-Container starten
