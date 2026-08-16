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

  /**
   * Main RAG Query Processor (Proxy to Backend)
   * @param {string} query User prompt
   * @param {Array} conversationHistory Past chat turn context
   */
  async processQuery(query, conversationHistory = []) {
    try {
      const response = await fetch(this.apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update local state if the backend returned a new state
      if (data.state) this.state = data.state;
      if (data.actionData) this.pendingActionData = data.actionData;

      return data;
    } catch (e) {
      console.error("Failed to reach Jarvis Agent:", e);
      return {
        text: "I am having trouble connecting to my brain (the Backend Agent Layer). Please ensure the FastAPI server is running.",
        resources: [],
        citations: []
      };
    }
  }
}

export const ragEngine = new RAGEngine();
