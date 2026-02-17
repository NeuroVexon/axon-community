"""
Axon by NeuroVexon - Settings API Endpoints
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json

from db.database import get_db
from db.models import Settings
from core.config import settings as app_settings, LLMProvider
from core.security import encrypt_value, decrypt_value
from llm.router import llm_router
from core.i18n import t, set_language, get_lang_from_header

# Keys that must be encrypted in the database
ENCRYPTED_KEYS = {"anthropic_api_key", "openai_api_key", "imap_password", "smtp_password", "mcp_auth_token"}

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    theme: Optional[str] = None
    system_prompt: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    ollama_model: Optional[str] = None
    claude_model: Optional[str] = None
    openai_model: Optional[str] = None
    # E-Mail
    email_enabled: Optional[str] = None
    imap_host: Optional[str] = None
    imap_port: Optional[str] = None
    imap_user: Optional[str] = None
    imap_password: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    # MCP
    mcp_enabled: Optional[str] = None
    mcp_auth_token: Optional[str] = None
    # Language
    language: Optional[str] = None


def mask_api_key(key: Optional[str]) -> str:
    """Mask API key, showing only last 4 characters"""
    if not key or len(key) < 8:
        return ""
    return "•" * 20 + key[-4:]


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get current settings"""
    result = await db.execute(select(Settings))
    db_settings = {s.key: s.value for s in result.scalars().all()}

    # Get API keys (from DB first — decrypt — then fallback to env)
    anthropic_key_encrypted = db_settings.get("anthropic_api_key")
    anthropic_key = decrypt_value(anthropic_key_encrypted) if anthropic_key_encrypted else app_settings.anthropic_api_key
    openai_key_encrypted = db_settings.get("openai_api_key")
    openai_key = decrypt_value(openai_key_encrypted) if openai_key_encrypted else app_settings.openai_api_key

    return {
        "app_name": app_settings.app_name,
        "app_version": app_settings.app_version,
        "llm_provider": db_settings.get("llm_provider", app_settings.llm_provider.value),
        "theme": db_settings.get("theme", "dark"),
        "system_prompt": db_settings.get("system_prompt", ""),
        "available_providers": [p.value for p in LLMProvider],
        # API Keys (masked)
        "anthropic_api_key_set": bool(anthropic_key),
        "anthropic_api_key_masked": mask_api_key(anthropic_key),
        "openai_api_key_set": bool(openai_key),
        "openai_api_key_masked": mask_api_key(openai_key),
        # Models
        "ollama_model": db_settings.get("ollama_model", app_settings.ollama_model),
        "claude_model": db_settings.get("claude_model", app_settings.claude_model),
        "openai_model": db_settings.get("openai_model", app_settings.openai_model),
        # E-Mail
        "email_enabled": db_settings.get("email_enabled", "false") == "true",
        "imap_host": db_settings.get("imap_host", ""),
        "imap_port": db_settings.get("imap_port", "993"),
        "imap_user": db_settings.get("imap_user", ""),
        "imap_password_set": bool(db_settings.get("imap_password", "")),
        "smtp_host": db_settings.get("smtp_host", ""),
        "smtp_port": db_settings.get("smtp_port", "587"),
        "smtp_user": db_settings.get("smtp_user", ""),
        "smtp_password_set": bool(db_settings.get("smtp_password", "")),
        "smtp_from": db_settings.get("smtp_from", ""),
        # Language
        "language": db_settings.get("language", "de"),
    }


@router.put("")
async def update_settings(
    update: SettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update settings"""
    updates = update.model_dump(exclude_none=True)

    for key, value in updates.items():
        # Encrypt API keys before storing
        store_value = encrypt_value(str(value)) if key in ENCRYPTED_KEYS else str(value)

        result = await db.execute(
            select(Settings).where(Settings.key == key)
        )
        setting = result.scalar_one_or_none()

        if setting:
            setting.value = store_value
        else:
            setting = Settings(key=key, value=store_value)
            db.add(setting)

    await db.commit()
    return {"status": "updated", "changes": updates}


@router.post("/email/test")
async def test_email_connection(request: Request, db: AsyncSession = Depends(get_db)):
    """E-Mail Verbindung testen"""
    set_language(get_lang_from_header(request.headers.get("accept-language")))
    from integrations.email import get_email_client_from_settings

    result = await db.execute(select(Settings))
    db_settings = {s.key: s.value for s in result.scalars().all()}

    client = get_email_client_from_settings(db_settings)
    if not client:
        return {"imap": False, "smtp": False, "imap_error": t("settings.not_configured"), "smtp_error": t("settings.not_configured")}

    return await client.test_connection()


@router.get("/health")
async def health_check():
    """Check health of all LLM providers"""
    provider_health = await llm_router.health_check_all()

    return {
        "status": "healthy",
        "app_name": app_settings.app_name,
        "version": app_settings.app_version,
        "providers": provider_health
    }
