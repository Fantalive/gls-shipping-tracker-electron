const { saveParcel, loadSavedParcels } = require('./index.js');

describe('saveParcel', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should save a new parcel to localStorage', () => {
        saveParcel('12345', '6789');
        const savedParcels = JSON.parse(localStorage.getItem('savedParcels'));
        expect(savedParcels).toHaveLength(1);
        expect(savedParcels[0]).toEqual({ parcelNumber: '12345', postalCode: '6789' });
    });

    it('should not save a duplicate parcel', () => {
        saveParcel('12345', '6789');
        saveParcel('12345', '6789'); // Trying to save the same parcel again
        const savedParcels = JSON.parse(localStorage.getItem('savedParcels'));
        expect(savedParcels).toHaveLength(1);
    });
});
