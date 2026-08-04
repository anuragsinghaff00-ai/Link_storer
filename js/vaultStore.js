/**
 * VaultStore - Manages saved resources, metadata, and persistence.
 */

const SEED_RESOURCES = [
  {
    id: "res-1",
    title: "FastAPI Authentication & Security Guide",
    url: "https://fastapi.tiangolo.com/tutorial/security/",
    websiteName: "FastAPI Documentation",
    favicon: "⚡",
    summary: "Complete guide on implementing JWT authentication, OAuth2 scopes, password hashing with bcrypt, and security headers in FastAPI.",
    purpose: "Backend Security & Auth standard implementation",
    category: "Backend",
    tags: ["FastAPI", "Authentication", "JWT", "OAuth2", "Security", "Python"],
    mediaType: "article",
    dateAdded: "2026-08-03T10:00:00.000Z", // Yesterday relative to 2026-08-04
    lastOpened: "2026-08-04T12:00:00.000Z",
    isFavorite: true,
    isArchived: false,
    difficulty: "Intermediate",
    length: "15 min read",
    quality: "High",
    viewsCount: 14,
    notes: "Essential pattern for API key verification and bearer token handling."
  },
  {
    id: "res-2",
    title: "JWT Authentication Deep Dive",
    url: "https://auth0.com/blog/json-web-token-jwt-how-it-works/",
    websiteName: "Auth0 Blog",
    favicon: "🔒",
    summary: "Detailed analysis of JSON Web Tokens architecture, token signing, expiration handling, refresh token rotation, and RBAC strategies.",
    purpose: "Understand JWT token format, signature validation, and security pitfalls.",
    category: "Security",
    tags: ["JWT", "Authentication", "OAuth", "Session", "Security", "RBAC"],
    mediaType: "article",
    dateAdded: "2026-08-01T14:30:00.000Z",
    lastOpened: "2026-08-02T09:15:00.000Z",
    isFavorite: true,
    isArchived: false,
    difficulty: "Intermediate",
    length: "20 min read",
    quality: "High",
    viewsCount: 22,
    notes: "Review refresh token rotation mechanism for production deployments."
  },
  {
    id: "res-3",
    title: "OAuth2 & OpenID Connect Explained in 10 Minutes",
    url: "https://youtube.com/watch?v=996gVCjpBLw",
    websiteName: "YouTube",
    favicon: "▶️",
    summary: "Visual video explanation of OAuth 2.0 authorization code grant flow with PKCE, access tokens vs ID tokens, and identity providers.",
    purpose: "Quick conceptual refresher on OAuth2 architecture.",
    category: "Backend",
    tags: ["OAuth2", "Authentication", "Video", "Security", "OpenID"],
    mediaType: "video",
    dateAdded: "2026-07-28T16:00:00.000Z",
    lastOpened: "2026-07-29T11:00:00.000Z",
    isFavorite: false,
    isArchived: false,
    difficulty: "Beginner",
    length: "10 mins video",
    quality: "High",
    viewsCount: 9,
    notes: "Great animation showing authorization server interaction."
  },
  {
    id: "res-4",
    title: "Docker Mastery: Containerize Any Python FastAPI App",
    url: "https://github.com/docker/awesome-compose/tree/master/fastapi-postgres",
    websiteName: "GitHub",
    favicon: "🐙",
    summary: "Production-ready Docker compose configuration with multi-stage builds, non-root user execution, live reloading, and PostgreSQL container connection.",
    purpose: "Template for deploying FastAPI apps with Docker and docker-compose.",
    category: "DevOps",
    tags: ["Docker", "FastAPI", "GitHub", "Container", "Deployment", "PostgreSQL"],
    mediaType: "repository",
    dateAdded: "2026-08-03T18:20:00.000Z", // Yesterday
    lastOpened: "2026-08-04T08:00:00.000Z",
    isFavorite: true,
    isArchived: false,
    difficulty: "Intermediate",
    length: "Repository Code",
    quality: "High",
    viewsCount: 18,
    notes: "Use this docker-compose file for multi-service setup."
  },
  {
    id: "res-5",
    title: "PostgreSQL Indexing & Performance Tuning Guide",
    url: "https://postgresqltutorial.com/postgresql-indexes/",
    websiteName: "PostgreSQL Tutorial",
    favicon: "🐘",
    summary: "Comprehensive guide to B-Tree, GIN, and GiST indexes, EXPLAIN ANALYZE query plans, query optimization, and connection pooling with PgBouncer.",
    purpose: "Optimize database queries and resolve slow response times.",
    category: "Database",
    tags: ["PostgreSQL", "Database", "Backend", "SQL", "Indexing", "Performance"],
    mediaType: "article",
    dateAdded: "2026-06-15T09:00:00.000Z",
    lastOpened: "2026-06-16T10:00:00.000Z", // Oldest saved backend article / not opened recently
    isFavorite: false,
    isArchived: false,
    difficulty: "Advanced",
    length: "30 min read",
    quality: "High",
    viewsCount: 4,
    notes: "GIN index section is crucial for JSONB field searches."
  },
  {
    id: "res-6",
    title: "Data Structures & Algorithms Roadmap 2026",
    url: "https://geeksforgeeks.org/dsa-roadmap-for-beginners/",
    websiteName: "GeeksforGeeks",
    favicon: "💡",
    summary: "Curated learning path covering Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Binary Search, and Space-Time complexity.",
    purpose: "Systematic preparation for coding interviews and DSA revision.",
    category: "Computer Science",
    tags: ["DSA", "Algorithms", "Data Structures", "Interview", "Roadmap"],
    mediaType: "article",
    dateAdded: "2026-08-02T11:00:00.000Z",
    lastOpened: "2026-08-04T15:00:00.000Z",
    isFavorite: true,
    isArchived: false,
    difficulty: "Beginner",
    length: "45 min read",
    quality: "High",
    viewsCount: 31,
    notes: "Review graph traversal (BFS/DFS) algorithms."
  },
  {
    id: "res-7",
    title: "5 AI Engineer Tips for LLM Fine-Tuning & RAG Architecture",
    url: "https://instagram.com/p/reel_ai_rag_tips/",
    websiteName: "Instagram",
    favicon: "📷",
    summary: "Short Instagram Reel breaking down hybrid search, chunking strategies, and reranking mechanisms for building zero-hallucination AI agents.",
    purpose: "Bite-sized insight on RAG pipeline architecture.",
    category: "Artificial Intelligence",
    tags: ["AI", "Machine Learning", "RAG", "Reel", "LLM", "Instagram"],
    mediaType: "reel",
    dateAdded: "2026-08-04T09:12:00.000Z", // Saved today
    lastOpened: "2026-08-04T14:30:00.000Z",
    isFavorite: false,
    isArchived: false,
    difficulty: "Intermediate",
    length: "60 sec reel",
    quality: "Medium",
    viewsCount: 5,
    notes: "Mentions vector embeddings chunk size of 512 tokens."
  },
  {
    id: "res-8",
    title: "Kubernetes Production Setup & Microservices Architecture",
    url: "https://github.com/kubernetes/examples",
    websiteName: "GitHub",
    favicon: "🐙",
    summary: "Example K8s manifests for deployments, services, ingress controllers, configmaps, and secrets management in cloud environments.",
    purpose: "Reference configs for orchestrating containerized backend services.",
    category: "DevOps",
    tags: ["Kubernetes", "Docker", "DevOps", "GitHub", "Microservices", "Deployment"],
    mediaType: "repository",
    dateAdded: "2026-05-10T14:00:00.000Z",
    lastOpened: "2026-05-12T10:00:00.000Z", // Oldest saved DevOps resource / stale
    isFavorite: false,
    isArchived: true, // Archived resource example
    difficulty: "Advanced",
    length: "Repository Code",
    quality: "High",
    viewsCount: 2,
    notes: "Archived reference manifest for ingress routes."
  },
  {
    id: "res-9",
    title: "React 19 Hooks & Server Components Masterclass",
    url: "https://youtube.com/watch?v=React19DeepDive",
    websiteName: "YouTube",
    favicon: "▶️",
    summary: "Full video tutorial covering useActionState, useOptimistic, Server Actions, and client/server boundary strategies in modern React.",
    purpose: "Master modern frontend state management and server component patterns.",
    category: "Frontend",
    tags: ["React", "JavaScript", "Frontend", "Video", "Hooks"],
    mediaType: "video",
    dateAdded: "2026-07-20T15:00:00.000Z",
    lastOpened: "2026-07-22T16:00:00.000Z",
    isFavorite: false,
    isArchived: false,
    difficulty: "Intermediate",
    length: "45 mins video",
    quality: "High",
    viewsCount: 12,
    notes: "Explains how useActionState replaces form pending states."
  },
  {
    id: "res-10",
    title: "Machine Learning Fundamentals with PyTorch",
    url: "https://pytorch.org/tutorials/beginner/basics/intro.html",
    websiteName: "PyTorch Official",
    favicon: "🔥",
    summary: "Introduction to Tensors, Datasets & DataLoaders, Neural Network Transforms, Model Building, Autograd, and Optimization loops.",
    purpose: "Core reference manual for PyTorch model building.",
    category: "Artificial Intelligence",
    tags: ["Machine Learning", "AI", "PyTorch", "Python", "Neural Networks"],
    mediaType: "article",
    dateAdded: "2026-07-10T08:00:00.000Z",
    lastOpened: "2026-07-15T11:00:00.000Z",
    isFavorite: true,
    isArchived: false,
    difficulty: "Beginner",
    length: "35 min read",
    quality: "High",
    viewsCount: 28,
    notes: "Autograd section clearly explains backpropagation."
  }
];

