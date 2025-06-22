// Imports
const logger = require('../../src/logging/logger.js');
const shuffle = require('../../src/commands/shuffle');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

describe('shuffle', () => {
    test('should have required properties', () => {
        expect(shuffle).toHaveProperty('guild', true);
        expect(shuffle).toHaveProperty('dm', false);
        expect(shuffle).toHaveProperty('player', true);
        expect(shuffle).toHaveProperty('help');
        expect(shuffle.help).toHaveProperty('category', 'Musik');
        expect(shuffle.help).toHaveProperty('usage');
        expect(shuffle).toHaveProperty('data');
        expect(shuffle.data).toHaveProperty('name', 'shuffle');
        expect(shuffle.data).toHaveProperty('description');
        expect(shuffle.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = {
                node: {
                    host: 'localhost',
                },
                queue: {
                    shuffle: jest.fn(),
                },
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                guild: {
                    name: 'Test',
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

        test('should shuffle the queue', async () => {
            // Act
            await shuffle.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling shuffle command used by "testUser".');
            expect(mockPlayer.queue.shuffle).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('"testUser" shuffled the queue.');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Die Queue wurde gemischt');
        });

        test('should handle no queue', async () => {
            // Arrange
            mockPlayer.queue = null;

            // Act
            await shuffle.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling shuffle command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('Queue was empty.');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Die Queue ist leer.');
        });
    });
});