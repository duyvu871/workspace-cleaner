## Workspace Cleaner

Cross-platform desktop app to **scan** your machine for large unused folders (`node_modules`, `.venv`, `target`, build outputs, …) and **Docker images/volumes**, then **delete** selected items to free disk space.

### Installers in this release

| Platform | Artifacts |
|----------|-------------|
| **Windows** | NSIS installer (`Workspace Cleaner-Setup-*.exe`) |
| **macOS** | DMG |
| **Linux** | AppImage and `.deb` |

### Highlights

- Recursive directory scan with live progress (IPC streaming)
- Optional Docker images & volumes scan
- Native folder picker, bulk selection, confirmation before delete
- Paths validated in the main process before any delete

### Documentation

- [README](https://github.com/duyvu871/workspace-cleaner/blob/main/README.md) — build from source, stack, architecture

---

**Caution:** Deleting caches and dependencies is permanent. You may need to run `npm install`, `pip install`, or rebuild projects afterward.
