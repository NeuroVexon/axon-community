"""
Axon by NeuroVexon - Discord Integration

Ermöglicht die Nutzung von Axon über Discord.
Tool-Approvals werden über Discord Button-Components abgewickelt.

Konfiguration via .env:
    DISCORD_BOT_TOKEN=<dein-token>
    DISCORD_ALLOWED_CHANNELS=123456789,987654321  (optional, leer = alle)
    DISCORD_ALLOWED_USERS=123456789  (optional, leer = alle)

Start:
    python -m integrations.discord
"""

import asyncio
import json
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional

logger = logging.getLogger(__name__)

try:
    import discord
    from discord.ext import commands
    from discord import ui
    HAS_DISCORD = True
except ImportError:
    HAS_DISCORD = False


# --- In-Memory State ---

# Session mapping: discord_user_id -> axon_session_id
_user_sessions: dict[int, str] = {}

# Pending approvals: approval_id -> {tool, channel_id, message_id}
_pending_approvals: dict[str, dict] = {}


def _get_config():
    """Discord config aus Environment laden"""
    token = os.getenv("DISCORD_BOT_TOKEN", "")
    allowed_channels_raw = os.getenv("DISCORD_ALLOWED_CHANNELS", "")
    allowed_users_raw = os.getenv("DISCORD_ALLOWED_USERS", "")

    allowed_channels = set()
    if allowed_channels_raw.strip():
        for cid in allowed_channels_raw.split(","):
            cid = cid.strip()
            if cid.isdigit():
                allowed_channels.add(int(cid))

    allowed_users = set()
    if allowed_users_raw.strip():
        for uid in allowed_users_raw.split(","):
            uid = uid.strip()
            if uid.isdigit():
                allowed_users.add(int(uid))

    return token, allowed_channels, allowed_users


def _is_allowed(
    user_id: int,
    channel_id: int,
    allowed_users: set[int],
    allowed_channels: set[int]
) -> bool:
    """Prüft ob User und Channel berechtigt sind"""
    if allowed_users and user_id not in allowed_users:
        return False
    if allowed_channels and channel_id not in allowed_channels:
        return False
    return True


# --- Approval View (Discord Buttons) ---

if HAS_DISCORD:
    class ApprovalView(ui.View):
        """Discord Button-View für Tool-Approvals"""

        def __init__(self, approval_id: str):
            super().__init__(timeout=120.0)
            self.approval_id = approval_id
            self.decision: Optional[str] = None

        @ui.button(label="Erlauben", style=discord.ButtonStyle.green, custom_id="approve_once")
        async def approve_once(self, interaction: discord.Interaction, button: ui.Button):
            await self._handle_decision(interaction, "once", "Einmal erlaubt")

        @ui.button(label="Session", style=discord.ButtonStyle.blurple, custom_id="approve_session")
        async def approve_session(self, interaction: discord.Interaction, button: ui.Button):
            await self._handle_decision(interaction, "session", "Für Session erlaubt")

        @ui.button(label="Ablehnen", style=discord.ButtonStyle.red, custom_id="approve_never")
        async def approve_never(self, interaction: discord.Interaction, button: ui.Button):
            await self._handle_decision(interaction, "never", "Abgelehnt")

        async def _handle_decision(self, interaction: discord.Interaction, decision: str, label: str):
            try:
                import httpx

                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        f"http://localhost:8000/api/v1/chat/approve/{self.approval_id}?decision={decision}"
                    )

                self.decision = decision
                _pending_approvals.pop(self.approval_id, None)

                # Buttons deaktivieren
                for item in self.children:
                    item.disabled = True
                await interaction.response.edit_message(view=self)
                await interaction.followup.send(f"Entscheidung: **{label}**", ephemeral=True)

            except Exception as e:
                logger.error(f"Discord approval error: {e}")
                await interaction.response.send_message(f"Fehler: {str(e)[:200]}", ephemeral=True)

        async def on_timeout(self):
            """Timeout — automatisch ablehnen"""
            if self.decision is None:
                try:
                    import httpx
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        await client.post(
                            f"http://localhost:8000/api/v1/chat/approve/{self.approval_id}?decision=never"
                        )
                except Exception:
                    pass
                _pending_approvals.pop(self.approval_id, None)


# --- Bot Setup ---

