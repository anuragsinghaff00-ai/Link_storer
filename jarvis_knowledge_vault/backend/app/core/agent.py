import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.core.llm_provider import get_llm_provider, AIUnavailableError
from app.api.tools.tool_schemas import get_openai_tools
from app.api.tools.resource_tools import (
    search_resources, 
    add_resource, 
    execute_add_resource, 
    delete_resource, 
    execute_delete_resource
)

SYSTEM_PROMPT = """You are Jarvis, the personal AI knowledge manager for this application.
You must:
- Understand natural language.
- Be concise.
- Never invent database records. Use your tools to query the database.
- Use your tools for any database operations.
- Clearly state when information cannot be found.
- If the user asks to save, delete, or modify something, you MUST use the provided tool. 
- You do NOT execute destructive actions immediately. Your tools will return a "requires_confirmation" status. You must present this to the user.
"""

class JarvisAgent:
    def __init__(self, db: Session):
        self.db = db
        try:
            self.llm = get_llm_provider()
        except AIUnavailableError:
            self.llm = None
        
        # We mock a static user ID since auth isn't fully implemented yet
        self.user_id = "mock_user_123"

        self.tools_map = {
            "search_resources": search_resources,
            "add_resource": add_resource,
            "delete_resource": delete_resource,
        }

    async def stream_chat(self, query: str, history: List[Dict[str, Any]], pending_state: str = "IDLE", action_data: Dict[str, Any] = None):
        """
        Asynchronous generator that yields SSE-compatible dictionaries.
        """
        if not self.llm:
            yield {"type": "error", "content": "Jarvis AI is temporarily unavailable. (No API Key)"}
            return

        # 1. Handle Confirmation Flows
        if pending_state != "IDLE" and action_data:
            action_type = action_data.get("action", "")
            if query.lower() in ["accept", "yes", "save", "proceed", "confirm"]:
                # Execute the paused action
                yield {"type": "status", "content": f"Executing {action_type}..."}
                
                if action_type == "ADD_RESOURCE":
                    result = execute_add_resource(self.db, self.user_id, action_data)
                elif action_type == "DELETE_RESOURCE":
                    result = execute_delete_resource(self.db, self.user_id, action_data)
                else:
                    result = {"status": "error", "message": "Unknown action type."}
                    
                yield {"type": "result", "state": "IDLE", "actionData": None, "resources": [], "text": result.get("message")}
                return
                
            elif query.lower() in ["cancel", "no", "reject", "stop"]:
                yield {"type": "result", "state": "IDLE", "actionData": None, "resources": [], "text": "Action cancelled."}
                return
            elif query.lower() in ["modify", "edit"]:
                yield {"type": "result", "state": "AWAITING_MODIFICATION", "actionData": action_data, "resources": [], "text": "What would you like to modify?"}
                return

        # 2. Normal LLM Flow
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in history:
            role = "assistant" if m.get("sender") == "assistant" else "user"
            messages.append({"role": role, "content": m.get("text", "")})
        messages.append({"role": "user", "content": query})

        yield {"type": "status", "content": "Thinking..."}

        tools = get_openai_tools()
        
        # Start streaming from OpenAI
        stream = self.llm.stream_chat(messages, tools=tools)
        
        tool_call_buffer = {}
        full_text = ""
        
        try:
            async for chunk in stream:
                if chunk["type"] == "content":
                    full_text += chunk["content"]
                    yield {"type": "chunk", "content": chunk["content"]}
                
                elif chunk["type"] == "tool_call_chunk":
                    idx = chunk["index"]
                    if idx not in tool_call_buffer:
                        tool_call_buffer[idx] = {"id": chunk["id"], "name": chunk["name"], "arguments": ""}
                    if chunk["arguments"]:
                        tool_call_buffer[idx]["arguments"] += chunk["arguments"]

            # If tool calls were accumulated
            if tool_call_buffer:
                for idx, tc in tool_call_buffer.items():
                    tool_name = tc["name"]
                    try:
                        args = json.loads(tc["arguments"])
                    except:
                        args = {}
                        
                    if tool_name in self.tools_map:
                        yield {"type": "status", "content": f"Executing {tool_name}..."}
                        
                        tool_func = self.tools_map[tool_name]
                        result = tool_func(self.db, self.user_id, args)
                        
                        if result.get("status") == "requires_confirmation":
                            # Pause execution and request confirmation
                            yield {
                                "type": "result",
                                "state": "AWAITING_CONFIRMATION",
                                "actionData": result.get("actionData"),
                                "text": result.get("message", "Confirmation required."),
                                "resources": []
                            }
                            return
                        else:
                            # Safe execution (like search). Feed result back to OpenAI to summarize.
                            messages.append({
                                "role": "assistant",
                                "content": None,
                                "tool_calls": [{
                                    "id": tc["id"],
                                    "type": "function",
                                    "function": {
                                        "name": tool_name,
                                        "arguments": tc["arguments"]
                                    }
                                }]
                            })
                            messages.append({
                                "role": "tool",
                                "tool_call_id": tc["id"],
                                "name": tool_name,
                                "content": json.dumps(result.get("resources", result.get("message", "Success")))
                            })
                            
                            yield {"type": "status", "content": "Summarizing..."}
                            
                            # Stream the follow-up response from OpenAI
                            follow_up_stream = self.llm.stream_chat(messages, tools=tools)
                            summary_text = ""
                            async for followup_chunk in follow_up_stream:
                                if followup_chunk["type"] == "content":
                                    summary_text += followup_chunk["content"]
                                    yield {"type": "chunk", "content": followup_chunk["content"]}
                                    
                            yield {
                                "type": "result",
                                "state": "IDLE",
                                "actionData": None,
                                "text": "", # text was already streamed in chunks
                                "resources": result.get("resources", [])
                            }
                            return
                            
            # No tool calls, just yield the final result
            yield {
                "type": "result",
                "state": "IDLE",
                "actionData": None,
                "text": "", # text was already streamed in chunks
                "resources": []
            }
            
        except Exception as e:
            yield {"type": "error", "content": f"Jarvis encountered an error: {str(e)}"}
