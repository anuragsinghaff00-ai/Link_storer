/**
 * Image Vault - Handles Image rendering in the vanilla JS app.
 */

export class ImageVault {
  constructor() {
    this.apiBase = "/api/images";
    this.images = [];
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.pendingUploads = [];
  }

  async fetchImages() {
    try {
      const response = await fetch(this.apiBase);
      if (response.ok) {
        this.images = await response.json();
      }
    } catch (e) {
      console.error("Failed to fetch images from backend:", e);
    }
  }

  init() {
    const filterTabs = document.querySelectorAll('[data-img-filter]');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.dataset.imgFilter;
        this.renderGrid();
      });
    });

    const searchInput = document.getElementById('image-vault-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderGrid();
      });
    }

    // Modal Handling
    const btnAddImage = document.getElementById('btn-add-image');
    const addImageModal = document.getElementById('add-image-modal');
    const btnCloseImageModal = document.getElementById('btn-close-image-modal');
    const btnCancelImage = document.getElementById('btn-cancel-image');
    
    if (btnAddImage && addImageModal) {
      btnAddImage.addEventListener('click', () => {
        addImageModal.classList.add('active');
        this.clearPendingUploads();
      });
      
      const closeModal = () => addImageModal.classList.remove('active');
      btnCloseImageModal.addEventListener('click', closeModal);
      btnCancelImage.addEventListener('click', closeModal);
      
      // Upload mechanics
      this.setupUploadMechanics(addImageModal);
    }
  }
  
  clearPendingUploads() {
    this.pendingUploads = [];
    document.getElementById('upload-preview-container').innerHTML = '';
    const submitBtn = document.getElementById('btn-submit-images');
    submitBtn.disabled = true;
    document.getElementById('upload-count').textContent = '';
  }

  addFilesToPending(files) {
    const container = document.getElementById('upload-preview-container');
    const submitBtn = document.getElementById('btn-submit-images');
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      this.pendingUploads.push(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.height = '80px';
        img.style.width = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid var(--border-color)';
        container.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
    
    if (this.pendingUploads.length > 0) {
      submitBtn.disabled = false;
      document.getElementById('upload-count').textContent = `(${this.pendingUploads.length})`;
    }
  }

  setupUploadMechanics(modal) {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image-file-input');
    const submitBtn = document.getElementById('btn-submit-images');
    const urlInput = document.getElementById('image-url-input');
    const btnUploadUrl = document.getElementById('btn-upload-url');
    
    // 1. Click to browse
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.addFilesToPending(e.target.files));
    
    // 2. Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.background = 'var(--bg-card-hover)';
    });
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.style.background = 'transparent';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.background = 'transparent';
      this.addFilesToPending(e.dataTransfer.files);
    });
    
    // 3. Paste from clipboard
    document.addEventListener('paste', (e) => {
      if (!modal.classList.contains('active')) return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      const files = [];
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          files.push(item.getAsFile());
        }
      }
      if (files.length > 0) this.addFilesToPending(files);
    });

    // 4. URL Upload (Fetch blob and add as file)
    btnUploadUrl.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      
      try {
        btnUploadUrl.textContent = "Fetching...";
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], "url_image.jpg", { type: blob.type });
        this.addFilesToPending([file]);
        urlInput.value = '';
      } catch (err) {
        alert("Could not fetch image from URL. It may be blocked by CORS.");
      } finally {
        btnUploadUrl.textContent = "Upload URL";
      }
    });

    // 5. Submit all pending uploads
    submitBtn.addEventListener('click', async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading...';
      
      for (const file of this.pendingUploads) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        try {
          const res = await fetch(this.apiBase, {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const newImage = await res.json();
            // Trigger AI silently
            fetch(`${this.apiBase}/${newImage.id}/analyze`, { method: 'POST' }).then(() => {
              this.fetchImages().then(() => this.renderGrid());
            });
          }
        } catch (err) {
          console.error("Upload failed for file:", file.name, err);
        }
      }
      
      await this.fetchImages();
      this.renderGrid();
      modal.classList.remove('active');
      submitBtn.textContent = 'Upload';
      this.clearPendingUploads();
    });
  }

  renderGrid() {
    const grid = document.getElementById('image-vault-grid');
    if (!grid) return;

    let filtered = this.images;

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(img => img.purpose_id && img.purpose_id.toLowerCase().includes(this.activeFilter.toLowerCase()));
    }

    if (this.searchQuery) {
      filtered = filtered.filter(img => 
        (img.title && img.title.toLowerCase().includes(this.searchQuery)) ||
        (img.ai_description && img.ai_description.toLowerCase().includes(this.searchQuery)) ||
        (img.ocr_text && img.ocr_text.toLowerCase().includes(this.searchQuery))
      );
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">No images found.</div>';
      return;
    }

    filtered.forEach(img => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.style.marginBottom = '16px';
      card.style.breakInside = 'avoid';
      card.style.background = 'var(--bg-card)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = 'var(--radius-lg)';
      card.style.overflow = 'hidden';
      card.style.position = 'relative';

      const imgUrl = img.storage_path;

      card.innerHTML = `
        <img src="${imgUrl}" alt="${img.title}" style="width: 100%; display: block;" loading="lazy">
        <div style="padding: 12px;">
          <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 4px;">${img.title || 'Untitled'}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.75rem; background: var(--bg-input); padding: 2px 6px; border-radius: 4px;">${img.purpose_id || 'General'}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date(img.date_added).toLocaleDateString()}</span>
          </div>
          ${img.ai_description ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; font-style: italic;">🤖 ${img.ai_description}</div>` : ''}
          ${img.ocr_text ? `<div style="font-size: 0.7rem; color: var(--accent-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📄 ${img.ocr_text}</div>` : ''}
        </div>
      `;

      grid.appendChild(card);
    });
  }
}

const imageVaultInstance = new ImageVault();
window.imageVault = imageVaultInstance;

document.addEventListener("DOMContentLoaded", () => {
  imageVaultInstance.init();
  imageVaultInstance.fetchImages().then(() => imageVaultInstance.renderGrid());
});
