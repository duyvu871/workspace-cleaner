# Workspace Cleaner

A cross-platform desktop app (Electron) to scan your system for large unused folders like `node_modules`, `.venv`, `target`, and Docker images/volumes, and delete them to free disk space.

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 41.x |
| UI | React 19 + Tailwind v4 + shadcn/ui (new-york) |
| State | TanStack Query v5 + React state |
| Validation | Zod |
| Build | electron-vite (Vite 6 + esbuild) |
| Packaging | electron-builder |
| Language | TypeScript 5.x |

## Features

- Scan recursively for dev artifact folders: `node_modules`, `.venv`, `__pycache__`, `target`, `dist`, `build`, `.next`, etc.
- Scan Docker images and volumes
- Real-time streaming progress via Electron IPC (replacing SSE)
- Native folder picker (`dialog.showOpenDialog`)
- Select and bulk-delete with confirmation dialog
- Fully typed IPC API with structured error responses
- Safety checks: paths validated before any `rm -rf`

## Architecture

```
src/
├── main/          # Electron main process (Node.js)
│   ├── ipc/       # IPC handlers (scan, delete, system-info, dialog)
│   └── services/  # Business logic (scan-service, delete-service, etc.)
├── preload/       # contextBridge API (typed, secure)
├── renderer/      # React app (Vite)
│   └── src/
│       ├── components/  # shadcn UI + custom components
│       ├── hooks/       # IPC-backed React hooks
│       ├── lib/         # utils, format, api
│       └── pages/       # workspace-cleaner-page.tsx
└── shared/        # Types, IPC channels, error codes (shared between main & renderer)
```

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- Docker (optional, for scanning Docker images/volumes)

## Getting Started

```bash
npm install
npm run dev        # Start Electron app with hot reload
```

## Build & Package

Packaging is configured in **[`electron-builder.yml`](electron-builder.yml)** (app id, **`icon: public/logo.png`** for installers & OS bundles, targets per OS, `release/` output). `package.json` no longer embeds the `build` field.

```bash
npm run build      # Build all processes (main, preload, renderer)
npm run dist       # Build + package with electron-builder
npm run dist:linux # Build + package for Linux only
```

Built output: `release/` directory (AppImage / deb on Linux, DMG on macOS, NSIS on Windows).

```bash
npm run dist:win   # Windows installer only
npm run dist:mac   # macOS DMG only
```

## CI/CD (GitHub Actions)

This follows a common “best practice” setup: **one workflow** runs **in parallel on Ubuntu, Windows, and macOS**—no need for a physical machine per OS. This repo uses **electron-vite + electron-builder** (not Electron Forge). The equivalent of `forge publish` + GitHub publisher is:

1. In **`package.json`**: the `"publish": "npm run build && electron-builder --publish always"` script (already present).
2. In **`electron-builder.yml`**: **`publish.provider: github`**, **`releaseType: draft`**, and **`releaseNotesFile: release-notes.md`** — the contents of **[`release-notes.md`](release-notes.md)** become the GitHub Release description (edit that file before tagging if you want different release notes).

| Workflow | File | Role |
|----------|------|------|
| **CI** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | On push/PR to `main` / `master`: `npm ci` + `npm run build` (Node 22). |
| **Release** | [`.github/workflows/release.yml`](.github/workflows/release.yml) | **Release Electron App**: on push of tag `v*`, matrix `windows-latest` / `macos-latest` / `ubuntu-latest` → `npm ci` → **`npm run publish`** (each runner builds and uploads its OS artifacts to the same GitHub Release as a **draft**). |

### One-time: write access for `GITHUB_TOKEN`

**Settings → Actions → General → Workflow permissions → Read and write permissions → Save.**  
The workflow already sets `permissions: contents: write`; `GH_TOKEN` / `GITHUB_TOKEN` is used by `electron-builder publish`.

### Releasing (tags)

```bash
npm version patch   # or minor | major — updates package.json and creates tag v…
git push origin main --follow-tags
# or: git push origin main && git push --tags
```

After a few minutes: **Actions** shows **Release Electron App** (three jobs). **Releases** has a **Draft** for that tag; adjust release notes if needed, then **Publish release**.

To publish **immediately** on GitHub instead of a draft, set `publish.releaseType: release` (or `prerelease`) in `electron-builder.yml`.

## Conventions

See [`.cursor/rules/workspace-cleaner.mdc`](.cursor/rules/workspace-cleaner.mdc) for:
- File naming (kebab-case)
- Directory structure
- IPC pattern
- Error handling
- Styling rules

> **Warning:** Deleting caches and dependencies is permanent. You may need to run `npm install`, `pip install`, etc. again in affected projects.
