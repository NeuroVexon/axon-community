"""
Axon by NeuroVexon - Telegram Integration

Ermöglicht die Nutzung von Axon über Telegram.
Tool-Approvals werden über Inline-Keyboards abgewickelt.

Konfiguration via .env:
    TELEGRAM_BOT_TOKEN=<dein-token>
    TELEGRAM_ALLOWED_USERS=123456789,987654321  (optional, leer = alle)

Start:
    python -m integrations.telegram
"""

import asyncio
import json
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional

logger = logging.getLogger(__name__)

# Lazy import — nur wenn das Modul wirklich gestartet wird
try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import (
        Application,
        CommandHandler,
        MessageHandler,
        CallbackQueryHandler,
        ContextTypes,
        filters,
    )
    HAS_TELEGRAM = True
except ImportError:
    HAS_TELEGRAM = False


# --- In-Memory State ---

# Pending approvals: approval_id -> {tool, params, description, risk_level, chat_id, message_id}
_pending_approvals: dict[str, dict] = {}

# Session mapping: telegram_user_id -> axon_session_id
_user_sessions: dict[int, str] = {}


def _get_config():
    """Telegram config aus Environment laden"""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    allowed_raw = os.getenv("TELEGRAM_ALLOWED_USERS", "")
    allowed_users = set()
    if allowed_raw.strip():
        for uid in allowed_raw.split(","):
            uid = uid.strip()
            if uid.isdigit():
                allowed_users.add(int(uid))
    return token, allowed_users


def _is_allowed(user_id: int, allowed_users: set[int]) -> bool:
    """Prüft ob der User berechtigt ist (leer = alle erlaubt)"""
    if not allowed_users:
        return True
    return user_id in allowed_users


