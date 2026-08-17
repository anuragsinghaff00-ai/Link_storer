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

from app.core.agent import JarvisAgent

class ChatRequest(BaseModel):
    query: str
    history: List[Dict[str, Any]] = []
    state: str = "IDLE"
    actionData: Dict[str, Any] = None

@router.post("/chat")
def process_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Agent / Tool Layer logic.
    Receives text, parses intent, and returns response and vault metadata.
    Uses the JarvisAgent to map natural language to specific Python functions.
    """
    agent = JarvisAgent(db)
    response = agent.process_chat(
        query=request.query, 
        history=request.history,
        pending_state=request.state,
        action_data=request.actionData
    )
    return response