def run_bot():
    """Startet den Discord Bot"""
    if not HAS_DISCORD:
        print("Fehler: discord.py nicht installiert.")
        print("  pip install discord.py")
        sys.exit(1)

    token, allowed_channels, allowed_users = _get_config()
    if not token:
        print("Fehler: DISCORD_BOT_TOKEN nicht gesetzt.")
        print("  Setze die Variable in .env oder als Environment Variable.")
        sys.exit(1)

    intents = discord.Intents.default()
    intents.message_content = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        print(f"Axon Discord Bot bereit: {bot.user}")
        print(f"  Stelle sicher, dass das Axon Backend auf http://localhost:8000 läuft.")

    @bot.command(name="new")
    async def cmd_new(ctx: commands.Context):
        """Neuen Chat starten"""
        if not _is_allowed(ctx.author.id, ctx.channel.id, allowed_users, allowed_channels):
            return
        _user_sessions.pop(ctx.author.id, None)
        await ctx.send("Neuer Chat gestartet.")

    @bot.command(name="status")
    async def cmd_status(ctx: commands.Context):
        """Status anzeigen"""
        if not _is_allowed(ctx.author.id, ctx.channel.id, allowed_users, allowed_channels):
            return
        session_id = _user_sessions.get(ctx.author.id, "Kein aktiver Chat")
        sid_display = session_id[:8] + "..." if len(session_id) > 8 else session_id
        pending = len(_pending_approvals)
        await ctx.send(f"Session: `{sid_display}`\nOffene Approvals: {pending}")

    @bot.event
    async def on_message(message: discord.Message):
        """Verarbeitet Nachrichten"""
        # Eigene Nachrichten und Bot-Commands ignorieren
        if message.author == bot.user:
            return

        # Commands zuerst verarbeiten
        await bot.process_commands(message)

        # Nur auf Nachrichten ohne Prefix reagieren
        if message.content.startswith("!"):
            return

        if not _is_allowed(message.author.id, message.channel.id, allowed_users, allowed_channels):
            return

        if not message.content.strip():
            return

        user_id = message.author.id
        session_id = _user_sessions.get(user_id)

        # Typing-Indikator
        async with message.channel.typing():
            try:
                import httpx

                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream(
                        "POST",
                        "http://localhost:8000/api/v1/chat/agent",
                        json={
                            "message": message.content,
                            "session_id": session_id,
                        },
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        full_text = ""

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

                                params_str = "\n".join(f"  {k}: {v}" for k, v in params.items())

                                embed = discord.Embed(
                                    title=f"{risk_emoji} Tool-Anfrage: {tool_name}",
                                    description=description,
                                    color={"low": 0x00ff00, "medium": 0xffaa00, "high": 0xff0000, "critical": 0xff0000}.get(risk_level, 0xffaa00)
                                )
                                if params_str:
                                    embed.add_field(name="Parameter", value=f"```\n{params_str}\n```", inline=False)

                                view = ApprovalView(approval_id)
                                approval_msg = await message.channel.send(embed=embed, view=view)

                                _pending_approvals[approval_id] = {
                                    "tool": tool_name,
                                    "channel_id": message.channel.id,
                                    "message_id": approval_msg.id,
                                }

                            elif event_type == "tool_result":
                                tool_name = event.get("tool", "?")
                                result_text = str(event.get("result", ""))[:1500]
                                exec_time = event.get("execution_time_ms", 0)

                                embed = discord.Embed(
                                    title=f"Tool `{tool_name}` ausgefuehrt ({exec_time}ms)",
                                    description=f"```\n{result_text}\n```",
                                    color=0x00d4ff
                                )
                                await message.channel.send(embed=embed)

                            elif event_type == "tool_rejected":
                                await message.channel.send(f"Tool `{event.get('tool', '?')}` abgelehnt.")

                            elif event_type == "done":
                                new_session = event.get("session_id")
                                if new_session:
                                    _user_sessions[user_id] = new_session

                # Antwort senden
                if full_text.strip():
                    # Discord hat 2000 Zeichen Limit
                    for chunk in _split_text(full_text, 1900):
                        await message.channel.send(chunk)

            except Exception as e:
                logger.error(f"Discord message handler error: {e}")
                await message.channel.send(f"Fehler: {str(e)[:200]}")


    print("Starte Axon Discord Bot...")
    bot.run(token)


def _split_text(text: str, max_length: int = 1900) -> list[str]:
    """Teilt langen Text in Discord-kompatible Chunks"""
    if len(text) <= max_length:
        return [text]

    chunks = []
    while text:
        if len(text) <= max_length:
            chunks.append(text)
            break
        split_pos = text.rfind('\n', 0, max_length)
        if split_pos == -1:
            split_pos = max_length
        chunks.append(text[:split_pos])
        text = text[split_pos:].lstrip('\n')
    return chunks


if __name__ == "__main__":
    run_bot()
