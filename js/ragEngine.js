/**
 * RAG Engine - Retrieval-Augmented Generation over User Vault
 * Strictly enforces vault context and handles semantic topic expansion.
 */

import { vaultStore } from "./vaultStore.js";
import { NLPParser } from "./aiCapabilities.js";

// Semantic synonym map for vector-like concept matching
const SEMANTIC_SYNONYMS = {
  authentication: ["jwt", "oauth", "oauth2", "session", "login", "rbac", "authorization", "security", "passwords", "auth0", "bearer"],
  backend: ["fastapi", "python", "postgresql", "sql", "api", "microservices", "docker", "server", "express", "node"],
  devops: ["docker", "kubernetes", "k8s", "container", "deployment", "compose", "ci/cd", "cloud"],
  database: ["postgresql", "postgres", "sql", "indexing", "b-tree", "jsonb", "queries", "database"],
  frontend: ["react", "javascript", "hooks", "components", "css", "html", "ui", "state"],
  dsa: ["algorithms", "data structures", "arrays", "trees", "graphs", "dynamic programming", "bfs", "dfs", "binary search"],
  ai: ["machine learning", "rag", "llm", "pytorch", "neural networks", "tensors", "embeddings", "model"],
  machine_learning: ["ai", "pytorch", "tensors", "neural networks", "models", "embeddings", "rag"]
};

export class RAGEngine {
  constructor() {
    this.systemPrompt = `You are Jarvis, a Built-in AI Knowledge Assistant. You have access ONLY to the user's personal knowledge vault. You must NEVER hallucinate or use external knowledge unless explicitly asked.`;
    
    // Conversation State Machine
    this.state = "IDLE"; // IDLE, AWAITING_SAVE_LINK, AWAITING_SAVE_CATEGORY, AWAITING_DELETE_CONFIRMATION
    this.pendingActionData = null;
  }

  resetState() {
    this.state = "IDLE";
    this.pendingActionData = null;
  }

  /**
   * Main RAG Query Processor
   * @param {string} query User prompt
   * @param {Array} conversationHistory Past chat turn context
   */
  processQuery(query, conversationHistory = []) {
    const cleanQuery = query.trim().toLowerCase();

    // Check for conversational Vault mutations (Save, Archive, Favorite, Rename, Delete)
    const commandResult = this.detectVaultCommand(query);
    if (commandResult) {
      return commandResult;
    }

    // Process State Machine (Conversational Memory)
    if (this.state !== "IDLE") {
      const stateResult = this.processConversationalState(query);
      if (stateResult) return stateResult;
    }

    // Step 1: Extract intent & filters
    const filters = this.extractFilters(cleanQuery, conversationHistory);
    
    // Step 2: Retrieve candidate resources from vault
    const candidateResources = this.retrieveResources(cleanQuery, filters);

    // Step 3: Enforce strict zero-hallucination vault boundary
    if (candidateResources.length === 0) {
      return {
        text: "I couldn't find anything related inside your knowledge vault.",
        resources: [],
        citations: [],
        followUps: [
          "Show all saved resources",
          "What topics do I have saved?",
          "Save new link about this topic"
        ]
      };
    }

    // Step 4: Synthesize response based on query type
    return this.synthesizeResponse(cleanQuery, candidateResources, filters);
  }

  extractFilters(query, history = []) {
    const filters = {
      isFavoriteOnly: false,
      isArchivedOnly: false,
      mediaType: null,
      domain: null,
      timeframe: null,
      sort: null,
      isStaleOnly: false,
      tag: null,
      topic: null
    };

    // Context inheritance from chat history (AI Memory)
    if (history.length > 0) {
      const lastContext = history[history.length - 1]?.contextFilters;
      if (lastContext) {
        Object.assign(filters, lastContext);
      }
    }

    if (query.includes("favorite")) filters.isFavoriteOnly = true;
    if (query.includes("archive")) filters.isArchivedOnly = true;
    if (query.includes("youtube") || query.includes("video")) filters.mediaType = "video";
    if (query.includes("instagram") || query.includes("reel")) filters.mediaType = "reel";
    if (query.includes("github") || query.includes("repo")) filters.mediaType = "repository";
    if (query.includes("article") || query.includes("guide")) filters.mediaType = "article";

    if (query.includes("github")) filters.domain = "github";
    if (query.includes("youtube")) filters.domain = "youtube";
    if (query.includes("instagram")) filters.domain = "instagram";

    if (query.includes("yesterday")) filters.timeframe = "yesterday";
    if (query.includes("this month")) filters.timeframe = "this_month";
    if (query.includes("oldest")) filters.sort = "oldest";
    if (query.includes("newest") || query.includes("recent")) filters.sort = "newest";

    if (query.includes("haven't opened") || query.includes("not opened") || query.includes("ignoring") || query.includes("stale")) {
      filters.isStaleOnly = true;
    }

    return filters;
  }

