/**
 * Tests for the queue embed manager utility
 *
 * @group util
 * @group queue
 * @group embed
 */

// Imports
const logger = require('../../src/logging/logger');
const util = require('../../src/util/util');
const { buildQueueEmbed } = require('../../src/util/queueEmbedManager');

// Mock dependencies
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn(),
    formatDuration: jest.fn(),
}));

/**
 * Generates a queue object with the specified length, containing an array of items.
 * Each item has information such as a title, length, and a requester ID.
 *
 * @param {number} length The desired number of items in the queue.
 * @return {Object} Returns an object containing the queue and its size.
 */
function generateQueue(length) {
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
        },
    };
}

describe('buildQueueEmbed', () => {
    // Setup
    const mockClient = {
        riffy: {
            players: {
                get: jest.fn(),
            },
        },
    };
    const mockMember = {
        guild: {
            tag: 'user',
        },
    };
    const mockMessage = {
        edit: jest.fn(),
    };
    const mockGuildId = '1234567890';

    const mockInteraction = {
        client: mockClient,
        member: mockMember,
        message: mockMessage,
        guildId: mockGuildId,
        reply: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        util.formatDuration.mockReturnValue('00:00');
        util.buildEmbed.mockReturnValue({
            color: 0x000aff,
            title: ':cd: Queue',
            description: 'blabla',
            timestamp: new Date(),
            footer: {
                text: 'Seite 1/1',
            },
        });
    });

    describe('valid queue and page', () => {
        test('should update queue embed to correct message, if queue is present (edit=true)', async () => {
            // Arrange
            mockClient.riffy.players.get.mockReturnValue(generateQueue(5));

            // Act
            await buildQueueEmbed(mockInteraction, 1, true);

            // Assert
            expect(mockMessage.edit).toHaveBeenCalled();
            expect(mockMessage.edit.mock.calls[0][0].embeds).toHaveLength(1);
            expect(util.buildEmbed).toHaveBeenCalledTimes(1);
            expect(util.buildEmbed.mock.calls[0][0].footer.text).toContain('1/1');
            expect(mockMessage.edit.mock.calls[0][0].components).toHaveLength(1);
            expect(logger.info).toHaveBeenCalledTimes(2);
        });

        test('should send queue embed, if queue is present (edit=false)', async () => {
            // Arrange
            mockClient.riffy.players.get.mockReturnValue(generateQueue(5));

            // Act
            await buildQueueEmbed(mockInteraction, 1);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(mockInteraction.reply.mock.calls[0][0].embeds).toHaveLength(1);
            expect(util.buildEmbed).toHaveBeenCalledTimes(1);
            expect(util.buildEmbed.mock.calls[0][0].footer.text).toContain('1/1');
            expect(mockInteraction.reply.mock.calls[0][0].components).toHaveLength(1);
            expect(logger.info).toHaveBeenCalledTimes(2);
        });
    });

    describe('valid queue but invalid page', () => {
        // Arrange
        const invalidPages = [
            [null],
            [-1],
            [0],
        ];

        test.each(invalidPages)('should edit page number to 1 on invalid page number (edit=false)', async (page) => {
            // Arrange
            mockClient.riffy.players.get.mockReturnValue(generateQueue(30));

            // Act
            await buildQueueEmbed(mockInteraction, page, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(mockInteraction.reply.mock.calls[0][0].embeds).toHaveLength(1);
            expect(util.buildEmbed).toHaveBeenCalledTimes(1);
            expect(util.buildEmbed.mock.calls[0][0].footer.text).toContain('1/2');
            expect(mockInteraction.reply.mock.calls[0][0].components).toHaveLength(1);
            expect(logger.info).toHaveBeenCalledTimes(2);
        });

        test('should edit page number to max, if too large (edit=false)', async () => {
            // Arrange
            mockClient.riffy.players.get.mockReturnValue(generateQueue(60));

            // Act
            await buildQueueEmbed(mockInteraction, 9, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(mockInteraction.reply.mock.calls[0][0].embeds).toHaveLength(1);
            expect(util.buildEmbed).toHaveBeenCalledTimes(1);
            expect(util.buildEmbed.mock.calls[0][0].footer.text).toContain('3/3');
            expect(mockInteraction.reply.mock.calls[0][0].components).toHaveLength(1);
            expect(logger.info).toHaveBeenCalledTimes(2);
        });
    });

    describe('invalid queue or only one song', () => {
        test('should update queue embed to empty message, if queue is not present (edit=true)', async () => {
            // Arrange
            const mockPlayer = {
                queue: null,
            };
            mockClient.riffy.players.get.mockReturnValue(mockPlayer);

            // Act
            await buildQueueEmbed(mockInteraction, 1, true);

            // Assert
            expect(mockMessage.edit).toHaveBeenCalled();
            expect(mockMessage.edit.mock.calls[0][0].content).toBe('Die Queue ist leer.');
            expect(mockMessage.edit.mock.calls[0][0].embeds).toHaveLength(0);
            expect(mockMessage.edit.mock.calls[0][0].components).toHaveLength(0);
            expect(logger.info).toHaveBeenCalled();
        });

        test('should send empty message, if queue is not present (edit=false)', async () => {
            // Arrange
            const mockPlayer = {
                queue: null,
            };
            mockClient.riffy.players.get.mockReturnValue(mockPlayer);

            // Act
            await buildQueueEmbed(mockInteraction, 1, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();
        });

        test('should send empty message, if queue only contains one song (edit=false)', async () => {
            // Arrange
            mockClient.riffy.players.get.mockReturnValue(generateQueue(1));

            // Act
            await buildQueueEmbed(mockInteraction, 1, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();
        });
    });
});
