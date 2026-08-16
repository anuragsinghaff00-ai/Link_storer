from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel
import re

from app.core.database import get_db
from app.models.resource import Resource

router = APIRouter(
    prefix="/jarvis",
    tags=["jarvis-agent"],
)

class ChatRequest(BaseModel):
    query: str
    history: List[Dict[str, Any]] = []

@router.post("/chat")
def process_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Agent / Tool Layer logic.
    Receives text, parses intent, and returns response and vault metadata.
    Currently uses pattern matching (mimicking the previous frontend NLP).
    Can be swapped with LangChain/OpenAI easily.
    """
    query = request.query.lower().strip()
    
    # 1. Check for Save Intent
    if "save this" in query or "save link" in query or query.startswith("http"):
        # Extract URL
        urls = re.findall(r'(https?://[^\s]+)', request.query)
        if urls:
            url = urls[0]
            # In a real LLM setup, the agent would use a tool to fetch metadata.
            # Here we just mock the confirmation flow.
            return {
                "text": f"I see you want to save {url}. What purpose should I assign to this resource?",
                "state": "AWAITING_SAVE_CATEGORY",
                "actionData": {"urls": urls},
                "resources": []
            }
    
    # 2. Check for Search/Query intent
    if "show" in query or "find" in query or "summarize" in query or "resources" in query or "explain" in query:
        # Fetch some resources to pretend we searched pgvector
        # In a real Agent setup, we'd embed the query and do a similarity search on `Embedding` model
        resources = db.query(Resource).limit(3).all()
        
        res_data = [
            {
                "id": r.id,
                "title": r.title,
                "url": r.url,
                "summary": r.summary
            } for r in resources
        ]
        
        return {
            "text": f"Here is what I found in your Postgres Vault matching your request:",
            "resources": res_data,
            "citations": res_data
        }
        
    # 3. Default fallback conversational response
    return {
        "text": "I am connected to the Agent Layer! Currently, I am operating in basic mock mode since LLM integration is pending. I can help you save links or search your Postgres vault.",
        "resources": [],
        "followUps": ["Save this link https://example.com", "Show my resources"]
    }
