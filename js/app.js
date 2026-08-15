/**
 * App - Central Application Controller
 */

import { vaultStore } from "./vaultStore.js";
import { ragEngine } from "./ragEngine.js";
import { aiCapabilities } from "./aiCapabilities.js";
import { chatUI } from "./chatUI.js";
import { voiceEngine } from "./voiceEngine.js";

document.addEventListener("DOMContentLoaded", () => {
  // Expose engine instances globally for chatUI to use
  window.voiceEngine = voiceEngine;
  window.ragEngine = ragEngine;

  // --- DOM ELEMENTS ---
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const drawerToggle = document.getElementById("drawer-toggle");
  const sidebar = document.getElementById("sidebar");
  const navItems = document.querySelectorAll(".nav-item");
  const viewContainers = document.querySelectorAll(".view-container");
  const viewTitle = document.getElementById("view-title");

  // Chat Elements
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessagesContainer = document.getElementById("chat-messages-container");
  const btnNewChat = document.getElementById("btn-new-chat");
  const historyListEl = document.getElementById("chat-history-list");
  const historySearchInput = document.getElementById("history-search-input");
  const promptChips = document.querySelectorAll(".prompt-chip");
  const btnVoice = document.getElementById("btn-voice");
  const voiceStatus = document.getElementById("voice-status");
  const voiceStatusText = voiceStatus?.querySelector(".status-text");
  const btnMuteToggle = document.getElementById("btn-mute-toggle");

  // Vault Elements
  const vaultCountBadge = document.getElementById("vault-count-badge");
  const vaultCardsGrid = document.getElementById("vault-cards-grid");
  const vaultFilterInput = document.getElementById("vault-filter-input");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const btnAddResourceModal = document.getElementById("btn-add-resource-modal");
  const addResourceModal = document.getElementById("add-resource-modal");
  const btnCloseAddModal = document.getElementById("btn-close-add-modal");
  const btnCancelAdd = document.getElementById("btn-cancel-add");
  const addResourceForm = document.getElementById("add-resource-form");

  const detailsModal = document.getElementById("details-modal");
  const detailsModalContent = document.getElementById("details-modal-content");

  // State
  let currentView = "chat";
  let activeVaultFilter = "all";

  // --- TOAST NOTIFICATION ---
  function showToast(message) {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.style.position = "fixed";
      toastContainer.style.bottom = "20px";
      toastContainer.style.right = "20px";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.style.background = "var(--bg-card)";
    toast.style.color = "var(--text-main)";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "var(--shadow-lg)";
    toast.style.borderLeft = "4px solid var(--accent-blue)";
    toast.style.marginBottom = "10px";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.3s ease";
    toast.innerText = message;

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- VOICE ENGINE WIRING ---
  voiceEngine.onWakeWord = () => {
    chatInput.placeholder = "Listening...";
  };

  voiceEngine.onCommand = (cmd) => {
    chatInput.placeholder = "Ask Jarvis or type 'Save this https://...' to store a link...";
    chatInput.value = cmd;
    switchView("chat");
    chatForm.requestSubmit();
  };

  voiceEngine.onInterruption = (int) => {
    chatInput.placeholder = "Ask Jarvis or type 'Save this https://...' to store a link...";
    showToast(`Voice interrupted (${int}).`);
  };

  document.addEventListener("jarvis-listening-state", (e) => {
    if (!voiceStatus || !voiceStatusText) return;
    if (e.detail) {
      voiceStatus.classList.add("listening");
      voiceStatusText.innerText = "Listening...";
      if (btnVoice) btnVoice.classList.add("recording");
    } else {
      voiceStatus.classList.remove("listening");
      voiceStatusText.innerText = voiceEngine.isSpeaking ? "Speaking..." : "Idle";
      if (btnVoice) btnVoice.classList.remove("recording");
    }
  });

  document.addEventListener("jarvis-speaking-state", (e) => {
    if (!voiceStatus || !voiceStatusText) return;
    if (e.detail) {
      voiceStatus.classList.add("speaking");
      voiceStatusText.innerText = "Speaking...";
    } else {
      voiceStatus.classList.remove("speaking");
      voiceStatusText.innerText = voiceEngine.isListening ? "Listening..." : "Idle";
    }
  });

  // Load Voices into Settings dropdown
  setTimeout(() => {
    const voiceSelect = document.getElementById("setting-voice-select");
    if (voiceSelect) {
      voiceEngine.voices.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.voiceURI;
        opt.innerText = `${v.name} (${v.lang})`;
        if (v.voiceURI === voiceEngine.settings.voiceURI) opt.selected = true;
        voiceSelect.appendChild(opt);
      });
    }
  }, 1000);

  // Wire Settings UI
  const setEnabled = document.getElementById("setting-voice-enabled");
  const setAlwaysListen = document.getElementById("setting-always-listen");
  const setWakeWord = document.getElementById("setting-wake-word");
  const setVoice = document.getElementById("setting-voice-select");
  const setSpeed = document.getElementById("setting-speed");
  const setPitch = document.getElementById("setting-pitch");

  // Mute button logic
  function updateMuteButtonState() {
    if (!btnMuteToggle) return;
    const isEnabled = voiceEngine.settings.enabled;
    btnMuteToggle.innerText = isEnabled ? "🔊" : "🔇";
    btnMuteToggle.title = isEnabled ? "Mute Jarvis" : "Unmute Jarvis";
  }

  if (btnMuteToggle) {
    updateMuteButtonState();
    btnMuteToggle.addEventListener("click", () => {
      const nextEnabled = !voiceEngine.settings.enabled;
      voiceEngine.saveSettings({ enabled: nextEnabled });
      updateMuteButtonState();
      if (setEnabled) {
        setEnabled.checked = nextEnabled;
      }
      showToast(nextEnabled ? "Jarvis voice enabled." : "Jarvis voice muted.");
      if (!nextEnabled && voiceEngine.isSpeaking) {
        voiceEngine.stopSpeaking();
      }
    });
  }

  if (setEnabled) {
    setEnabled.checked = voiceEngine.settings.enabled;
    setAlwaysListen.checked = voiceEngine.settings.alwaysListening;
    setWakeWord.value = voiceEngine.settings.wakeWord;
    setSpeed.value = voiceEngine.settings.speed;
    setPitch.value = voiceEngine.settings.pitch;

    setEnabled.addEventListener("change", (e) => {
      voiceEngine.saveSettings({ enabled: e.target.checked });
      updateMuteButtonState();
      if (!e.target.checked && voiceEngine.isSpeaking) {
        voiceEngine.stopSpeaking();
      }
    });
    setAlwaysListen.addEventListener("change", (e) => voiceEngine.toggleAlwaysListening(e.target.checked));
    setWakeWord.addEventListener("change", (e) => voiceEngine.saveSettings({ wakeWord: e.target.value }));
    setVoice.addEventListener("change", (e) => voiceEngine.saveSettings({ voiceURI: e.target.value }));
    
    setSpeed.addEventListener("input", (e) => {
      document.getElementById("val-speed").innerText = e.target.value;
      voiceEngine.saveSettings({ speed: parseFloat(e.target.value) });
    });
    setPitch.addEventListener("input", (e) => {
      document.getElementById("val-pitch").innerText = e.target.value;
      voiceEngine.saveSettings({ pitch: parseFloat(e.target.value) });
    });
  }

  // --- INITIALIZATION ---
  initTheme();
  renderVaultBadge();
  renderChatHistory();
  renderActiveChatSession();

  // --- THEME ENGINE ---
  function initTheme() {
    const savedTheme = localStorage.getItem("link_storer_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggle.innerText = savedTheme === "dark" ? "🌙" : "☀️";
  }

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("link_storer_theme", next);
    themeToggle.innerText = next === "dark" ? "🌙" : "☀️";
  });

  // --- MOBILE DRAWER TOGGLE ---
  drawerToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // --- NAVIGATION CONTROLLER ---
  navItems.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetView = btn.dataset.view;
      switchView(targetView);
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("open");
      }
    });
  });

  function switchView(viewName) {
    currentView = viewName;
    navItems.forEach(b => b.classList.toggle("active", b.dataset.view === viewName));
    viewContainers.forEach(c => c.classList.toggle("active", c.id === `view-${viewName}`));

    const titles = {
      chat: "AI Knowledge Assistant",
      vault: "Vault Resource Library",
      graph: "Knowledge Graph & Topic Dependencies",
      quiz: "AI Quiz & Active Recall Runner",
      insights: "AI Analytics & Weekly Review",
      voicesettings: "Voice & Assistant Settings"
    };

    viewTitle.innerText = titles[viewName] || "AI Assistant";

    if (viewName === "vault") renderVaultGrid();
    if (viewName === "graph") renderKnowledgeGraph();
    if (viewName === "quiz") renderQuizRunner();
    if (viewName === "insights") renderAIInsights();
  }

  function renderVaultBadge() {
    const count = vaultStore.getAll().length;
    vaultCountBadge.innerText = `📚 ${count} Saved Items`;
  }

  // --- CHAT SESSION MANAGEMENT ---
  btnNewChat.addEventListener("click", () => {
    chatUI.createNewSession();
    renderChatHistory();
    renderActiveChatSession();
    switchView("chat");
  });

  function renderChatHistory(filterQuery = "") {
    historyListEl.innerHTML = "";
    const sessions = chatUI.loadSessions();

    const filtered = sessions.filter(s => s.title.toLowerCase().includes(filterQuery.toLowerCase()));

    filtered.forEach(session => {
      const item = document.createElement("div");
      item.className = `history-item ${session.id === chatUI.currentSessionId ? "active" : ""}`;

      const titleSpan = document.createElement("span");
      titleSpan.className = "history-item-title";
      titleSpan.innerText = session.title;
      titleSpan.addEventListener("click", () => {
        chatUI.currentSessionId = session.id;
        renderChatHistory();
        renderActiveChatSession();
        switchView("chat");
      });

      const actions = document.createElement("div");
      actions.className = "history-actions";

      const renameBtn = document.createElement("button");
      renameBtn.className = "btn-history-action";
      renameBtn.innerHTML = "✏️";
      renameBtn.title = "Rename Chat";
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const newTitle = prompt("Enter new chat title:", session.title);
        if (newTitle && newTitle.trim()) {
          chatUI.renameSession(session.id, newTitle.trim());
          renderChatHistory();
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-history-action";
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.title = "Delete Chat";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chatUI.deleteSession(session.id);
        renderChatHistory();
        renderActiveChatSession();
        showToast(`Chat "${session.title}" deleted.`);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(titleSpan);
      item.appendChild(actions);
      historyListEl.appendChild(item);
    });
  }

  historySearchInput.addEventListener("input", (e) => {
    renderChatHistory(e.target.value);
  });

  function renderActiveChatSession() {
    chatMessagesContainer.innerHTML = "";
    const session = chatUI.getCurrentSession();
    session.messages.forEach(msg => {
      chatUI.renderMessageBubble(msg, chatMessagesContainer);
    });
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // --- CHAT SUBMIT & QUICK PROMPTS ---
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    chatInput.value = "";
    chatUI.sendMessage(query, chatMessagesContainer, () => {
      renderChatHistory();
      renderVaultBadge();
    });
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.dataset.prompt;
      chatInput.value = prompt;
      switchView("chat");
      chatForm.requestSubmit();
    });
  });

  // --- VOICE COMMAND MANUAL TRIGGER ---
  if (btnVoice) {
    btnVoice.addEventListener("click", () => {
      if (window.voiceEngine) {
        window.voiceEngine.triggerListen();
      }
    });
  }

  // Global Event Delegation for Cards Action Buttons inside Chat and Vault
  document.addEventListener("click", (e) => {
    // Follow-up prompt chip click
    const followupChip = e.target.closest(".followup-chip");
    if (followupChip) {
      const promptText = followupChip.dataset.prompt;
      if (promptText) {
        chatInput.value = promptText;
        switchView("chat");
        chatForm.requestSubmit();
      }
    }

    // Read Aloud button
    const readAloudBtn = e.target.closest(".btn-read-aloud");
    if (readAloudBtn) {
      const text = decodeURIComponent(readAloudBtn.dataset.text || "");
      if (window.voiceEngine) {
        window.voiceEngine.speak(text);
      }
    }

    // Action Card button
    const actionCardBtn = e.target.closest(".btn-action-card");
    if (actionCardBtn) {
      const command = actionCardBtn.dataset.command;
      if (command) {
        // If it's a save action, sync the input fields back to ragEngine before submitting
        if (command === "accept" && window.ragEngine && window.ragEngine.state === "AWAITING_NEW_RESOURCE_CONFIRMATION") {
          const actionCard = actionCardBtn.closest(".action-card");
          if (actionCard) {
            const previews = actionCard.querySelectorAll(".new-resource-preview");
            const updatedResources = window.ragEngine.pendingActionData.resources || [];
            
            previews.forEach((preview, idx) => {
              const res = updatedResources[idx];
              if (res) {
                const titleInput = preview.querySelector(".edit-title");
                const purposeInput = preview.querySelector(".edit-purpose");
                const categoryInput = preview.querySelector(".edit-category");
                const summaryInput = preview.querySelector(".edit-summary");
                const tagsInput = preview.querySelector(".edit-tags");
                
                if (titleInput) res.title = titleInput.value.trim();
                if (purposeInput) res.purpose = purposeInput.value.trim();
                if (categoryInput) res.category = categoryInput.value.trim();
                if (summaryInput) res.summary = summaryInput.value.trim();
                if (tagsInput) res.tags = tagsInput.value.split(",").map(t => t.trim()).filter(Boolean);
              }
            });
            window.ragEngine.pendingActionData.resources = updatedResources;
          }
        }

        chatInput.value = command;
        switchView("chat");
        chatForm.requestSubmit();
      }
    }

    // Code copy button click
    const copyCodeBtn = e.target.closest(".btn-copy-code");
    if (copyCodeBtn) {
      const code = decodeURIComponent(copyCodeBtn.dataset.code || "");
      navigator.clipboard.writeText(code);
      const originalText = copyCodeBtn.innerText;
      copyCodeBtn.innerText = "Copied! ✓";
      setTimeout(() => (copyCodeBtn.innerText = originalText), 2000);
    }

    // Card Action: Open Link
    const openBtn = e.target.closest(".btn-open");
    if (openBtn) {
      const resId = openBtn.dataset.id;
      if (resId) {
        vaultStore.markOpened(resId);
        const res = vaultStore.getById(resId);
        if (res?.url) window.open(res.url, "_blank");
      }
    }

    // Card Action: Favorite Toggle
    const favBtn = e.target.closest(".btn-fav");
    if (favBtn) {
      const resId = favBtn.dataset.id;
      const res = vaultStore.getById(resId);
      if (res) {
        vaultStore.update(resId, { isFavorite: !res.isFavorite });
        favBtn.classList.toggle("active");
        favBtn.innerText = !res.isFavorite ? "⭐ Saved" : "⭐ Fav";
        if (currentView === "vault") renderVaultGrid();
      }
    }

    // Card Action: Archive Toggle
    const archiveBtn = e.target.closest(".btn-archive");
    if (archiveBtn) {
      const resId = archiveBtn.dataset.id;
      const res = vaultStore.getById(resId);
      if (res) {
        vaultStore.update(resId, { isArchived: !res.isArchived });
        if (currentView === "vault") renderVaultGrid();
      }
    }

    // Card Action: Delete Link
    const el = e.target instanceof Element ? e.target : e.target.parentElement;
    const deleteBtn = el?.closest(".btn-delete-card");
    if (deleteBtn) {
      const resId = deleteBtn.dataset.id;
      const res = vaultStore.getById(resId);
      if (res) {
        vaultStore.delete(resId);
        renderVaultBadge();
        if (currentView === "vault") renderVaultGrid();
        
        // Remove card element from DOM visually
        const cardEl = deleteBtn.closest(".vault-card");
        if (cardEl) {
          cardEl.style.transform = "scale(0.9)";
          cardEl.style.opacity = "0";
          setTimeout(() => cardEl.remove(), 250);
        }
        showToast(`Deleted "${res.title}" from vault.`);
      }
    }

    // Card Action: Copy URL
    const copyUrlBtn = e.target.closest(".btn-copy");
    if (copyUrlBtn) {
      const url = copyUrlBtn.dataset.url;
      if (url) {
        navigator.clipboard.writeText(url);
        copyUrlBtn.innerText = "Copied! ✓";
        setTimeout(() => (copyUrlBtn.innerText = "📋 Copy"), 2000);
      }
    }

    // Card Action: View Details
    const detailsBtn = e.target.closest(".btn-details");
    if (detailsBtn) {
      const resId = detailsBtn.dataset.id;
      if (resId) showResourceDetails(resId);
    }

    // Card Action: Edit
    const editBtn = e.target.closest(".btn-edit-card");
    if (editBtn) {
      const resId = editBtn.dataset.id;
      const res = vaultStore.getById(resId);
      if (res) {
        document.getElementById("edit-id").value = res.id;
        document.getElementById("edit-url").value = res.url || "";
        document.getElementById("edit-title").value = res.title || "";
        document.getElementById("edit-category").value = res.category || "";
        document.getElementById("edit-purpose").value = res.purpose || "";
        document.getElementById("edit-tags").value = res.tags ? res.tags.join(", ") : "";
        document.getElementById("edit-resource-modal").classList.add("active");
      }
    }
  });

  // --- VAULT VIEW & FILTERING ---
  vaultFilterInput.addEventListener("input", () => renderVaultGrid());

  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeVaultFilter = tab.dataset.filter;
      renderVaultGrid();
    });
  });

  function renderVaultGrid() {
    vaultCardsGrid.innerHTML = "";
    let items = vaultStore.getAll();
    const query = vaultFilterInput.value.trim().toLowerCase();

    if (activeVaultFilter === "favorite") items = items.filter(i => i.isFavorite);
    else if (activeVaultFilter === "archived") items = items.filter(i => i.isArchived);
    else if (activeVaultFilter === "article") items = items.filter(i => i.mediaType === "article");
    else if (activeVaultFilter === "video") items = items.filter(i => i.mediaType === "video");
    else if (activeVaultFilter === "repository") items = items.filter(i => i.mediaType === "repository");
    else items = items.filter(i => !i.isArchived); // Hide archived by default in "all"

    if (query) {
      items = items.filter(i => 
        i.title.toLowerCase().includes(query) ||
        i.summary.toLowerCase().includes(query) ||
        i.tags.some(t => t.toLowerCase().includes(query)) ||
        i.category.toLowerCase().includes(query)
      );
    }

    if (items.length === 0) {
      vaultCardsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        No saved resources match the current filter.
      </div>`;
      return;
    }

    items.forEach(res => {
      const card = chatUI.createResourceCardElement(res);
      vaultCardsGrid.appendChild(card);
    });
  }

  // --- ADD RESOURCE MODAL ---
  btnAddResourceModal.addEventListener("click", () => addResourceModal.classList.add("active"));
  btnCloseAddModal.addEventListener("click", () => addResourceModal.classList.remove("active"));
  btnCancelAdd.addEventListener("click", () => addResourceModal.classList.remove("active"));

  addResourceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = document.getElementById("add-url").value;
    const title = document.getElementById("add-title").value;
    const category = document.getElementById("add-category").value;
    const purpose = document.getElementById("add-purpose").value;
    const tagsRaw = document.getElementById("add-tags").value;

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : ["Saved"];

    const newRes = vaultStore.add({
      title: title || "New Saved Resource",
      url: url,
      category: category,
      purpose: purpose || "General learning and reference",
      tags: tags,
      summary: "Newly added resource saved to your personal knowledge vault."
    });

    addResourceModal.classList.remove("active");
    addResourceForm.reset();
    renderVaultBadge();
    if (currentView === "vault") renderVaultGrid();

    // Trigger confirmation chat bubble
    chatUI.sendMessage(`Save this ${url}`, chatMessagesContainer, () => renderChatHistory());
    switchView("chat");
  });

  // --- EDIT RESOURCE MODAL ---
  const editResourceModal = document.getElementById("edit-resource-modal");
  const btnCloseEditModal = document.getElementById("btn-close-edit-modal");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const editResourceForm = document.getElementById("edit-resource-form");

  if (btnCloseEditModal) btnCloseEditModal.addEventListener("click", () => editResourceModal.classList.remove("active"));
  if (btnCancelEdit) btnCancelEdit.addEventListener("click", () => editResourceModal.classList.remove("active"));

  if (editResourceForm) {
    editResourceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-id").value;
      const url = document.getElementById("edit-url").value;
      const title = document.getElementById("edit-title").value;
      const category = document.getElementById("edit-category").value;
      const purpose = document.getElementById("edit-purpose").value;
      const tagsRaw = document.getElementById("edit-tags").value;

      const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : ["Saved"];

      vaultStore.update(id, {
        title: title || "Saved Resource",
        url: url,
        category: category,
        purpose: purpose,
        tags: tags
      });

      editResourceModal.classList.remove("active");
      editResourceForm.reset();
      renderVaultBadge();
      if (currentView === "vault") renderVaultGrid();
      showToast(`Updated resource "${title}".`);
    });
  }

  // --- RESOURCE DETAILS MODAL ---
  function showResourceDetails(resId) {
    const res = vaultStore.getById(resId);
    if (!res) return;

    detailsModalContent.innerHTML = `
      <div class="modal-header">
        <h3>ℹ️ Resource Metadata & Notes</h3>
        <button class="btn-close-modal" id="btn-close-details">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <span class="website-badge">${res.favicon || "🔗"} ${res.websiteName}</span>
          <h2 style="font-size: 1.2rem; margin-top: 6px;">${res.title}</h2>
          <a href="${res.url}" target="_blank" style="color: var(--accent-primary); font-size: 0.88rem;">${res.url}</a>
        </div>
        <div style="background: var(--bg-input); padding: 14px; border-radius: 8px;">
          <strong>Summary:</strong>
          <p style="margin-top: 4px; font-size: 0.9rem; color: var(--text-muted);">${res.summary}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem;">
          <div><strong>Category:</strong> ${res.category}</div>
          <div><strong>Difficulty:</strong> ${res.difficulty}</div>
          <div><strong>Date Added:</strong> ${new Date(res.dateAdded).toLocaleString()}</div>
          <div><strong>Last Opened:</strong> ${new Date(res.lastOpened).toLocaleString()}</div>
          <div><strong>Views Count:</strong> ${res.viewsCount}</div>
          <div><strong>Media Type:</strong> ${res.mediaType}</div>
        </div>
        <div>
          <strong>Tags:</strong>
          <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
            ${res.tags.map(t => `<span class="tag-badge">#${t}</span>`).join("")}
          </div>
        </div>
        <div>
          <strong>Personal Notes:</strong>
          <textarea id="edit-notes-input" style="width: 100%; height: 80px; margin-top: 6px; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 6px;">${res.notes || ""}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="btn-delete-details" style="color: #ef4444; border-color: #ef4444;">Delete Resource</button>
        <button class="btn-primary" id="btn-save-notes">Save Notes</button>
      </div>
    `;

    detailsModal.classList.add("active");

    document.getElementById("btn-close-details").addEventListener("click", () => detailsModal.classList.remove("active"));
    
    document.getElementById("btn-save-notes").addEventListener("click", () => {
      const updatedNotes = document.getElementById("edit-notes-input").value;
      vaultStore.update(resId, { notes: updatedNotes });
      detailsModal.classList.remove("active");
    });

    document.getElementById("btn-delete-details").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete "${res.title}" from your vault?`)) {
        vaultStore.delete(resId);
        detailsModal.classList.remove("active");
        renderVaultBadge();
        if (currentView === "vault") renderVaultGrid();
      }
    });
  }

  // --- KNOWLEDGE GRAPH RENDERER ---
  function renderKnowledgeGraph() {
    const graphContainer = document.getElementById("graph-canvas-container");
    const missingContainer = document.getElementById("graph-missing-steps");
    const graphData = aiCapabilities.getKnowledgeGraphData();

    graphContainer.innerHTML = "";

    // Position nodes dynamically
    const nodePositions = [
      { top: "15%", left: "10%" },
      { top: "15%", left: "40%" },
      { top: "45%", left: "30%" },
      { top: "70%", left: "45%" },
      { top: "45%", left: "70%" },
      { top: "70%", left: "75%" },
      { top: "85%", left: "85%" },
      { top: "75%", left: "10%" },
      { top: "15%", left: "75%" },
      { top: "40%", left: "90%" }
    ];

    graphData.nodes.forEach((node, idx) => {
      const pos = nodePositions[idx] || { top: "50%", left: "50%" };
      const el = document.createElement("div");
      el.className = "graph-node";
      el.style.top = pos.top;
      el.style.left = pos.left;
      el.innerText = `${node.label}`;
      el.title = `Category: ${node.category}`;
      el.addEventListener("click", () => {
        chatInput.value = `Show everything about ${node.label}`;
        switchView("chat");
        chatForm.dispatchEvent(new Event("submit"));
      });
      graphContainer.appendChild(el);
    });

    let missingHtml = `<h4>💡 Recommended Missing Steps in your Vault:</h4><ul style="margin-top: 8px; font-size: 0.9rem; padding-left: 20px;">`;
    graphData.missingSteps.forEach(step => {
      missingHtml += `<li style="margin-bottom: 6px;"><strong>${step.topic}:</strong> ${step.reason}</li>`;
    });
    missingHtml += `</ul>`;
    missingContainer.innerHTML = missingHtml;
  }

  // --- QUIZ RUNNER ---
  function renderQuizRunner() {
    const quizContainer = document.getElementById("quiz-runner-container");
    const quizData = aiCapabilities.generateQuiz();

    let html = `<div class="quiz-card-box">
      <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent-primary); font-weight: 700;">Question 1 of ${quizData.mcqs.length}</div>
      <h3 style="font-size: 1.1rem;">${quizData.mcqs[0].question}</h3>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">`;

    quizData.mcqs[0].options.forEach((opt, idx) => {
      html += `<button class="quiz-option-btn" data-correct="${idx === quizData.mcqs[0].correctIndex}">${opt}</button>`;
    });

    html += `</div><div id="quiz-feedback" style="margin-top: 10px; font-weight: 600;"></div></div>`;

    quizContainer.innerHTML = html;

    const optBtns = quizContainer.querySelectorAll(".quiz-option-btn");
    const feedbackEl = quizContainer.getElementById ? quizContainer.getElementById("quiz-feedback") : document.getElementById("quiz-feedback");

    optBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const isCorrect = btn.dataset.correct === "true";
        if (isCorrect) {
          btn.classList.add("correct");
          feedbackEl.innerHTML = `<span style="color: #10b981;">Correct! 🎉 ${quizData.mcqs[0].explanation}</span>`;
        } else {
          btn.classList.add("wrong");
          feedbackEl.innerHTML = `<span style="color: #ef4444;">Incorrect. ${quizData.mcqs[0].explanation}</span>`;
        }
      });
    });
  }

  // --- AI INSIGHTS & WEEKLY REVIEW ---
  function renderAIInsights() {
    const grid = document.getElementById("insights-grid");
    const insights = aiCapabilities.getAIInsights();
    const review = aiCapabilities.generateWeeklyReview();

    grid.innerHTML = `
      <div class="insight-card">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Top Saved Topic</span>
        <div class="insight-val">${insights.topTopic}</div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">${insights.answers.whatTopicsMost}</p>
      </div>

      <div class="insight-card">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Most Helpful Domain</span>
        <div class="insight-val">${insights.topWebsite}</div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">${insights.answers.whichWebsitesHelpMost}</p>
      </div>

      <div class="insight-card">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Vault Consistency Score</span>
        <div class="insight-val">94%</div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">${insights.answers.howConsistentAmI}</p>
      </div>

      <div class="insight-card">
        <span style="font-size: 0.85rem; color: var(--text-muted);">Ignored Resources</span>
        <div class="insight-val">${insights.ignoredCount} Items</div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">${insights.answers.whatAmIIgnoring}</p>
      </div>
    `;
  }
});
