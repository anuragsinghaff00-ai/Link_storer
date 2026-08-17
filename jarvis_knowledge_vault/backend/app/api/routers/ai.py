from fastapi import APIRouter
import os

from app.core.llm_provider import get_llm_provider, AIUnavailableError
from pydantic import BaseModel

router = APIRouter(
    prefix="/ai",
    tags=["ai-health"],
)

class TestRequest(BaseModel):
    query: str

@router.get("/health")
def health_check():
    api_key = os.getenv("OPENAI_API_KEY")
    configured = bool(api_key)
    
    return {
        "provider": "openai",
        "configured": configured,
        "reachable": configured # Simplified for health check
    }

@router.post("/test")
async def test_llm(req: TestRequest):
    try:
        provider = get_llm_provider()
        
        messages = [
            {"role": "system", "content": "You are Jarvis. Be very brief."},
            {"role": "user", "content": req.query}
        ]
        
        stream = provider.stream_chat(messages=messages)
        full_text = ""
        async for chunk in stream:
            if chunk["type"] == "content":
                full_text += chunk["content"]
                
        return {"response": full_text}
    except AIUnavailableError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": "Internal AI Error"}
