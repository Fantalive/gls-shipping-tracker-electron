const axios = require('axios');
const { fetchGLSData } = require('./main.js');

jest.mock('axios');

describe('fetchGLSData', () => {
    it('should fetch GLS data successfully', async () => {
        const mockData = { statusBar: [{ imageText: 'Sample Text' }] };
        axios.get.mockResolvedValue({ data: mockData });

        const result = await fetchGLSData('12345', '6789');
        expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching data fails', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        try {
            await fetchGLSData('12345', '6789');
        } catch (error) {
            expect(error.message).toBe('Network Error');
        }
    });
});