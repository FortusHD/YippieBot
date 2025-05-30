// Imports
const logger = require('../../src/logging/logger');
const { buildQueueEmbed } = require('../../src/util/queueEmbedManager');
const { validateUserInSameVoiceChannel, buildEmbed, formatDuration } = require('../../src/util/util');
const queue = require('../../src/commands/queue');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/queueEmbedManager', () => ({
    buildQueueEmbed: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn(),
    validateUserInSameVoiceChannel: jest.fn(),
    formatDuration: jest.fn(),
}));

function generatePlayer(length) {
    return {
        queue: {
            ...Array.from({ length: length }, (_, index) => ({
                info: {
                    title: `Title ${index + 1}`,
                    length: Math.floor((Math.random() + 1) * 1000),
                    requester: {
                        id: Math.random().toString(36).substring(2, 8),
                    },
                },
            })),
            size: length,
            splice: jest.fn(),
            clear: jest.fn(),
            add: jest.fn(),
        },
    };
}

describe('queue', () => {
    test('should have required properties', () => {
        expect(queue).toHaveProperty('guild', true);
        expect(queue).toHaveProperty('dm', false);
        expect(queue).toHaveProperty('player', true);
        expect(queue).toHaveProperty('data');
        expect(queue.data).toHaveProperty('name', 'queue');
        expect(queue.data).toHaveProperty('description');
        expect(queue.data.options).toHaveLength(3);
        expect(queue.data.options[0]).toHaveProperty('name', 'view');
        expect(queue.data.options[0]).toHaveProperty('description');
        expect(queue.data.options[0].options).toHaveLength(1);
        expect(queue.data.options[0].options[0]).toHaveProperty('name', 'page');
        expect(queue.data.options[0].options[0]).toHaveProperty('description');
        expect(queue.data.options[0].options[0]).toHaveProperty('type', 4);
        expect(queue.data.options[0].options[0]).toHaveProperty('required', false);
        expect(queue.data.options[1]).toHaveProperty('name', 'remove');
        expect(queue.data.options[1]).toHaveProperty('description');
        expect(queue.data.options[1].options).toHaveLength(1);
        expect(queue.data.options[1].options[0]).toHaveProperty('name', 'position');
        expect(queue.data.options[1].options[0]).toHaveProperty('description');
        expect(queue.data.options[1].options[0]).toHaveProperty('type', 4);
        expect(queue.data.options[1].options[0]).toHaveProperty('required', true);
        expect(queue.data.options[2]).toHaveProperty('name', 'clear');
        expect(queue.data.options[2]).toHaveProperty('description');
        expect(queue.data.options[2].options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockClient;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = generatePlayer(10);

            mockClient = {
                riffy: {
                    players: {
                        get: jest.fn().mockReturnValue(mockPlayer),
                    },
                },
            };

            mockInteraction = {
                client: mockClient,
                user: {
                    tag: 'testUser',
                    id: 123,
                },
                options: {
                    getSubcommand: jest.fn(),
                    getInteger: jest.fn().mockReturnValue(null),
                },
                reply: jest.fn(),
            };
        });

        test('should default to the view command when no subcommand was given', async () => {
            // Act
            await queue.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
            expect(buildQueueEmbed).toHaveBeenCalledWith(mockInteraction, null);
        });

        test('should handle no player', async () => {
            // Arrange
            mockClient.riffy.players.get.mockReturnValue(null);

            // Act
            await queue.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
            expect(buildQueueEmbed).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith('Die Queue ist leer.');
        });

        describe('view', () => {
            const testData = [1, 10, null];

            test.each(testData)('should handle queue page %s', async (page) => {
                // Arrange
                mockInteraction = {
                    ...mockInteraction,
                    options: {
                        getSubcommand: jest.fn().mockReturnValue('view'),
                        getInteger: jest.fn().mockReturnValue(page),
                    },
                };

                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(buildQueueEmbed).toHaveBeenCalledWith(mockInteraction, page);
            });
        });

        describe('remove', () => {
            // Setup
            beforeEach(() => {
                mockInteraction = {
                    ...mockInteraction,
                    options: {
                        getSubcommand: jest.fn().mockReturnValue('remove'),
                        getInteger: jest.fn().mockReturnValue(2),
                    },
                };

                buildEmbed.mockReturnValue({ test: 'test' });
                validateUserInSameVoiceChannel.mockReturnValue(true);
            });

            test('should remove track from queue', async () => {
                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(mockPlayer.queue.splice).toHaveBeenCalledWith(2, 1);
                expect(formatDuration).toHaveBeenCalledWith(mockPlayer.queue[2].info.length / 1000);
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Song aus Queue entfernt',
                    description: expect.stringContaining('Title 3'),
                }));
                expect(logger.info).toHaveBeenCalledWith('"Title 3" was removed from the queue by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    embeds: [expect.any(Object)],
                }));
            });

            test('should not remove track when user is not in same channel', async () => {
                // Assert
                validateUserInSameVoiceChannel.mockReturnValue(false);

                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    content: 'Du musst im selben Sprachkanal wie der Bot sein, um Songs zu entfernen.',
                }));
                expect(mockInteraction.options.getInteger).not.toHaveBeenCalled();
                expect(mockPlayer.queue.splice).not.toHaveBeenCalled();
                expect(formatDuration).not.toHaveBeenCalled();
                expect(buildEmbed).not.toHaveBeenCalledWith();
            });

            const invalidPositions = [-1, 0, 10, 14, null];

            test.each(invalidPositions)('should not remove track for invalid position %s', async (pos) => {
                // Assert
                mockInteraction.options.getInteger.mockReturnValue(pos);

                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    content: 'Ungültige Position. Bitte wähle eine Zahl zwischen 1 und 9.',
                }));
                expect(mockPlayer.queue.splice).not.toHaveBeenCalled();
                expect(formatDuration).not.toHaveBeenCalled();
                expect(buildEmbed).not.toHaveBeenCalledWith();
            });
        });

        describe('clear', () => {
            // Setup
            beforeEach(() => {
                mockInteraction = {
                    ...mockInteraction,
                    options: {
                        getSubcommand: jest.fn().mockReturnValue('clear'),
                    },
                };

                buildEmbed.mockReturnValue({ test: 'test' });
                validateUserInSameVoiceChannel.mockReturnValue(true);
            });

            test('should clear queue', async () => {
                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(mockPlayer.queue.clear).toHaveBeenCalledWith();
                expect(mockPlayer.queue.add).toHaveBeenCalledWith(mockPlayer.queue[0]);
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Queue geleert',
                    description: expect.stringContaining('123'),
                }));
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    embeds: [expect.any(Object)],
                }));
            });

            test('should not clear queue when user is not in same channel', async () => {
                // Assert
                validateUserInSameVoiceChannel.mockReturnValue(false);

                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    content: 'Du musst im selben Sprachkanal wie der Bot sein, um die Queue zu leeren.',
                }));
                expect(mockPlayer.queue.clear).not.toHaveBeenCalled();
                expect(mockPlayer.queue.add).not.toHaveBeenCalled();
                expect(buildEmbed).not.toHaveBeenCalledWith();
            });

            test('should not add current song if no song was playing', async () => {
                // Arrange
                mockPlayer = generatePlayer(0);
                mockClient = {
                    riffy: {
                        players: {
                            get: jest.fn().mockReturnValue(mockPlayer),
                        },
                    },
                };
                mockInteraction = {
                    ...mockInteraction,
                    client: mockClient,
                };

                // Act
                await queue.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
                expect(mockPlayer.queue.clear).toHaveBeenCalledWith();
                expect(mockPlayer.queue.add).not.toHaveBeenCalledWith();
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Queue geleert',
                    description: expect.stringContaining('123'),
                }));
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    embeds: [expect.any(Object)],
                }));
            });
        });
    });
});