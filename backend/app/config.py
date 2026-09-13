from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Values come from env vars (Cloud Run) or backend/.env (local)."""

    model_config = SettingsConfigDict(env_prefix="FITTRACK_", env_file=".env", extra="ignore")

    env: str = "local"
    version: str = "0.1.0"
    static_dir: str = "static"
    # SQLite locally (no docker on the dev Mac); Postgres on Cloud Run via Secret Manager.
    database_url: str = "sqlite:///./fittrack.db"
    # Single-user bearer token. Prod value lives in Secret Manager (fittrack-app-token).
    app_token: str = "dev-token"
    owner_email: str = "anil.dara@gmail.com"


settings = Settings()
