import os
import re
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple

class AIProvider(ABC):
    @abstractmethod
    def process_intent(self, query: str, conversation_history: List[Dict[str, Any]]) -> Tuple[Optional[str], Optional[Dict[str, Any]], str]:
        """
        Process the user query and determine the tool to call.
        Returns: (tool_name, tool_arguments, natural_language_response)
        """
        pass

class LocalProvider(AIProvider):
    """
    A lightweight, regex-based intent router that runs locally without any API calls.
    Used as the default free-tier AI.
    """
    def __init__(self):
        # Define basic intent patterns
        self.patterns = {
            "add_resource": [
                r"save this (http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+)",
                r"remember this link (http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+)"
            ],
            "delete_resource": [
                r"delete my (.+) resource[s]?",
                r"delete (?:the )?resource (.+)",
                r"delete this"
            ],
            "search_resources": [
                r"find my (.+) resource[s]?",
                r"show my (.+) resource[s]?",
                r"find resources about (.+)",
                r"search for (.+)"
            ],
            "create_purpose": [
                r"create a purpose called (.+)",
                r"add a purpose named (.+)"
            ],
            "summarize_resources": [
                r"summarize my (.+) resource[s]?",
                r"summarize everything I have about (.+)"
            ]
        }
        
    def _extract_purpose_from_save(self, query: str) -> Optional[str]:
        # Basic heuristic for "save this url for purpose"
        # e.g., "save this https://... for instagram, purpose is wallpaper style"
        match = re.search(r'purpose is ([^,\.]+)', query, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        match2 = re.search(r'under ([\w\s]+)', query, re.IGNORECASE)
        if match2:
            return match2.group(1).strip()
        return None

    def process_intent(self, query: str, conversation_history: List[Dict[str, Any]]) -> Tuple[Optional[str], Optional[Dict[str, Any]], str]:
        query_lower = query.lower().strip()
        
        # Check Add Resource
        for pattern in self.patterns["add_resource"]:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                url = match.group(1)
                purpose = self._extract_purpose_from_save(query_lower)
                args = {"url": url}
                if purpose:
                    args["purpose"] = purpose
                return "add_resource", args, "I detected a save command."

        # Check Delete Resource
        for pattern in self.patterns["delete_resource"]:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                target = match.group(1).strip() if len(match.groups()) > 0 else None
                return "delete_resource", {"query": target}, "I detected a delete command."

        # Check Search
        for pattern in self.patterns["search_resources"]:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                target = match.group(1).strip()
                return "search_resources", {"query": target}, "I will search for that."
                
        # Check Create Purpose
        for pattern in self.patterns["create_purpose"]:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                target = match.group(1).strip()
                return "create_purpose", {"name": target}, "I will create that purpose."

        # Check Summary
        for pattern in self.patterns["summarize_resources"]:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                target = match.group(1).strip()
                return "search_resources", {"query": target, "summarize": True}, "I will summarize those resources."

        # If no explicit action is matched, default to general conversational response
        return None, None, "I am your Jarvis Agent. (Local Mode). I didn't recognize a specific command, but I am ready to help you manage your Knowledge Vault. You can try: 'Find Docker links' or 'Save this https://...'"


class OpenAIProvider(AIProvider):
    """
    Uses OpenAI API for natural language extraction and tool calling.
    """
    def __init__(self, api_key: str):
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
        except ImportError:
            raise RuntimeError("The 'openai' python package is not installed. Please install it to use OpenAIProvider.")

    def process_intent(self, query: str, conversation_history: List[Dict[str, Any]]) -> Tuple[Optional[str], Optional[Dict[str, Any]], str]:
        # To be implemented when OpenAI tool schemas are fully defined.
        # For now, it falls back to a generic message.
        return None, None, "OpenAI Provider is active but tool schemas are pending implementation."

def get_llm_provider() -> AIProvider:
    provider = os.getenv("AI_PROVIDER", "local").lower()
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            return OpenAIProvider(api_key)
        else:
            print("Warning: OpenAI provider selected but OPENAI_API_KEY is not set. Falling back to local.")
    return LocalProvider()
