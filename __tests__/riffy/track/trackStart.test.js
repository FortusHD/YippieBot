// Imports
const logger = require('../../../src/logging/logger');
const trackStart = require('../../../src/riffy/track/trackStart');

jest.mock('../../../src/logging/logger', () => ({
    info: jest.fn(),
}));

describe('trackStartListener', () => {
    let mockPlayer;
    let mockTrack;

    // Setup
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        mockTrack = {
            info: {
                title: 'Test Song',
                requester: {
                    user: {
                        username: 'TestUser',
                    },
                },
            },
        };

        mockPlayer = {
            disconnectTimer: setTimeout(() => {
            }, 1000),
        };
    });

    afterEach(() => {
        if (mockPlayer.disconnectTimer) {
            clearTimeout(mockPlayer.disconnectTimer);
            mockPlayer.disconnectTimer = null;
        }
        jest.useRealTimers();
    });

    test('should have required properties', () => {
        // Assert
        expect(trackStart).toHaveProperty('name', 'trackStart');
        expect(trackStart).toHaveProperty('execute');
        expect(typeof trackStart.execute).toBe('function');
    });

    test('execute function handles track start event correctly', async () => {
        // Act
        await trackStart.execute(mockPlayer, mockTrack);

        // Assert
        expect(mockPlayer.disconnectTimer).toBeUndefined();
        expect(logger.info).toHaveBeenCalledWith('Inactivity timer cleared.');
        expect(logger.info).toHaveBeenCalledWith(
            '[RIFFY] Now playing: "Test Song" requested by "TestUser"',
        );
    });

    test('should only log if disconnect timer is undefined', async () => {
        // Arrange
        mockPlayer = {
            disconnectTimer: undefined,
        };

        // Act
        await trackStart.execute(mockPlayer, mockTrack);

        // Assert
        expect(mockPlayer.disconnectTimer).toBeUndefined();
        expect(logger.info).not.toHaveBeenCalledWith('Inactivity timer cleared.');
        expect(logger.info).toHaveBeenCalledWith(
            '[RIFFY] Now playing: "Test Song" requested by "TestUser"',
        );
    });
});