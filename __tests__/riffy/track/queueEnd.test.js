// Imports
const logger = require('../../../src/logging/logger');
const queueEnd = require('../../../src/riffy/track/queueEnd');

jest.mock('../../../src/logging/logger', () => ({
    info: jest.fn(),
}));

describe('queueEndListener', () => {
    let mockPlayer;

    // Setup
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        mockPlayer = {
            disconnect: jest.fn().mockReturnValue({
                destroy: jest.fn().mockResolvedValue(undefined),
            }),
            disconnectTimer: undefined,
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
        expect(queueEnd).toHaveProperty('name', 'queueEnd');
        expect(queueEnd).toHaveProperty('execute');
        expect(typeof queueEnd.execute).toBe('function');
    });

    test('should log queue end message', async () => {
        // Act
        await queueEnd.execute(mockPlayer);

        // Assert
        expect(logger.info).toHaveBeenCalledWith('[RIFFY] Queue has ended.');
    });

    test('should set disconnect timer if not already set', async () => {
        // Act
        await queueEnd.execute(mockPlayer);

        // Assert
        expect(mockPlayer.disconnectTimer).toBeDefined();
        expect(logger.info).toHaveBeenCalledWith('Inactivity timer started.');
    });

    test('should not set new timer if one already exists', async () => {
        // Arrange
        await queueEnd.execute(mockPlayer);
        const initialTimer = mockPlayer.disconnectTimer;
        logger.info.mockClear();

        // Act
        await queueEnd.execute(mockPlayer);

        // Assert
        expect(mockPlayer.disconnectTimer).toBe(initialTimer);
        expect(logger.info).not.toHaveBeenCalledWith('Inactivity timer started.');
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should handle null player gracefully', async () => {
        // Act
        await queueEnd.execute(null);

        // Assert
        expect(logger.info).toHaveBeenCalledWith('[RIFFY] Queue has ended.');
        expect(logger.info).not.toHaveBeenCalledWith('Inactivity timer started.');
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should handle player without disconnect method', async () => {
        // Arrange
        const playerWithoutDisconnect = { disconnectTimer: undefined };

        // Act
        await queueEnd.execute(playerWithoutDisconnect);
        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();

        // Assert
        expect(logger.info).toHaveBeenCalledWith('[RIFFY] Queue has ended.');
        expect(playerWithoutDisconnect.disconnectTimer).toBeUndefined();
    });

    test('should handle disconnect without destroy method', async () => {
        // Arrange
        const playerWithoutDestroy = {
            disconnect: jest.fn().mockReturnValue({}),
            disconnectTimer: undefined,
        };

        // Act
        await queueEnd.execute(playerWithoutDestroy);
        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();

        // Assert
        expect(playerWithoutDestroy.disconnect).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Bot disconnected due to inactivity.');
        expect(playerWithoutDestroy.disconnectTimer).toBeUndefined();
    });

    test('should disconnect and destroy mockPlayer after timeout', async () => {
        // Act
        await queueEnd.execute(mockPlayer);
        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();
        await jest.runAllTimers();
        await Promise.resolve();

        // Assert
        expect(mockPlayer.disconnect).toHaveBeenCalled();
        expect(mockPlayer.disconnect().destroy).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Bot disconnected due to inactivity.');
        expect(mockPlayer.disconnectTimer).toBeUndefined();
    });

    test('should clean up timer after disconnect', async () => {
        // Act
        await queueEnd.execute(mockPlayer);
        jest.advanceTimersByTime(5 * 60 * 1000);
        await Promise.resolve();
        await jest.runAllTimers();
        await Promise.resolve();

        // Assert
        expect(mockPlayer.disconnectTimer).toBeUndefined();
    });
});