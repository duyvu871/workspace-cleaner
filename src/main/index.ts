import { app, BrowserWindow, Menu, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { registerHandlers } from './ipc/handlers'

const isDev = !app.isPackaged

/** Logo PNG: dev = repo/public; packaged = out/renderer (copy từ public qua Vite) */
function resolveWindowIcon(): string | undefined {
  const candidates = [
    join(__dirname, '../renderer/logo.png'),
    join(process.cwd(), 'public/logo.png'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return undefined
}

function createWindow(): void {
  const icon = resolveWindowIcon()
  if (process.platform === 'darwin' && icon) {
    app.dock?.setIcon(icon)
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: 'Workspace Cleaner',
    backgroundColor: '#f8fafc', // slate-50
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // needed for preload to access electron APIs
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']!)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

registerHandlers()

app.whenReady().then(() => {
  // Ẩn menu mặc định (File / Edit / …). Trên macOS thanh menu hệ thống vẫn do OS quản lý.
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
  } else {
    // macOS vẫn cần một menu tối thiểu; chỉ giữ tên app + Quit (không còn File/Edit/View…)
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { label: app.name, submenu: [{ role: 'quit' }] },
      ])
    )
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
