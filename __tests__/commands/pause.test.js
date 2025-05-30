// Imports
const logger = require('../../src/logging/logger');
const pause = require('../../src/commands/pause');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

describe('pause', () => {
    test('should have required properties', () => {
        // Assert
        expect(pause).toHaveProperty('guild', true);
        expect(pause).toHaveProperty('dm', false);
        expect(pause).toHaveProperty('player', true);
        expect(pause).toHaveProperty('data');
        expect(pause.data).toHaveProperty('name', 'pause');
        expect(pause.data).toHaveProperty('description');
        expect(pause.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = {
                current: {},
                paused: false,
                node: {
                    host: 'localhost',
                },
                pause: jest.fn((pause) => (this.paused = pause)),
            };

            mockInteraction = {
                guild: {
                    name: 'Test',
                },
                user: {
                    tag: 'testUser',
                },
                client: {
                    riffy: {
                        players: {
                            get: jest.fn().mockReturnValue(mockPlayer),
                        },
                    },
                },
                reply: jest.fn(),
            };
        });

        test('should pause the playing player', async () => {
            // Act
            await pause.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling pause command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('Bot was paused.');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Der Bot wurde pausiert.');
            expect(mockPlayer.pause).toHaveBeenCalledWith(true);
        });

        test('should resume the paused player', async () => {
            // Arrange
            mockPlayer.paused = true;

            // Act
            await pause.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling pause command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('Bot was resumed.');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Der Bot spielt jetzt weiter.');
            expect(mockPlayer.pause).toHaveBeenCalledWith(false);
        });

        test('should handle no song playing', async () => {
            // Arrange
            mockPlayer.current = null;

            // Act
            await pause.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling pause command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('Nothing playing right now.');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Gerade spielt doch gar nichts.');
            expect(mockPlayer.pause).not.toHaveBeenCalled();
        });
    });
});