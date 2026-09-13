from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Values come from env vars (Cloud Run) or backend/.env (local)."""

    model_config = SettingsConfigDict(env_prefix="FITTRACK_", env_file=".env", extra="ignore")

    env: str = "local"
    version: str = "0.1.0"
    static_dir: str = "static"


settings = Settings()
