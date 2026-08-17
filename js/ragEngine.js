/**
 * RAG Engine - Retrieval-Augmented Generation over User Vault
 * Acts as a proxy to the FastAPI Agent Layer
 */

export class RAGEngine {
  constructor() {
    this.apiBase = "/api/jarvis/chat";
    this.state = "IDLE"; // Client-side state tracking
    this.pendingActionData = null;
  }

  resetState() {
    this.state = "IDLE";
    this.pendingActionData = null;
  }

  async processQueryStream(query, conversationHistory, onEvent) {
    try {
      const response = await fetch(this.apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          history: conversationHistory,
          state: this.state,
          actionData: this.pendingActionData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // keep incomplete chunk in buffer
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const event = JSON.parse(dataStr);
              
              if (event.type === "result") {
                if (event.state) this.state = event.state;
                if (event.state === "IDLE") {
                  this.pendingActionData = null;
                } else if (event.actionData !== undefined) {
                  this.pendingActionData = event.actionData;
                }
              }
              
              if (onEvent) onEvent(event);
            } catch (e) {
              console.error("Failed to parse SSE event:", e, dataStr);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to reach Jarvis Agent:", e);
      if (onEvent) {
        onEvent({
          type: "error",
          content: "Jarvis AI is temporarily unavailable."
        });
      }
    }
  }
}

export const ragEngine = new RAGEngine();
