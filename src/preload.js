const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded'); // Debug log

contextBridge.exposeInMainWorld('electronAPI', {
	startPolling: (config) => ipcRenderer.send('start-polling', config),
	stopPolling: () => ipcRenderer.send('stop-polling'),
	retryFetch: (config) => ipcRenderer.send('retry-fetch', config),
	onGLSData: (callback) => ipcRenderer.on('gls-data', (event, data) => callback(data)),
	onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, update) => callback(update)),
});

contextBridge.exposeInMainWorld('formatter', {
	formatParcelData(data) {
		const { history, progressBar, infos, references } = data;

		// Format Progress
		const progress = progressBar?.statusBar?.map(
			(step) => `- ${step.imageText}: ${step.imageStatus === 'CURRENT' ? 'Current' : step.imageStatus === 'COMPLETE' ? 'Completed' : 'Pending'}`
		).join('\n') || 'No progress available.';

		// Format History
		const formattedHistory = history?.map(
			(item, index) => `
				<tr>
					<td>${item.time}</td>
					<td>${item.date}</td>
					<td>${item.address.city}</td>
					<td>${item.address.countryName}</td>
					<td>${item.address.countryCode}</td>
				</tr>
			`
		).join(``) || '<tr><td colspan="2">No history available.</td></tr>';

		// Format Details
		const details = infos?.map((info) => `
			<tr>
				<td>${info.name}</td>
				<td>${info.value}</td>
			</tr>
			`).join(``) || '<tr><td colspan="2">No details available.</td></tr>';

		// Format References
		const formattedReferences = references?.map(
			(ref) => `
				<tr>
					<td>${ref.name}</td>
					<td>${ref.value}</td>
				</tr>
			`).join('') || '<tr><td colspan="2">No references available.</td></tr>';

		// Construct Final HTML
		return `
			<h3>Parcel History</h3>
			<table class="table table-striped table-bordered table-sm parcel-history-table caption-top">
				<caption>Shipping Information</caption>
				<thead>
					<tr>
						<th scope="col">Time</th>
						<th scope="col">Date</th>
						<th scope="col">City</th>
						<th scope="col">Country</th>
						<th scope="col">Country Code</th>
					</tr>
				</thead>
				<tbody>
					${formattedHistory}
				</tbody>
			</table>
			<h3>Details</h3>
			<caption>Shipped Item Details</caption>
			<table class="table table-striped table-bordered table-sm parcel-details-table caption-top">
				<thead>
					<tr>
						<th scope="col">Detail</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					${details}
				</tbody>
			</table>
			<h3>References</h3>
			<caption>Reference Information</caption>
			<table class="table table-striped table-bordered table-sm parcel-references-table caption-top">
				<thead>
					<tr>
						<th scope="col">Reference</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					${formattedReferences}
				</tbody>
			</table>
		`;
	},
});