// Imports
const { Events } = require('discord.js');
const logger = require('../../src/logging/logger');
const jsonManager = require('../../src/util/json_manager');
const { buildRoleEmbed } = require('../../src/util/embedBuilder');
const config = require('../../src/util/config');
const { startWichtelLoop } = require('../../src/threads/wichtelLoop');
const { startPollLoop } = require('../../src/threads/pollLoop');
const { startLavalinkLoop } = require('../../src/threads/lavalinkLoop');
const { startLogLoop } = require('../../src/threads/logLoop');
const ready = require('../../src/events/ready');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/json_manager', () => ({
    getMessageID: jest.fn(),
    updateMessageID: jest.fn(),
    getPolls: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildRoleEmbed: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getGuildId: jest.fn(),
    getRoleChannelId: jest.fn(),
    getDrachiEmojiId: jest.fn(),
    getFreeEmojiId: jest.fn(),
    getNsfwEmojiId: jest.fn(),
    getBobbyEmojiId: jest.fn(),
}));

jest.mock('../../src/threads/wichtelLoop', () => ({
    startWichtelLoop: jest.fn(),
}));

jest.mock('../../src/threads/pollLoop', () => ({
    startPollLoop: jest.fn(),
}));

jest.mock('../../src/threads/lavalinkLoop', () => ({
    startLavalinkLoop: jest.fn(),
}));

jest.mock('../../src/threads/logLoop', () => ({
    startLogLoop: jest.fn(),
}));

