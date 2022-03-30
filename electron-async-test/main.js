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
  // f
  console.log('Call function f from main function')
  await f();
  // f2
  console.log('Call function f2 from main function')
  await f2();
  // when f2 is done
  console.log('This is called when function f2 is done')
  // sync function
  syncFunction();
  // f3
  await f3();
}

// function f
async function f() {
  console.log('Start of function f')

  let promise = new Promise((resolve, reject) => {
    const testAction1 = require("child_process").execFile(`${rootFolder}/binaries/test1`, ["argument1"]);
    // testAction1.stdout.pipe(process.stdout)
    // testAction1.stderr.pipe(process.stderr)
    testAction1.stdout.on('data', (data) => {
      data = data.toString();
      console.log(data);
    });
    testAction1.stderr.on('data', (data) => {
      data = data.toString();
      // console.log(data);
      console.log(`<span style="color:red">${data}</span>`)
    });
    testAction1.on("exit", () => resolve("bash script test1 done!"))
  });

  let result = await promise; // wait until the promise resolves (*)
  console.log(result);
}

// function f2
async function f2() {
  console.log('Start of function f2')

  let promise = new Promise((resolve, reject) => {
    const testAction1 = require("child_process").execFile(`${rootFolder}/binaries/test2`, ["argument1"]);
    testAction1.on("exit", (code) => {
      if (code == 0) {
        console.log("There was no error in bash script test2");
        resolve("bash script test2 done!")
      }
      if (code == 1) {
        console.log("There was an error in bash script test2");
        resolve("bash script test2 finished with error code 1")
        // reject("bash script test2 finished with error code 1")
        // When using reject everything after
        // await f2(); in main function gets never called        
      }
    });
  });

  let result = await promise; // wait until the promise resolves (*)
  console.log(result);
}

// function f3
async function f3() {
  console.log('Start of function f3')

  let promise = new Promise((resolve, reject) => {
    const testAction1 = require("child_process").execFile(`${rootFolder}/binaries/test3`, ["argument1"]);
    testAction1.on("exit", (code) => {
      resolve("bash script test3 finished")
    });
  });

  let result = await promise; // wait until the promise resolves (*)
  console.log(result);
}

// sync function
function syncFunction(){
  console.log('do stuff in sync function')
}