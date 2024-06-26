import { app, BrowserWindow, globalShortcut, ipcMain, Tray } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import trayicon from '../../resources/trayiconTemplate.png?asset'

// Want to hide the dock icon on macOS as early as possible
if (app.dock) {
  app.dock.hide()
}

function createTray() {
  let pickerWindow: BrowserWindow | null = null
  function createPickerWindow() {
    pickerWindow = new BrowserWindow({
      width: 300,
      height: 600,
      show: false, // Do not show the window immediately
      frame: false, // Create a frameless window
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false // Set to false to use Node.js modules in the renderer process
      },
      skipTaskbar: true
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      pickerWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      pickerWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
    pickerWindow.on('closed', () => {
      pickerWindow = null
    })

    pickerWindow.on('blur', () => {
      pickerWindow?.hide() // Hide the window when it loses focus
      isVisible = false // Update visibility state
    })

    return pickerWindow
  }

  let isVisible = false // Track visibility state
  const tray = new Tray(trayicon)
  tray.setToolTip('Emoji Picker')

  tray.on('click', () => {
    if (!pickerWindow) {
      pickerWindow = createPickerWindow()
    }

    isVisible = !isVisible // Toggle visibility state
    isVisible ? pickerWindow.show() : pickerWindow.hide()

    const trayBounds = tray.getBounds()
    const pickerBounds = pickerWindow.getBounds()
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - pickerBounds.width / 2)
    const y = Math.round(trayBounds.y + trayBounds.height)

    pickerWindow.setPosition(x, y, false)
    pickerWindow.show()
    pickerWindow.focus()
  })

  const ret = globalShortcut.register('Alt+E', () => {
    if (pickerWindow) {
      if (pickerWindow.isVisible()) {
        pickerWindow.hide()
      } else {
        pickerWindow.show()
      }
    } else {
      // Create the picker window if it does not exist
      createPickerWindow()
    }
  })

  if (!ret) {
    console.log('Registration failed for the global hotkey')
  }

  // Check if the hotkey is registered
  console.log(globalShortcut.isRegistered('Alt+E'))

  createPickerWindow()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
  })

  import('electron-updater').then(({ autoUpdater }) => {
    autoUpdater.setFeedURL({
      provider: 'github',
      repo: 'keymoji',
      owner: 'deniztetik',
      private: true,
      token:
        // expires 4/4/25
        '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'
    })

    autoUpdater.checkForUpdatesAndNotify()
  })

  if (app.dock) {
    app.dock.hide()
  }
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('quit-app', () => {
    app.quit()
  })

  createTray()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
import('@sentry/electron/main').then(({ init }) => {
  init({
    dsn: 'https://c8d16fe04a7f4361230ce950a160c21e@o271079.ingest.us.sentry.io/4506888948219904'
  })
})