class VaultStore {
  constructor() {
    this.storageKey = "link_storer_vault_v1";
    this.resources = this.loadFromStorage();
  }

  loadFromStorage() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      this.saveToStorage(SEED_RESOURCES);
      return SEED_RESOURCES;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse stored vault data:", e);
      return SEED_RESOURCES;
    }
  }

  saveToStorage(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.resources = data;
  }

  getAll() {
    return this.resources;
  }

  getById(id) {
    return this.resources.find(r => r.id === id);
  }

  add(resource) {
    const newRes = {
      id: "res-" + Date.now(),
      title: resource.title || "Untitled Saved Resource",
      url: resource.url || "#",
      websiteName: resource.websiteName || this.extractDomain(resource.url),
      favicon: resource.favicon || "🔗",
      summary: resource.summary || "No summary provided.",
      purpose: resource.purpose || "General Reference",
      category: resource.category || "General",
      tags: resource.tags || [],
      mediaType: resource.mediaType || "article",
      dateAdded: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
      isFavorite: Boolean(resource.isFavorite),
      isArchived: Boolean(resource.isArchived),
      difficulty: resource.difficulty || "Intermediate",
      length: resource.length || "5 min read",
      quality: resource.quality || "High",
      viewsCount: 1,
      notes: resource.notes || ""
    };
    this.resources.unshift(newRes);
    this.saveToStorage(this.resources);
    return newRes;
  }

  update(id, updates) {
    let target = null;
    this.resources = this.resources.map(res => {
      if (res.id === id) {
        target = { ...res, ...updates };
        return target;
      }
      return res;
    });
    this.saveToStorage(this.resources);
    return target;
  }

  delete(id) {
    const initialLen = this.resources.length;
    this.resources = this.resources.filter(res => res.id !== id);
    this.saveToStorage(this.resources);
    return this.resources.length < initialLen;
  }

  batchUpdate(filterFn, updates) {
    let affectedCount = 0;
    this.resources = this.resources.map(res => {
      if (filterFn(res)) {
        affectedCount++;
        return { ...res, ...updates };
      }
      return res;
    });
    this.saveToStorage(this.resources);
    return affectedCount;
  }

  batchDelete(filterFn) {
    const initialLen = this.resources.length;
    this.resources = this.resources.filter(res => !filterFn(res));
    this.saveToStorage(this.resources);
    return initialLen - this.resources.length;
  }

  markOpened(id) {
    return this.update(id, {
      lastOpened: new Date().toISOString(),
      viewsCount: (this.getById(id)?.viewsCount || 0) + 1
    });
  }

  findDuplicates() {
    const urlMap = {};
    const duplicates = [];
    this.resources.forEach(res => {
      const cleanUrl = res.url.toLowerCase().replace(/\/$/, "");
      if (urlMap[cleanUrl]) {
        duplicates.push(res);
      } else {
        urlMap[cleanUrl] = res;
      }
    });
    return duplicates;
  }

  mergeDuplicates() {
    const seenUrls = new Set();
    const uniqueList = [];
    let mergedCount = 0;
    this.resources.forEach(res => {
      const cleanUrl = res.url.toLowerCase().replace(/\/$/, "");
      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        uniqueList.push(res);
      } else {
        mergedCount++;
      }
    });
    if (mergedCount > 0) {
      this.saveToStorage(uniqueList);
    }
    return mergedCount;
  }

  resetToSeed() {
    this.saveToStorage(SEED_RESOURCES);
    return SEED_RESOURCES;
  }

  extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return "Web Resource";
    }
  }
}

export const vaultStore = new VaultStore();
