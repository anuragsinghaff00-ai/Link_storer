import sys
import os
import traceback
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI()

try:
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'jarvis_knowledge_vault', 'backend'))
    sys.path.append(backend_dir)
    from app.main import app as real_app
    # Mount the real app
    app.mount("/", real_app)
except Exception as e:
    err = traceback.format_exc()
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    def catch_all(path_name: str):
        return PlainTextResponse(err, status_code=500)
