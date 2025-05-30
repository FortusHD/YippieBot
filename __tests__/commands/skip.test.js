// Imports
const logger = require('../../src/logging/logger.js');
const { editInteractionReply, buildEmbed } = require('../../src/util/util');
const skip = require('../../src/commands/skip');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    editInteractionReply: jest.fn(),
    buildEmbed: jest.fn(),
}));

describe('skip', () => {
    test('should have required properties', () => {
        expect(skip).toHaveProperty('guild', true);
        expect(skip).toHaveProperty('dm', false);
        expect(skip).toHaveProperty('player', true);
        expect(skip).toHaveProperty('data');
        expect(skip.data).toHaveProperty('name', 'skip');
        expect(skip.data).toHaveProperty('description');
        expect(skip.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = {
                current: {
                    info: {
                        title: 'testSong1',
                    },
                },
                node: {
                    host: 'localhost',
                },
                queue: {
                    first: {
                        info: {
                            title: 'testSong2',
                        },
                    },
                },
                stop: jest.fn(),
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                guildId: '1234',
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

            buildEmbed.mockReturnValue({ test: 'test' });
        });

        test('should skip song', async () => {
            // Act
            await skip.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling skip command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Überspringe...');
            expect(mockPlayer.stop).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/(?=.*testSong1)(?=.*testSong2)/s));
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('testSong1'),
                description: expect.stringMatching(/(?=.*testSong1)(?=.*testSong2)/s),
            }));
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, {
                content: '',
                embeds: [expect.any(Object)],
            });
        });

        const emptyQueueCases = [
            { queue: null },
            { queue: { first: null } },
        ];

        test.each(emptyQueueCases)('should handle empty queue', async ({ queue }) => {
            // Arrange
            mockPlayer.queue = queue;

            // Act
            await skip.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling skip command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Überspringe...');
            expect(mockPlayer.stop).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/(?=.*testSong1)(?=.*empty)/s));
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('testSong1'),
                description: expect.stringMatching(/(?=.*testSong1)(?=.*leer)/s),
            }));
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, {
                content: '',
                embeds: [expect.any(Object)],
            });
        });

        test('should handle no playing song', async () => {
            // Arrange
            mockPlayer.current = null;

            // Act
            await skip.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling skip command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Überspringe...');
            expect(logger.info).toHaveBeenCalledWith('No song playing.');
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, 'Gerade läuft kein Song du Idiot!');
            expect(mockPlayer.stop).not.toHaveBeenCalled();
        });
    });
});
