const { startPolling, stopPolling } = require('./main.js');

describe('startPolling', () => {
    it('should start polling with the correct interval', () => {
        const parcelNumber = '12345';
        const postalCode = '6789';
        const interval = 60000; // 1 minute

        startPolling(parcelNumber, postalCode, interval);

        jest.runOnlyPendingTimers();

        // Check if the interval is set
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), interval);
    });

    it('should clear the interval when stopped', () => {
        stopPolling();
        expect(clearInterval).toHaveBeenCalledTimes(1);
    });
});
