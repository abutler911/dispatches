# Dispatches — Architecture & Setup Guide

## Overview

**Dispatches** is a mobile-first editorial site with a Google Docs publishing pipeline. Write in Google Docs, hit publish, and your piece goes live.

```
Google Docs → Google Apps Script → GitHub API → GitHub Pages/Netlify → Live Site
```

---

## The Stack

| Layer    | Technology              | Purpose                                   |
| -------- | ----------------------- | ----------------------------------------- |
| Site     | HTML/CSS/JS (static)    | Mobile-first editorial reading experience |
| Content  | `dispatches.json`       | Single JSON file holds all dispatches     |
| Pipeline | Google Apps Script      | Parses Google Docs, pushes JSON to GitHub |
| Hosting  | GitHub Pages or Netlify | Auto-deploys on every push                |

---

## Setup: Step by Step

### 1. Create a GitHub Repository

Create a repo called `dispatches` (or whatever you want). Push these files:

```
dispatches/
├── index.html
├── style.css
├── script.js
└── dispatches.json
```

### 2. Enable GitHub Pages

- Go to repo **Settings → Pages**
- Source: Deploy from branch `main`, root `/`
- Your site will be live at `https://your-username.github.io/dispatches/`

**OR use Netlify** (recommended for custom domains):

- Connect your GitHub repo to Netlify
- It auto-deploys on every push — no config needed

### 3. Set Up the Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project: **"Dispatches Publisher"**
3. Paste the contents of `google-apps-script/publish.gs` into `Code.gs`
4. Edit the `CONFIG` object at the top:
   - `GITHUB_OWNER`: your GitHub username
   - `GITHUB_REPO`: your repo name
   - `GITHUB_BRANCH`: `main`
5. **Create a GitHub Personal Access Token:**
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
   - Give it repo contents read/write permission for your dispatches repo
6. In the Apps Script, run `setupToken()` — it will prompt you to paste the token
7. Optionally run `setupTrigger()` for auto-publishing from a drafts folder

### 4. Deploy as a Doc Add-on (Optional)

To get the "Dispatches" menu in every Google Doc:

- In the Apps Script editor, go to **Extensions → Google Docs**
- Set the script to trigger `onOpen`
- Now every Google Doc will have a **Dispatches → Publish** menu item

---

## Writing & Publishing Workflow

### Document Format

Create a Google Doc with this structure:

```
Title: The Mirage
Subtitle: A strategic assessment of logistical limits and the inevitability of escalation.
Date: 2026-03-03
---
Your body text starts here. Just write naturally in paragraphs.

> This becomes a pull quote. Start the line with > (like blockquotes).

---

Three dashes on their own line become a section break (· · ·).

More body text continues.
```

### Publishing

**Option A — Manual (from any Google Doc):**

1. Write your dispatch in Google Docs
2. Click **Dispatches → Publish This Dispatch** in the menu
3. Done — live in ~60 seconds

**Option B — Folder-based (auto-publish):**

1. Create two Drive folders: "Drafts" and "Published"
2. Set folder IDs in the CONFIG
3. Run `setupTrigger()` once
4. Drop Google Docs into the Drafts folder
5. Script checks every 15 minutes and publishes any new docs
6. Published docs are moved to the Published folder

---

## Site Features

### Mobile-First Design

- Fluid typography scales from phone to desktop
- Safe-area support for notched phones (iPhone)
- Touch-optimized tap targets
- Left-aligned text on mobile (justified on desktop for readability)
- Minimal, distraction-free reading environment

### Navigation

- **Reading progress bar** at the top of the page
- **Index overlay** (click "Index" or press `I`) — lists all dispatches
- **Keyboard navigation**: `J`/`K` or arrows to jump between articles
- **Article nav** at the bottom links to oldest/latest dispatches
- Smart auto-hiding nav: disappears on scroll down, reappears on scroll up

### Visual Design

- Dark/light theme toggle (persisted in localStorage)
- Staggered header reveal animation on load
- Scroll-triggered article reveals via IntersectionObserver
- Drop caps on first paragraphs
- Pull quotes with accent border
- Dispatch numbering (Dispatch No. 001, 002, etc.)

### Performance

- Zero dependencies — pure HTML/CSS/JS
- Single JSON fetch for all content
- CSS-only animations (no JS animation libraries)
- Print stylesheet included

---

## Customization

### Custom Domain

If using GitHub Pages, add a `CNAME` file with your domain. If using Netlify, configure it in the Netlify dashboard.

### Colors

Edit the CSS variables in `:root` and `[data-theme='light']` in `style.css`.

### Fonts

Currently uses **Cormorant Garamond** (body) and **Instrument Sans** (headings/UI). Change the Google Fonts link in `index.html` and the `--font-serif` / `--font-sans` variables in the CSS.

---

## Future Enhancements

Potential additions if the project grows:

- **RSS feed generation** via the Apps Script (generate `feed.xml` alongside the JSON)
- **Social sharing meta tags** — dynamic `og:title` and `og:description` per article (would need a build step or server-side rendering)
- **Full-text search** — client-side search through dispatches with a small JS library
- **Email newsletter integration** — extend the Apps Script to also push to Buttondown or Substack API
- **Image support** — handle images from Google Docs (upload to GitHub or a CDN)