# --- Bot Handlers ---

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler für /start"""
    _, allowed_users = _get_config()
    if not _is_allowed(update.effective_user.id, allowed_users):
        await update.message.reply_text("Zugriff verweigert.")
        return

    await update.message.reply_text(
        "Willkommen bei *Axon by NeuroVexon*\\!\n\n"
        "Sende mir eine Nachricht und ich leite sie an die KI weiter\\.\n"
        "Wenn ein Tool ausgeführt werden soll, bekommst du Buttons zur Genehmigung\\.\n\n"
        "Befehle:\n"
        "/new \\- Neuer Chat\n"
        "/status \\- Aktueller Status",
        parse_mode="MarkdownV2"
    )


async def cmd_new(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler für /new — neuen Chat starten"""
    user_id = update.effective_user.id
    _user_sessions.pop(user_id, None)
    await update.message.reply_text("Neuer Chat gestartet.")


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler für /status"""
    user_id = update.effective_user.id
    session_id = _user_sessions.get(user_id, "Kein aktiver Chat")
    pending = len(_pending_approvals)
    await update.message.reply_text(
        f"Session: {session_id[:8]}...\n"
        f"Offene Approvals: {pending}"
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Verarbeitet normale Text-Nachrichten → leitet an Axon Agent weiter"""
    _, allowed_users = _get_config()
    user_id = update.effective_user.id

    if not _is_allowed(user_id, allowed_users):
        await update.message.reply_text("Zugriff verweigert.")
        return

    message_text = update.message.text
    if not message_text:
        return

    # "Denkt nach..." Indikator
    thinking_msg = await update.message.reply_text("Axon denkt nach...")

    session_id = _user_sessions.get(user_id)

    try:
        import httpx

        # Agent-Endpoint aufrufen (SSE stream)
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                "http://localhost:8000/api/v1/chat/agent",
                json={
                    "message": message_text,
                    "session_id": session_id,
                },
                headers={"Content-Type": "application/json"}
            ) as response:
                full_text = ""
                buffer = ""

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    try:
                        event = json.loads(line[6:])
                    except json.JSONDecodeError:
                        continue

                    event_type = event.get("type")

                    if event_type == "text":
                        full_text += event.get("content", "")

                    elif event_type == "tool_request":
                        tool_name = event.get("tool", "?")
                        description = event.get("description", "")
                        risk_level = event.get("risk_level", "medium")
                        approval_id = event.get("approval_id", "")
                        params = event.get("params", {})

                        risk_emoji = {"low": "🟢", "medium": "🟡", "high": "🔴", "critical": "⛔"}.get(risk_level, "🟡")

                        keyboard = InlineKeyboardMarkup([
                            [
                                InlineKeyboardButton("Erlauben", callback_data=f"approve:{approval_id}:once"),
                                InlineKeyboardButton("Session", callback_data=f"approve:{approval_id}:session"),
                                InlineKeyboardButton("Ablehnen", callback_data=f"approve:{approval_id}:never"),
                            ]
                        ])

                        params_str = "\n".join(f"  {k}: {v}" for k, v in params.items())
                        approval_msg = await update.message.reply_text(
                            f"{risk_emoji} *Tool\\-Anfrage:* `{tool_name}`\n"
                            f"{_escape_md(description)}\n\n"
                            f"Parameter:\n```\n{params_str}\n```",
                            parse_mode="MarkdownV2",
                            reply_markup=keyboard
                        )

                        _pending_approvals[approval_id] = {
                            "tool": tool_name,
                            "chat_id": update.effective_chat.id,
                            "message_id": approval_msg.message_id,
                        }

                    elif event_type == "tool_result":
                        tool_name = event.get("tool", "?")
                        result_text = str(event.get("result", ""))[:500]
                        exec_time = event.get("execution_time_ms", 0)
                        await update.message.reply_text(
                            f"Tool `{tool_name}` ausgefuehrt ({exec_time}ms):\n```\n{result_text}\n```",
                            parse_mode="MarkdownV2"
                        )

                    elif event_type == "tool_rejected":
                        await update.message.reply_text(f"Tool `{event.get('tool', '?')}` abgelehnt.")

                    elif event_type == "done":
                        new_session = event.get("session_id")
                        if new_session:
                            _user_sessions[user_id] = new_session

                # Denk-Nachricht löschen und Antwort senden
                await thinking_msg.delete()
                if full_text.strip():
                    # Telegram hat 4096 Zeichen Limit
                    for chunk in _split_text(full_text, 4000):
                        await update.message.reply_text(chunk)

    except Exception as e:
        logger.error(f"Telegram message handler error: {e}")
        await thinking_msg.edit_text(f"Fehler: {str(e)[:200]}")


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Verarbeitet Inline-Keyboard Callbacks für Tool-Approvals"""
    query = update.callback_query
    await query.answer()

    data = query.data
    if not data or not data.startswith("approve:"):
        return

    parts = data.split(":")
    if len(parts) != 3:
        return

    _, approval_id, decision = parts

    try:
        import httpx

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"http://localhost:8000/api/v1/chat/approve/{approval_id}?decision={decision}"
            )

        decision_text = {"once": "Einmal erlaubt", "session": "Für Session erlaubt", "never": "Abgelehnt"}.get(decision, decision)
        await query.edit_message_reply_markup(reply_markup=None)
        await query.message.reply_text(f"Entscheidung: {decision_text}")

        # Cleanup
        _pending_approvals.pop(approval_id, None)

    except Exception as e:
        logger.error(f"Telegram callback error: {e}")
        await query.message.reply_text(f"Fehler bei Approval: {str(e)[:200]}")


# --- Utilities ---

def _escape_md(text: str) -> str:
    """Escaped spezielle MarkdownV2 Zeichen"""
    special = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in special:
        text = text.replace(char, f'\\{char}')
    return text


def _split_text(text: str, max_length: int = 4000) -> list[str]:
    """Teilt langen Text in Telegram-kompatible Chunks"""
    if len(text) <= max_length:
        return [text]

    chunks = []
    while text:
        if len(text) <= max_length:
            chunks.append(text)
            break
        # Am nächsten Newline vor dem Limit splitten
        split_pos = text.rfind('\n', 0, max_length)
        if split_pos == -1:
            split_pos = max_length
        chunks.append(text[:split_pos])
        text = text[split_pos:].lstrip('\n')
    return chunks


# --- Main ---

def run_bot():
    """Startet den Telegram Bot"""
    if not HAS_TELEGRAM:
        print("Fehler: python-telegram-bot nicht installiert.")
        print("  pip install python-telegram-bot")
        sys.exit(1)

    token, _ = _get_config()
    if not token:
        print("Fehler: TELEGRAM_BOT_TOKEN nicht gesetzt.")
        print("  Setze die Variable in .env oder als Environment Variable.")
        sys.exit(1)

    print("Starte Axon Telegram Bot...")
    print("  Stelle sicher, dass das Axon Backend auf http://localhost:8000 läuft.")

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("new", cmd_new))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(handle_callback))

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    run_bot()
