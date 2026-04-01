/* ========================================
   THE NURTURY BABY CENTRE - MAIN JS
   Shared across all pages
   ======================================== */

(function () {
  'use strict';

  // ----------------------------------------
  // CONFIG
  // ----------------------------------------
  var WHATSAPP_NUMBER = '27715787180';
  var WHATSAPP_URL = 'https://wa.me/' + WHATSAPP_NUMBER;
  var NAV_SCROLL_THRESHOLD = 80;

  // Admin config
  var ADMIN_PASSWORD = 'NurturyAdmin2025';
  var SESSION_KEY = 'nurtury_admin';
  var EDITS_KEY = 'nurtury_edits';
  var IMG_DB_NAME = 'NurturyImagesDB';
  var IMG_DB_VERSION = 1;
  var IMG_STORE_NAME = 'images';
  var CLICK_THRESHOLD = 5;
  var CLICK_TIMEOUT = 3000;

  // Admin state
  var clickCount = 0;
  var imgDb = null;
  var clickTimer = null;

  // Expose admin state globally so gallery.js can read it
  window.NurturyAdmin = {
    isActive: false,
    onEnable: [],
    onDisable: []
  };

  // ----------------------------------------
  // DOM READY
  // ----------------------------------------
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Clear old index-based edit data (one-time migration to path-based keys)
    var migrationKey = 'nurtury_edits_v2';
    if (!localStorage.getItem(migrationKey)) {
      localStorage.removeItem(EDITS_KEY);
      localStorage.setItem(migrationKey, '1');
    }

    restoreSavedEdits();
    openImgDatabase(function () {
      restoreSavedImages();
    });
    initNavScroll();
    initActiveNavLink();
    initHamburgerMenu();
    initScrollAnimations();
    initSmoothScroll();
    initWhatsAppButton();
    initTabs();
    initSecretAdmin();
    checkAdminSession();
    markPageLoaded();
  }

  // ----------------------------------------
  // INDEXEDDB FOR IMAGES
  // ----------------------------------------
  function openImgDatabase(callback) {
    var request = indexedDB.open(IMG_DB_NAME, IMG_DB_VERSION);
    request.onupgradeneeded = function (e) {
      var database = e.target.result;
      if (!database.objectStoreNames.contains(IMG_STORE_NAME)) {
        database.createObjectStore(IMG_STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = function (e) {
      imgDb = e.target.result;
      if (callback) callback();
    };
    request.onerror = function () {
      imgDb = null;
      if (callback) callback();
    };
  }

  function imgDbSave(key, dataUrl, callback) {
    if (!imgDb) { if (callback) callback(); return; }
    var tx = imgDb.transaction(IMG_STORE_NAME, 'readwrite');
    var store = tx.objectStore(IMG_STORE_NAME);
    store.put({ key: key, data: dataUrl });
    tx.oncomplete = function () { if (callback) callback(); };
    tx.onerror = function () { if (callback) callback(); };
  }

  function imgDbGet(key, callback) {
    if (!imgDb) { callback(null); return; }
    var tx = imgDb.transaction(IMG_STORE_NAME, 'readonly');
    var store = tx.objectStore(IMG_STORE_NAME);
    var request = store.get(key);
    request.onsuccess = function () {
      callback(request.result ? request.result.data : null);
    };
    request.onerror = function () { callback(null); };
  }

  function imgDbGetAllForPage(pageKey, callback) {
    if (!imgDb) { callback({}); return; }
    var tx = imgDb.transaction(IMG_STORE_NAME, 'readonly');
    var store = tx.objectStore(IMG_STORE_NAME);
    var request = store.getAll();
    request.onsuccess = function () {
      var result = {};
      var prefix = pageKey + '::';
      (request.result || []).forEach(function (item) {
        if (item.key.indexOf(prefix) === 0) {
          var imgKey = item.key.substring(prefix.length);
          result[imgKey] = item.data;
        }
      });
      callback(result);
    };
    request.onerror = function () { callback({}); };
  }

  function imgDbDeleteForPage(pageKey, callback) {
    if (!imgDb) { if (callback) callback(); return; }
    var tx = imgDb.transaction(IMG_STORE_NAME, 'readwrite');
    var store = tx.objectStore(IMG_STORE_NAME);
    var request = store.getAll();
    request.onsuccess = function () {
      var prefix = pageKey + '::';
      (request.result || []).forEach(function (item) {
        if (item.key.indexOf(prefix) === 0) {
          store.delete(item.key);
        }
      });
    };
    tx.oncomplete = function () { if (callback) callback(); };
    tx.onerror = function () { if (callback) callback(); };
  }

  // ----------------------------------------
  // 1. NAVBAR SCROLL BEHAVIOR
  // ----------------------------------------
  function initNavScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > NAV_SCROLL_THRESHOLD) {
            navbar.classList.add('nav-scrolled');
          } else {
            navbar.classList.remove('nav-scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ----------------------------------------
  // 2. ACTIVE NAV LINK
  // ----------------------------------------
  function initActiveNavLink() {
    var path = window.location.pathname;
    var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    var links = document.querySelectorAll('.nav-links a:not(.btn)');

    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var linkFile = href.split('/').pop().split('#')[0] || 'index.html';
      if (linkFile === filename) {
        link.classList.add('active');
      }
    });
  }

  // ----------------------------------------
  // 3. HAMBURGER MENU
  // ----------------------------------------
  function initHamburgerMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navLinks = document.querySelector('.nav-links');
    var overlay = document.querySelector('.nav-overlay');

    if (!hamburger || !navLinks) return;

    function openMenu() {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
      document.body.classList.add('nav-open');
      if (overlay) overlay.classList.add('active');
    }

    function closeMenu() {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      document.body.classList.remove('nav-open');
      if (overlay) overlay.classList.remove('active');
    }

    hamburger.addEventListener('click', function () {
      if (navLinks.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // ----------------------------------------
  // 4. SCROLL FADE-IN ANIMATIONS
  // ----------------------------------------
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.fade-in-up');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ----------------------------------------
  // 5. SMOOTH SCROLL
  // ----------------------------------------
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        var navHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 72;
        var topBarHeight = document.querySelector('.top-bar') ? document.querySelector('.top-bar').offsetHeight : 36;
        var offset = target.getBoundingClientRect().top + window.scrollY - navHeight - topBarHeight - 20;

        window.scrollTo({ top: offset, behavior: 'smooth' });
      });
    });
  }

  // ----------------------------------------
  // 6. WHATSAPP FLOATING BUTTON
  // ----------------------------------------
  function initWhatsAppButton() {
    if (document.querySelector('.whatsapp-float')) return;

    var btn = document.createElement('a');
    btn.href = WHATSAPP_URL;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.className = 'whatsapp-float';
    btn.setAttribute('aria-label', 'Chat on WhatsApp');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

    document.body.appendChild(btn);
  }

  // ----------------------------------------
  // 7. TABS (Home page classrooms)
  // ----------------------------------------
  function initTabs() {
    var tabBtns = document.querySelectorAll('.tabs__btn');
    var tabContents = document.querySelectorAll('.tabs__content');

    if (!tabBtns.length) return;

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        tabContents.forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var targetContent = document.getElementById(target);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  // ----------------------------------------
  // 8. PAGE LOADED
  // ----------------------------------------
  function markPageLoaded() {
    requestAnimationFrame(function () {
      document.body.classList.add('page-loaded');
    });
  }

  // ========================================
  // 9. SITE-WIDE ADMIN SYSTEM
  // ========================================

  function getPageKey() {
    var path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  }

  // --- SECRET CLICK TO LOGIN ---
  function initSecretAdmin() {
    var copyright = document.querySelector('.footer__copyright');
    if (!copyright) return;

    copyright.addEventListener('click', function () {
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(function () { clickCount = 0; }, CLICK_TIMEOUT);
      }
      if (clickCount >= CLICK_THRESHOLD) {
        clickCount = 0;
        clearTimeout(clickTimer);
        if (!window.NurturyAdmin.isActive) {
          showLoginModal();
        }
      }
    });
  }

  function checkAdminSession() {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      enableAdmin();
    }
  }

  // --- LOGIN MODAL (injected via JS) ---
  function showLoginModal() {
    var existing = document.getElementById('site-login-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'site-login-modal';
    modal.className = 'login-modal active';
    modal.innerHTML =
      '<div class="login-modal__box">' +
        '<h3 class="login-modal__title">Admin Login</h3>' +
        '<input type="password" class="login-modal__input" id="site-admin-pw" placeholder="Enter password..." autocomplete="off">' +
        '<div class="login-modal__error" id="site-admin-err">Incorrect password. Please try again.</div>' +
        '<button class="btn btn--sage" style="width:100%;margin-bottom:0.75rem;" id="site-admin-submit">Login</button>' +
        '<button class="btn btn--outline" style="width:100%;" id="site-admin-cancel">Cancel</button>' +
      '</div>';
    document.body.appendChild(modal);

    var input = document.getElementById('site-admin-pw');
    var errMsg = document.getElementById('site-admin-err');
    input.focus();

    function attempt() {
      if (input.value === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        modal.remove();
        enableAdmin();
      } else {
        errMsg.style.display = 'block';
        input.value = '';
        input.focus();
      }
    }

    document.getElementById('site-admin-submit').addEventListener('click', attempt);
    document.getElementById('site-admin-cancel').addEventListener('click', function () { modal.remove(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }

  // --- ENABLE / DISABLE ADMIN ---
  function enableAdmin() {
    window.NurturyAdmin.isActive = true;
    document.body.classList.add('admin-active');

    injectAdminBar();
    makeContentEditable();
    addImageOverlays();

    // Notify gallery.js and other listeners
    window.NurturyAdmin.onEnable.forEach(function (fn) { fn(); });
  }

  function disableAdmin() {
    window.NurturyAdmin.isActive = false;
    sessionStorage.removeItem(SESSION_KEY);
    document.body.classList.remove('admin-active');

    removeContentEditable();
    removeImageOverlays();

    var bar = document.getElementById('site-admin-bar');
    if (bar) bar.remove();

    // Notify gallery.js and other listeners
    window.NurturyAdmin.onDisable.forEach(function (fn) { fn(); });
  }

  // --- ADMIN BAR ---
  function injectAdminBar() {
    if (document.getElementById('site-admin-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'site-admin-bar';
    bar.className = 'admin-bar active';
    bar.innerHTML =
      '<div class="container">' +
        '<div class="admin-bar__title"><span class="admin-bar__dot"></span> Edit Mode — Click any text to edit, click images to replace</div>' +
        '<div class="admin-bar__actions">' +
          '<button class="admin-bar__btn admin-bar__btn--add" id="site-admin-save">Save Changes</button>' +
          '<button class="admin-bar__btn admin-bar__btn--logout" id="site-admin-reset">Reset Page</button>' +
          '<button class="admin-bar__btn admin-bar__btn--logout" id="site-admin-logout">Logout</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);

    document.getElementById('site-admin-save').addEventListener('click', saveAllEdits);
    document.getElementById('site-admin-reset').addEventListener('click', resetPageEdits);
    document.getElementById('site-admin-logout').addEventListener('click', function () {
      saveAllEdits();
      disableAdmin();
    });
  }

  // --- EDITABLE CONTENT SELECTORS ---
  var EDITABLE_SELECTORS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'li', 'span.section-eyebrow',
    '.card__title', '.card__text',
    '.hero__subtitle', '.hero__title',
    '.page-hero__title', '.page-hero__desc', '.page-hero__age',
    '.fee-card__name', '.fee-card__type', '.fee-card__price',
    '.fee-enrollment__price',
    '.schedule__time', '.schedule__activity',
    '.schedule__note',
    '.info-bar__title', '.info-bar__text',
    '.contact-card__title', '.contact-card__text',
    '.footer__brand-text',
    '.footer__hours p',
    '.cta-section h2', '.cta-section p'
  ].join(', ');

  // Elements to skip (nav, buttons, admin UI, etc.)
  function shouldSkip(el) {
    if (!el || !el.closest) return true;
    if (el.closest('.navbar')) return true;
    if (el.closest('.nav-links')) return true;
    if (el.closest('.hamburger')) return true;
    if (el.closest('.top-bar')) return true;
    if (el.closest('.admin-bar')) return true;
    if (el.closest('.login-modal')) return true;
    if (el.closest('.photo-modal')) return true;
    if (el.closest('.lightbox')) return true;
    if (el.closest('.whatsapp-float')) return true;
    if (el.closest('.btn')) return true;
    if (el.closest('a[href]') && !el.closest('.footer__hours') && !el.closest('.contact-card') && !el.closest('.cta-section')) return true;
    if (el.tagName === 'A') return true;
    return false;
  }

  function makeContentEditable() {
    var elements = document.querySelectorAll(EDITABLE_SELECTORS);
    elements.forEach(function (el) {
      if (shouldSkip(el)) return;

      // Skip elements that are inside other editable elements
      var parent = el.parentElement;
      while (parent) {
        if (parent.hasAttribute && parent.hasAttribute('contenteditable')) return;
        parent = parent.parentElement;
      }

      el.setAttribute('contenteditable', 'true');
      el.classList.add('nurtury-editable');

      el.addEventListener('focus', function () {
        this.classList.add('nurtury-editing');
      });
      el.addEventListener('blur', function () {
        this.classList.remove('nurtury-editing');
      });
      // Prevent links inside editable areas from navigating
      el.addEventListener('click', function (e) {
        if (window.NurturyAdmin.isActive) {
          e.preventDefault();
        }
      });
    });
  }

  function removeContentEditable() {
    document.querySelectorAll('.nurtury-editable').forEach(function (el) {
      el.removeAttribute('contenteditable');
      el.classList.remove('nurtury-editable', 'nurtury-editing');
    });
  }

  // --- IMAGE REPLACEMENT ---
  function addImageOverlays() {
    var images = document.querySelectorAll('.placeholder-img');
    images.forEach(function (img) {
      // Skip gallery items (handled by gallery.js)
      if (img.closest('.gallery-item') || img.closest('.gallery-grid')) return;
      if (img.closest('.lightbox')) return;

      var overlay = document.createElement('div');
      overlay.className = 'nurtury-img-overlay';
      overlay.innerHTML =
        '<button class="nurtury-img-btn">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>' +
          ' Replace Image' +
        '</button>';
      img.style.position = 'relative';
      img.appendChild(overlay);

      overlay.querySelector('.nurtury-img-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        triggerImageReplace(img);
      });
    });
  }

  function removeImageOverlays() {
    document.querySelectorAll('.nurtury-img-overlay').forEach(function (o) { o.remove(); });
  }

  function triggerImageReplace(imgEl) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', function () {
      if (!input.files || !input.files[0]) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        // Apply the image as background
        imgEl.style.backgroundImage = 'url(' + dataUrl + ')';
        imgEl.style.backgroundSize = 'cover';
        imgEl.style.backgroundPosition = 'center';
        imgEl.classList.add('nurtury-has-image');
        // Hide placeholder content
        Array.from(imgEl.children).forEach(function (child) {
          if (!child.classList.contains('nurtury-img-overlay')) {
            child.style.display = 'none';
          }
        });
        // Mark for saving
        imgEl.setAttribute('data-custom-image', dataUrl);
      };
      reader.readAsDataURL(input.files[0]);
      input.remove();
    });
    input.click();
  }

  // --- SAVE / RESTORE EDITS ---
  function getElementPath(el) {
    // Generate a stable DOM path as unique key (e.g. "section[2]>div[0]>h2[0]")
    var path = [];
    var node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      var parent = node.parentElement;
      if (!parent) break;
      var siblings = Array.from(parent.children);
      var index = siblings.indexOf(node);
      path.unshift(node.tagName.toLowerCase() + '[' + index + ']');
      node = parent;
    }
    return path.join('>');
  }

  function saveAllEdits() {
    var pageKey = getPageKey();

    // Save text edits (small data, localStorage is fine)
    var edits = {};
    var allEditable = document.querySelectorAll(EDITABLE_SELECTORS);
    allEditable.forEach(function (el) {
      if (shouldSkip(el)) return;
      var id = getElementPath(el);
      edits[id] = el.innerHTML;
    });

    var allEditsData = {};
    try { allEditsData = JSON.parse(localStorage.getItem(EDITS_KEY)) || {}; } catch (e) { allEditsData = {}; }
    allEditsData[pageKey] = edits;
    try {
      localStorage.setItem(EDITS_KEY, JSON.stringify(allEditsData));
    } catch (e) {
      showToast('Error: Could not save text edits. Try clearing old data.');
      return;
    }

    // Save image replacements to IndexedDB (large data, unlimited storage)
    var allPlaceholders = document.querySelectorAll('.placeholder-img');
    var imgIdx = 0;
    var saveCount = 0;
    var totalToSave = 0;

    // Count how many images need saving
    allPlaceholders.forEach(function (img) {
      if (img.closest('.gallery-item') || img.closest('.gallery-grid') || img.closest('.lightbox')) return;
      var dataUrl = img.getAttribute('data-custom-image');
      if (dataUrl) totalToSave++;
      imgIdx++;
    });

    if (totalToSave === 0) {
      showToast('Changes saved!');
      return;
    }

    imgIdx = 0;
    allPlaceholders.forEach(function (img) {
      if (img.closest('.gallery-item') || img.closest('.gallery-grid') || img.closest('.lightbox')) return;
      var dataUrl = img.getAttribute('data-custom-image');
      if (dataUrl) {
        var dbKey = pageKey + '::img#' + imgIdx;
        imgDbSave(dbKey, dataUrl, function () {
          saveCount++;
          if (saveCount >= totalToSave) {
            showToast('Changes saved!');
          }
        });
      }
      imgIdx++;
    });

    // If no images but text was saved
    if (totalToSave === 0) {
      showToast('Changes saved!');
    }
  }

  function restoreSavedEdits() {
    var pageKey = getPageKey();
    var allEditsData = {};
    try { allEditsData = JSON.parse(localStorage.getItem(EDITS_KEY)) || {}; } catch (e) { return; }

    var edits = allEditsData[pageKey];
    if (!edits) return;

    var allEditable = document.querySelectorAll(EDITABLE_SELECTORS);
    allEditable.forEach(function (el) {
      if (shouldSkip(el)) return;
      var id = getElementPath(el);
      if (edits[id] !== undefined) {
        el.innerHTML = edits[id];
      }
    });
  }

  function restoreSavedImages() {
    var pageKey = getPageKey();

    imgDbGetAllForPage(pageKey, function (imageEdits) {
      if (!imageEdits || Object.keys(imageEdits).length === 0) {
        // Try migrating old localStorage data
        migrateOldImageData(pageKey);
        return;
      }

      applyImageEdits(imageEdits);
    });
  }

  function applyImageEdits(imageEdits) {
    var allPlaceholders = document.querySelectorAll('.placeholder-img');
    var imgIdx = 0;
    allPlaceholders.forEach(function (img) {
      if (img.closest('.gallery-item') || img.closest('.gallery-grid') || img.closest('.lightbox')) return;
      var key = 'img#' + imgIdx;
      if (imageEdits[key]) {
        img.style.backgroundImage = 'url(' + imageEdits[key] + ')';
        img.style.backgroundSize = 'cover';
        img.style.backgroundPosition = 'center';
        img.classList.add('nurtury-has-image');
        img.setAttribute('data-custom-image', imageEdits[key]);
        Array.from(img.children).forEach(function (child) {
          child.style.display = 'none';
        });
      }
      imgIdx++;
    });
  }

  function migrateOldImageData(pageKey) {
    // Migrate from old localStorage if it exists
    try {
      var allImageData = JSON.parse(localStorage.getItem('nurtury_images')) || {};
      var imageEdits = allImageData[pageKey];
      if (!imageEdits) return;

      // Save each image to IndexedDB
      Object.keys(imageEdits).forEach(function (imgKey) {
        var dbKey = pageKey + '::' + imgKey;
        imgDbSave(dbKey, imageEdits[imgKey]);
      });

      // Apply immediately
      applyImageEdits(imageEdits);

      // Clean up old data for this page
      delete allImageData[pageKey];
      if (Object.keys(allImageData).length === 0) {
        localStorage.removeItem('nurtury_images');
      } else {
        localStorage.setItem('nurtury_images', JSON.stringify(allImageData));
      }
    } catch (e) { /* ignore */ }
  }

  function resetPageEdits() {
    if (!confirm('Reset all edits on this page to defaults? This cannot be undone.')) return;

    var pageKey = getPageKey();

    // Clear text edits from localStorage
    var allEditsData = {};
    try { allEditsData = JSON.parse(localStorage.getItem(EDITS_KEY)) || {}; } catch (e) { allEditsData = {}; }
    delete allEditsData[pageKey];
    localStorage.setItem(EDITS_KEY, JSON.stringify(allEditsData));

    // Clear images from IndexedDB
    imgDbDeleteForPage(pageKey, function () {
      showToast('Page reset! Reloading...');
      setTimeout(function () { location.reload(); }, 800);
    });
  }

  // --- TOAST NOTIFICATION ---
  function showToast(msg) {
    var existing = document.querySelector('.nurtury-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'nurtury-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('nurtury-toast--visible');
    });

    setTimeout(function () {
      toast.classList.remove('nurtury-toast--visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

})();
