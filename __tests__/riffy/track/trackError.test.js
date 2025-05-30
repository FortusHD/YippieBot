// Imports
const logger = require('../../../src/logging/logger');
const trackError = require('../../../src/riffy/track/trackError');

jest.mock('../../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe('trackErrorListener', () => {
    let mockDisconnect;
    let mockPlayer;
    let mockTrack;
    let mockPayload;

    // Setup
    const setupPlayer = (queueSize = 1, isRunning = true, isWell = true) => {
        return {
            stop: jest.fn(),
            disconnect: isWell ? jest.fn().mockResolvedValue(mockDisconnect) : undefined,
            queue: isRunning ? { size: queueSize } : null,
        };
    };

    const assertLoggerCalls = (warnMessage, infoMessage = null, errorMessage = null) => {
        expect(logger.warn).toHaveBeenCalledWith(warnMessage);
        if (infoMessage) {
            expect(logger.info).toHaveBeenCalledWith(infoMessage);
        } else {
            expect(logger.info).not.toHaveBeenCalled();
        }
        if (errorMessage) {
            expect(logger.error).toHaveBeenCalledWith(errorMessage);
        } else {
            expect(logger.error).not.toHaveBeenCalled();
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockDisconnect = {
            destroy: jest.fn().mockResolvedValue(true),
        };
        mockTrack = { name: 'Test Song' };
        mockPayload = 'Invalid encoding';
    });

    test('should have required properties', () => {
        // Assert
        expect(trackError).toHaveProperty('name', 'trackError');
        expect(trackError).toHaveProperty('execute');
        expect(typeof trackError.execute).toBe('function');
    });

    test.each([
        [1, 'Invalid encoding', '[RIFFY] Error while playing track "Test Song": Invalid encoding'],
        [0, 'No results', '[RIFFY] Error while playing track "Unknown Title": No results'],
    ])(
        'should handle failure with track name or empty title (queue size: %p)',
        async (queueSize, payload, expectedWarn) => {
            // Arrange
            mockPlayer = setupPlayer(queueSize);
            mockTrack.name = queueSize > 0 ? 'Test Song' : undefined;
            mockPayload = payload;

            // Act
            await trackError.execute(mockPlayer, mockTrack, mockPayload);

            // Assert
            assertLoggerCalls(expectedWarn,
                queueSize > 0 && '[RIFFY] Attempting to recover by skipping to the next track.');
            if (queueSize > 0) {
                expect(mockPlayer.stop).toHaveBeenCalled();
            } else {
                expect(mockPlayer.stop).not.toHaveBeenCalled();
            }
        },
    );

    test('should not try to recover if player is not running', async () => {
        // Arrange
        mockPlayer = setupPlayer(1, false);

        // Act
        await trackError.execute(mockPlayer, mockTrack, mockPayload);

        // Assert
        assertLoggerCalls(
            '[RIFFY] Error while playing track "Test Song": Invalid encoding',
        );
        expect(mockPlayer.stop).not.toHaveBeenCalled();
    });

    test('should try to disconnect when recovery fails', async () => {
        // Arrange
        mockPlayer = setupPlayer();
        mockPlayer.stop.mockImplementation(() => {
            throw new Error('Some error');
        });

        // Act
        await trackError.execute(mockPlayer, mockTrack, mockPayload);

        // Assert
        assertLoggerCalls(
            '[RIFFY] Error while playing track "Test Song": Invalid encoding',
            '[RIFFY] Attempting to recover by skipping to the next track.',
            '[RIFFY] Failed to recover from track error: Some error',
        );
        expect(mockPlayer.disconnect).toHaveBeenCalled();
        expect(mockDisconnect.destroy).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('[RIFFY] Player reset due to unrecoverable error.');
    });

    test('should not try to disconnect when recovery fails and player is not well', async () => {
        // Arrange
        mockPlayer = setupPlayer(1, true, false);
        mockPlayer.stop.mockImplementation(() => {
            throw new Error('Some error');
        });
        mockPlayer.disconnect = undefined;

        // Act
        await trackError.execute(mockPlayer, mockTrack, mockPayload);

        // Assert
        assertLoggerCalls(
            '[RIFFY] Error while playing track "Test Song": Invalid encoding',
            '[RIFFY] Attempting to recover by skipping to the next track.',
            '[RIFFY] Failed to recover from track error: Some error',
        );
        expect(mockDisconnect.destroy).not.toHaveBeenCalled();
    });

    test('should handle error while disconnecting', async () => {
        // Arrange
        mockPlayer = setupPlayer();
        mockPlayer.stop.mockImplementation(() => {
            throw new Error('Some error');
        });
        mockPlayer.disconnect.mockImplementation(() => {
            throw new Error('Some other error');
        });

        // Act
        await trackError.execute(mockPlayer, mockTrack, mockPayload);

        // Assert
        assertLoggerCalls(
            '[RIFFY] Error while playing track "Test Song": Invalid encoding',
            '[RIFFY] Attempting to recover by skipping to the next track.',
            '[RIFFY] Failed to reset player: Some other error',
        );
        expect(mockDisconnect.destroy).not.toHaveBeenCalled();
    });

    test.each([
        [null, '[RIFFY] Error while playing track "Test Song": Invalid encoding', false],
        [undefined, '[RIFFY] Error while playing track "Test Song": Invalid encoding', false],
    ])(
        'should not try to destroy when disconnect is invalid',
        async (disconnectValue, expectedWarn, shouldDestroy) => {
            // Arrange
            mockPlayer = setupPlayer();
            mockPlayer.stop.mockImplementation(() => {
                throw new Error('Some error');
            });
            mockPlayer.disconnect = jest.fn().mockResolvedValue(disconnectValue);

            // Act
            await trackError.execute(mockPlayer, mockTrack, mockPayload);

            // Assert
            assertLoggerCalls(
                expectedWarn,
                '[RIFFY] Attempting to recover by skipping to the next track.',
                '[RIFFY] Failed to recover from track error: Some error',
            );
            if (shouldDestroy) {
                expect(mockDisconnect.destroy).toHaveBeenCalled();
            } else {
                expect(mockDisconnect.destroy).not.toHaveBeenCalled();
            }
        },
    );
});