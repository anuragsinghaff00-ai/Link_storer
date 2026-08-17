import os
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam

class AIUnavailableError(Exception):
    pass

class AIProvider(ABC):
    @abstractmethod
    async def stream_chat(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        pass

class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str):
        if not api_key:
            raise AIUnavailableError("OPENAI_API_KEY is missing.")
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    async def stream_chat(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        # Filter messages to ensure they match OpenAI's expected structure
        formatted_messages = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if isinstance(content, list):
                # handle complex content
                formatted_messages.append({"role": role, "content": content})
            else:
                formatted_messages.append({"role": role, "content": str(content)})

        kwargs = {
            "model": self.model,
            "messages": formatted_messages,
            "stream": True
        }
        if tools:
            kwargs["tools"] = tools

        try:
            stream = await self.client.chat.completions.create(**kwargs)
            async for chunk in stream:
                delta = chunk.choices[0].delta
                
                # Check for tool calls
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        yield {
                            "type": "tool_call_chunk",
                            "index": tc.index,
                            "id": tc.id,
                            "name": tc.function.name if tc.function else None,
                            "arguments": tc.function.arguments if tc.function else None
                        }
                # Check for content
                if delta.content:
                    yield {
                        "type": "content",
                        "content": delta.content
                    }
        except Exception as e:
            # We don't expose raw exception details directly to the client, but log it internally
            print(f"OpenAI Stream Error: {e}")
            raise AIUnavailableError(f"OpenAI service error.")


def get_llm_provider() -> AIProvider:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise AIUnavailableError("Jarvis AI is temporarily unavailable. (Missing API Key)")
    return OpenAIProvider(api_key)
