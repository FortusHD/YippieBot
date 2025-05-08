// Imports
const logger = require('../../../src/logging/logger');
const trackError = require('../../../src/riffy/track/trackError');

jest.mock('../../../src/logging/logger', () => ({
    warn: jest.fn(),
}));

describe('trackErrorListener', () => {
    let mockPlayer;
    let mockTrack;
    let mockPayload;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockPlayer = {};
    });

    test('should have required properties', () => {
        // Assert
        expect(trackError).toHaveProperty('name', 'trackError');
        expect(trackError).toHaveProperty('execute');
        expect(typeof trackError.execute).toBe('function');
    });

    test('execute function handles track error event correctly', async () => {
        // Arrange
        mockTrack = {
            name: 'Test Song',
        };

        mockPayload = 'Invalid encoding';

        // Act
        await trackError.execute(mockPlayer, mockTrack, mockPayload);

        // Assert
        expect(logger.warn).toHaveBeenCalledWith('[RIFFY] Error while playing track "Test Song": Invalid encoding');
    });

    test('execute function handles empty track correctly', async () => {
        // Arrange
        mockTrack = {};

        mockPayload = 'No results';

        // Act
        await trackError.execute(mockPlayer, mockTrack, mockPayload);

        // Assert
        expect(logger.warn).toHaveBeenCalledWith('[RIFFY] Error while playing track "Unknown Title": No results');
    });
});