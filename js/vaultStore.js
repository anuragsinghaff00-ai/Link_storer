/**
 * VaultStore - Manages saved resources, interacting with the FastAPI backend.
 */

class VaultStore {
  constructor() {
    this.apiBase = "/api/resources";
    this.resources = [];
  }

  async fetchAll() {
    try {
      const response = await fetch(this.apiBase);
      if (response.ok) {
        this.resources = await response.json();
      }
    } catch (e) {
      console.error("Failed to fetch resources from backend:", e);
    }
    return this.resources;
  }

  getAll() {
    return this.resources;
  }

  getById(id) {
    return this.resources.find(r => r.id === id);
  }

  async add(resourceData) {
    try {
      const response = await fetch(this.apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceData)
      });
      if (response.ok) {
        const newRes = await response.json();
        // Optimistically update local array
        this.resources.unshift({ ...resourceData, id: newRes.id });
        return newRes;
      }
    } catch (e) {
      console.error("Failed to add resource:", e);
    }
    return null;
  }

  async update(id, updates) {
    try {
      const response = await fetch(`${this.apiBase}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        this.resources = this.resources.map(res => res.id === id ? { ...res, ...updates } : res);
        return true;
      }
    } catch (e) {
      console.error("Failed to update resource:", e);
    }
    return false;
  }

  async delete(id) {
    try {
      const response = await fetch(`${this.apiBase}/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        this.resources = this.resources.filter(res => res.id !== id);
        return true;
      }
    } catch (e) {
      console.error("Failed to delete resource:", e);
    }
    return false;
  }

  // Stubs for bin functionality (can be implemented later)
  getDeleted() { return []; }
  restore(id) { return false; }
  emptyBin() { return false; }
  deletePermanently(id) { return this.delete(id); }

  async markOpened(id) {
    // Optimistic update
    const res = this.getById(id);
    if (res) {
      res.viewsCount = (res.viewsCount || 0) + 1;
      // Background sync
      this.update(id, { viewsCount: res.viewsCount });
    }
    return res;
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