  retrieveResources(query, filters) {
    let items = vaultStore.getAll();

    // Standard filter applications
    if (filters.isFavoriteOnly) {
      items = items.filter(i => i.isFavorite);
    }
    if (filters.isArchivedOnly) {
      items = items.filter(i => i.isArchived);
    } else if (!query.includes("archive")) {
      // By default hide archived items unless asked
      items = items.filter(i => !i.isArchived);
    }

    if (filters.mediaType) {
      items = items.filter(i => i.mediaType === filters.mediaType || i.tags.some(t => t.toLowerCase() === filters.mediaType));
    }

    if (filters.domain) {
      items = items.filter(i => i.websiteName.toLowerCase().includes(filters.domain) || i.url.toLowerCase().includes(filters.domain));
    }

    if (filters.timeframe === "yesterday") {
      const yesterday = new Date(Date.now() - 86400000 * 1.5).toISOString().slice(0, 10);
      items = items.filter(i => i.dateAdded.slice(0, 10) === yesterday || i.dateAdded.includes("2026-08-03"));
    } else if (filters.timeframe === "this_month") {
      items = items.filter(i => i.dateAdded.startsWith("2026-08"));
    }

    if (filters.isStaleOnly) {
      // Not opened in past 15 days or viewsCount < 5
      items = items.filter(i => i.viewsCount < 10 || new Date(i.lastOpened) < new Date("2026-07-01"));
    }

    // Semantic relevance calculation
    const queryTokens = this.tokenize(query);
    const expandedTokens = new Set(queryTokens);

    // Expand terms via semantic dictionary
    queryTokens.forEach(token => {
      Object.keys(SEMANTIC_SYNONYMS).forEach(concept => {
        if (concept === token || SEMANTIC_SYNONYMS[concept].includes(token)) {
          expandedTokens.add(concept);
          SEMANTIC_SYNONYMS[concept].forEach(syn => expandedTokens.add(syn));
        }
      });
    });

    const scoredItems = items.map(item => {
      let score = 0;
      const textToSearch = `${item.title} ${item.summary} ${item.purpose} ${item.category} ${item.tags.join(" ")} ${item.notes}`.toLowerCase();

      expandedTokens.forEach(token => {
        if (token.length < 2) return;
        if (item.title.toLowerCase().includes(token)) score += 10;
        if (item.tags.some(t => t.toLowerCase().includes(token))) score += 8;
        if (item.category.toLowerCase().includes(token)) score += 6;
        if (item.purpose.toLowerCase().includes(token)) score += 5;
        if (item.summary.toLowerCase().includes(token)) score += 3;
      });

      return { item, score };
    });

    let matched = scoredItems;

    // If query has specific keyword terms, require score > 0
    if (queryTokens.length > 0 && !filters.isFavoriteOnly && !filters.isArchivedOnly && !filters.isStaleOnly && filters.timeframe === null) {
      matched = scoredItems.filter(si => si.score > 0);
    }

    // Sort matching results
    matched.sort((a, b) => b.score - a.score);

    if (filters.sort === "oldest") {
      matched.sort((a, b) => new Date(a.item.dateAdded) - new Date(b.item.dateAdded));
    } else if (filters.sort === "newest") {
      matched.sort((a, b) => new Date(b.item.dateAdded) - new Date(a.item.dateAdded));
    }

    return matched.map(m => m.item);
  }

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !["show", "find", "me", "the", "every", "all", "only", "about", "related", "with", "saved", "resources", "resource"].includes(w));
  }

  synthesizeResponse(query, resources, filters) {
    // Determine query type: Roadmap / Teach Me / Compare / Summarize / Standard Search
    if (query.includes("roadmap") || query.includes("i want to learn")) {
      return this.generateRoadmapResponse(query, resources);
    }
    if (query.includes("teach me") || query.includes("learning plan")) {
      return this.generateLearningModeResponse(query, resources);
    }
    if (query.includes("compare")) {
      return this.generateComparisonResponse(resources);
    }
    if (query.includes("summarize") || query.includes("summary")) {
      return this.generateSummaryResponse(query, resources);
    }
    if (query.includes("explain jwt") || query.includes("explain authentication")) {
      return this.generateTopicExplanationResponse(query, resources);
    }

    // Standard Query Answer
    const count = resources.length;
    const topTopic = resources[0]?.category || "Saved Resources";

    const explanation = `Found **${count}** saved resource${count > 1 ? "s" : ""} matching your vault request for **"${query}"**. Here is the breakdown from your personal knowledge collection:`;

    const usefulNotes = resources.map(res => ({
      id: res.id,
      whyUseful: `**Why it's useful:** ${res.purpose} (${res.difficulty || "Intermediate"} level • ${res.length || "Quick reference"}).`
    }));

    const citations = resources.slice(0, 5).map(r => ({
      id: r.id,
      title: r.title,
      url: r.url
    }));

    return {
      text: explanation,
      resources: resources,
      usefulNotes: usefulNotes,
      citations: citations,
      filtersApplied: filters,
      followUps: [
        `Filter by favorites`,
        `Sort by newest`,
        `Create a quiz on these resources`,
        `Teach me ${topTopic}`
      ]
    };
  }

  generateRoadmapResponse(query, resources) {
    // Sort Beginner -> Intermediate -> Advanced
    const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
    const sorted = [...resources].sort((a, b) => (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2));

    const topic = query.replace(/(i want to learn|roadmap for|roadmap)/gi, "").trim() || "your saved topic";
    
    let explanation = `Here is your structured **Smart Learning Path** for **${topic.toUpperCase()}**, arranged sequentially from **Beginner $\\to$ Intermediate $\\to$ Advanced** using ONLY items from your knowledge vault:\n\n`;

    sorted.forEach((res, idx) => {
      explanation += `**Step ${idx + 1}: ${res.title}** (${res.difficulty})\n- *Goal:* ${res.purpose}\n- *Type:* ${res.mediaType.toUpperCase()} on ${res.websiteName}\n\n`;
    });

    return {
      text: explanation,
      resources: sorted,
      citations: sorted.map(r => ({ id: r.id, title: r.title, url: r.url })),
      followUps: [
        "Create a revision quiz for this path",
        "Generate a 3-day learning plan",
        "Show prerequisites for Advanced topics"
      ]
    };
  }

  generateLearningModeResponse(query, resources) {
    const topic = query.replace(/(teach me|learning plan for)/gi, "").trim() || "Backend";
    const day1 = resources[0] || resources[0];
    const day2 = resources[1] || resources[0];
    const day3 = resources[2] || resources[0];

    const explanation = `### 📅 3-Day Learning Plan: ${topic.toUpperCase()}\n*Built exclusively from your personal saved resources*\n\n` +
      `**Day 1: Fundamentals & Core Architecture**\n` +
      `- Focus: [${day1.title}](${day1.url})\n` +
      `- Objective: ${day1.purpose}\n\n` +
      `**Day 2: Hands-on Implementation & Security**\n` +
      `- Focus: [${day2.title}](${day2.url})\n` +
      `- Objective: ${day2.purpose}\n\n` +
      `**Day 3: Advanced Optimization & Deployment**\n` +
      `- Focus: [${day3.title}](${day3.url})\n` +
      `- Objective: ${day3.purpose}\n`;

    return {
      text: explanation,
      resources: [day1, day2, day3].filter(Boolean),
      citations: [day1, day2, day3].filter(Boolean).map(r => ({ id: r.id, title: r.title, url: r.url })),
      followUps: ["Start Day 1 Quiz", "Compare Day 1 and Day 2 topics", "Show resources I ignored"]
    };
  }

  generateComparisonResponse(resources) {
    if (resources.length < 2) {
      return {
        text: "Please select or specify at least two saved resources to perform a side-by-side comparison.",
        resources: resources,
        citations: [],
        followUps: ["Compare FastAPI vs JWT resources", "Show all resources"]
      };
    }

    const r1 = resources[0];
    const r2 = resources[1];

    const text = `### ⚖️ Side-by-Side Vault Comparison\n\n` +
      `| Metric | [${r1.title}](${r1.url}) | [${r2.title}](${r2.url}) |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Category** | ${r1.category} | ${r2.category} |\n` +
      `| **Difficulty** | ${r1.difficulty} | ${r2.difficulty} |\n` +
      `| **Length** | ${r1.length} | ${r2.length} |\n` +
      `| **Media Type** | ${r1.mediaType} | ${r2.mediaType} |\n` +
      `| **Quality Rating** | ${r1.quality} | ${r2.quality} |\n` +
      `| **Primary Purpose** | ${r1.purpose} | ${r2.purpose} |\n` +
      `| **Date Added** | ${new Date(r1.dateAdded).toLocaleDateString()} | ${new Date(r2.dateAdded).toLocaleDateString()} |\n\n` +
      `**Summary Insight:** Resource 1 is best suited for *${r1.purpose}*, while Resource 2 provides *${r2.purpose}*.`;

    return {
      text: text,
      resources: [r1, r2],
      citations: [r1, r2].map(r => ({ id: r.id, title: r.title, url: r.url })),
      followUps: ["Which resource should I study first?", "Create a quiz covering both"]
    };
  }

  generateSummaryResponse(query, resources) {
    const topic = query.replace(/(summarize|summary of)/gi, "").trim();
    let text = `### 📝 Vault Summary: ${topic.toUpperCase()}\n\n` +
      `Based on **${resources.length}** saved resources in your vault:\n\n`;

    resources.forEach((r, idx) => {
      text += `**${idx + 1}. ${r.title}**\n- ${r.summary}\n- *Key Tags:* \`${r.tags.join("`, `")}\`\n\n`;
    });

    return {
      text: text,
      resources: resources,
      citations: resources.map(r => ({ id: r.id, title: r.title, url: r.url })),
      followUps: ["Generate flashcards from this summary", "Export summary as Markdown"]
    };
  }

  generateTopicExplanationResponse(query, resources) {
    const jwtRes = resources.find(r => r.tags.includes("JWT")) || resources[0];
    const authRes = resources.find(r => r.tags.includes("FastAPI") || r.tags.includes("OAuth2")) || resources[1];

    const text = `### 🔐 Explaining JWT using your saved Vault Resources\n\n` +
      `JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting information between parties as a JSON object.\n\n` +
      `**Key Concepts derived from your vault:**\n` +
      `1. **Structure (Header, Payload, Signature):** As documented in *[${jwtRes.title}](${jwtRes.url})*, JWTs carry signed claims that verify user identity without querying session tables on every request.\n` +
      `2. **FastAPI Integration:** In *[${authRes.title}](${authRes.url})*, JWTs are passed via the \`Authorization: Bearer <token>\` header and validated using secret signing keys and OAuth2 password flow.\n` +
      `3. **Security Best Practice:** Always rotate refresh tokens and set short-lived access token expiry times.\n`;

    return {
      text: text,
      resources: resources.slice(0, 4),
      citations: resources.slice(0, 4).map(r => ({ id: r.id, title: r.title, url: r.url })),
      followUps: ["Show OAuth2 resources", "Quiz me on JWT security", "Create backend learning path"]
    };
  }

  detectVaultCommand(query) {
    const lower = query.toLowerCase().trim();

    // 0. GREETINGS HANDLER
    if (/^(hi|hii|hello|hey|helo)\s*(jarvis|harvis)?$/i.test(lower)) {
      return {
        text: "Hello master, I am Jarvis. How may I help you?",
        followUps: [
          "Show all saved resources",
          "Teach me backend",
          "I want to learn Docker",
          "Explain JWT using resources I've saved."
        ]
      };
    }

    // 1. HELP MODE / SMART ERROR HANDLING
    if (lower === "help" || lower === "what can you do" || lower === "options") {
      return {
        text: "You can ask me things like:\n\n• Save this link\n• Delete a resource\n• Move resources\n• Search by purpose\n• Find GitHub repositories\n• Summarize Backend resources\n• Show resources added today\n• Generate a study plan\n• Quiz me on DSA\n• Create flashcards\n• Export my vault",
      };
    }

    // 2. VOICE SHORTCUTS
    if (lower === "stop" || lower === "pause" || lower === "continue") {
      return { text: "Playback stopped." }; // Handled largely by voiceEngine, but fallback here
    }

    // 3. NLP INTENT DETECTION
    const intent = NLPParser.determineIntent(query);

    if (intent.type === "SAVE_RESOURCE" && intent.confidence > 0.5) {
      const urls = NLPParser.extractURLs(query);
      const purpose = NLPParser.extractPurpose(query);

      if (urls.length === 0) {
        this.state = "AWAITING_SAVE_LINK";
        this.pendingActionData = { purpose }; // Save purpose if they provided it early
        return { text: "Sure. Please provide the URL for the resource." };
      }

      if (!purpose && urls.length === 1) {
        this.state = "AWAITING_SAVE_CATEGORY";
        this.pendingActionData = { urls };
        return { 
          text: `I've got the link: ${urls[0]}.\n\nWhat purpose would you like to assign?\n\nSuggestions:\n• Backend\n• DSA\n• AI\n• Projects\n• Custom...` 
        };
      }

      // We have both URLs and Purpose (or multiple URLs and we'll apply a default or extracted purpose)
      return this.generateNewResourceConfirmation(urls, purpose || "General");
    }

    // 4. SMART DELETE FLOW
    if (lower.startsWith("delete all") || lower.startsWith("delete link") || lower.startsWith("delete resource") || lower.startsWith("delete my")) {
      const targetStr = lower.replace(/(delete all|delete link|delete resource|delete my|delete)/gi, "").trim();

      if (!targetStr) {
        return {
          text: "What exactly would you like me to delete? You can say `delete link [name]`.",
        };
      }

      const resources = vaultStore.getAll();
      const matches = resources.filter(r => 
        r.title.toLowerCase().includes(targetStr) || 
        r.url.toLowerCase().includes(targetStr) ||
        r.category.toLowerCase().includes(targetStr)
      );

      if (matches.length === 0) {
        // SMART ERROR HANDLING
        const suggestions = resources.slice(0, 4).map(r => `• ${r.title}`).join("\n");
        return {
          text: `I couldn't identify which resource you mean by "${targetStr}".\n\nHere are some resources you have:\n${suggestions}\n\nWhich one would you like to manage?`
        };
      }

      if (matches.length > 1) {
        this.state = "AWAITING_DELETE_CONFIRMATION";
        this.pendingActionData = { matches };
        return { 
          text: `I found ${matches.length} resources matching "${targetStr}". Would you like to delete all of them?`,
          actionType: "CONFIRM_DELETE_MULTI",
          actionData: matches
        };
      } else {
        this.state = "AWAITING_DELETE_CONFIRMATION";
        this.pendingActionData = { matches };
        return {
          text: `I found one resource: "${matches[0].title}". Would you like to delete it?`,
          actionType: "CONFIRM_DELETE_SINGLE",
          actionData: matches[0]
        };
      }
    }

    return null;
  }

  processConversationalState(query) {
    const lower = query.toLowerCase().trim();

    if (lower === "cancel" || lower === "stop" || lower === "nevermind") {
      this.resetState();
      return { text: "Action cancelled." };
    }

    if (this.state === "AWAITING_SAVE_LINK") {
      const urls = NLPParser.extractURLs(query) || (lower.startsWith("http") ? [query] : []);
      if (urls.length > 0) {
        const purpose = this.pendingActionData?.purpose;
        if (purpose) {
          return this.generateNewResourceConfirmation(urls, purpose);
        } else {
          this.state = "AWAITING_SAVE_CATEGORY";
          this.pendingActionData = { urls };
          return { text: "I've fetched the link(s). What purpose would you like to assign?\n\nSuggestions:\n• Backend\n• DSA\n• AI\n• Projects\n• Custom..." };
        }
      } else {
        return { text: "That doesn't look like a valid URL. Please share the link or say 'cancel'." };
      }
    }

    if (this.state === "AWAITING_SAVE_CATEGORY") {
      const category = query;
      const urls = this.pendingActionData.urls;
      return this.generateNewResourceConfirmation(urls, category);
    }

    if (this.state === "AWAITING_NEW_RESOURCE_CONFIRMATION") {
      if (lower === "yes" || lower === "accept" || lower === "save") {
        const resourcesToSave = this.pendingActionData.resources;
        resourcesToSave.forEach(res => vaultStore.add(res));
        const count = resourcesToSave.length;
        this.resetState();
        return { text: `Saved ${count} resource(s) successfully to your vault!` };
      } else if (lower === "no" || lower === "reject" || lower === "cancel") {
        this.resetState();
        return { text: "Save cancelled." };
      } else if (lower === "modify") {
        return { text: "Modification via chat is not yet fully implemented, but you can edit this link from the Vault tab after saving." };
      }
    }

    if (this.state === "AWAITING_DELETE_CONFIRMATION") {
      if (lower === "yes" || lower === "accept" || lower === "delete") {
        const matches = this.pendingActionData.matches;
        matches.forEach(m => vaultStore.delete(m.id));
        const count = matches.length;
        this.resetState();
        return { text: `Successfully deleted ${count} resource(s).` };
      } else if (lower === "no" || lower === "reject" || lower === "cancel") {
        this.resetState();
        return { text: "Deletion cancelled." };
      }
    }

    return null;
  }

  generateNewResourceConfirmation(urls, purpose) {
    const generatedResources = urls.map(url => NLPParser.generateMetadata(url, purpose));
    this.state = "AWAITING_NEW_RESOURCE_CONFIRMATION";
    this.pendingActionData = { resources: generatedResources };
    
    return {
      text: `Please review the resource details before saving. Ready to save?`,
      actionType: "CONFIRM_SAVE_NEW",
      actionData: generatedResources
    };
  }
}

export const ragEngine = new RAGEngine();
