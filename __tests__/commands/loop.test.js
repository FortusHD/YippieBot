// Imports
const logger = require('../../src/logging/logger');
const loop = require('../../src/commands/loop');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
}));

describe('loop', () => {
    test('should have required properties', () => {
        expect(loop).toHaveProperty('guild', true);
        expect(loop).toHaveProperty('dm', false);
        expect(loop).toHaveProperty('player', true);
        expect(loop).toHaveProperty('player', true);
        expect(loop).toHaveProperty('data');
        expect(loop).toHaveProperty('help');
        expect(loop.help).toHaveProperty('usage');
        expect(loop.data).toHaveProperty('name', 'loop');
        expect(loop.data).toHaveProperty('description');
        expect(loop.data.options).toHaveLength(3);
        expect(loop.data.options[0]).toHaveProperty('name', 'song');
        expect(loop.data.options[0]).toHaveProperty('description');
        expect(loop.data.options[0].options).toHaveLength(0);
        expect(loop.data.options[1]).toHaveProperty('name', 'queue');
        expect(loop.data.options[1]).toHaveProperty('description');
        expect(loop.data.options[1].options).toHaveLength(0);
        expect(loop.data.options[2]).toHaveProperty('name', 'off');
        expect(loop.data.options[2]).toHaveProperty('description');
        expect(loop.data.options[2].options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = {
                current: {},
                loop: 'none',
                setLoop: jest.fn(),
            };

            mockInteraction = {
                client: {
                    riffy: {
                        players: {
                            get: jest.fn().mockReturnValue(mockPlayer),
                        },
                    },
                },
                user: {
                    tag: 'testUser',
                    id: 123,
                },
                options: {
                    getSubcommand: jest.fn(),
                },
                reply: jest.fn(),
            };
        });

        test('should default to the off command when no subcommand was given', async () => {
            // Act
            await loop.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
            expect(mockPlayer.setLoop).toHaveBeenCalledWith('none');
            expect(logger.info).toHaveBeenCalledWith('Loop was disabled by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Der Loop wurde deaktiviert.');
        });

        test('should handle no player', async () => {
            // Arrange
            mockInteraction.client.riffy.players.get.mockReturnValue(null);

            // Act
            await loop.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Gerade spielt nichts.');
        });

        test('should handle nothing playing', async () => {
            // Arrange
            mockPlayer.current = null;

            // Act
            await loop.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Gerade spielt nichts.');
        });

        describe('song', () => {
            test('should loop the current song', async () => {
                // Arrange
                mockInteraction.options.getSubcommand.mockReturnValue('song');

                // Act
                await loop.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
                expect(mockPlayer.setLoop).toHaveBeenCalledWith('track');
                expect(logger.info).toHaveBeenCalledWith('track loop was enabled by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Der aktuelle Song loopt jetzt.');
            });

            test('should disable running song loop', async () => {
                // Arrange
                mockInteraction.options.getSubcommand.mockReturnValue('song');
                mockPlayer.loop = 'track';
                mockInteraction.client.riffy.players.get.mockReturnValue(mockPlayer);

                // Act
                await loop.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
                expect(mockPlayer.setLoop).toHaveBeenCalledWith('none');
                expect(logger.info).toHaveBeenCalledWith('Loop was disabled by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Der Loop wurde deaktiviert.');
            });
        });

        describe('queue', () => {
            test('should loop the current song', async () => {
                // Arrange
                mockInteraction.options.getSubcommand.mockReturnValue('queue');

                // Act
                await loop.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
                expect(mockPlayer.setLoop).toHaveBeenCalledWith('queue');
                expect(logger.info).toHaveBeenCalledWith('queue loop was enabled by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Die Queue loopt jetzt.');
            });

            test('should disable running queue loop', async () => {
                // Arrange
                mockInteraction.options.getSubcommand.mockReturnValue('queue');
                mockPlayer.loop = 'queue';
                mockInteraction.client.riffy.players.get.mockReturnValue(mockPlayer);

                // Act
                await loop.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
                expect(mockPlayer.setLoop).toHaveBeenCalledWith('none');
                expect(logger.info).toHaveBeenCalledWith('Loop was disabled by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Der Loop wurde deaktiviert.');
            });
        });

        describe('off', () => {
            test('should loop the current song', async () => {
                // Arrange
                mockInteraction.options.getSubcommand.mockReturnValue('off');

                // Act
                await loop.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling loop command used by "testUser".');
                expect(mockPlayer.setLoop).toHaveBeenCalledWith('none');
                expect(logger.info).toHaveBeenCalledWith('Loop was disabled by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Der Loop wurde deaktiviert.');
            });
        });
    });
});