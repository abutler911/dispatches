// ============================================
// DISPATCHES — Engine
// ============================================

// Spotlight: update CSS vars on mouse move
document.addEventListener(
  "mousemove",
  (e) => {
    document.body.style.setProperty("--mouse-x", `${e.clientX}px`);
    document.body.style.setProperty("--mouse-y", `${e.clientY}px`);
  },
  { passive: true },
);

(function () {
  "use strict";

  // --- Config ---
  const API_BASE = ["localhost", "127.0.0.1", ""].includes(
    window.location.hostname,
  )
    ? "http://localhost:3001"
    : "https://dispatches-api.onrender.com";

  // --- Reduced motion ---
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // --- Tag color map (dark / light) ---
  const TAG_COLORS = {
    Security: {
      dark: {
        bg: "rgba(201,162,77,0.12)",
        text: "#ddb95c",
        border: "rgba(201,162,77,0.25)",
      },
      light: {
        bg: "rgba(164,126,40,0.10)",
        text: "#7a5e18",
        border: "rgba(164,126,40,0.25)",
      },
    },
    NATO: {
      dark: {
        bg: "rgba(100,160,255,0.10)",
        text: "#7ab4ff",
        border: "rgba(100,160,255,0.20)",
      },
      light: {
        bg: "rgba(40,100,180,0.08)",
        text: "#2a6ab0",
        border: "rgba(40,100,180,0.18)",
      },
    },
    Europe: {
      dark: {
        bg: "rgba(130,180,130,0.10)",
        text: "#8cbf8c",
        border: "rgba(130,180,130,0.20)",
      },
      light: {
        bg: "rgba(50,120,50,0.08)",
        text: "#3a7a3a",
        border: "rgba(50,120,50,0.18)",
      },
    },
    Industry: {
      dark: {
        bg: "rgba(200,140,100,0.10)",
        text: "#d4a070",
        border: "rgba(200,140,100,0.20)",
      },
      light: {
        bg: "rgba(160,100,50,0.08)",
        text: "#8a5a2a",
        border: "rgba(160,100,50,0.18)",
      },
    },
    Technology: {
      dark: {
        bg: "rgba(160,130,220,0.10)",
        text: "#b8a0e0",
        border: "rgba(160,130,220,0.20)",
      },
      light: {
        bg: "rgba(100,70,160,0.08)",
        text: "#6a4aaa",
        border: "rgba(100,70,160,0.18)",
      },
    },
    Trade: {
      dark: {
        bg: "rgba(100,200,200,0.10)",
        text: "#70c8c8",
        border: "rgba(100,200,200,0.20)",
      },
      light: {
        bg: "rgba(30,140,140,0.08)",
        text: "#1a8a8a",
        border: "rgba(30,140,140,0.18)",
      },
    },
    Logistics: {
      dark: {
        bg: "rgba(220,160,160,0.10)",
        text: "#d4a0a0",
        border: "rgba(220,160,160,0.20)",
      },
      light: {
        bg: "rgba(180,80,80,0.08)",
        text: "#a04a4a",
        border: "rgba(180,80,80,0.18)",
      },
    },
    Policy: {
      dark: {
        bg: "rgba(180,180,140,0.10)",
        text: "#c0c098",
        border: "rgba(180,180,140,0.20)",
      },
      light: {
        bg: "rgba(120,120,70,0.08)",
        text: "#6a6a3a",
        border: "rgba(120,120,70,0.18)",
      },
    },
    Resources: {
      dark: {
        bg: "rgba(100,190,160,0.10)",
        text: "#70c0a0",
        border: "rgba(100,190,160,0.20)",
      },
      light: {
        bg: "rgba(30,140,100,0.08)",
        text: "#1a8a60",
        border: "rgba(30,140,100,0.18)",
      },
    },
    Climate: {
      dark: {
        bg: "rgba(140,190,220,0.10)",
        text: "#90c0e0",
        border: "rgba(140,190,220,0.20)",
      },
      light: {
        bg: "rgba(40,120,170,0.08)",
        text: "#2a7aaa",
        border: "rgba(40,120,170,0.18)",
      },
    },
    Governance: {
      dark: {
        bg: "rgba(190,160,200,0.10)",
        text: "#c0a0d0",
        border: "rgba(190,160,200,0.20)",
      },
      light: {
        bg: "rgba(130,80,150,0.08)",
        text: "#7a4a90",
        border: "rgba(130,80,150,0.18)",
      },
    },
  };

  function getTagColor(tag) {
    const theme = document.body.getAttribute("data-theme") || "dark";
    return (TAG_COLORS[tag] || TAG_COLORS.Security)[theme];
  }

  // --- State ---
  let posts = [];
  let expandedId = null;
  let activeTags = [];
  let searchQuery = "";
  let lastScrollY = 0;
  let ticking = false;
  let toastTimeout = null;
  let terminalInterval = null;

  // --- DOM ---
  const body = document.body;
  const progressBar = document.getElementById("progress-bar");
  const topNav = document.getElementById("top-nav");
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");
  const scrollTopBtn = document.getElementById("scroll-top");
  const scrollCue = document.getElementById("scroll-cue");
  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");
  const tagPillsContainer = document.getElementById("tag-pills");
  const tagClear = document.getElementById("tag-clear");
  const filterCount = document.getElementById("filter-count");
  const dispatchList = document.getElementById("dispatch-list");
  const emptyState = document.getElementById("empty-state");
  const emptyReset = document.getElementById("empty-reset");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const shortcutsOverlay = document.getElementById("shortcuts-overlay");
  const shortcutsClose = document.getElementById("shortcuts-close");
  const filterBar = document.getElementById("filter-bar");
  const copyToast = document.getElementById("copy-toast");

  // --- Theme ---
  const savedTheme = localStorage.getItem("dispatches-theme");
  if (savedTheme) body.setAttribute("data-theme", savedTheme);
  updateThemeLabel();

  themeToggle.addEventListener("click", () => {
    const next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    localStorage.setItem("dispatches-theme", next);
    updateThemeLabel();
    refreshTagColors();
  });

  function updateThemeLabel() {
    const current = body.getAttribute("data-theme") || "dark";
    if (themeLabel)
      themeLabel.textContent = current === "dark" ? "Light" : "Dark";
  }

  // --- Helpers ---
  function estimateReadingTime(html) {
    const text = html.replace(/<[^>]*>/g, "");
    return Math.max(1, Math.round(text.trim().split(/\s+/).length / 230));
  }

  function getExcerpt(html, len) {
    len = len || 200;
    const text = html.replace(/<[^>]*>/g, "");
    return text.length > len
      ? text.slice(0, len).replace(/\s+\S*$/, "") + "\u2026"
      : text;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  }

  // --- Terminal loading messages ---
  const TERMINAL_MESSAGES = [
    "ESTABLISHING SECURE CHANNEL",
    "AUTHENTICATING CREDENTIALS",
    "CONTACTING FIELD ASSETS",
    "DECRYPTING FIELD REPORTS",
    "AWAITING TRANSMISSION",
  ];

  function startTerminalLoader() {
    let msgIndex = 0;
    const completedLines = [];

    function buildTerminalHTML() {
      const prevHTML = completedLines
        .map(
          (msg) =>
            '<div class="terminal-prev-line">' +
            '<span class="terminal-check">✓</span>' +
            "<span>" +
            msg +
            "</span>" +
            "</div>",
        )
        .join("");

      const currentMsg =
        TERMINAL_MESSAGES[msgIndex] ||
        TERMINAL_MESSAGES[TERMINAL_MESSAGES.length - 1];

      return (
        '<div class="loading-terminal">' +
        '<div class="terminal-messages">' +
        prevHTML +
        "</div>" +
        '<div class="terminal-line">' +
        '<span class="terminal-prompt">&gt;</span>' +
        '<span class="terminal-text">' +
        currentMsg +
        "</span>" +
        '<span class="terminal-cursor">_</span>' +
        "</div>" +
        '<div class="terminal-sub">First contact may take 30–60 seconds on cold start.</div>' +
        "</div>"
      );
    }

    dispatchList.innerHTML = buildTerminalHTML();

    if (prefersReducedMotion) return;

    terminalInterval = setInterval(function () {
      if (msgIndex < TERMINAL_MESSAGES.length - 1) {
        completedLines.push(TERMINAL_MESSAGES[msgIndex]);
        msgIndex++;
        const terminal = dispatchList.querySelector(".loading-terminal");
        if (terminal) {
          dispatchList.innerHTML = buildTerminalHTML();
        } else {
          clearInterval(terminalInterval);
        }
      }
    }, 1800);
  }

  function stopTerminalLoader() {
    if (terminalInterval) {
      clearInterval(terminalInterval);
      terminalInterval = null;
    }
  }

  // --- Toast notification ---
  function showToast(message) {
    copyToast.textContent = message;
    copyToast.classList.remove("hidden");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      copyToast.classList.add("hidden");
    }, 2400);
  }

  // --- Deep link: URL hash ---
  function getHashId() {
    const hash = window.location.hash;
    return hash ? hash.replace("#dispatch-", "") : null;
  }

  function setHashId(id) {
    if (id) {
      history.replaceState(null, "", "#dispatch-" + id);
    } else {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }

  // --- Copy share link ---
  function copyShareLink(postId) {
    const url =
      window.location.origin + window.location.pathname + "#dispatch-" + postId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("Link copied to clipboard");
      });
    } else {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("Link copied to clipboard");
    }
  }

  // --- Content processing ---
  function processContent(rawContent) {
    const temp = document.createElement("div");
    temp.innerHTML = rawContent;

    temp.querySelectorAll("p").forEach(function (p) {
      const html = p.innerHTML.trim();
      const ulPattern = /^(?:[•\-\*]\s+.+(?:<br\s*\/?>)?)+$/im;
      const olPattern = /^(?:\d+[\.\)]\s+.+(?:<br\s*\/?>)?)+$/im;

      if (ulPattern.test(html)) {
        const items = html
          .split(/<br\s*\/?>|\n/)
          .map((l) => l.replace(/^[•\-\*]\s+/, "").trim())
          .filter((l) => l.length > 0);
        if (items.length > 0) {
          const ul = document.createElement("ul");
          items.forEach(function (item) {
            const li = document.createElement("li");
            li.innerHTML = item;
            ul.appendChild(li);
          });
          p.replaceWith(ul);
        }
      } else if (olPattern.test(html)) {
        const items = html
          .split(/<br\s*\/?>|\n/)
          .map((l) => l.replace(/^\d+[\.\)]\s+/, "").trim())
          .filter((l) => l.length > 0);
        if (items.length > 0) {
          const ol = document.createElement("ol");
          items.forEach(function (item) {
            const li = document.createElement("li");
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
        const scrollY = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

        progressBar.style.width = progress + "%";
        topNav.classList.toggle("scrolled", scrollY > 60);

        if (scrollY > lastScrollY && scrollY > 200) {
          topNav.classList.add("nav-hidden");
        } else {
          topNav.classList.remove("nav-hidden");
        }

        scrollTopBtn.classList.toggle("visible", scrollY > window.innerHeight);
        updateArticleProgress();

        lastScrollY = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // --- Per-article reading progress ---
  function updateArticleProgress() {
    if (expandedId === null) return;
    const row = document.querySelector(".dispatch-row.expanded");
    if (!row) return;
    const bodyEl = row.querySelector(".dispatch-body");
    if (!bodyEl) return;
    const fill = row.querySelector(".row-progress-fill");
    if (!fill) return;

    const rect = bodyEl.getBoundingClientRect();
    const total = bodyEl.scrollHeight;
    const scrolled = -rect.top + 200;
    const pct = Math.min(
      100,
      Math.max(0, (scrolled / (total - window.innerHeight + 200)) * 100),
    );
    fill.style.height = pct + "%";
  }

  // --- Scroll-to-top ---
  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // --- Scroll cue ---
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      if (filterBar)
        filterBar.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // --- Search ---
  searchInput.addEventListener("input", function (e) {
    searchQuery = e.target.value;
    searchClear.classList.toggle("hidden", !searchQuery);
    renderList();
  });

  if (searchClear) {
    searchClear.addEventListener("click", function () {
      searchQuery = "";
      searchInput.value = "";
      searchClear.classList.add("hidden");
      renderList();
      searchInput.focus();
    });
  }

  // --- Tag clear ---
  tagClear.addEventListener("click", function () {
    activeTags = [];
    renderTagPills();
    renderList();
  });

  // --- Empty state reset ---
  emptyReset.addEventListener("click", function () {
    searchQuery = "";
    activeTags = [];
    searchInput.value = "";
    searchClear.classList.add("hidden");
    renderTagPills();
    renderList();
  });

  // --- Keyboard shortcuts modal ---
  function openShortcuts() {
    shortcutsOverlay.classList.remove("hidden");
    shortcutsClose.focus();
  }
  function closeShortcuts() {
    shortcutsOverlay.classList.add("hidden");
  }

  if (shortcutsBtn) shortcutsBtn.addEventListener("click", openShortcuts);
  if (shortcutsClose) shortcutsClose.addEventListener("click", closeShortcuts);
  if (shortcutsOverlay) {
    shortcutsOverlay.addEventListener("click", function (e) {
      if (e.target === shortcutsOverlay) closeShortcuts();
    });
  }

  // --- Filter logic ---
  function getFilteredPosts() {
    return posts.filter(function (p) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTags =
        activeTags.length === 0 || activeTags.some((t) => p.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }

  function getAllTags() {
    const s = new Set();
    posts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }

  // --- Tag filter pills ---
  function renderTagPills() {
    tagPillsContainer.innerHTML = "";
    getAllTags().forEach(function (tag) {
      const btn = document.createElement("button");
      btn.className = "tag-pill" + (activeTags.includes(tag) ? " active" : "");
      btn.textContent = tag;
      btn.addEventListener("click", function () {
        const idx = activeTags.indexOf(tag);
        if (idx !== -1) activeTags.splice(idx, 1);
        else activeTags.push(tag);
        renderTagPills();
        renderList();
      });
      tagPillsContainer.appendChild(btn);
    });
    tagClear.classList.toggle("hidden", activeTags.length === 0);
  }

  // --- Refresh tag badge colors after theme change ---
  function refreshTagColors() {
    document.querySelectorAll(".tag-badge").forEach(function (el) {
      const tag = el.getAttribute("data-tag");
      const c = getTagColor(tag);
      el.style.background = c.bg;
      el.style.color = c.text;
      el.style.borderColor = c.border;
    });
  }

  // --- Build a single dispatch row ---
  function buildRow(post, index, total) {
    const num = String(total - index).padStart(3, "0");
    const rt = estimateReadingTime(post.content);
    const excerpt = getExcerpt(post.content);
    const processed = processContent(post.content);
    const isExpanded = expandedId === post._id;

    const row = document.createElement("div");
    row.className = "dispatch-row" + (isExpanded ? " expanded" : "");
    row.setAttribute("data-id", post._id);

    if (!prefersReducedMotion) {
      row.style.animation =
        "fadeSlideIn 0.55s cubic-bezier(0.16,1,0.3,1) " +
        index * 0.06 +
        "s both";
    }

    const tagsHTML = post.tags
      .map(function (tag) {
        const c = getTagColor(tag);
        return (
          '<span class="tag-badge" data-tag="' +
          tag +
          '" style="background:' +
          c.bg +
          ";color:" +
          c.text +
          ";border:1px solid " +
          c.border +
          '">' +
          tag +
          "</span>"
        );
      })
      .join("");

    row.innerHTML =
      '<div class="row-progress-track"><div class="row-progress-fill"></div></div>' +
      '<div class="dispatch-header">' +
      '<div class="dispatch-meta-line">' +
      '<span class="meta-num">No. ' +
      num +
      "</span>" +
      '<span class="meta-sep">//</span>' +
      '<span class="meta-date">' +
      formatDateShort(post.date) +
      "</span>" +
      '<span class="meta-sep">//</span>' +
      '<span class="meta-time">' +
      rt +
      " min read</span>" +
      '<div class="meta-tags">' +
      tagsHTML +
      "</div>" +
      "</div>" +
      '<h2 class="dispatch-title">' +
      post.title +
      "</h2>" +
      '<p class="dispatch-subtitle">' +
      post.subtitle +
      "</p>" +
      '<p class="dispatch-excerpt">' +
      excerpt +
      "</p>" +
      '<div class="dispatch-toggle-hint">' +
      "<span>" +
      (isExpanded ? "Collapse" : "Read Dispatch") +
      "</span>" +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9" /></svg>' +
      "</div>" +
      "</div>" +
      '<div class="dispatch-body">' +
      '<div class="dispatch-body-inner">' +
      '<div class="dispatch-author-bar">' +
      '<span class="author-name">Andrew F. Butler</span>' +
      '<span class="sep">//</span>' +
      "<span>" +
      formatDate(post.date) +
      "</span>" +
      '<span class="sep">//</span>' +
      "<span>" +
      rt +
      " min read</span>" +
      '<button class="share-btn" data-post-id="' +
      post._id +
      '" aria-label="Copy link to this dispatch">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
      "Share" +
      "</button>" +
      "</div>" +
      '<div class="body-content">' +
      processed +
      "</div>" +
      "</div>" +
      "</div>";

    const header = row.querySelector(".dispatch-header");
    header.addEventListener("click", function () {
      toggleExpand(post._id, row);
    });

    const shareBtn = row.querySelector(".share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        copyShareLink(post._id);
      });
    }

    return row;
  }

  // --- Toggle expand ---
  function toggleExpand(id, clickedRow) {
    if (expandedId === id) {
      expandedId = null;
      clickedRow.classList.remove("expanded");
      clickedRow.querySelector(".dispatch-toggle-hint span").textContent =
        "Read Dispatch";
      setHashId(null);
    } else {
      const prev = document.querySelector(".dispatch-row.expanded");
      if (prev) {
        prev.classList.remove("expanded");
        prev.querySelector(".dispatch-toggle-hint span").textContent =
          "Read Dispatch";
        const prevFill = prev.querySelector(".row-progress-fill");
        if (prevFill) prevFill.style.height = "0%";
      }

      expandedId = id;
      clickedRow.classList.add("expanded");
      clickedRow.querySelector(".dispatch-toggle-hint span").textContent =
        "Collapse";
      setHashId(id);

      setTimeout(function () {
        const y = clickedRow.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({
          top: y,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }, 50);
    }
  }

  // --- Render list ---
  function renderList() {
    const filtered = getFilteredPosts();
    const total = posts.length;
    const isFiltered = searchQuery || activeTags.length > 0;

    if (isFiltered) {
      filterCount.textContent =
        filtered.length +
        " of " +
        total +
        " dispatch" +
        (total !== 1 ? "es" : "");
    } else {
      filterCount.textContent = total + " dispatch" + (total !== 1 ? "es" : "");
    }

    if (filtered.length === 0) {
      dispatchList.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");
    dispatchList.innerHTML = "";
    filtered.forEach(function (post, i) {
      dispatchList.appendChild(buildRow(post, i, filtered.length));
    });
  }

  // --- Render after load ---
  function renderArticles(data) {
    posts = data;
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    posts.forEach((p) => {
      if (!p.tags) p.tags = [];
    });

    renderTagPills();

    const hashId = getHashId();
    if (hashId) {
      const match = posts.find((p) => p._id === hashId);
      if (match) expandedId = hashId;
    }

    renderList();

    if (expandedId) {
      setTimeout(function () {
        const row = document.querySelector(
          '.dispatch-row[data-id="' + expandedId + '"]',
        );
        if (row) {
          const y = row.getBoundingClientRect().top + window.scrollY - 110;
          window.scrollTo({
            top: y,
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        }
      }, 300);
    }
  }

  // --- Load from API ---
  async function loadDispatches() {
    startTerminalLoader();

    try {
      const response = await fetch(API_BASE + "/api/dispatches");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      stopTerminalLoader();
      renderArticles(data);
    } catch (error) {
      stopTerminalLoader();
      console.error("Error loading dispatches:", error);
      dispatchList.innerHTML =
        '<div class="dispatch-row" style="animation: fadeSlideIn 0.5s ease both">' +
        '<div class="dispatch-header" style="cursor:default">' +
        '<div class="dispatch-meta-line"><span class="meta-num">Transmission Error</span></div>' +
        '<h2 class="dispatch-title">Signal Lost</h2>' +
        '<p class="dispatch-subtitle">Could not reach the field.</p>' +
        '<p class="dispatch-excerpt">Verify the API at ' +
        API_BASE +
        "/api/dispatches is operational, then reload.</p>" +
        "</div>" +
        "</div>";
    }
  }

  // --- Keyboard shortcuts ---
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Escape") {
        searchInput.blur();
        if (searchQuery) {
          searchQuery = "";
          searchInput.value = "";
          searchClear.classList.add("hidden");
          renderList();
        }
      }
      return;
    }

    if (e.key === "t" || e.key === "T") {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
    if (e.key === "/") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === "?") {
      e.preventDefault();
      if (shortcutsOverlay.classList.contains("hidden")) openShortcuts();
      else closeShortcuts();
    }
    if (e.key === "Escape") {
      if (!shortcutsOverlay.classList.contains("hidden")) closeShortcuts();
    }
  });

  // --- Init ---
  document.addEventListener("DOMContentLoaded", loadDispatches);
})();
