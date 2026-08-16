from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.routers import images, image_ai, resources, jarvis

app = FastAPI(
    title="Jarvis Knowledge Vault API",
    description="Backend API for Jarvis Knowledge Vault",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists in data folder
data_upload_dir = os.path.join(os.path.dirname(__file__), "..", "data", "uploads", "images")
os.makedirs(data_upload_dir, exist_ok=True)
app.mount("/static/images", StaticFiles(directory=data_upload_dir), name="images")

# Include routers
app.include_router(images.router, prefix="/api")
app.include_router(image_ai.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(jarvis.router, prefix="/api")

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

from fastapi.responses import FileResponse

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Mount the entire frontend directory for static assets (js, css)
app.mount("/", StaticFiles(directory=FRONTEND_DIR), name="frontend")
