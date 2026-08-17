/**
 * ChatUI - ChatGPT-style UI controller, session history manager, and card renderer.
 */

import { ragEngine } from "./ragEngine.js";
import { vaultStore } from "./vaultStore.js";

export class ChatUI {
  constructor() {
    this.storageKey = "link_storer_chat_sessions_v1";
    this.sessions = this.loadSessions();
    this.currentSessionId = this.sessions[0]?.id || this.createNewSession();
    this.isStreaming = false;
  }

  loadSessions() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [this.createDefaultSession()];
    try {
      const parsed = JSON.parse(raw);
      return parsed.length ? parsed : [this.createDefaultSession()];
    } catch {
      return [this.createDefaultSession()];
    }
  }

  saveSessions() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
  }

  createDefaultSession() {
    const initialSession = {
      id: "session-" + Date.now(),
      title: "Jarvis AI Assistant",
      createdAt: new Date().toISOString(),
      messages: [
        {
          sender: "assistant",
          text: "👋 **Hello! I am Jarvis, your AI Knowledge Assistant.**\n\nI have direct access **ONLY** to your personal knowledge vault. Ask me anything about your saved links, summaries, notes, or learning roadmaps.\n\n*Try asking:*",
          resources: vaultStore.getAll().slice(0, 3),
          citations: vaultStore.getAll().slice(0, 3).map(r => ({ id: r.id, title: r.title, url: r.url })),
          followUps: [
            "Show me every FastAPI resource",
            "I want to learn Docker",
            "Teach me backend",
            "Which resources haven't I opened recently?"
          ]
        }
      ]
    };
    return initialSession;
  }

  createNewSession() {
    const newSession = {
      id: "session-" + Date.now(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: []
    };
    this.sessions.unshift(newSession);
    this.currentSessionId = newSession.id;
    this.saveSessions();
    return newSession.id;
  }

  getCurrentSession() {
    return this.sessions.find(s => s.id === this.currentSessionId) || this.sessions[0];
  }

  renameSession(sessionId, newTitle) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.title = newTitle;
      this.saveSessions();
    }
  }

  deleteSession(sessionId) {
    if (this.sessions.length <= 1) {
      this.createNewSession();
    }
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = this.sessions[0].id;
    }
    this.saveSessions();
  }

  /**
   * Sends user message, runs RAG engine, and streams response into UI container
   */
  async sendMessage(queryText, containerEl, onFinishCallback) {
    if (!queryText.trim() || this.isStreaming) return;

    const session = this.getCurrentSession();
    
    // Auto-update session title if default "New Chat"
    if (session.title === "New Chat" && session.messages.length === 0) {
      session.title = queryText.slice(0, 28) + (queryText.length > 28 ? "..." : "");
    }

    // 1. Append User Message
    const userMsg = {
      sender: "user",
      text: queryText,
      timestamp: new Date().toISOString()
    };
    session.messages.push(userMsg);
    this.saveSessions();

    this.renderMessageBubble(userMsg, containerEl);

    // 2. Prepare Assistant Bubble
    this.isStreaming = true;
    const historyContext = session.messages.map(m => ({ text: m.text, sender: m.sender }));
    
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble assistant-bubble";
    
    const readAloudBtnId = "read-aloud-" + Date.now();
    bubble.innerHTML = `
      <div class="bubble-header">
        <span class="bubble-avatar">⚡</span> 
        <strong>Jarvis</strong>
        <span class="status-indicator" style="font-size: 0.8rem; color: var(--text-muted); margin-left: 10px;">Thinking...</span>
        <button class="btn-read-aloud" id="${readAloudBtnId}" title="Read Aloud" style="display:none;" data-text="">🔊</button>
      </div>
      <div class="bubble-content markdown-body">
        <div class="streaming-text"></div>
      </div>
    `;

    const textSpan = bubble.querySelector(".streaming-text");
    const content = bubble.querySelector(".bubble-content");
    const statusSpan = bubble.querySelector(".status-indicator");
    const readAloudBtn = bubble.getElementById(readAloudBtnId);
    containerEl.appendChild(bubble);
    containerEl.scrollTop = containerEl.scrollHeight;

    let assistantFullText = "";
    let finalActionType = null;
    let finalActionData = null;
    let finalResources = [];
    
    await ragEngine.processQueryStream(queryText, historyContext, (event) => {
      if (event.type === "status") {
        statusSpan.innerText = event.content;
      } else if (event.type === "chunk") {
        statusSpan.innerText = "Generating...";
        assistantFullText += event.content;
        textSpan.innerHTML = this.formatMarkdown(assistantFullText);
        containerEl.scrollTop = containerEl.scrollHeight;
      } else if (event.type === "result") {
        statusSpan.innerText = "";
        if (event.text) {
            assistantFullText += event.text;
            textSpan.innerHTML = this.formatMarkdown(assistantFullText);
        }
        
        finalActionType = event.state === "AWAITING_CONFIRMATION" ? (event.actionData?.action || null) : null;
        finalActionData = event.actionData;
        finalResources = event.resources || [];
        
        // Render Action Cards
        if (finalActionType) {
          content.appendChild(this.renderActionCard(finalActionType, finalActionData));
        }
        
        // Render Resources
        if (finalResources && finalResources.length > 0) {
          const cardSection = this.renderResourceCardsSection(finalResources, event.usefulNotes || []);
          content.appendChild(cardSection);
        }
        
        // Citations / FollowUps omitted for brevity in stream end block, can be added if needed
        containerEl.scrollTop = containerEl.scrollHeight;
      } else if (event.type === "error") {
        statusSpan.innerText = "Error";
        assistantFullText += `\n\n**Error:** ${event.content}`;
        textSpan.innerHTML = this.formatMarkdown(assistantFullText);
      }
    });

    const assistantMsg = {
      sender: "assistant",
      text: assistantFullText,
      resources: finalResources,
      actionType: finalActionType,
      actionData: finalActionData,
      timestamp: new Date().toISOString()
    };
    
    // Enable Read Aloud now that stream is done
    if (readAloudBtn) {
        readAloudBtn.dataset.text = encodeURIComponent(assistantFullText);
        readAloudBtn.style.display = 'inline-block';
    }

    session.messages.push(assistantMsg);
    this.saveSessions();
    this.isStreaming = false;

    if (window.voiceEngine) {
      window.voiceEngine.speak(assistantMsg.text);
    }

    if (onFinishCallback) onFinishCallback();
  }

  renderMessageBubble(msg, containerEl) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${msg.sender === "user" ? "user-bubble" : "assistant-bubble"}`;
    
    // Add "Read Aloud" button for accessibility
    const readAloudBtn = msg.sender === "assistant" ? `<button class="btn-read-aloud" title="Read Aloud" data-text="${encodeURIComponent(msg.text)}">🔊</button>` : '';

    if (msg.sender === "user") {
      bubble.innerHTML = `<div class="bubble-content">${this.escapeHtml(msg.text)}</div>`;
    } else {
      bubble.innerHTML = `
        <div class="bubble-header">
          <span class="bubble-avatar">⚡</span> 
          <strong>Jarvis</strong>
          ${readAloudBtn}
        </div>
        <div class="bubble-content markdown-body">
          ${this.formatMarkdown(msg.text)}
        </div>
      `;

      if (msg.actionType) {
        bubble.appendChild(this.renderActionCard(msg.actionType, msg.actionData));
      }

      if (msg.resources && msg.resources.length > 0) {
        const cardSection = this.renderResourceCardsSection(msg.resources, msg.usefulNotes);
        bubble.appendChild(cardSection);
      }
      
      if (msg.citations && msg.citations.length > 0) {
        const citationBox = this.renderCitationsSection(msg.citations);
        bubble.appendChild(citationBox);
      }

      if (msg.followUps && msg.followUps.length > 0) {
        const followUpBox = this.renderFollowUpsSection(msg.followUps);
        bubble.appendChild(followUpBox);
      }
    }
    
    containerEl.appendChild(bubble);
    bubble.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  renderActionCard(actionType, actionData) {
    const container = document.createElement("div");
    container.className = "action-card-container";

    let html = "";
    if (actionType === "CONFIRM_DELETE_SINGLE" || actionType === "CONFIRM_DELETE_MULTI" || actionType === "DELETE_RESOURCE") {
      const isMulti = Array.isArray(actionData);
      html = `
        <div class="action-card">
          <h4>⚠️ Confirm Deletion</h4>
          <p>${isMulti ? `Delete ${actionData.length} items.` : `Delete resource: ${this.escapeHtml(actionData.query || actionData.title || 'Unknown')}`}</p>
          <div class="action-card-buttons">
            <button class="btn-action-card accept" data-command="accept">🟢 Accept</button>
            <button class="btn-action-card reject" data-command="reject">🔴 Reject</button>
            <button class="btn-action-card cancel" data-command="cancel">⚪ Cancel</button>
          </div>
        </div>
      `;
    } else if (actionType === "CONFIRM_SAVE" || actionType === "CONFIRM_SAVE_NEW" || actionType === "ADD_RESOURCE") {
      const resources = Array.isArray(actionData) ? actionData : [actionData];
      
      let resourceHtml = resources.map((res, index) => `
        <div class="new-resource-preview" data-index="${index}" style="margin-bottom: 12px; font-size: 0.9rem; border-left: 3px solid var(--accent-blue); padding-left: 10px; width: 100%; box-sizing: border-box; overflow: hidden;">
          ${resources.length > 1 ? `<strong>Resource ${index + 1}</strong><br>` : ''}
          <div style="display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 4px; align-items: center; width: 100%;">
            <span style="color: var(--text-muted);">Website</span> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(res.websiteName || "Web")}</span>
            <span style="color: var(--text-muted);">Title</span> <input type="text" class="edit-title" value="${this.escapeHtml(res.title || "Auto Generated")}" style="width: 100%; min-width: 0; box-sizing: border-box; padding: 4px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;">
            <span style="color: var(--text-muted);">URL</span> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><a href="${this.escapeHtml(res.url || '')}" target="_blank" style="color: var(--accent-blue);">${this.escapeHtml(res.url || '')}</a></span>
            <span style="color: var(--text-muted);">Purpose</span> <input type="text" class="edit-purpose" value="${this.escapeHtml(res.purpose || "-")}" style="width: 100%; min-width: 0; box-sizing: border-box; padding: 4px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;">
            <span style="color: var(--text-muted);">Category</span> <input type="text" class="edit-category" value="${this.escapeHtml(res.category || "-")}" style="width: 100%; min-width: 0; box-sizing: border-box; padding: 4px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;">
            <span style="color: var(--text-muted);">Summary</span> <input type="text" class="edit-summary" value="${this.escapeHtml(res.summary || "-")}" style="width: 100%; min-width: 0; box-sizing: border-box; padding: 4px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px; font-style: italic;">
            <span style="color: var(--text-muted);">Tags</span> <input type="text" class="edit-tags" value="${res.tags ? res.tags.join(", ") : ""}" style="width: 100%; min-width: 0; box-sizing: border-box; padding: 4px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px;">
            <span style="color: var(--text-muted);">Date</span> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(res.date || new Date().toLocaleDateString())}</span>
          </div>
        </div>
      `).join("");

      html = `
        <div class="action-card">
          <h4>📥 Confirm Save</h4>
          <p>Please review the details before saving.</p>
          <div style="max-height: 250px; overflow-y: auto; margin-bottom: 15px;">
            ${resourceHtml}
          </div>
          <div class="action-card-buttons">
            <button class="btn-action-card accept" data-command="accept">🟢 Save</button>
            <button class="btn-action-card modify" data-command="modify">🟡 Modify</button>
            <button class="btn-action-card preview" data-command="preview">🔵 Preview</button>
            <button class="btn-action-card reject" data-command="reject">🔴 Cancel</button>
          </div>
        </div>
      `;
    } else if (actionType === "CREATE_PURPOSE") {
      html = `
        <div class="action-card">
          <h4>🎯 Confirm New Purpose</h4>
          <p>Create Purpose: <strong>${this.escapeHtml(actionData.name)}</strong></p>
          <div class="action-card-buttons">
            <button class="btn-action-card accept" data-command="accept">🟢 Accept</button>
            <button class="btn-action-card reject" data-command="reject">🔴 Reject</button>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    return container;
  }

  async renderAssistantStream(msg, containerEl) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble assistant-bubble";

    // Add "Read Aloud" button for accessibility
    const readAloudBtn = `<button class="btn-read-aloud" title="Read Aloud" data-text="${encodeURIComponent(msg.text)}">🔊</button>`;

    bubble.innerHTML = `
      <div class="bubble-header">
        <span class="bubble-avatar">⚡</span> 
        <strong>Jarvis</strong>
        ${readAloudBtn}
      </div>
      <div class="bubble-content markdown-body">
        <div class="streaming-text"></div>
      </div>
    `;

    const textSpan = bubble.querySelector(".streaming-text");
    const content = bubble.querySelector(".bubble-content");
    containerEl.appendChild(bubble);

    // Simulate word-by-word streaming effect
    const fullText = msg.text;
    const words = fullText.split(" ");
    let displayedText = "";

    for (let i = 0; i < words.length; i++) {
      displayedText += (i === 0 ? "" : " ") + words[i];
      textSpan.innerHTML = this.formatMarkdown(displayedText);
      containerEl.scrollTop = containerEl.scrollHeight;
      await new Promise(r => setTimeout(r, 18));
    }

    // Render Cards & Citations after text streaming finishes
    if (msg.actionType) {
      content.appendChild(this.renderActionCard(msg.actionType, msg.actionData));
    }
    if (msg.resources && msg.resources.length > 0) {
      const cardSection = this.renderResourceCardsSection(msg.resources, msg.usefulNotes);
      content.appendChild(cardSection);
    }

    if (msg.citations && msg.citations.length > 0) {
      const citationBox = this.renderCitationsSection(msg.citations);
      content.appendChild(citationBox);
    }

    if (msg.followUps && msg.followUps.length > 0) {
      const followUpBox = this.renderFollowUpsSection(msg.followUps);
      content.appendChild(followUpBox);
    }

    containerEl.scrollTop = containerEl.scrollHeight;
  }

  renderResourceCardsSection(resources, usefulNotes = []) {
    const section = document.createElement("div");
    section.className = "chat-resources-wrapper";

    const header = document.createElement("div");
    header.className = "chat-resources-header";
    header.innerHTML = `<span>⭐ Saved Vault Resources (${resources.length})</span>`;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "chat-resources-grid";

    resources.forEach(res => {
      const noteObj = usefulNotes.find(n => n.id === res.id);
      const card = this.createResourceCardElement(res, noteObj?.whyUseful);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  createResourceCardElement(res, whyUseful) {
    const card = document.createElement("div");
    card.className = `vault-card ${res.isFavorite ? "is-favorite" : ""} ${res.isArchived ? "is-archived" : ""}`;
    card.dataset.id = res.id;

    const formattedDate = new Date(res.dateAdded).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    card.innerHTML = `
      <div class="card-header">
        <div class="website-badge">
          <span class="website-icon">${res.favicon || "🔗"}</span>
          <span class="website-name">${res.websiteName}</span>
        </div>
        <div class="card-media-type">${(res.mediaType || "website").toUpperCase()}</div>
      </div>
      <h4 class="card-title">
        <a href="${res.url}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(res.title)}</a>
      </h4>
      <p class="card-summary">${this.escapeHtml(res.summary)}</p>
      <div class="card-purpose">🎯 <strong>Purpose:</strong> ${this.escapeHtml(res.purpose)}</div>
      ${whyUseful ? `<div class="card-why-useful">${this.formatMarkdown(whyUseful)}</div>` : ""}
      <div class="card-tags">
        ${res.tags.map(t => `<span class="tag-badge">#${t}</span>`).join("")}
      </div>
      <div class="card-footer">
        <span class="card-date">📅 ${formattedDate}</span>
        <div class="card-actions">
          <button class="btn-card-action btn-open" data-id="${res.id}" title="Open Link">🔗 Open</button>
          <button class="btn-card-action btn-edit-card" data-id="${res.id}" title="Edit Link">✏️ Edit</button>
          <button class="btn-card-action btn-fav ${res.isFavorite ? "active" : ""}" data-id="${res.id}" title="Favorite">⭐ ${res.isFavorite ? "Saved" : "Fav"}</button>
          <button class="btn-card-action btn-archive ${res.isArchived ? "active" : ""}" data-id="${res.id}" title="Archive">📦 ${res.isArchived ? "Unarchive" : "Archive"}</button>
          <button class="btn-card-action btn-delete-card" data-id="${res.id}" title="Delete Link">🗑️ Delete</button>
          <button class="btn-card-action btn-copy" data-url="${res.url}" title="Copy Link">📋 Copy</button>
          <button class="btn-card-action btn-details" data-id="${res.id}" title="View Details">ℹ️ Details</button>
        </div>
      </div>
    `;

    return card;
  }

  renderCitationsSection(citations) {
    const box = document.createElement("div");
    box.className = "chat-citations-box";

    let html = `<div class="citations-title">📌 Sources & Citations:</div><ul class="citations-list">`;
    citations.forEach(c => {
      html += `<li><a href="${c.url}" target="_blank" rel="noopener noreferrer">• ${this.escapeHtml(c.title)}</a></li>`;
    });
    html += `</ul>`;

    box.innerHTML = html;
    return box;
  }

  renderFollowUpsSection(followUps) {
    const box = document.createElement("div");
    box.className = "chat-followups-box";

    const title = document.createElement("div");
    title.className = "followups-title";
    title.innerText = "💡 Suggested Follow-ups:";
    box.appendChild(title);

    const chipsWrapper = document.createElement("div");
    chipsWrapper.className = "followups-chips";

    followUps.forEach(text => {
      const chip = document.createElement("button");
      chip.className = "followup-chip";
      chip.innerText = text;
      chip.dataset.prompt = text;
      chipsWrapper.appendChild(chip);
    });

    box.appendChild(chipsWrapper);
    return box;
  }

  formatMarkdown(text) {
    if (!text) return "";
    let html = this.escapeHtml(text);

    // Code blocks with syntax highlighting & copy button
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || "code";
      return `<div class="code-block-wrapper">
        <div class="code-header">
          <span>${language.toUpperCase()}</span>
          <button class="btn-copy-code" data-code="${encodeURIComponent(code)}">Copy Code</button>
        </div>
        <pre><code class="language-${language}">${code.trim()}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold text
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic text
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Markdown Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Headers #, ##, ###
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Linebreaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export const chatUI = new ChatUI();
