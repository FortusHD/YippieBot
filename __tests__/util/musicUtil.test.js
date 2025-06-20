// Imports
const logger = require('../../src/logging/logger');
const { MessageFlags } = require('discord.js');
const { formatDuration, validateUserInSameVoiceChannel, editInteractionReply } = require('../../src/util/util');
const { buildEmbed } = require('../../src/util/embedBuilder');
const musicUtil = require('../../src/util/musicUtil');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn(),
    formatDuration: jest.fn(),
    validateUserInSameVoiceChannel: jest.fn(),
    editInteractionReply: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
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

describe('pauseOrResumePlayer', () => {
    let mockPlayer;
    let mockInteraction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockPlayer = {
            paused: false,
            pause: jest.fn(),
            node: {
                host: 'localhost',
            },
            current: {},
        };

        mockInteraction = {
            reply: jest.fn(),
            user: {
                tag: 'testUser#1234',
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
        };

        validateUserInSameVoiceChannel.mockReturnValue(true);
    });

    test('should pause the player', async () => {
        // Act
        await musicUtil.pauseOrResumePlayer(mockInteraction);

        // Assert
        expect(validateUserInSameVoiceChannel).toHaveBeenCalledWith(mockInteraction, mockPlayer);
        expect(mockPlayer.pause).toHaveBeenCalledWith(true);
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: '[object Object] hat die Wiedergabe pausiert.',
        });
    });

    test('should resume the player', async () => {
        // Arrange
        mockPlayer.paused = true;

        // Act
        await musicUtil.pauseOrResumePlayer(mockInteraction);

        // Assert
        expect(validateUserInSameVoiceChannel).toHaveBeenCalledWith(mockInteraction, mockPlayer);
        expect(mockPlayer.pause).toHaveBeenCalledWith(false);
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: '[object Object] hat die Wiedergabe fortgesetzt.',
        });
    });

    test('Should handle no player', async () => {
        // Arrange
        mockInteraction.client.riffy.players.get.mockReturnValue(null);

        // Act
        await musicUtil.pauseOrResumePlayer(mockInteraction);

        // Assert
        expect(validateUserInSameVoiceChannel).not.toHaveBeenCalled();
        expect(mockPlayer.pause).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: 'Es wird derzeit kein Song abgespielt.',
            flags: MessageFlags.Ephemeral,
        });
    });

    test('Should handle user not in same channel', async () => {
        // Arrange
        validateUserInSameVoiceChannel.mockReturnValue(false);

        // Act
        await musicUtil.pauseOrResumePlayer(mockInteraction);

        // Assert
        expect(validateUserInSameVoiceChannel).toHaveBeenCalledWith(mockInteraction, mockPlayer);
        expect(mockPlayer.pause).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith({
            content: 'Du musst im selben Sprachkanal wie der Bot sein, um die Wiedergabe zu steuern.',
            flags: MessageFlags.Ephemeral,
        });
    });
});

describe('skipSong', () => {
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
        await musicUtil.skipSong(mockInteraction);

        // Assert
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
        await musicUtil.skipSong(mockInteraction);

        // Assert
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
        await musicUtil.skipSong(mockInteraction);

        // Assert
        expect(mockInteraction.reply).toHaveBeenCalledWith('Überspringe...');
        expect(logger.info).toHaveBeenCalledWith('No song playing.');
        expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, 'Gerade läuft kein Song du Idiot!');
        expect(mockPlayer.stop).not.toHaveBeenCalled();
    });
});

describe('buildQueueEmbed', () => {
    // Setup
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
        client: {
            riffy: {
                players: {
                    get: jest.fn(),
                },
            },
        },
        member: mockMember,
        message: mockMessage,
        guildId: mockGuildId,
        reply: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        formatDuration.mockReturnValue('00:00');
        buildEmbed.mockReturnValue({
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
            mockInteraction.client.riffy.players.get.mockReturnValue(generateQueue(5));

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, 1, true);

            // Assert
            expect(mockMessage.edit).toHaveBeenCalled();
            expect(mockMessage.edit.mock.calls[0][0].embeds).toHaveLength(1);
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(buildEmbed.mock.calls[0][0].footer.text).toContain('1/1');
            expect(mockMessage.edit.mock.calls[0][0].components).toHaveLength(1);
            expect(logger.info).toHaveBeenCalledTimes(2);
        });

        test('should send queue embed, if queue is present (edit=false)', async () => {
            // Arrange
            mockInteraction.client.riffy.players.get.mockReturnValue(generateQueue(5));

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, 1);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(mockInteraction.reply.mock.calls[0][0].embeds).toHaveLength(1);
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(buildEmbed.mock.calls[0][0].footer.text).toContain('1/1');
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
            mockInteraction.client.riffy.players.get.mockReturnValue(generateQueue(30));

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, page, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(mockInteraction.reply.mock.calls[0][0].embeds).toHaveLength(1);
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(buildEmbed.mock.calls[0][0].footer.text).toContain('1/2');
            expect(mockInteraction.reply.mock.calls[0][0].components).toHaveLength(1);
            expect(logger.info).toHaveBeenCalledTimes(2);
        });

        test('should edit page number to max, if too large (edit=false)', async () => {
            // Arrange
            mockInteraction.client.riffy.players.get.mockReturnValue(generateQueue(60));

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, 9, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(mockInteraction.reply.mock.calls[0][0].embeds).toHaveLength(1);
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(buildEmbed.mock.calls[0][0].footer.text).toContain('3/3');
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
            mockInteraction.client.riffy.players.get.mockReturnValue(mockPlayer);

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, 1, true);

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
            mockInteraction.client.riffy.players.get.mockReturnValue(mockPlayer);

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, 1, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();
        });

        test('should send empty message, if queue only contains one song (edit=false)', async () => {
            // Arrange
            mockInteraction.client.riffy.players.get.mockReturnValue(generateQueue(1));

            // Act
            await musicUtil.buildQueueEmbed(mockInteraction, 1, false);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();
        });
    });
});
