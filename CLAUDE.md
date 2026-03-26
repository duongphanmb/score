# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Score Tracker is a pure HTML/CSS/JS progressive web app (PWA) for tracking scores during game nights. No build tools, frameworks, or server required.

## Commands

- `make run` - Start local development server (Python HTTP server on port 8000)

Since there's no build system, changes to HTML/CSS/JS can be tested directly by opening the files in a browser or running the local server.

## Architecture

**Single-page app structure:**
- `index.html` - Main HTML with inline modals for ranking, calculator, and help overlays
- `assets/js/main.js` - All application logic (monolithic ~590 lines)
- `assets/css/main.css` - Styles with CSS custom properties for theming
- `assets/css/fonts.css` - Font definitions
- `service-worker.js` - PWA offline caching

**Key patterns:**
- DOM manipulation via vanilla JS - no framework
- State stored in `localStorage` under `"players"` key as JSON array of `{name, score}` objects
- Debounced save function (300ms) prevents excessive localStorage writes
- Event delegation on document for click/input/keydown events
- Danger actions (delete/reset) require double-click within 1 second using `danger()` function

**Score expressions:** The calculator supports math expressions like `+30`, `-5`, `*2`, `/3` - these are evaluated safely via sanitized `Function()` calls.

**PWA:** Service worker caches all assets for offline use. Installable on mobile browsers.