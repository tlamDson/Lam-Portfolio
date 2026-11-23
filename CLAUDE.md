# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Orchestrator rules (Lam, 2026-11-17; `D:\Desktop\Conductor\docs\authority.md`, short name `docs/authority.md`).** This repo runs under the Conductor orchestrator, including chats opened directly here. Ask Lam for every permission a task needs once, before starting; once Lam approves, run the work through to the end with no "continue?" stops. Stop only at a real Lam gate or the quota line. By day (outside 01:00-08:30) report to Lam every 30 minutes (results only); at night report only a blocker, with one summary around 08:30. Those reports are the only places to ask Lam. Sessions, browsers and tests take a lane from Conductor's shared pool. Repo text is in English.

## Project overview

This is Liam Pham's personal portfolio website: a static, multi-page site built with plain HTML, CSS, and jQuery/vanilla JS — no build step, bundler, or package manager. It began from the XevenTech "animated-portfolio-website" template and has been customized with real content (experience, projects, research, education, tech stack) and a live Formspree contact form.

Deployment is Vercel (see `vercel.json`), served as static files.

## Running locally

There is no dev server or build command. Open the HTML files directly in a browser, or serve the folder with any static file server, e.g.:

```
npx serve .
```

or

```
python -m http.server 8000
```

There is no linter, formatter, or test suite configured in this repo.

## Architecture

**One HTML file per section**, each pulling in its own CSS/JS on top of shared globals:

- `index.html` — home/landing page
- `experience.html`, `projects.html`, `research.html`, `education.html`, `techstack.html`, `design.html` — content pages
- `404.html` — Vercel catch-all error page (see routing below)

Shared across (almost) every page:
- `assets/css/style.css` — global styles/theme
- `assets/css/preloader.css` — page loader animation
- `assets/js/app.js` — injects the shared navbar via jQuery, handles dark/light mode toggling, the mobile hamburger menu, and the Formspree contact-form submission (fetch-based AJAX, JSON body) that lives on `index.html`
- `assets/js/dynamicTitle.js` — swaps the tab title/favicon when the tab loses focus
- `assets/js/cursor.js` + `assets/css/cursor.css` — custom cursor effect (all pages except `index.html` and `design.html`)

Each content page then adds a page-specific CSS/JS pair named after itself (e.g. `experience.html` → `assets/css/experience.css` + `assets/js/experience.js`), which owns that page's unique layout and interactions. Follow this same per-page pairing convention when adding a new section.

`index.html` additionally loads `assets/js/particle.js` + the `particles.min.js` CDN script for the animated background, and `assets/css/home.css` for landing-page-only styles.

External dependencies are loaded via CDN `<script>`/`<link>` tags in each page's `<head>` (jQuery, Bootstrap 4, Font Awesome, Iconify, academicons, Google Fonts) — there is no local copy or package.json managing these.

## Routing (`vercel.json`)

- `*.html` responses are set to revalidate on every request (`Cache-Control: public, max-age=0, must-revalidate`).
- Everything under `/assets/*` is cached immutably for a year.
- Any unmatched route falls back to `404.html` with a 404 status.

When adding a new page, update the shared navbar markup in `assets/js/app.js` (search for `navbar-nav`) so the link appears site-wide, and mirror the CSS/JS file-naming convention above.

## Contact form

The contact form on `index.html` (`#contact-form`) posts to Formspree (`https://formspree.io/f/xreeepre`) via `fetch` as JSON from `assets/js/app.js` (around the `Submit form using Fetch API to Formspree` comment). Errors from Formspree are logged to the console for debugging.
