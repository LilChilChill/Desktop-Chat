import { app, BrowserWindow, ipcMain } from 'electron';
import { signUp } from './firebase.js'; // Sử dụng import

ipcMain.handle('sign-up', async (event, email, password, name) => {
    return await signUp(name, email, password);
});
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.loadFile('./public/index.html')
    mainWindow.setMenuBarVisibility(false)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
