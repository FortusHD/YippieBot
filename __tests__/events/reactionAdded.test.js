// Imports
const { Events } = require('discord.js');
const logger = require('../../src/logging/logger');
const jsonManager = require('../../src/util/json_manager');
const config = require('../../src/util/config');
const reactionAdded = require('../../src/events/reactionAdded');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/json_manager', () => ({
    getMessageID: jest.fn(),
    getPoll: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getDrachiEmojiId: jest.fn(),
    getFreeEmojiId: jest.fn(),
    getNsfwEmojiId: jest.fn(),
    getBobbyEmojiId: jest.fn(),
    getDrachiRoleId: jest.fn(),
    getFreeRoleId: jest.fn(),
    getNsfwRoleId: jest.fn(),
    getBobbyRoleId: jest.fn(),
}));

describe('reactionAdded', () => {
    test('should have correct event name', () => {
        // Assert
        expect(reactionAdded.name).toBe(Events.MessageReactionAdd);
    });

    describe('Role Assignment', () => {
        let mockReaction;
        let mockUser;
        let mockMember;
        let mockRole;
        let mockMessage;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();

            mockRole = {
                name: 'TestRole',
            };

            mockMember = {
                roles: {
                    add: jest.fn().mockResolvedValue(undefined),
                },
            };

            mockMessage = {
                id: 'messageId',
                guild: {
                    members: {
                        cache: {
                            get: jest.fn().mockReturnValue(mockMember),
                        },
                    },
                    roles: {
                        cache: {
                            get: jest.fn().mockReturnValue(mockRole),
                        },
                    },
                },
            };

            mockReaction = {
                message: mockMessage,
                emoji: {
                    id: 'emojiId',
                },
            };
            mockUser = {
                id: 'userId',
                username: 'testUser',
                bot: false,
            };

            jsonManager.getMessageID.mockReturnValue('messageId');
            jsonManager.getPoll.mockReturnValue(null);
        });

        test('should assign Drachi role when reacting with Drachi emoji', async () => {
            // Arrange
            config.getDrachiEmojiId.mockReturnValue('emojiId');
            config.getDrachiRoleId.mockReturnValue('drachiRoleId');

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Gave "testUser" the "TestRole" role'),
            );
        });

        test('should assign Free role when reacting with Free emoji', async () => {
            // Arrange
            config.getFreeEmojiId.mockReturnValue('emojiId');
            config.getFreeRoleId.mockReturnValue('freeRoleId');

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Gave "testUser" the "TestRole" role'),
            );
        });

        test('should assign Nsfw role when reacting with Nsfw emoji', async () => {
            // Arrange
            config.getNsfwEmojiId.mockReturnValue('emojiId');
            config.getNsfwRoleId.mockReturnValue('nsfwRoleId');

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Gave "testUser" the "TestRole" role'),
            );
        });

        test('should assign Bobby role when reacting with Bobby emoji', async () => {
            // Arrange
            config.getBobbyEmojiId.mockReturnValue('emojiId');
            config.getBobbyRoleId.mockReturnValue('bobbyRoleId');

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Gave "testUser" the "TestRole" role'),
            );
        });

        test('should assign no role when reacting with other emoji', async () => {
            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });

        test('should assign no role if message is not role message', async () => {
            // Arrange
            jsonManager.getMessageID.mockReturnValue('otherMessageId');

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });
    });

    describe('Poll Voting', () => {
        let mockMessage;
        let mockChannel;
        let mockReaction;
        let mockUser;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();

            mockMessage = {
                id: 'messageId',
                channelId: 'channelId',
                reactions: {
                    cache: { filter: jest.fn() },
                },
            };

            mockChannel = {
                messages: {
                    fetch: jest.fn().mockResolvedValue(mockMessage),
                },
                reactions: {
                    cache: {
                        filter: jest.fn(),
                    },
                },
            };

            mockReaction = {
                client: {
                    channels: {
                        cache: {
                            get: jest.fn().mockReturnValue(mockChannel),
                        },
                    },
                },
                message: mockMessage,
                users: {
                    remove: jest.fn(),
                },
            };

            mockUser = {
                id: 'userId',
                username: 'testUser',
                bot: false,
            };
        });

        test('should remove reaction, when max votes reached', async () => {
            // Arrange
            const mockPoll = { maxVotes: 1 };
            jsonManager.getPoll.mockReturnValue(mockPoll);
            mockMessage.reactions.cache.filter.mockReturnValue({
                size: 2,
            });

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
        });

        test('should do nothing, when max votes not reached', async () => {
            // Arrange
            const mockPoll = { maxVotes: 1 };
            jsonManager.getPoll.mockReturnValue(mockPoll);
            mockMessage.reactions.cache.filter.mockReturnValue({
                size: 1,
            });

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockReaction.users.remove).not.toHaveBeenCalled();
        });

        test('should filter only reactions from user and remove, when max votes reached', async () => {
            // Arrange
            const mockPoll = { maxVotes: 1 };
            jsonManager.getPoll.mockReturnValue(mockPoll);
            const createMockReaction = (userId) => ({
                users: { cache: new Map([[userId, true]]) },
            });
            const mockReactions = new Map([
                ['1', createMockReaction('userId')],
                ['2', createMockReaction('userId')],
                ['3', createMockReaction('otherUserId')],
            ]);
            mockReactions.filter = jest.fn(filterFn => {
                const result = new Map();
                mockReactions.forEach((value, key) => {
                    if (filterFn(value)) {
                        result.set(key, value);
                    }
                });
                return result;
            });
            mockMessage.reactions.cache = mockReactions;

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
        });
    });
});