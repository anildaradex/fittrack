from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings

app = FastAPI(title="FitTrack API", version=settings.version)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "env": settings.env, "version": settings.version}


# --- Serve the built frontend (frontend/dist copied to `static/` in the container) ---
STATIC = Path(settings.static_dir)
if STATIC.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        """SPA fallback: real files are served as-is, anything else gets index.html."""
        candidate = STATIC / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-store"})
