# Skills System

Axon unterstützt erweiterbare Skills — Community-Plugins, die neue Fähigkeiten hinzufügen.

## Sicherheits-Gate

Jeder Skill durchläuft einen **Sicherheitsprozess**, bevor er ausgeführt werden kann:

1. **Scan**: Skills-Verzeichnis wird nach `.py` Dateien durchsucht
2. **Validierung**: Struktur wird geprüft (Pflichtattribute, execute-Funktion)
3. **Registrierung**: Skill wird in der DB gespeichert (nicht aktiv)
4. **Genehmigung**: User muss den Skill explizit in der UI genehmigen
5. **Hash-Prüfung**: Bei jeder Ausführung wird der SHA-256 Hash der Datei geprüft
6. **Auto-Revocation**: Wird die Datei geändert, wird die Genehmigung automatisch widerrufen

## Skill erstellen

Erstelle eine `.py` Datei in `backend/skills/`:

```python
"""
Mein Custom Skill
"""

# Pflichtattribute
SKILL_NAME = "my_skill"              # Eindeutiger Name (snake_case)
SKILL_DISPLAY_NAME = "Mein Skill"    # Anzeigename
SKILL_DESCRIPTION = "Beschreibung"   # Was macht der Skill?
SKILL_VERSION = "1.0.0"              # SemVer

# Optionale Attribute
SKILL_AUTHOR = "Dein Name"
SKILL_RISK_LEVEL = "low"             # low, medium, high, critical

SKILL_PARAMETERS = {
    "input": {"type": "string", "description": "Eingabe", "required": True},
    "option": {"type": "integer", "description": "Option", "default": 5}
}


def execute(params: dict) -> str:
    """Hauptfunktion — wird vom Agent aufgerufen"""
    input_text = params.get("input", "")
    option = params.get("option", 5)

    # Deine Logik hier
    result = f"Verarbeitet: {input_text}"

    return result
```

### Pflichtattribute

| Attribut | Typ | Beschreibung |
|----------|-----|-------------|
| `SKILL_NAME` | str | Eindeutiger technischer Name |
| `SKILL_DESCRIPTION` | str | Beschreibung der Funktionalität |
| `SKILL_VERSION` | str | Versionsnummer (SemVer) |
| `execute(params)` | function | Hauptfunktion (sync oder async) |

### Optionale Attribute

| Attribut | Typ | Standard | Beschreibung |
|----------|-----|----------|-------------|
| `SKILL_DISPLAY_NAME` | str | = SKILL_NAME | Anzeigename in der UI |
| `SKILL_AUTHOR` | str | None | Autor des Skills |
| `SKILL_RISK_LEVEL` | str | "medium" | Risikostufe |
| `SKILL_PARAMETERS` | dict | {} | Parameter-Definitionen |

## Mitgelieferte Skills

### summarize
- **Beschreibung**: Fasst einen Text extraktiv in wenigen Sätzen zusammen
- **Risiko**: Niedrig
- **Parameter**: `text` (string), `max_sentences` (int, default: 3)

### word_count
- **Beschreibung**: Zählt Wörter, Zeichen, Sätze und Absätze
- **Risiko**: Niedrig
- **Parameter**: `text` (string)

### json_formatter
- **Beschreibung**: Formatiert, validiert und analysiert JSON-Daten
- **Risiko**: Niedrig
- **Parameter**: `json_string` (string), `indent` (int), `sort_keys` (bool)

## API Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| GET | `/api/v1/skills` | Alle Skills auflisten (inkl. Auto-Scan) |
| GET | `/api/v1/skills/{id}` | Einzelnen Skill abrufen |
| POST | `/api/v1/skills/{id}/approve` | Skill genehmigen/widerrufen |
| POST | `/api/v1/skills/{id}/toggle` | Skill aktivieren/deaktivieren |
| DELETE | `/api/v1/skills/{id}` | Skill aus DB entfernen |
| POST | `/api/v1/skills/scan` | Manueller Verzeichnis-Scan |

## Sicherheitshinweise

- Skills werden **nicht** in einer Sandbox ausgeführt — sie haben vollen Zugriff auf den Python-Prozess
- Prüfe den Quellcode eines Skills **immer**, bevor du ihn genehmigst
- Das Hash-System schützt vor **unbemerkten Änderungen**, nicht vor bösartigem Code
- Verwende Skills von unbekannten Quellen nur, wenn du den Code verstehst
- In einer zukünftigen Version ist eine Docker-Sandbox für Skills geplant
