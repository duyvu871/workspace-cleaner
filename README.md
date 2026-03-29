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

```bash
npm run build      # Build all processes (main, preload, renderer)
npm run dist       # Build + package with electron-builder
npm run dist:linux # Build + package for Linux only
```

Built output: `release/` directory (AppImage / deb on Linux, DMG on macOS, NSIS on Windows).

## Conventions

See [`.cursor/rules/workspace-cleaner.mdc`](.cursor/rules/workspace-cleaner.mdc) for:
- File naming (kebab-case)
- Directory structure
- IPC pattern
- Error handling
- Styling rules

> **Warning:** Deleting caches and dependencies is permanent. You may need to run `npm install`, `pip install`, etc. again in affected projects.
