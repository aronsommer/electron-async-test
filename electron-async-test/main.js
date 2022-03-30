// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')

// Running in development or production mode?
var productionMode = true;
// If launched with --dev flag switch do development mode
// Flag is set in start script in package.json
if (process.argv[2] == '--dev') {
  console.log("Running in development mode");
  productionMode = false;
}
var rootFolder = "path to root folder";
if (productionMode == true) {
  rootFolder = process.resourcesPath;
} else {
  rootFolder = __dirname;
}

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  })

  // MENU BEGIN
  /////////////////////////////////////////////////////////////////////
  const { app, Menu } = require('electron')
  const isMac = process.platform === 'darwin'
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Run main function', click() {
            main();
          }
        },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ]
    },
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  /////////////////////////////////////////////////////////////////////
  // MENU END

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')
  mainWindow.loadURL(`file:///${rootFolder}/output.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/////////////////////////////////////////////////////////////////////
// FUNCTIONS
/////////////////////////////////////////////////////////////////////

// Send all console messages to output window
const originalConsoleLog = console.log.bind(console)
console.log = (...args) => {
  mainWindow.webContents.send('ping', args)
  originalConsoleLog(...args);
}

// main function
async function main() {
  // test 1
  await callBashScript("binaries/test1", ["argument1", "argument2", "argument3"]);
  // test 2
  await callBashScript("binaries/test2", ["argument1"]);
  // after test 2
  console.log('This gets called after test 2')
  // sync function
  syncFunction();
  // test 3
  await callBashScript("binaries/test3", [""]);
}

// Call bash script function
async function callBashScript(scriptPath, arguments) {
  console.log('Start of function ' + scriptPath)

  let promise = new Promise((resolve, reject) => {
    const action = require("child_process").execFile(`${rootFolder}/${scriptPath}`, [...arguments]);
    // action.stdout.pipe(process.stdout)
    // action.stderr.pipe(process.stderr)
    action.stdout.on('data', (data) => {
      data = data.toString();
      console.log(data);
    });
    action.stderr.on('data', (data) => {
      data = data.toString();
      // console.log(data);
      console.log(`<span style="color:red">${data}</span>`)
    });
    action.on("exit", (code) => {
      if (code == 0) {
        console.log('There was no error in bash script ' + scriptPath)
        resolve('Bash script ' + scriptPath + ' done!')
      }
      if (code == 1) {
        console.log('There was an error in bash script ' + scriptPath)
        resolve('Bash script ' + scriptPath + ' finished with error code 1')
        // reject('Bash script ' + scriptPath + ' finished with error code 1')
        // When using reject everything after the function call in main function gets not executed
      }
    });
  });

  let result = await promise; // wait until the promise resolves (*)
  console.log(result);
}

// sync function
function syncFunction() {
  console.log('do stuff in sync function')
}