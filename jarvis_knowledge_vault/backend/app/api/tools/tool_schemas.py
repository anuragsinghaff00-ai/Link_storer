from typing import List, Dict, Any

def get_openai_tools() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "search_resources",
                "description": "Search the user's postgres database for resources matching a query, category, or tags.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search term to look for in title, summary, or url. Leave empty if filtering purely by category/tags."
                        },
                        "category": {
                            "type": "string",
                            "description": "Optional category to filter by (e.g., 'Backend', 'DevOps')."
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "add_resource",
                "description": "Prepare to save a new URL/resource to the vault. Requires confirmation.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The URL to save."
                        },
                        "purpose": {
                            "type": "string",
                            "description": "The user's stated purpose for saving this link."
                        },
                        "category": {
                            "type": "string",
                            "description": "A suggested category for this link (e.g. Backend, DevOps)."
                        }
                    },
                    "required": ["url"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "delete_resource",
                "description": "Prepare to delete a specific resource from the vault. Requires confirmation.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The exact title or URL of the resource to delete."
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "create_purpose",
                "description": "Prepare to create a new purpose tag. Requires confirmation.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The name of the new purpose."
                        }
                    },
                    "required": ["name"],
                    "additionalProperties": False
                }
            }
        }
    ]
