// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { buildEmbed } = require('../../src/util/embedBuilder');
const errorHandler = require('../../src/logging/errorHandler');
const { ErrorType } = require('../../src/logging/errorHandler');
const { insertPoll } = require('../../src/database/tables/polls');
const poll = require('../../src/commands/poll');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/database/tables/polls', () => ({
    insertPoll: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    ...jest.requireActual('../../src/logging/errorHandler'),
    handleError: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

describe('poll', () => {
    test('should have required properties', () => {
        // Assert
        expect(poll).toHaveProperty('guild', true);
        expect(poll).toHaveProperty('dm', false);
        expect(poll).toHaveProperty('data');
        expect(poll).toHaveProperty('help');
        expect(poll.help).toHaveProperty('category', 'Sonstiges');
        expect(poll.help).toHaveProperty('usage');
        expect(poll.data).toHaveProperty('name', 'poll');
        expect(poll.data).toHaveProperty('description');
        expect(poll.data.options).toHaveLength(18);
        expect(poll.data.options[0]).toHaveProperty('name', 'question');
        expect(poll.data.options[0]).toHaveProperty('description');
        expect(poll.data.options[0]).toHaveProperty('type', 3);
        expect(poll.data.options[0]).toHaveProperty('required', true);
        expect(poll.data.options[1]).toHaveProperty('name', 'time');
        expect(poll.data.options[1]).toHaveProperty('description');
        expect(poll.data.options[1]).toHaveProperty('type', 3);
        expect(poll.data.options[1]).toHaveProperty('required', true);
        expect(poll.data.options[2]).toHaveProperty('name', 'answer1');
        expect(poll.data.options[2]).toHaveProperty('description');
        expect(poll.data.options[2]).toHaveProperty('type', 3);
        expect(poll.data.options[2]).toHaveProperty('required', true);
        expect(poll.data.options[3]).toHaveProperty('name', 'answer2');
        expect(poll.data.options[3]).toHaveProperty('description');
        expect(poll.data.options[3]).toHaveProperty('type', 3);
        expect(poll.data.options[3]).toHaveProperty('required', true);
        expect(poll.data.options[4]).toHaveProperty('name', 'max_votes');
        expect(poll.data.options[4]).toHaveProperty('description');
        expect(poll.data.options[4]).toHaveProperty('type', 4);
        expect(poll.data.options[4]).toHaveProperty('required', false);

        for (let i = 5; i < 18; i++) {
            expect(poll.data.options[i]).toHaveProperty('name', `answer${i - 2}`);
            expect(poll.data.options[i]).toHaveProperty('description');
            expect(poll.data.options[i]).toHaveProperty('type', 3);
            expect(poll.data.options[i]).toHaveProperty('required', false);
        }
    });

    describe('execute', () => {
        let mockMessage;
        let mockChannel;
        let mockDmChannel;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockMessage = {
                id: '456',
                react: jest.fn(),
            };

            mockChannel = {
                id: '123',
                send: jest.fn().mockResolvedValue(mockMessage),
            };

            mockDmChannel = {
                send: jest.fn(),
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                channel: mockChannel,
                member: {
                    user: {
                        createDM: jest.fn().mockReturnValue(mockDmChannel),
                    },
                },
                options: {
                    getString: jest.fn().mockImplementation((query) => {
                        switch (query) {
                        case 'question':
                            return 'testQuestion';
                        case 'time':
                            return '10m';
                        default:
                            if (query.startsWith('answer') && query.length > 6) {
                                const answerNumber = parseInt(query.substring(6), 10);
                                if (answerNumber >= 1 && answerNumber <= 15) {
                                    return `<:emoji${answerNumber}:${answerNumber * 2}> testAnswer${answerNumber}`;
                                }
                            }
                            return 'Invalid query';
                        }
                    }),
                    getInteger: jest.fn().mockReturnValue(null),
                },
                reply: jest.fn(),
            };

            buildEmbed.mockReturnValue({ test: 'test' });
        });

        test('should start poll', async () => {
            // Act
            await poll.execute(mockInteraction);
            await Promise.resolve();

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling poll command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Abstimmung wird gestartet!',
                flags: MessageFlags.Ephemeral,
            });
            expect(buildEmbed).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    color: 0x2210e8,
                    title: 'Umfrage',
                    description: 'testQuestion',
                    fields: expect.any(Array),
                }),
            );
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [{ test: 'test' }],
            });
            expect(insertPoll).toHaveBeenCalledWith({
                channelId: '123',
                endTime: expect.any(Date),
                maxVotes: null,
                messageId: '456',
            });
            expect(logger.info).toHaveBeenCalledWith('"testUser" started a poll with 15 answers.');
            expect(errorHandler.handleError).not.toHaveBeenCalled();
            expect(mockDmChannel.send).not.toHaveBeenCalled();
        });

        const testTimes = ['10h', '5d'];

        test.each(testTimes)('should start poll with other inputs (time: %s)', async (time) => {
            // Arrange
            mockInteraction.options.getString.mockImplementation((query) => {
                switch (query) {
                case 'question':
                    return 'testQuestion';
                case 'time':
                    return time;
                default:
                    if (query.startsWith('answer') && query.length > 6) {
                        const answerNumber = parseInt(query.substring(6), 10);
                        if (answerNumber >= 1 && answerNumber <= 4) {
                            return `<:emoji${answerNumber}:${answerNumber * 2}> testAnswer${answerNumber}`;
                        }

                        return null;
                    }
                }
            });
            mockInteraction.options.getInteger.mockReturnValue(3);

            // Act
            await poll.execute(mockInteraction);
            await Promise.resolve();

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling poll command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Abstimmung wird gestartet!',
                flags: MessageFlags.Ephemeral,
            });
            expect(buildEmbed).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    color: 0x2210e8,
                    title: 'Umfrage',
                    description: 'testQuestion',
                    fields: expect.any(Array),
                }),
            );
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [{ test: 'test' }],
            });
            expect(insertPoll).toHaveBeenCalledWith({
                messageId: '456',
                channelId: '123',
                endTime: expect.any(Date),
                maxVotes: 3,
            });
            expect(logger.info).toHaveBeenCalledWith('"testUser" started a poll with 4 answers.');
            expect(errorHandler.handleError).not.toHaveBeenCalled();
            expect(mockDmChannel.send).not.toHaveBeenCalled();
        });

        test('should handle invalid answer input', async () => {
            // Arrange
            mockInteraction.options.getString.mockImplementation((query) => {
                switch (query) {
                case 'question':
                    return 'testQuestion';
                case 'time':
                    return '10d';
                default:
                    if (query.startsWith('answer') && query.length > 6) {
                        const answerNumber = parseInt(query.substring(6), 10);
                        if (answerNumber >= 1 && answerNumber <= 4) {
                            return `<:emoji${answerNumber}:${answerNumber * 2}> testAnswer${answerNumber}`;
                        }
                        if (answerNumber === 5) {
                            return `<:emoji${answerNumber}:> testAnswer${answerNumber}`;
                        }

                        return null;
                    }
                }
            });

            // Act
            await poll.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling poll command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Abstimmung wird gestartet!',
                flags: MessageFlags.Ephemeral,
            });
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(mockDmChannel.send).toHaveBeenCalledWith({
                content: 'Bei deinem Poll hast du bei Antwort 5 nicht das richtige Format befolgt. '
                    + 'Bitte stelle sicher, dass die Antwort folgende Form hat: (emoji) (text)',
                embeds: [expect.any(Object)],
            });
            expect(mockChannel.send).not.toHaveBeenCalled();
            expect(insertPoll).not.toHaveBeenCalled();
            expect(errorHandler.handleError).not.toHaveBeenCalled();
        });

        test('should handle duplicate emojis', async () => {
            // Arrange
            mockInteraction.options.getString.mockImplementation((query) => {
                switch (query) {
                case 'question':
                    return 'testQuestion';
                case 'time':
                    return '10d';
                default:
                    if (query.startsWith('answer') && query.length > 6) {
                        const answerNumber = parseInt(query.substring(6), 10);
                        if (answerNumber >= 1 && answerNumber <= 4) {
                            return `<:emoji${answerNumber}:${answerNumber * 2}> testAnswer${answerNumber}`;
                        }
                        if (answerNumber === 5) {
                            return `<:emoji4:8> testAnswer${answerNumber}`;
                        }

                        return null;
                    }
                }
            });

            // Act
            await poll.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling poll command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Abstimmung wird gestartet!',
                flags: MessageFlags.Ephemeral,
            });
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(mockDmChannel.send).toHaveBeenCalledWith({
                content: 'Das Emoji für Antwort 5 wurde bereits verwendet. '
                    + 'Bitte wähle ein anderes Emoji.',
                embeds: [expect.any(Object)],
            });
            expect(mockChannel.send).not.toHaveBeenCalled();
            expect(insertPoll).not.toHaveBeenCalled();
            expect(errorHandler.handleError).not.toHaveBeenCalled();
        });

        test('should handle error while sending message', async () => {
            // Arrange
            mockChannel.send.mockResolvedValue(null);

            // Act
            await poll.execute(mockInteraction);
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling poll command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Abstimmung wird gestartet!',
                flags: MessageFlags.Ephemeral,
            });
            expect(buildEmbed).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    color: 0x2210e8,
                    title: 'Umfrage',
                    description: 'testQuestion',
                    fields: expect.any(Array),
                }),
            );
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [{ test: 'test' }],
            });
            expect(errorHandler.handleError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.MESSAGE_NOT_SENT,
                    interaction: mockInteraction,
                    context: expect.any(Object),
                }),
            );
            expect(insertPoll).not.toHaveBeenCalled();
            expect(mockDmChannel.send).not.toHaveBeenCalled();
        });

        test('should handle invalid time input', async () => {
            // Arrange
            mockInteraction.options.getString.mockImplementation((query) => {
                switch (query) {
                case 'question':
                    return 'testQuestion';
                case 'time':
                    return '1087123';
                default:
                    if (query.startsWith('answer') && query.length > 6) {
                        const answerNumber = parseInt(query.substring(6), 10);
                        if (answerNumber >= 1 && answerNumber <= 4) {
                            return `<:emoji${answerNumber}:${answerNumber * 2}> testAnswer${answerNumber}`;
                        }
                        return null;
                    }
                }
            });

            // Act
            await poll.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling poll command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Abstimmung wird gestartet!',
                flags: MessageFlags.Ephemeral,
            });
            expect(buildEmbed).toHaveBeenCalledTimes(1);
            expect(mockDmChannel.send).toHaveBeenCalledWith({
                content: 'Bei deinem Poll hast du die Zeit falsch angegeben. Erlaubt ist nur dieses Format: '
                    + '7d, 10h oder 33m',
                embeds: [expect.any(Object)],
            });
            expect(mockChannel.send).not.toHaveBeenCalled();
            expect(insertPoll).not.toHaveBeenCalled();
            expect(errorHandler.handleError).not.toHaveBeenCalled();
        });
    });
});