describe('ready', () => {
    let mockMessage;
    let mockChannel;
    let mockGuild;
    let mockClient;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct event name', () => {
        // Assert
        expect(ready.name).toBe(Events.ClientReady);
    });

    test('should initialize riffy and log ready message', async () => {
        // Arrange
        mockClient = {
            riffy: { init: jest.fn() },
            user: { id: '123456789', tag: 'TestBot#1234' },
            guilds: {
                cache: {
                    get: jest.fn(),
                },
            },
        };
        jsonManager.getPolls.mockReturnValue([]);

        // Act
        await ready.execute(mockClient);

        // Assert
        expect(mockClient.riffy.init).toHaveBeenCalledWith(mockClient.user.id);
        expect(logger.info).toHaveBeenCalledWith(`Ready! Logged in as ${mockClient.user.tag}`);
    });

    describe('Reaction Role Message', () => {
        // Setup
        beforeEach(() => {
            mockMessage = {
                id: 'message123',
                react: jest.fn().mockResolvedValue({}),
                edit: jest.fn().mockResolvedValue({}),
                embeds: [{
                    title: 'Lustige Rollen',
                    color: 0x22E5AA,
                    fields: [
                        {
                            name: 'Test Field',
                            value: 'Test Value',
                        },
                    ],
                }],
            };

            mockChannel = {
                send: jest.fn(),
                messages: {
                    fetch: jest.fn().mockResolvedValue({
                        size: 1,
                        get: jest.fn().mockReturnValue(mockMessage),
                    }),
                },
            };

            const mockReactions = [
                { name: 'schanze', id: '123' },
                { name: 'free', id: '456' },
                { name: 'nsfw', id: '789' },
                { name: 'rene', id: '147' },
            ];

            mockGuild = {
                channels: {
                    cache: {
                        get: jest.fn().mockReturnValue(mockChannel),
                    },
                },
                emojis: {
                    cache: {
                        find: jest.fn(findFn => {
                            mockReactions.forEach(reaction => {
                                if (findFn(reaction)) {
                                    return `<:${reaction.name}:${reaction.id}>`;
                                }
                            });
                        }),
                    },
                },
            };

            mockClient = {
                riffy: { init: jest.fn() },
                user: { id: '123456789', tag: 'TestBot#1234' },
                guilds: {
                    cache: {
                        get: jest.fn().mockReturnValue(mockGuild),
                    },
                },
                channels: {
                    fetch: jest.fn(),
                },
            };

            jsonManager.getPolls.mockReturnValue([]);
        });

        const noMessageCases = [
            { size: 0, get: jest.fn() },
            { size: 1, get: jest.fn().mockReturnValue(null) },
        ];

        test.each(noMessageCases)('should create new reaction role message if none exists', async (noMessage) => {
            // Arrange
            jsonManager.getMessageID.mockReturnValue(null);
            buildRoleEmbed.mockReturnValue({
                color: 0x000000,
                title: 'Test Title',
                fields: [
                    {
                        name: 'Test Field',
                        value: 'Test Value',
                    },
                ],
            });
            mockChannel.messages.fetch.mockResolvedValue(noMessage);
            mockChannel.send.mockResolvedValue(mockMessage);

            // Act
            await ready.execute(mockClient);
            await Promise.resolve();
            await Promise.resolve();

            // Assert
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [{
                    color: 0x000000,
                    title: 'Test Title',
                    fields: [
                        {
                            name: 'Test Field',
                            value: 'Test Value',
                        },
                    ],
                }],
            });
            expect(mockMessage.react).toHaveBeenCalledTimes(4);
            expect(jsonManager.updateMessageID).toHaveBeenCalledWith('roleId', 'message123');
        });

        test('should update old reaction role message if change is noticed', async () => {
            // Arrange
            jsonManager.getMessageID.mockReturnValue('message123');
            buildRoleEmbed.mockReturnValue({
                data: {
                    color: 0x000000,
                    title: 'Test Title',
                    fields: [
                        {
                            name: 'Test Field',
                            value: 'Other Test Value',
                        },
                    ],
                },
            });
            mockChannel.messages.fetch.mockResolvedValue({ size: 1, get: jest.fn().mockReturnValue(mockMessage) });

            // Act
            await ready.execute(mockClient);
            await Promise.resolve();
            await Promise.resolve();

            // Assert
            expect(mockMessage.edit).toHaveBeenCalledWith({
                embeds: [{
                    data: {
                        color: 0x000000,
                        title: 'Test Title',
                        fields: [
                            {
                                name: 'Test Field',
                                value: 'Other Test Value',
                            },
                        ],
                    },
                }],
            });
            expect(mockMessage.react).toHaveBeenCalledTimes(4);
            expect(jsonManager.updateMessageID).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Applied changes to reaction message');
        });

        test('should not update old reaction role message if no change is noticed', async () => {
            // Arrange
            jsonManager.getMessageID.mockReturnValue('message123');
            buildRoleEmbed.mockReturnValue({
                data: {
                    title: 'Lustige Rollen',
                    color: 0x22E5AA,
                    fields: [
                        {
                            name: 'Test Field',
                            value: 'Test Value',
                        },
                    ],
                },
            });
            mockChannel.messages.fetch.mockResolvedValue({ size: 1, get: jest.fn().mockReturnValue(mockMessage) });

            // Act
            await ready.execute(mockClient);
            await Promise.resolve();
            await Promise.resolve();

            // Assert
            expect(mockMessage.edit).not.toHaveBeenCalled();
            expect(mockMessage.react).not.toHaveBeenCalled();
            expect(jsonManager.updateMessageID).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalledWith();
        });

        test('should handle guild not found', async () => {
            // Arrange
            mockClient.guilds.cache.get.mockReturnValue(null);

            // Act
            await ready.execute(mockClient);

            // Assert
            expect(logger.warn).toHaveBeenCalledWith('Could not find guild in cache on ready event');
            expect(config.getRoleChannelId).not.toHaveBeenCalled();
        });

        test('should handle role channel not found', async () => {
            // Arrange
            mockGuild.channels.cache.get.mockReturnValue(null);

            // Act
            await ready.execute(mockClient);

            // Assert
            expect(logger.warn).toHaveBeenCalledWith('Could not find role channel in cache on ready event');
            expect(buildRoleEmbed).not.toHaveBeenCalled();
        });
    });

    describe('Polls', () => {
        test('should load active polls into the cache', async () => {
            // Arrange
            mockChannel = {
                messages: {
                    fetch: jest.fn(),
                },
            };

            mockClient = {
                riffy: { init: jest.fn() },
                user: { id: '123456789', tag: 'TestBot#1234' },
                guilds: {
                    cache: {
                        get: jest.fn(),
                    },
                },
                channels: {
                    fetch: jest.fn().mockResolvedValue(mockChannel),
                },
            };
            jsonManager.getPolls.mockReturnValue([
                {
                    channelId: '123',
                    messageId: '456',
                },
                {
                    channelId: '123',
                    messageId: '789',
                },
                {
                    channelId: '147',
                    messageId: '258',
                },
            ]);

            // Act
            await ready.execute(mockClient);

            // Assert
            expect(jsonManager.getPolls).toHaveBeenCalled();
            expect(mockClient.channels.fetch).toHaveBeenCalledTimes(3);
            expect(mockChannel.messages.fetch).toHaveBeenCalledTimes(3);
        });
    });

    test('should start threads', async () => {
        // Arrange
        mockClient = {
            riffy: { init: jest.fn() },
            user: { id: '123456789', tag: 'TestBot#1234' },
            guilds: {
                cache: {
                    get: jest.fn(),
                },
            },
        };
        jsonManager.getPolls.mockReturnValue([]);

        // Act
        await ready.execute(mockClient);

        // Assert
        expect(startWichtelLoop).toHaveBeenCalled();
        expect(startPollLoop).toHaveBeenCalled();
        expect(startLavalinkLoop).toHaveBeenCalled();
        expect(startLogLoop).toHaveBeenCalled();
    });
});