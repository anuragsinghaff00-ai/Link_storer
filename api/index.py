import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'jarvis_knowledge_vault', 'backend'))
sys.path.append(backend_dir)

from app.main import app
