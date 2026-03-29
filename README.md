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

Shared settings live in **[`.github/ci-config.yml`](.github/ci-config.yml)** (Node version, release matrix: runner OS per platform, Linux `apt` packages, `electron-builder` flags). Workflows read this file via **[`.github/scripts/read-ci-config.rb`](.github/scripts/read-ci-config.rb)**.

- **CI** (`.github/workflows/ci.yml`): runs on pushes and pull requests to `main` / `master` — `npm ci` and `npm run build` (Node version from `ci-config.yml`).
- **Release** (`.github/workflows/release.yml`): on every push of a **version tag** `v*` (for example `v1.0.1`), builds installers on **Linux**, **Windows**, and **macOS** in parallel, then uploads all artifacts to a **GitHub Release** with auto-generated notes.

When adding a new OS or changing the Ubuntu runner, edit `ci-config.yml` and keep **branch names** in `ci:` aligned with `on.push.branches` in `ci.yml`. Tag patterns for releases are declared in `release.yml` (`on.push.tags`) and documented under `release.tag_pattern` in `ci-config.yml`.

Release steps:

1. Bump `"version"` in `package.json` (and commit).
2. Create and push a tag: `git tag v1.0.1 && git push origin v1.0.1`

You can also run the **Release** workflow manually from the Actions tab (**Run workflow**) to verify all three platform builds without creating a tag; artifact files will appear on the workflow run (no GitHub Release is created unless the ref is a `v*` tag).

## Conventions

See [`.cursor/rules/workspace-cleaner.mdc`](.cursor/rules/workspace-cleaner.mdc) for:
- File naming (kebab-case)
- Directory structure
- IPC pattern
- Error handling
- Styling rules

> **Warning:** Deleting caches and dependencies is permanent. You may need to run `npm install`, `pip install`, etc. again in affected projects.
