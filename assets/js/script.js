// ============================================
// DISPATCHES — Core Engine v2
// ============================================

(function () {
  'use strict';

  // -----------------------------------------------
  // CONFIG — Point this at your Express API
  // -----------------------------------------------
  const API_BASE = ['localhost', '127.0.0.1', ''].includes(
    window.location.hostname
  )
    ? 'http://localhost:3001'
    : 'https://api.andrewfbutler.com';

  // --- State ---
  let posts = [];
  let currentArticleIndex = -1;
  let keyboardHintTimer = null;

  // --- DOM References ---
  const body = document.body;
  const progressBar = document.getElementById('progress-bar');
  const topNav = document.getElementById('top-nav');
  const themeToggle = document.getElementById('theme-toggle');
  const archiveToggle = document.getElementById('archive-toggle');
  const archiveOverlay = document.getElementById('archive-overlay');
  const archiveClose = document.getElementById('archive-close');
  const archiveList = document.getElementById('archive-list');
  const archiveCount = document.getElementById('archive-count');
  const articlesContainer = document.getElementById('articles-container');
  const articleNav = document.getElementById('article-nav');
  const scrollTopBtn = document.getElementById('scroll-top');
  const scrollCue = document.getElementById('scroll-cue');
  const keyboardHint = document.getElementById('keyboard-hint');

  // --- Theme ---
  const savedTheme = localStorage.getItem('dispatches-theme');
  if (savedTheme) body.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem('dispatches-theme', next);
  });

  // --- Reading Time Estimate ---
  function estimateReadingTime(html) {
    const text = html.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 230));
    return minutes;
  }

  // --- Scroll: Progress + Nav + Scroll-to-Top ---
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

        // Hide/show nav on scroll direction
        if (scrollY > lastScrollY && scrollY > 240) {
          topNav.classList.add('hidden');
        } else {
          topNav.classList.remove('hidden');
        }

        // Scroll-to-top button
        scrollTopBtn.classList.toggle('visible', scrollY > window.innerHeight);

        lastScrollY = scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Scroll-to-Top ---
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Scroll Cue ---
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      const firstArticle = document.querySelector('article');
      if (firstArticle) {
        firstArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // --- Archive Overlay ---
  archiveToggle.addEventListener('click', () => {
    archiveOverlay.classList.add('open');
    body.style.overflow = 'hidden';
  });

  function closeArchive() {
    archiveOverlay.classList.remove('open');
    body.style.overflow = '';
  }

  archiveClose.addEventListener('click', closeArchive);
  archiveOverlay.addEventListener('click', (e) => {
    if (e.target === archiveOverlay) closeArchive();
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
    { threshold: 0.04, rootMargin: '0px 0px -40px 0px' }
  );

  // --- Track which article is currently in view ---
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index, 10);
          if (!isNaN(index)) currentArticleIndex = index;
        }
      });
    },
    { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' }
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

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // --- Content Processing ---
  function processContent(rawContent) {
    const temp = document.createElement('div');
    temp.innerHTML = rawContent;

    temp.querySelectorAll('p').forEach((p) => {
      const html = p.innerHTML.trim();
      const ulPattern = /^(?:[•\-\*]\s+.+(?:<br\s*\/?>)?)+$/im;
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

  // --- Smooth Scroll to Article ---
  function scrollToArticle(index, highlight) {
    const article = document.getElementById('dispatch-' + index);
    if (!article) return;

    // Remove previous highlights
    document.querySelectorAll('.nav-highlight').forEach((el) => {
      el.classList.remove('nav-highlight');
    });

    // Smooth scroll with offset
    const y = article.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });

    // Add highlight indicator
    if (highlight) {
      setTimeout(() => {
        article.classList.add('visible');
        article.classList.add('nav-highlight');
      }, 100);
    }

    currentArticleIndex = index;
  }

  // --- Render Articles ---
  function renderArticles(data) {
    posts = data;
    // API already returns sorted newest-first, but ensure it just in case
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    articlesContainer.innerHTML = posts
      .map((post, i) => {
        const num = String(posts.length - i).padStart(3, '0');
        const processedContent = processContent(post.content);
        const readTime = estimateReadingTime(post.content);
        return `
          <article id="dispatch-${i}" data-index="${i}">
            <div class="dispatch-label">Dispatch No. ${num}</div>
            <header>
              <h1>${post.title}</h1>
              <span class="subtitle">${post.subtitle}</span>
              <div class="meta">
                <span class="author-name">Andrew F. Butler</span>
                <span class="divider">//</span>
                <span>${formatDate(post.date)}</span>
                <span class="divider">//</span>
                <span class="reading-time">${readTime} min read</span>
              </div>
            </header>
            <div class="body-content">
              ${processedContent}
            </div>
          </article>
        `;
      })
      .join('');

    // Observe articles
    document.querySelectorAll('article').forEach((el) => {
      revealObserver.observe(el);
      activeObserver.observe(el);
    });

    // Archive list
    archiveList.innerHTML = posts
      .map((post, i) => {
        const readTime = estimateReadingTime(post.content);
        return `
          <li style="animation-delay: ${i * 0.05}s">
            <a href="#dispatch-${i}" data-index="${i}">
              <div>
                <span class="archive-title">${post.title}</span>
                <span class="archive-reading-time">${readTime} min read</span>
              </div>
              <span class="archive-date">${formatDateShort(post.date)}</span>
            </a>
          </li>
        `;
      })
      .join('');

    // Archive count
    if (archiveCount) {
      archiveCount.textContent = `${posts.length} dispatch${posts.length !== 1 ? 'es' : ''}`;
    }

    // Archive link clicks
    archiveList.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(link.dataset.index, 10);
        closeArchive();
        setTimeout(() => scrollToArticle(idx, true), 300);
      });
    });

    // Bottom nav
    if (posts.length > 1) {
      articleNav.innerHTML = `
        <a href="#dispatch-${posts.length - 1}" class="nav-link-oldest">
          <span class="nav-direction">&larr; Oldest</span>
          <span class="nav-label">${posts[posts.length - 1].title}</span>
        </a>
        <a href="#dispatch-0" class="nav-link-latest next">
          <span class="nav-direction">Latest &rarr;</span>
          <span class="nav-label">${posts[0].title}</span>
        </a>
      `;

      articleNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const hash = link.getAttribute('href');
          const idx = parseInt(hash.replace('#dispatch-', ''), 10);
          scrollToArticle(idx, true);
        });
      });
    }

    // Show keyboard hint briefly on desktop
    showKeyboardHint();
  }

  // --- Keyboard Hint ---
  function showKeyboardHint() {
    if (!keyboardHint || window.matchMedia('(hover: none)').matches) return;
    keyboardHintTimer = setTimeout(() => {
      keyboardHint.classList.add('visible');
      setTimeout(() => {
        keyboardHint.classList.remove('visible');
      }, 4000);
    }, 2500);
  }

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (archiveOverlay.classList.contains('open')) {
        closeArchive();
      }
      return;
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (archiveOverlay.classList.contains('open')) return;

    const articles = document.querySelectorAll('article');
    if (articles.length === 0) return;

    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (keyboardHint) keyboardHint.classList.remove('visible');
      const nextIndex = Math.min(currentArticleIndex + 1, articles.length - 1);
      scrollToArticle(nextIndex, true);
    }

    if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (keyboardHint) keyboardHint.classList.remove('visible');
      const prevIndex = Math.max(currentArticleIndex - 1, 0);
      scrollToArticle(prevIndex, true);
    }

    if (e.key === 'i') archiveToggle.click();
    if (e.key === 't') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      currentArticleIndex = -1;
    }
    if (e.key === 'h') scrollToArticle(0, true);
    if (e.key === 'l') scrollToArticle(articles.length - 1, true);
  });

  // --- Load Content (now from API) ---
  async function loadDispatches() {
    try {
      const response = await fetch(`${API_BASE}/api/dispatches`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderArticles(data);
    } catch (error) {
      console.error('Error loading dispatches:', error);
      articlesContainer.innerHTML = `
        <article class="visible">
          <div class="dispatch-label">System</div>
          <h1>Standby</h1>
          <div class="body-content">
            <p>Dispatches are being loaded. If this persists, ensure the API at <code>${API_BASE}/api/dispatches</code> is accessible.</p>
          </div>
        </article>
      `;
    }
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', loadDispatches);
})();
