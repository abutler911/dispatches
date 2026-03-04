// ============================================
// DISPATCHES — Core Engine
// ============================================

(function () {
  'use strict';

  // --- State ---
  let posts = [];
  let currentIndex = 0;

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

        // Progress bar
        progressBar.style.width = progress + '%';

        // Nav background
        topNav.classList.toggle('scrolled', scrollY > 80);

        // Hide nav on scroll down, show on scroll up
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

  // --- Render Articles ---
  function renderArticles(data) {
    posts = data;

    // Sort newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render main articles
    articlesContainer.innerHTML = posts
      .map((post, i) => {
        const num = String(posts.length - i).padStart(3, '0');
        return `
          <article id="dispatch-${i}" data-index="${i}">
            <span class="dispatch-number">Dispatch No. ${num}</span>
            <header>
              <h1>${post.title}</h1>
              <span class="subtitle">${post.subtitle}</span>
              <div class="meta">
                <span class="author-name">Andrew F. Butler</span> · ${formatDate(post.date)}
              </div>
            </header>
            <div class="body-content">
              ${post.content}
            </div>
          </article>
        `;
      })
      .join('');

    // Observe articles for scroll reveal
    document.querySelectorAll('article').forEach((el) => {
      revealObserver.observe(el);
    });

    // Build archive list
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

    // Build inter-article navigation
    if (posts.length > 1) {
      const navLinks = posts
        .map((post, i) => {
          const prev = i > 0 ? posts[i - 1] : null;
          const next = i < posts.length - 1 ? posts[i + 1] : null;
          // We only build a single nav block between all articles
          return '';
        })
        .join('');

      // Build a simple "scroll to top" or latest/oldest nav
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
      const response = await fetch('dispatches.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderArticles(data);
    } catch (error) {
      console.error('Error loading dispatches:', error);
      articlesContainer.innerHTML = `
        <article class="visible">
          <h1>Standby</h1>
          <p>Dispatches are being loaded. If this persists, ensure <code>dispatches.json</code> is accessible.</p>
        </article>
      `;
    }
  }

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (e) => {
    if (archiveOverlay.classList.contains('open')) return;

    if (e.key === 'j' || e.key === 'ArrowDown') {
      // Next article
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
      // Previous article
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
