import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.core.llm_provider import get_llm_provider

# Tool definitions
def add_resource(db: Session, args: Dict[str, Any]) -> Dict[str, Any]:
    url = args.get("url")
    purpose = args.get("purpose")
    return {
        "status": "requires_confirmation",
        "action": "ADD_RESOURCE",
        "actionData": {"url": url, "purpose": purpose},
        "message": f"I see you want to save {url}. I will prepare a preview."
    }

def delete_resource(db: Session, args: Dict[str, Any]) -> Dict[str, Any]:
    query = args.get("query")
    return {
        "status": "requires_confirmation",
        "action": "DELETE_RESOURCE",
        "actionData": {"query": query},
        "message": f"Are you sure you want to delete the resource matching '{query}'?"
    }

def search_resources(db: Session, args: Dict[str, Any]) -> Dict[str, Any]:
    query = args.get("query", "").lower()
    from app.models.resource import Resource
    # Extremely basic mock search for demonstration
    resources = db.query(Resource).limit(5).all()
    filtered = []
    for r in resources:
        if query in (r.title or "").lower() or query in (r.url or "").lower() or query in (r.category or "").lower():
            filtered.append(r)
    
    if not filtered:
        filtered = resources # fallback to all if empty for testing
        
    res_data = [
        {
            "id": r.id,
            "title": r.title,
            "url": r.url,
            "summary": r.summary,
            "category": getattr(r, "category", "General") # Use standard attr if category is an object in real schema
        } for r in filtered
    ]
    
    summarize = args.get("summarize", False)
    if summarize:
        msg = f"Here is a summary of your resources matching '{query}'."
    else:
        msg = f"I found some resources matching '{query}'."

    return {
        "status": "executed",
        "message": msg,
        "resources": res_data
    }

def create_purpose(db: Session, args: Dict[str, Any]) -> Dict[str, Any]:
    name = args.get("name")
    return {
        "status": "requires_confirmation",
        "action": "CREATE_PURPOSE",
        "actionData": {"name": name},
        "message": f"I can create the purpose '{name}'. Shall I proceed?"
    }

class JarvisAgent:
    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm_provider()
        self.tools = {
            "add_resource": add_resource,
            "delete_resource": delete_resource,
            "search_resources": search_resources,
            "create_purpose": create_purpose
        }

    def process_chat(self, query: str, history: List[Dict[str, Any]], pending_state: str = "IDLE", action_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Main entry point for Jarvis AI control layer.
        """
        # 1. Handle confirmation flows
        if pending_state != "IDLE" and action_data:
            # The frontend has sent back a confirmed or modified action
            # Mocking execution of confirmed actions
            if query.lower() in ["accept", "yes", "save", "proceed", "confirm"]:
                action_type = action_data.get("action", "")
                return {
                    "text": f"Confirmed! Executed action: {action_type}.",
                    "state": "IDLE",
                    "actionData": None,
                    "resources": []
                }
            elif query.lower() in ["cancel", "no", "reject", "stop"]:
                return {
                    "text": "Action cancelled.",
                    "state": "IDLE",
                    "actionData": None,
                    "resources": []
                }
            elif query.lower() in ["modify", "edit"]:
                return {
                    "text": "What would you like to modify about this action?",
                    "state": "AWAITING_MODIFICATION",
                    "actionData": action_data,
                    "resources": []
                }

        # 2. Normal LLM intent routing
        tool_name, tool_args, llm_response = self.llm.process_intent(query, history)

        if tool_name and tool_name in self.tools:
            # Execute the tool
            tool_func = self.tools[tool_name]
            result = tool_func(self.db, tool_args)
            
            if result.get("status") == "requires_confirmation":
                return {
                    "text": result.get("message", "Confirmation required."),
                    "state": "AWAITING_CONFIRMATION",
                    "actionData": result.get("actionData", {}),
                    "resources": result.get("resources", [])
                }
            else:
                return {
                    "text": result.get("message", "Executed successfully."),
                    "state": "IDLE",
                    "actionData": None,
                    "resources": result.get("resources", []),
                    "citations": result.get("resources", [])
                }

        # 3. Fallback response
        return {
            "text": llm_response,
            "state": "IDLE",
            "actionData": None,
            "resources": []
        }
