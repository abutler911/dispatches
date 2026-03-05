// ============================================
// DISPATCHES — Core Engine
// ============================================

(function () {
  'use strict';

  // --- State ---
  let posts = [];

  // --- DOM References ---
  const body = document.body;
  const progressBar = document.getElementById('progress-bar');
  const topNav = document.getElementById('top-nav');
  const themeToggle = document.getElementById('theme-toggle');
  const archiveToggle = document.getElementById('archive-toggle');
  const archiveOverlay = document.getElementById('archive-overlay');
  const archiveClose = document.getElementById('archive-close');
  const archiveList = document.getElementById('archive-list');
  const articlesContainer = document.getElementById('articles-container');
  const articleNav = document.getElementById('article-nav');

  // --- Theme ---
  const savedTheme = localStorage.getItem('dispatches-theme');
  if (savedTheme) body.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem('dispatches-theme', next);
  });

  // --- Scroll: Progress Bar + Nav Hide/Show ---
  let lastScrollY = 0;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

        progressBar.style.width = progress + '%';
        topNav.classList.toggle('scrolled', scrollY > 80);

        if (scrollY > lastScrollY && scrollY > 200) {
          topNav.classList.add('hidden');
        } else {
          topNav.classList.remove('hidden');
        }

        lastScrollY = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Archive Overlay ---
  archiveToggle.addEventListener('click', () => {
    archiveOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeArchive() {
    archiveOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  archiveClose.addEventListener('click', closeArchive);
  archiveOverlay.addEventListener('click', (e) => {
    if (e.target === archiveOverlay) closeArchive();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeArchive();
  });

  // --- Intersection Observer for Scroll Reveal ---
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -60px 0px' }
  );

  // --- Format Date ---
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  }

  // --- Content Processing ---
  // Processes raw HTML content from dispatches.json to ensure
  // lists and other elements render correctly.

  function processContent(rawContent) {
    // Create a temporary container to parse and clean the HTML
    const temp = document.createElement('div');
    temp.innerHTML = rawContent;

    // Ensure all lists inside .body-content are properly structured.
    // If the JSON content uses simple line-break-separated items with
    // markers like "- item" or "1. item", convert them to proper HTML lists.
    // This handles both pre-formed <ul>/<ol> tags AND plain-text list patterns.

    const textNodes = [];
    const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    // Process paragraphs that contain line-based list patterns
    temp.querySelectorAll('p').forEach((p) => {
      const html = p.innerHTML.trim();

      // Detect unordered list pattern: lines starting with "- " or "• "
      const ulPattern = /^(?:[•\-\*]\s+.+(?:<br\s*\/?>)?)+$/im;
      // Detect ordered list pattern: lines starting with "1. ", "2. ", etc.
      const olPattern = /^(?:\d+[\.\)]\s+.+(?:<br\s*\/?>)?)+$/im;

      if (ulPattern.test(html)) {
        const items = html
          .split(/<br\s*\/?>|\n/)
          .map((line) => line.replace(/^[•\-\*]\s+/, '').trim())
          .filter((line) => line.length > 0);

        if (items.length > 0) {
          const ul = document.createElement('ul');
          items.forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = item;
            ul.appendChild(li);
          });
          p.replaceWith(ul);
        }
      } else if (olPattern.test(html)) {
        const items = html
          .split(/<br\s*\/?>|\n/)
          .map((line) => line.replace(/^\d+[\.\)]\s+/, '').trim())
          .filter((line) => line.length > 0);

        if (items.length > 0) {
          const ol = document.createElement('ol');
          items.forEach((item) => {
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

  // --- Render Articles ---
  function renderArticles(data) {
    posts = data;
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    articlesContainer.innerHTML = posts
      .map((post, i) => {
        const num = String(posts.length - i).padStart(3, '0');
        const processedContent = processContent(post.content);
        return `
          <article id="dispatch-${i}" data-index="${i}">
            <div class="dispatch-label">Dispatch No. ${num}</div>
            <header>
              <h1>${post.title}</h1>
              <span class="subtitle">${post.subtitle}</span>
              <div class="meta">
                <span class="author-name">Andrew F. Butler</span>
                <span class="divider">//</span>
                ${formatDate(post.date)}
              </div>
            </header>
            <div class="body-content">
              ${processedContent}
            </div>
          </article>
        `;
      })
      .join('');

    document.querySelectorAll('article').forEach((el) => {
      revealObserver.observe(el);
    });

    archiveList.innerHTML = posts
      .map(
        (post, i) => `
        <li style="animation-delay: ${i * 0.06}s">
          <a href="#dispatch-${i}" onclick="document.querySelector('.archive-overlay').classList.remove('open'); document.body.style.overflow='';">
            <span class="archive-title">${post.title}</span>
            <span class="archive-date">${formatDate(post.date)}</span>
          </a>
        </li>
      `
      )
      .join('');

    if (posts.length > 1) {
      articleNav.innerHTML = `
        <a href="#dispatch-${posts.length - 1}">
          Oldest
          <span class="nav-label">${posts[posts.length - 1].title}</span>
        </a>
        <a href="#dispatch-0" class="next">
          Latest
          <span class="nav-label">${posts[0].title}</span>
        </a>
      `;
    }
  }

  // --- Load Content ---
  async function loadDispatches() {
    try {
      const response = await fetch('data/dispatches.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderArticles(data);
    } catch (error) {
      console.error('Error loading dispatches:', error);
      articlesContainer.innerHTML = `
        <article class="visible">
          <h1>Standby</h1>
          <p>Dispatches are being loaded. If this persists, ensure data/dispatches.json is accessible.</p>
        </article>
      `;
    }
  }

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (e) => {
    if (archiveOverlay.classList.contains('open')) return;

    if (e.key === 'j' || e.key === 'ArrowDown') {
      const articles = document.querySelectorAll('article');
      for (let i = 0; i < articles.length; i++) {
        const rect = articles[i].getBoundingClientRect();
        if (rect.top > 100) {
          articles[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
      }
    }

    if (e.key === 'k' || e.key === 'ArrowUp') {
      const articles = document.querySelectorAll('article');
      for (let i = articles.length - 1; i >= 0; i--) {
        const rect = articles[i].getBoundingClientRect();
        if (rect.top < -50) {
          articles[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        }
      }
    }

    if (e.key === 'i') {
      archiveToggle.click();
    }
  });

  // --- Init ---
  document.addEventListener('DOMContentLoaded', loadDispatches);
})();
