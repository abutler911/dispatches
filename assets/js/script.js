// ============================================
// DISPATCHES — Redesigned Engine
// ============================================

(function () {
  'use strict';

  // --- Config ---
  const API_BASE = ['localhost', '127.0.0.1', ''].includes(
    window.location.hostname
  )
    ? 'http://localhost:3001'
    : 'https://dispatches-api.onrender.com';

  // --- Tag color map (dark / light) ---
  const TAG_COLORS = {
    Security: {
      dark: {
        bg: 'rgba(201,162,77,0.12)',
        text: '#ddb95c',
        border: 'rgba(201,162,77,0.25)',
      },
      light: {
        bg: 'rgba(164,126,40,0.10)',
        text: '#7a5e18',
        border: 'rgba(164,126,40,0.25)',
      },
    },
    NATO: {
      dark: {
        bg: 'rgba(100,160,255,0.10)',
        text: '#7ab4ff',
        border: 'rgba(100,160,255,0.20)',
      },
      light: {
        bg: 'rgba(40,100,180,0.08)',
        text: '#2a6ab0',
        border: 'rgba(40,100,180,0.18)',
      },
    },
    Europe: {
      dark: {
        bg: 'rgba(130,180,130,0.10)',
        text: '#8cbf8c',
        border: 'rgba(130,180,130,0.20)',
      },
      light: {
        bg: 'rgba(50,120,50,0.08)',
        text: '#3a7a3a',
        border: 'rgba(50,120,50,0.18)',
      },
    },
    Industry: {
      dark: {
        bg: 'rgba(200,140,100,0.10)',
        text: '#d4a070',
        border: 'rgba(200,140,100,0.20)',
      },
      light: {
        bg: 'rgba(160,100,50,0.08)',
        text: '#8a5a2a',
        border: 'rgba(160,100,50,0.18)',
      },
    },
    Technology: {
      dark: {
        bg: 'rgba(160,130,220,0.10)',
        text: '#b8a0e0',
        border: 'rgba(160,130,220,0.20)',
      },
      light: {
        bg: 'rgba(100,70,160,0.08)',
        text: '#6a4aaa',
        border: 'rgba(100,70,160,0.18)',
      },
    },
    Trade: {
      dark: {
        bg: 'rgba(100,200,200,0.10)',
        text: '#70c8c8',
        border: 'rgba(100,200,200,0.20)',
      },
      light: {
        bg: 'rgba(30,140,140,0.08)',
        text: '#1a8a8a',
        border: 'rgba(30,140,140,0.18)',
      },
    },
    Logistics: {
      dark: {
        bg: 'rgba(220,160,160,0.10)',
        text: '#d4a0a0',
        border: 'rgba(220,160,160,0.20)',
      },
      light: {
        bg: 'rgba(180,80,80,0.08)',
        text: '#a04a4a',
        border: 'rgba(180,80,80,0.18)',
      },
    },
    Policy: {
      dark: {
        bg: 'rgba(180,180,140,0.10)',
        text: '#c0c098',
        border: 'rgba(180,180,140,0.20)',
      },
      light: {
        bg: 'rgba(120,120,70,0.08)',
        text: '#6a6a3a',
        border: 'rgba(120,120,70,0.18)',
      },
    },
    Resources: {
      dark: {
        bg: 'rgba(100,190,160,0.10)',
        text: '#70c0a0',
        border: 'rgba(100,190,160,0.20)',
      },
      light: {
        bg: 'rgba(30,140,100,0.08)',
        text: '#1a8a60',
        border: 'rgba(30,140,100,0.18)',
      },
    },
    Climate: {
      dark: {
        bg: 'rgba(140,190,220,0.10)',
        text: '#90c0e0',
        border: 'rgba(140,190,220,0.20)',
      },
      light: {
        bg: 'rgba(40,120,170,0.08)',
        text: '#2a7aaa',
        border: 'rgba(40,120,170,0.18)',
      },
    },
    Governance: {
      dark: {
        bg: 'rgba(190,160,200,0.10)',
        text: '#c0a0d0',
        border: 'rgba(190,160,200,0.20)',
      },
      light: {
        bg: 'rgba(130,80,150,0.08)',
        text: '#7a4a90',
        border: 'rgba(130,80,150,0.18)',
      },
    },
  };

  function getTagColor(tag) {
    const theme = document.body.getAttribute('data-theme') || 'dark';
    const entry = TAG_COLORS[tag] || TAG_COLORS.Security;
    return entry[theme];
  }

  // --- State ---
  let posts = [];
  let expandedId = null;
  let activeTags = [];
  let searchQuery = '';
  let lastScrollY = 0;
  let ticking = false;

  // --- DOM ---
  const body = document.body;
  const progressBar = document.getElementById('progress-bar');
  const topNav = document.getElementById('top-nav');
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');
  const scrollTopBtn = document.getElementById('scroll-top');
  const scrollCue = document.getElementById('scroll-cue');
  const searchInput = document.getElementById('search-input');
  const tagPillsContainer = document.getElementById('tag-pills');
  const tagClear = document.getElementById('tag-clear');
  const filterCount = document.getElementById('filter-count');
  const dispatchList = document.getElementById('dispatch-list');
  const emptyState = document.getElementById('empty-state');
  const emptyReset = document.getElementById('empty-reset');

  // --- Theme ---
  const savedTheme = localStorage.getItem('dispatches-theme');
  if (savedTheme) body.setAttribute('data-theme', savedTheme);
  updateThemeLabel();

  themeToggle.addEventListener('click', () => {
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem('dispatches-theme', next);
    updateThemeLabel();
    refreshTagColors();
  });

  function updateThemeLabel() {
    const current = body.getAttribute('data-theme') || 'dark';
    if (themeLabel)
      themeLabel.textContent = current === 'dark' ? 'Light' : 'Dark';
  }

  // --- Helpers ---
  function estimateReadingTime(html) {
    const text = html.replace(/<[^>]*>/g, '');
    return Math.max(1, Math.round(text.trim().split(/\s+/).length / 230));
  }

  function getExcerpt(html, len) {
    len = len || 180;
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > len
      ? text.slice(0, len).replace(/\s+\S*$/, '') + '\u2026'
      : text;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }

  // --- Content Processing (same as original) ---
  function processContent(rawContent) {
    const temp = document.createElement('div');
    temp.innerHTML = rawContent;

    temp.querySelectorAll('p').forEach(function (p) {
      const html = p.innerHTML.trim();
      const ulPattern = /^(?:[•\-\*]\s+.+(?:<br\s*\/?>)?)+$/im;
      const olPattern = /^(?:\d+[\.\)]\s+.+(?:<br\s*\/?>)?)+$/im;

      if (ulPattern.test(html)) {
        const items = html
          .split(/<br\s*\/?>|\n/)
          .map(function (line) {
            return line.replace(/^[•\-\*]\s+/, '').trim();
          })
          .filter(function (line) {
            return line.length > 0;
          });
        if (items.length > 0) {
          const ul = document.createElement('ul');
          items.forEach(function (item) {
            const li = document.createElement('li');
            li.innerHTML = item;
            ul.appendChild(li);
          });
          p.replaceWith(ul);
        }
      } else if (olPattern.test(html)) {
        const items = html
          .split(/<br\s*\/?>|\n/)
          .map(function (line) {
            return line.replace(/^\d+[\.\)]\s+/, '').trim();
          })
          .filter(function (line) {
            return line.length > 0;
          });
        if (items.length > 0) {
          const ol = document.createElement('ol');
          items.forEach(function (item) {
            const li = document.createElement('li');
            li.innerHTML = item;
            ol.appendChild(li);
          });
          p.replaceWith(ol);
        }
      }
    });

    return temp.innerHTML;
  }

  // --- Scroll handling ---
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        var docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

        progressBar.style.width = progress + '%';
        topNav.classList.toggle('scrolled', scrollY > 60);

        if (scrollY > lastScrollY && scrollY > 200) {
          topNav.classList.add('nav-hidden');
        } else {
          topNav.classList.remove('nav-hidden');
        }

        scrollTopBtn.classList.toggle('visible', scrollY > window.innerHeight);

        // Update per-article reading progress for expanded article
        updateArticleProgress();

        lastScrollY = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Per-article reading progress ---
  function updateArticleProgress() {
    if (expandedId === null) return;
    var row = document.querySelector('.dispatch-row.expanded');
    if (!row) return;
    var bodyEl = row.querySelector('.dispatch-body');
    if (!bodyEl) return;
    var fill = row.querySelector('.row-progress-fill');
    if (!fill) return;

    var rect = bodyEl.getBoundingClientRect();
    var total = bodyEl.scrollHeight;
    var scrolled = -rect.top + 200;
    var pct = Math.min(
      100,
      Math.max(0, (scrolled / (total - window.innerHeight + 200)) * 100)
    );
    fill.style.height = pct + '%';
  }

  // --- Scroll-to-top ---
  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Scroll cue ---
  if (scrollCue) {
    scrollCue.addEventListener('click', function () {
      var filterBar = document.getElementById('filter-bar');
      if (filterBar) {
        filterBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // --- Search ---
  searchInput.addEventListener('input', function (e) {
    searchQuery = e.target.value;
    renderList();
  });

  // --- Tag clear ---
  tagClear.addEventListener('click', function () {
    activeTags = [];
    renderTagPills();
    renderList();
  });

  // --- Empty state reset ---
  emptyReset.addEventListener('click', function () {
    searchQuery = '';
    activeTags = [];
    searchInput.value = '';
    renderTagPills();
    renderList();
  });

  // --- Filter logic ---
  function getFilteredPosts() {
    return posts.filter(function (p) {
      var q = searchQuery.toLowerCase();
      var matchesSearch =
        !q ||
        p.title.toLowerCase().indexOf(q) !== -1 ||
        p.subtitle.toLowerCase().indexOf(q) !== -1 ||
        p.tags.some(function (t) {
          return t.toLowerCase().indexOf(q) !== -1;
        });

      var matchesTags =
        activeTags.length === 0 ||
        activeTags.some(function (t) {
          return p.tags.indexOf(t) !== -1;
        });

      return matchesSearch && matchesTags;
    });
  }

  // --- Collect all tags ---
  function getAllTags() {
    var s = new Set();
    posts.forEach(function (p) {
      p.tags.forEach(function (t) {
        s.add(t);
      });
    });
    return Array.from(s).sort();
  }

  // --- Render tag filter pills ---
  function renderTagPills() {
    var allTags = getAllTags();
    tagPillsContainer.innerHTML = '';

    allTags.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.className =
        'tag-pill' + (activeTags.indexOf(tag) !== -1 ? ' active' : '');
      btn.textContent = tag;
      btn.addEventListener('click', function () {
        var idx = activeTags.indexOf(tag);
        if (idx !== -1) {
          activeTags.splice(idx, 1);
        } else {
          activeTags.push(tag);
        }
        renderTagPills();
        renderList();
      });
      tagPillsContainer.appendChild(btn);
    });

    tagClear.classList.toggle('hidden', activeTags.length === 0);
  }

  // --- Refresh tag badge colors (after theme change) ---
  function refreshTagColors() {
    document.querySelectorAll('.tag-badge').forEach(function (el) {
      var tag = el.getAttribute('data-tag');
      var c = getTagColor(tag);
      el.style.background = c.bg;
      el.style.color = c.text;
      el.style.borderColor = c.border;
    });
  }

  // --- Build a single dispatch row ---
  function buildRow(post, index, total) {
    var num = String(total - index).padStart(3, '0');
    var rt = estimateReadingTime(post.content);
    var excerpt = getExcerpt(post.content);
    var processed = processContent(post.content);
    var isExpanded = expandedId === post.id;

    var row = document.createElement('div');
    row.className = 'dispatch-row' + (isExpanded ? ' expanded' : '');
    row.setAttribute('data-id', post.id);
    row.style.animation =
      'fadeSlideIn 0.6s cubic-bezier(0.16,1,0.3,1) ' + index * 0.07 + 's both';

    // Build tag badges HTML
    var tagsHTML = post.tags
      .map(function (tag) {
        var c = getTagColor(tag);
        return (
          '<span class="tag-badge" data-tag="' +
          tag +
          '" style="background:' +
          c.bg +
          ';color:' +
          c.text +
          ';border:1px solid ' +
          c.border +
          '">' +
          tag +
          '</span>'
        );
      })
      .join('');

    row.innerHTML =
      '<div class="row-progress-track"><div class="row-progress-fill"></div></div>' +
      '<div class="dispatch-header">' +
      '<div class="dispatch-meta-line">' +
      '<span class="meta-num">No. ' +
      num +
      '</span>' +
      '<span class="meta-sep">//</span>' +
      '<span class="meta-date">' +
      formatDateShort(post.date) +
      '</span>' +
      '<span class="meta-sep">//</span>' +
      '<span class="meta-time">' +
      rt +
      ' min</span>' +
      '<div class="meta-tags">' +
      tagsHTML +
      '</div>' +
      '</div>' +
      '<h2 class="dispatch-title">' +
      post.title +
      '</h2>' +
      '<p class="dispatch-subtitle">' +
      post.subtitle +
      '</p>' +
      '<p class="dispatch-excerpt">' +
      excerpt +
      '</p>' +
      '<div class="dispatch-toggle-hint">' +
      '<span>' +
      (isExpanded ? 'Collapse' : 'Read Dispatch') +
      '</span>' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>' +
      '</div>' +
      '</div>' +
      '<div class="dispatch-body">' +
      '<div class="dispatch-body-inner">' +
      '<div class="dispatch-author-bar">' +
      '<span class="author-name">Andrew F. Butler</span>' +
      '<span class="sep">//</span>' +
      '<span>' +
      formatDate(post.date) +
      '</span>' +
      '<span class="sep">//</span>' +
      '<span>' +
      rt +
      ' min read</span>' +
      '</div>' +
      '<div class="body-content">' +
      processed +
      '</div>' +
      '</div>' +
      '</div>';

    // Click to expand/collapse
    var header = row.querySelector('.dispatch-header');
    header.addEventListener('click', function () {
      toggleExpand(post.id, row);
    });

    return row;
  }

  // --- Toggle expand ---
  function toggleExpand(id, clickedRow) {
    if (expandedId === id) {
      // Collapse
      expandedId = null;
      clickedRow.classList.remove('expanded');
      clickedRow.querySelector('.dispatch-toggle-hint span').textContent =
        'Read Dispatch';
    } else {
      // Collapse previously expanded
      var prev = document.querySelector('.dispatch-row.expanded');
      if (prev) {
        prev.classList.remove('expanded');
        prev.querySelector('.dispatch-toggle-hint span').textContent =
          'Read Dispatch';
        var prevFill = prev.querySelector('.row-progress-fill');
        if (prevFill) prevFill.style.height = '0%';
      }
      // Expand new
      expandedId = id;
      clickedRow.classList.add('expanded');
      clickedRow.querySelector('.dispatch-toggle-hint span').textContent =
        'Collapse';

      // Scroll to it with offset
      setTimeout(function () {
        var y = clickedRow.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 50);
    }
  }

  // --- Render the dispatch list ---
  function renderList() {
    var filtered = getFilteredPosts();

    // Update count
    var suffix = filtered.length !== 1 ? 'es' : '';
    var extra = searchQuery || activeTags.length > 0 ? ' found' : '';
    filterCount.textContent = filtered.length + ' dispatch' + suffix + extra;

    // Show/hide empty state
    if (filtered.length === 0) {
      dispatchList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    // Build rows
    dispatchList.innerHTML = '';
    filtered.forEach(function (post, i) {
      var row = buildRow(post, i, filtered.length);
      dispatchList.appendChild(row);
    });
  }

  // --- Initial render after data loads ---
  function renderArticles(data) {
    posts = data;
    posts.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    // Ensure every post has tags (default to empty array)
    posts.forEach(function (p) {
      if (!p.tags) p.tags = [];
    });

    renderTagPills();
    renderList();
  }

  // --- Load from API ---
  async function loadDispatches() {
    try {
      var response = await fetch(API_BASE + '/api/dispatches');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var data = await response.json();
      renderArticles(data);
    } catch (error) {
      console.error('Error loading dispatches:', error);
      dispatchList.innerHTML =
        '<div class="dispatch-row" style="animation: fadeSlideIn 0.5s ease both">' +
        '<div class="dispatch-header" style="cursor:default">' +
        '<div class="dispatch-meta-line"><span class="meta-num">System</span></div>' +
        '<h2 class="dispatch-title">Standby</h2>' +
        '<p class="dispatch-subtitle">Dispatches are being loaded.</p>' +
        '<p class="dispatch-excerpt">If this persists, ensure the API at ' +
        API_BASE +
        '/api/dispatches is accessible.</p>' +
        '</div>' +
        '</div>';
    }
  }

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 't') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (e.key === '/') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // --- Init ---
  document.addEventListener('DOMContentLoaded', loadDispatches);
})();
