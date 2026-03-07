"""
KhetAI Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database - defaults to SQLite for easy local dev
    DATABASE_URL: str = "sqlite:///./khetai.db"

    # Grok API
    GROK_API_KEY: str = ""
    GROK_BASE_URL: str = "https://api.x.ai/v1"
    GROK_MODEL: str = "grok-2-vision-1212"
    GROK_TEXT_MODEL: str = "grok-2-1212"

    # JWT
    SECRET_KEY: str = "khetai-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # App
    APP_NAME: str = "KhetAI"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
