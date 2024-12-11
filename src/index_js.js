document.addEventListener('DOMContentLoaded', () => {
    // Helper function for safe innerHTML setting
    function safeSetInnerHTML(element, value, errorMessage) {
        if (element) {
            element.innerHTML = value;
        } else {
            console.error(errorMessage);
        }
    }

    // Helper function to log missing elements
    function logElementStatus(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`${id} element not found.`);
        }
    }

    // Element initialization and checks
    const elementIds = [
        'startButton',
        'parcelNumber',
        'postalCode',
        'interval',
        'output',
        'results',
        'progress-bar',
        'savedParcelsList',
        'spinner',
        'themeToggle',
        'retryButton'
    ];
    elementIds.forEach(logElementStatus);

    const startButton = document.getElementById('startButton');
    const parcelInput = document.getElementById('parcelNumber');
    const postalCodeInput = document.getElementById('postalCode');
    const intervalInput = document.getElementById('interval');
    const output = document.getElementById('output');
    const resultsElement = document.getElementById('results');
    const progressBarContainer = document.getElementById('progress-bar');
    const savedParcelsList = document.getElementById('savedParcelsList');
    const retryButton = document.getElementById('retryButton');
    const spinnerElement = document.getElementById('spinner');
    const themeToggle = document.getElementById('themeToggle');
    const rootElement = document.documentElement;

    let isTracking = false;
    let retrying = false;

	function loadSavedSettings() {
        // Load theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeToggle.checked = savedTheme === 'dark'; // Sync toggle state
        }

        // Load interval
        const savedInterval = localStorage.getItem('interval');
        if (savedInterval && intervalInput) {
            intervalInput.value = parseInt(savedInterval, 10) / 60000; // Convert ms to minutes for display
        }
    }


    // Save settings (including interval) to local storage
    function saveSettings() {
        // Save theme
        const currentTheme = document.documentElement.getAttribute('data-theme');
        localStorage.setItem('theme', currentTheme);

        // Save interval
        if (intervalInput) {
            const intervalValue = parseInt(intervalInput.value, 10) * 60000; // Convert minutes to ms
            localStorage.setItem('interval', intervalValue);
        }
    }

    // Save theme preference to local storage
    function saveThemePreference(theme) {
        localStorage.setItem('theme', theme);
    }

    // Load theme preference from local storage
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        rootElement.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    }

    // Load saved theme on page load
    loadThemePreference();

	// Load saved settings on page load
    loadSavedSettings();

    // Clear previous tracking data
    function clearTrackingData() {
        if (resultsElement) {
            resultsElement.innerHTML = '<p>No data yet...</p>';
        } else {
            console.error('Results element not found.');
        }

        if (progressBarContainer) {
            progressBarContainer.innerHTML = '';
        } else {
            console.error('Progress bar container not found.');
        }

        if (output) {
            output.textContent = '';
        } else {
            console.error('Output element not found.');
        }
    }

    // Render progress bar
    function renderProgressBar(data) 
	{
        if (!progressBarContainer) {
            console.error('Progress bar container not found.');
            return;
        }

        progressBarContainer.innerHTML = ''; // Clear existing content

        data.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.classList.add('progress-step');
            if (step.imageStatus === 'COMPLETE') stepElement.classList.add('complete');
            if (step.imageStatus === 'CURRENT') stepElement.classList.add('current');

            const circle = document.createElement('div');
            circle.classList.add('circle');
            circle.textContent = index + 1;

            const label = document.createElement('div');
            label.classList.add('label');
            label.textContent = step.imageText;

            stepElement.appendChild(circle);
            stepElement.appendChild(label);
            progressBarContainer.appendChild(stepElement);
        });

        const progressIndicator = document.createElement('div');
        progressIndicator.classList.add('progress-indicator');
        progressBarContainer.appendChild(progressIndicator);
    }

    // Show or hide the spinner
    function showSpinner(show) {
        if (spinnerElement) {
            spinnerElement.style.display = show ? 'block' : 'none';
        } else {
            console.error('Spinner element not found.');
        }
    }

    // Save parcel information
    function saveParcel(parcelNumber, postalCode) {
        const savedParcels = JSON.parse(localStorage.getItem('savedParcels')) || [];
        const isDuplicate = savedParcels.some(
            (parcel) => parcel.parcelNumber === parcelNumber && parcel.postalCode === postalCode
        );

        if (!isDuplicate) {
            savedParcels.push({ parcelNumber, postalCode });
            localStorage.setItem('savedParcels', JSON.stringify(savedParcels));
        } else {
            console.warn('Duplicate parcel not saved:', parcelNumber);
        }
    }

    // Load saved parcels into the dropdown
    function loadSavedParcels() {
        if (!savedParcelsList) {
            console.error('Saved parcels list element not found.');
            return;
        }

        const savedParcels = JSON.parse(localStorage.getItem('savedParcels')) || [];
        savedParcelsList.innerHTML = ''; // Clear current list

        savedParcels.forEach((parcel) => {
            const listItem = document.createElement('li');
            listItem.className = 'dropdown-item';
            listItem.textContent = `${parcel.parcelNumber} (${parcel.postalCode})`;

            listItem.addEventListener('click', () => {
                parcelInput.value = parcel.parcelNumber;
                postalCodeInput.value = parcel.postalCode;
            });

            savedParcelsList.appendChild(listItem);
        });
    }

    // Start/Stop tracking button logic
    startButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (isTracking) {
            // Stop tracking
            window.electronAPI.stopPolling();
            startButton.textContent = 'Start Tracking';
            isTracking = false;
            clearTrackingData();
        } else {
            // Start tracking
            const parcelNumber = parcelInput.value;
            const postalCode = postalCodeInput.value;
            const interval = parseInt(intervalInput.value, 10) * 60000;

            if (parcelNumber && postalCode && interval) {
				saveSettings(); // Save interval to local storage
                saveParcel(parcelNumber, postalCode);
                window.electronAPI.startPolling({
                    parcelNumber,
                    postalCode,
                    userInterval: interval,
                });
                startButton.textContent = 'Stop Tracking';
                isTracking = true;
            } else {
                alert('Please fill in all fields with valid data.');
            }
        }
    });

    // Retry button logic
    retryButton.addEventListener('click', () => {
        if (retrying) {
            console.warn('Retry already in progress.');
            return;
        }

        retrying = true;

        const parcelNumber = parcelInput.value;
        const postalCode = postalCodeInput.value;

        if (parcelNumber && postalCode) {
            showSpinner(true);
            window.electronAPI.startPolling({
                parcelNumber,
                postalCode,
                userInterval: 0,
            });

            setTimeout(() => {
                retrying = false;
                showSpinner(false);
            }, 3000);
        } else {
            alert('Please provide parcel and postal code to retry.');
            retrying = false;
        }
    });

    // Theme toggle button logic
    themeToggle.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        rootElement.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
        saveThemePreference(newTheme);
    });

    // Electron API event listeners
    window.electronAPI.onGLSData((data) => {
        if (data.progressBar && Array.isArray(data.progressBar.statusBar)) {
            renderProgressBar(data.progressBar.statusBar);
        } else {
            console.warn('Invalid progress bar data:', data.progressBar);
            progressBarContainer.innerHTML = '<p>No progress available.</p>';
        }

        const formatted = window.formatter.formatParcelData(data);
        resultsElement.innerHTML = formatted;
    });

    window.electronAPI.onUpdateStatus((update) => {
        showSpinner(false);

        if (update.success) {
            output.textContent = `Last update: ${update.timestamp}`;
        } else {
            output.textContent = `Error: ${update.message}`;
        }
    });

    // Load saved parcels on page load
    loadSavedParcels();
});