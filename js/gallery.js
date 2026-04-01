/* ========================================
   THE NURTURY - GALLERY JS
   Lightbox, filtering, and secret admin panel
   Uses IndexedDB for reliable image persistence
   ======================================== */

(function () {
  'use strict';

  // ----------------------------------------
  // CONFIG & DATA
  // ----------------------------------------
  var DB_NAME = 'NurturyGalleryDB';
  var DB_VERSION = 1;
  var STORE_NAME = 'gallery';
  var META_KEY = 'nurtury_gallery_meta';
  var VERSION_KEY = 'nurtury_gallery_version';
  var GALLERY_VERSION = 5;

  var DEFAULT_ITEMS = [
    { id: 1, title: 'Photo 1', category: 'all', color: 'peach', icon: 'camera' },
    { id: 2, title: 'Photo 2', category: 'all', color: 'sage', icon: 'camera' },
    { id: 3, title: 'Photo 3', category: 'all', color: 'blue', icon: 'camera' },
    { id: 4, title: 'Photo 4', category: 'all', color: 'lavender', icon: 'camera' },
    { id: 5, title: 'Photo 5', category: 'all', color: 'pink', icon: 'camera' },
    { id: 6, title: 'Photo 6', category: 'all', color: 'sage', icon: 'camera' },
    { id: 7, title: 'Photo 7', category: 'all', color: 'peach', icon: 'camera' },
    { id: 8, title: 'Photo 8', category: 'all', color: 'blue', icon: 'camera' },
    { id: 9, title: 'Photo 9', category: 'all', color: 'lavender', icon: 'camera' },
    { id: 10, title: 'Photo 10', category: 'all', color: 'pink', icon: 'camera' },
    { id: 11, title: 'Photo 11', category: 'all', color: 'sage', icon: 'camera' },
    { id: 12, title: 'Photo 12', category: 'all', color: 'peach', icon: 'camera' },
    { id: 13, title: 'Photo 13', category: 'all', color: 'blue', icon: 'camera' },
    { id: 14, title: 'Photo 14', category: 'all', color: 'lavender', icon: 'camera' },
    { id: 15, title: 'Photo 15', category: 'all', color: 'pink', icon: 'camera' },
    { id: 16, title: 'Photo 16', category: 'all', color: 'sage', icon: 'camera' },
    { id: 17, title: 'Photo 17', category: 'all', color: 'peach', icon: 'camera' },
    { id: 18, title: 'Photo 18', category: 'all', color: 'blue', icon: 'camera' },
    { id: 19, title: 'Photo 19', category: 'all', color: 'lavender', icon: 'camera' },
    { id: 20, title: 'Photo 20', category: 'all', color: 'pink', icon: 'camera' },
    { id: 21, title: 'Photo 21', category: 'all', color: 'sage', icon: 'camera' },
    { id: 22, title: 'Photo 22', category: 'all', color: 'peach', icon: 'camera' },
    { id: 23, title: 'Photo 23', category: 'all', color: 'blue', icon: 'camera' },
    { id: 24, title: 'Photo 24', category: 'all', color: 'lavender', icon: 'camera' },
    { id: 25, title: 'Photo 25', category: 'all', color: 'pink', icon: 'camera' },
    { id: 26, title: 'Photo 26', category: 'all', color: 'sage', icon: 'camera' },
    { id: 27, title: 'Photo 27', category: 'all', color: 'peach', icon: 'camera' },
    { id: 28, title: 'Photo 28', category: 'all', color: 'blue', icon: 'camera' },
    { id: 29, title: 'Photo 29', category: 'all', color: 'lavender', icon: 'camera' },
    { id: 30, title: 'Photo 30', category: 'all', color: 'pink', icon: 'camera' }
  ];

  var ICONS = {
    baby: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M12 8c-2.21 0-4 1.79-4 4v4h2v4h4v-4h2v-4c0-2.21-1.79-4-4-4z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    tree: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L5 12h3l-2 5h4v5h4v-5h4l-2-5h3z"/></svg>',
    meal: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="white"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zM6.5 13c-.83 0-1.5-.67-1.5-1.5S5.67 10 6.5 10s1.5.67 1.5 1.5S7.33 13 6.5 13zm3-4C8.67 9 8 8.33 8 7.5S8.67 6 9.5 6s1.5.67 1.5 1.5S10.33 9 9.5 9zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zm3 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>'
  };

  var COLORS = {
    sage: 'placeholder-img--sage',
    peach: 'placeholder-img--peach',
    blue: 'placeholder-img--blue',
    lavender: 'placeholder-img--lavender',
    pink: 'placeholder-img--pink',
    cream: 'placeholder-img--cream'
  };

  // ----------------------------------------
  // STATE
  // ----------------------------------------
  var galleryItems = [];
  var db = null;
  var currentFilter = 'all';
  var lightboxIndex = -1;
  var isAdmin = false;

  // ----------------------------------------
  // INIT
  // ----------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    openDatabase(function () {
      loadGalleryData(function () {
        renderGallery();
        initFilters();
        initLightbox();
        initGalleryAdmin();
      });
    });
  });

  // ----------------------------------------
  // INDEXEDDB - PERSISTENT STORAGE
  // ----------------------------------------
  function openDatabase(callback) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (e) {
      var database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = function (e) {
      db = e.target.result;
      callback();
    };

    request.onerror = function () {
      console.warn('IndexedDB failed, falling back to memory-only gallery.');
      db = null;
      callback();
    };
  }

  function dbSaveAll(items, callback) {
    if (!db) { if (callback) callback(); return; }

    var tx = db.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);

    // Clear then re-add all
    store.clear();
    items.forEach(function (item) {
      store.put(item);
    });

    tx.oncomplete = function () {
      // Also save metadata version
      localStorage.setItem(VERSION_KEY, GALLERY_VERSION);
      if (callback) callback();
    };

    tx.onerror = function () {
      console.error('Failed to save gallery to IndexedDB');
      if (callback) callback();
    };
  }

  function dbLoadAll(callback) {
    if (!db) { callback(null); return; }

    var tx = db.transaction(STORE_NAME, 'readonly');
    var store = tx.objectStore(STORE_NAME);
    var request = store.getAll();

    request.onsuccess = function () {
      callback(request.result && request.result.length > 0 ? request.result : null);
    };

    request.onerror = function () {
      callback(null);
    };
  }

  // ----------------------------------------
  // DATA MANAGEMENT
  // ----------------------------------------
  function loadGalleryData(callback) {
    var storedVersion = parseInt(localStorage.getItem(VERSION_KEY)) || 0;

    // Check for baked-in gallery data from file (used in deployed builds)
    if (window.NURTURY_GALLERY_DATA && storedVersion < GALLERY_VERSION) {
      galleryItems = window.NURTURY_GALLERY_DATA.slice();
      dbSaveAll(galleryItems, function () {
        localStorage.setItem(VERSION_KEY, GALLERY_VERSION);
        callback();
      });
      return;
    }

    // If version is outdated, reset to defaults
    if (storedVersion < GALLERY_VERSION) {
      galleryItems = DEFAULT_ITEMS.slice();
      dbSaveAll(galleryItems, function () {
        localStorage.removeItem('nurtury_gallery');
        callback();
      });
      return;
    }

    // Try to load from IndexedDB
    dbLoadAll(function (items) {
      if (items && items.length > 0) {
        galleryItems = items;
      } else {
        // Migrate from old localStorage if it exists
        var oldData = localStorage.getItem('nurtury_gallery');
        if (oldData) {
          try {
            galleryItems = JSON.parse(oldData);
            localStorage.removeItem('nurtury_gallery');
            // Save migrated data to IndexedDB
            dbSaveAll(galleryItems, function () {
              callback();
            });
            return;
          } catch (e) {
            galleryItems = DEFAULT_ITEMS.slice();
          }
        } else {
          galleryItems = DEFAULT_ITEMS.slice();
        }
        dbSaveAll(galleryItems);
      }
      callback();
    });
  }

  function saveGalleryData(callback) {
    dbSaveAll(galleryItems, callback);
  }

  function getNextId() {
    var max = 0;
    galleryItems.forEach(function (item) {
      if (item.id > max) max = item.id;
    });
    return max + 1;
  }

  // ----------------------------------------
  // GALLERY RENDERING
  // ----------------------------------------
  function renderGallery() {
    var grid = document.getElementById('gallery-grid');
    if (!grid) return;

    var filtered = currentFilter === 'all'
      ? galleryItems
      : galleryItems.filter(function (item) { return item.category === currentFilter; });

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No photos in this category yet.</div>';
      return;
    }

    filtered.forEach(function (item, index) {
      var div = document.createElement('div');
      div.className = 'gallery-item fade-in-up';
      div.setAttribute('data-id', item.id);
      div.style.transitionDelay = (index % 8) * 0.05 + 's';

      var imgClass = COLORS[item.color] || 'placeholder-img--sage';
      var iconSvg = ICONS[item.icon] || ICONS.camera;

      var html = '<div class="placeholder-img placeholder-img--square ' + imgClass + '">' +
        iconSvg +
        '<span>' + escapeHtml(item.title) + '</span>' +
        '</div>';

      if (item.customImage) {
        html = '<div class="placeholder-img placeholder-img--square" style="background-image:url(' + escapeHtml(item.customImage) + ');background-size:cover;background-position:center;">' +
          '<span style="background:rgba(0,0,0,0.5);padding:0.25rem 0.75rem;border-radius:4px;">' + escapeHtml(item.title) + '</span>' +
          '</div>';
      }

      html += '<div class="gallery-item__admin">' +
        '<button class="gallery-item__admin-btn gallery-item__admin-btn--replace" title="Replace photo" data-action="replace" data-id="' + item.id + '">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="gallery-item__admin-btn gallery-item__admin-btn--delete" title="Delete photo" data-action="delete" data-id="' + item.id + '">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>' +
        '</button>' +
        '</div>';

      div.innerHTML = html;

      div.addEventListener('click', function (e) {
        if (e.target.closest('.gallery-item__admin-btn')) return;
        if (isAdmin) return;
        var allFiltered = getFilteredItems();
        var clickedIdx = allFiltered.findIndex(function (fi) { return fi.id === item.id; });
        openLightbox(clickedIdx);
      });

      grid.appendChild(div);
    });

    requestAnimationFrame(function () {
      grid.querySelectorAll('.fade-in-up').forEach(function (el) {
        el.classList.add('visible');
      });
    });

    if (isAdmin) {
      grid.querySelectorAll('.gallery-item__admin-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var action = this.getAttribute('data-action');
          var id = parseInt(this.getAttribute('data-id'));
          if (action === 'delete') deletePhoto(id);
          if (action === 'replace') openPhotoModal(id);
        });
      });
    }
  }

  function getFilteredItems() {
    return currentFilter === 'all'
      ? galleryItems
      : galleryItems.filter(function (item) { return item.category === currentFilter; });
  }

  // ----------------------------------------
  // FILTERS
  // ----------------------------------------
  function initFilters() {
    var filterBtns = document.querySelectorAll('.gallery-filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.classList.remove('btn--sage');
          b.classList.add('btn--outline-sage');
        });
        this.classList.add('active');
        this.classList.remove('btn--outline-sage');
        this.classList.add('btn--sage');
        currentFilter = this.getAttribute('data-filter');
        renderGallery();
      });
    });
  }

  // ----------------------------------------
  // LIGHTBOX
  // ----------------------------------------
  function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    var closeBtn = lightbox.querySelector('.lightbox__close');
    var prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    var nextBtn = lightbox.querySelector('.lightbox__nav--next');

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function () { navigateLightbox(-1); });
    nextBtn.addEventListener('click', function () { navigateLightbox(1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (lightboxIndex < 0) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(index) {
    var items = getFilteredItems();
    if (index < 0 || index >= items.length) return;

    lightboxIndex = index;
    var lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateLightboxContent();
  }

  function closeLightbox() {
    lightboxIndex = -1;
    var lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    var items = getFilteredItems();
    lightboxIndex += dir;
    if (lightboxIndex < 0) lightboxIndex = items.length - 1;
    if (lightboxIndex >= items.length) lightboxIndex = 0;
    updateLightboxContent();
  }

  function updateLightboxContent() {
    var items = getFilteredItems();
    var item = items[lightboxIndex];
    if (!item) return;

    var container = document.getElementById('lightbox-image');
    var counter = document.getElementById('lightbox-counter');

    var imgClass = COLORS[item.color] || 'placeholder-img--sage';
    var iconSvg = ICONS[item.icon] || ICONS.camera;

    if (item.customImage) {
      container.className = 'lightbox__image';
      container.style.backgroundImage = 'url(' + item.customImage + ')';
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.innerHTML = '<span style="background:rgba(0,0,0,0.5);padding:0.5rem 1rem;border-radius:8px;">' + escapeHtml(item.title) + '</span>';
    } else {
      container.className = 'lightbox__image ' + imgClass;
      container.style.backgroundImage = '';
      container.innerHTML = iconSvg + '<span>' + escapeHtml(item.title) + '</span>';
    }

    counter.textContent = (lightboxIndex + 1) + ' / ' + items.length;
  }

  // ----------------------------------------
  // GALLERY ADMIN (hooks into shared admin from main.js)
  // ----------------------------------------
  function initGalleryAdmin() {
    if (window.NurturyAdmin) {
      window.NurturyAdmin.onEnable.push(enableGalleryAdmin);
      window.NurturyAdmin.onDisable.push(disableGalleryAdmin);

      if (window.NurturyAdmin.isActive) {
        enableGalleryAdmin();
      }
    }
  }

  function enableGalleryAdmin() {
    isAdmin = true;

    var adminBar = document.getElementById('admin-bar');
    if (adminBar) adminBar.classList.add('active');

    var addBtn = document.getElementById('admin-add-btn');
    if (addBtn) {
      var newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newAddBtn, addBtn);
      newAddBtn.addEventListener('click', function () { openPhotoModal(null); });
    }

    renderGallery();
  }

  function disableGalleryAdmin() {
    isAdmin = false;

    var adminBar = document.getElementById('admin-bar');
    if (adminBar) adminBar.classList.remove('active');

    renderGallery();
  }

  // ----------------------------------------
  // PHOTO CRUD
  // ----------------------------------------
  function openPhotoModal(editId) {
    var modal = document.getElementById('photo-modal');
    if (!modal) return;
    modal.classList.add('active');

    var titleInput = modal.querySelector('#pm-title');
    var categorySelect = modal.querySelector('#pm-category');
    var colorSelect = modal.querySelector('#pm-color');
    var iconSelect = modal.querySelector('#pm-icon');
    var fileInput = modal.querySelector('#pm-file');
    var submitBtn = modal.querySelector('#pm-submit');
    var closeBtn = modal.querySelector('#pm-close');
    var modalTitle = modal.querySelector('.photo-modal__title');

    titleInput.value = '';
    categorySelect.value = 'all';
    colorSelect.value = 'sage';
    iconSelect.value = 'camera';
    if (fileInput) fileInput.value = '';

    if (editId !== null) {
      modalTitle.textContent = 'Edit Photo';
      var item = galleryItems.find(function (i) { return i.id === editId; });
      if (item) {
        titleInput.value = item.title;
        categorySelect.value = item.category;
        colorSelect.value = item.color;
        iconSelect.value = item.icon;
      }
    } else {
      modalTitle.textContent = 'Add Photo';
    }

    var newSubmit = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
    newSubmit.addEventListener('click', function () {
      var title = titleInput.value.trim();
      if (!title) { titleInput.focus(); return; }

      if (editId !== null) {
        var idx = galleryItems.findIndex(function (i) { return i.id === editId; });
        if (idx >= 0) {
          galleryItems[idx].title = title;
          galleryItems[idx].category = categorySelect.value;
          galleryItems[idx].color = colorSelect.value;
          galleryItems[idx].icon = iconSelect.value;
        }

        if (fileInput && fileInput.files && fileInput.files[0]) {
          readFileAsDataURL(fileInput.files[0], function (dataUrl) {
            if (idx >= 0) galleryItems[idx].customImage = dataUrl;
            saveGalleryData(function () { renderGallery(); });
          });
        } else {
          saveGalleryData(function () { renderGallery(); });
        }
      } else {
        var newItem = {
          id: getNextId(),
          title: title,
          category: categorySelect.value,
          color: colorSelect.value,
          icon: iconSelect.value
        };

        if (fileInput && fileInput.files && fileInput.files[0]) {
          readFileAsDataURL(fileInput.files[0], function (dataUrl) {
            newItem.customImage = dataUrl;
            galleryItems.push(newItem);
            saveGalleryData(function () { renderGallery(); });
          });
        } else {
          galleryItems.push(newItem);
          saveGalleryData(function () { renderGallery(); });
        }
      }

      modal.classList.remove('active');
    });

    var newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener('click', function () {
      modal.classList.remove('active');
    });
  }

  function deletePhoto(id) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    galleryItems = galleryItems.filter(function (item) { return item.id !== id; });
    saveGalleryData(function () { renderGallery(); });
  }

  function readFileAsDataURL(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) { callback(e.target.result); };
    reader.readAsDataURL(file);
  }

  // ----------------------------------------
  // HELPERS
  // ----------------------------------------
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
