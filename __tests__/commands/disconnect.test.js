// Imports
const logger = require('../../src/logging/logger');
const disconnect = require('../../src/commands/disconnect');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

describe('disconnect', () => {
    test('should have required properties', () => {
        // Assert
        expect(disconnect).toHaveProperty('player', true);
        expect(disconnect).toHaveProperty('guild', true);
        expect(disconnect).toHaveProperty('dm', false);
        expect(disconnect).toHaveProperty('help');
        expect(disconnect.help).toHaveProperty('category', 'Musik');
        expect(disconnect.help).toHaveProperty('usage');
        expect(disconnect).toHaveProperty('data');
        expect(disconnect.data).toHaveProperty('name', 'dc');
        expect(disconnect.data).toHaveProperty('description');
        expect(disconnect.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockDisconnected;
        let mockPlayer;
        let mockClient;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockDisconnected = {
                destroy: jest.fn().mockResolvedValue(undefined),
            };

            mockPlayer = {
                disconnect: jest.fn().mockReturnValue(mockDisconnected),
            };

            mockClient = {
                riffy: {
                    players: {
                        get: jest.fn().mockReturnValue(mockPlayer),
                    },
                },
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                guildId: '123',
                guild: {
                    name: 'Test',
                },
                client: mockClient,
                reply: jest.fn(),
            };
        });

        test('should disconnect the bot and destroy the player', async () => {
            // Act
            await disconnect.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling disconnect command used by "testUser".',
            );
            expect(mockPlayer.disconnect).toHaveBeenCalled();
            expect(mockDisconnected.destroy).toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.any(String));
            expect(logger.info).toHaveBeenCalledWith('Bot was disconnected by "testUser".');
        });

        test('should handle missing disconnect', async () => {
            // Arrange
            mockPlayer.disconnect = null;

            // Act
            await disconnect.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling disconnect command used by "testUser".',
            );
            expect(mockPlayer.disconnect).toBeNull();
            expect(mockDisconnected.destroy).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.any(String));
            expect(logger.info).toHaveBeenCalledWith('Bot was disconnected by "testUser".');
        });

        test('should handle missing destroy', async () => {
            // Arrange
            mockDisconnected.destroy = null;

            // Act
            await disconnect.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling disconnect command used by "testUser".',
            );
            expect(mockPlayer.disconnect).toHaveBeenCalled();
            expect(mockDisconnected.destroy).toBeNull();
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.any(String));
            expect(logger.info).toHaveBeenCalledWith('Bot was disconnected by "testUser".');
        });
    });
});