const { app, BrowserWindow, ipcMain, screen } = require('electron');
const axios = require('axios');
const path = require('path');

let mainWindow;
let intervalId;

function createWindow( width, height ) 
{	
	mainWindow = new BrowserWindow(
	{
		width: width,
		height: height,
		maximizable: false,
		title: "GLS Shipping Tracker",

		webPreferences: 
		{
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

  mainWindow.webContents.openDevTools(); // Opens developer tools
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
}

app.whenReady().then(() => {
	//Height, Width
	let { width, height } = screen.getPrimaryDisplay().workAreaSize
  	createWindow( 800, height );

  app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Fetch GLS data
async function fetchGLSData(parcelNumber, postalCode) 
{
    const unixTime = Math.floor(Date.now() / 1000);
    const url = `https://gls-group.com/app/service/open/rest/GROUP/en/rstt028/${parcelNumber}?caller=witt002&millis=${unixTime}&postalCode=${postalCode}`;
    
	let retryCount = 0;
    const maxRetries = 5;

    async function fetchWithRetry() 
	{
        while (retryCount < maxRetries) {
            try {
                console.log(`Fetching GLS data (Attempt ${retryCount + 1})...`);
                const response = await axios.get(url);
                console.log('API response:', "Grabbed Successfully.");
				process.stdout.write('\x1Bc')

                mainWindow.webContents.send('gls-data', response.data);
                mainWindow.webContents.send('update-status', { success: true, timestamp: new Date().toISOString() });
                return; // Exit function on success
            } catch (error) {
                retryCount++;
                console.error(`Error fetching GLS data (Attempt ${retryCount}):`, error.message);

                if (retryCount >= maxRetries) {
                    mainWindow.webContents.send('update-status', {
                        success: false,
                        message: `Max retries reached. Error: ${error.message}`,
                    });
                    return;
                }

                // Exponential backoff before retry
                await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
            }
        }
    }

    await fetchWithRetry();
} 

// Set up interval
function startPolling(parcelNumber, postalCode, userInterval) {
    stopPolling(); // Ensure no duplicate intervals

    console.log(`Setting up polling every ${userInterval} ms`);
    fetchGLSData(parcelNumber, postalCode); // Immediate fetch
    intervalId = setInterval(() => fetchGLSData(parcelNumber, postalCode), userInterval);
}

function stopPolling() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('Stopped polling');
        mainWindow.webContents.send('update-status', { success: true, message: 'Polling stopped.' });
    }
}
  

// Handle interval setup from renderer
ipcMain.on('start-polling', (event, config) => {
    const { parcelNumber, postalCode, userInterval } = config;
    startPolling(parcelNumber, postalCode, userInterval);
});

ipcMain.on('stop-polling', () => {
    stopPolling();
});