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

Flow theo hướng dẫn “best practice”: **một workflow** chạy **song song trên Ubuntu / Windows / macOS**, không cần máy thật từng OS. Repo này dùng **electron-vite + electron-builder**, không dùng Electron Forge — tương đương `forge publish` + `publisher-github` là:

1. Trong **`package.json`**: script `"publish": "npm run build && electron-builder --publish always"` (đã có).
2. Trong **`electron-builder.yml`**: **`publish.provider: github`** và **`releaseType: draft`** (bản nháp trên GitHub; bạn bấm **Publish release** khi xong).

| Workflow | File | Role |
|----------|------|------|
| **CI** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Push/PR tới `main` / `master`: `npm ci` + `npm run build` (Node 22). |
| **Release** | [`.github/workflows/release.yml`](.github/workflows/release.yml) | **Release Electron App**: khi push tag `v*`, matrix `windows-latest` / `macos-latest` / `ubuntu-latest` → `npm ci` → **`npm run publish`** (mỗi máy đóng gói và đẩy artifact của OS đó lên cùng một GitHub Release dạng draft). |

### Bước 3 — Quyền Ghi cho `GITHUB_TOKEN` (một lần)

**Settings → Actions → General → Workflow permissions → Read and write permissions → Save.**  
Workflow đã có `permissions: contents: write`; `GH_TOKEN`/`GITHUB_TOKEN` dùng cho `electron-builder publish`.

### Bước 4 — Phát hành (tag)

```bash
npm version patch   # hoặc minor | major — cập nhật package.json + tạo tag v…
git push origin main --follow-tags
# hoặc: git push origin main && git push --tags
```

Sau vài phút: **Actions** có workflow **Release Electron App** (3 job). **Releases** có bản **Draft** cùng tag; chỉnh release notes → **Publish release**.

Để đổi từ draft sang **publish ngay** trên GitHub, set trong `electron-builder.yml` → `publish.releaseType: release` (hoặc `prerelease`).

## Conventions

See [`.cursor/rules/workspace-cleaner.mdc`](.cursor/rules/workspace-cleaner.mdc) for:
- File naming (kebab-case)
- Directory structure
- IPC pattern
- Error handling
- Styling rules

> **Warning:** Deleting caches and dependencies is permanent. You may need to run `npm install`, `pip install`, etc. again in affected projects.
