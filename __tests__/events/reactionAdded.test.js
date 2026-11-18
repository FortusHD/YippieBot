// Imports
const { Events } = require('discord.js');
const logger = require('../../src/logging/logger');
const config = require('../../src/util/config');
const { getId } = require('../../src/database/tables/messageIDs');
const { getPoll } = require('../../src/database/tables/polls');
const reactionAdded = require('../../src/events/reactionAdded');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/database/tables/messageIDs', () => ({
    getId: jest.fn(),
}));

jest.mock('../../src/database/tables/polls', () => ({
    getPoll: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getDrachiEmojiId: jest.fn(),
    getFreeEmojiId: jest.fn(),
    getNsfwEmojiId: jest.fn(),
    getBobbyEmojiId: jest.fn(),
    getStreetFighterEmojiId: jest.fn(),
    getDrachiRoleId: jest.fn(),
    getFreeRoleId: jest.fn(),
    getNsfwRoleId: jest.fn(),
    getBobbyRoleId: jest.fn(),
    getStreetFighterRoleId: jest.fn(),
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

            getId.mockResolvedValue('messageId');
            getPoll.mockResolvedValue(null);
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

        test('should assign StreetFighter role when reacting with StreetFighter emoji', async () => {
            // Arrange
            config.getStreetFighterEmojiId.mockReturnValue('emojiId');
            config.getStreetFighterRoleId.mockReturnValue('streetFighterRoleId');

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.add).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Gave "testUser" the "TestRole" role'),
            );
        });

        test('should fetch the member, when it is not cached', async () => {
            // Arrange
            config.getDrachiEmojiId.mockReturnValue('emojiId');
            config.getDrachiRoleId.mockReturnValue('drachiRoleId');
            mockMessage.guild.members.cache.get.mockReturnValue(undefined);
            mockMessage.guild.members.fetch = jest.fn().mockResolvedValue(mockMember);

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockMessage.guild.members.fetch).toHaveBeenCalledWith('userId');
            expect(mockMember.roles.add).toHaveBeenCalledWith(mockRole);
        });

        test('should log a warning and not throw, when the role cannot be assigned', async () => {
            // Arrange
            config.getDrachiEmojiId.mockReturnValue('emojiId');
            config.getDrachiRoleId.mockReturnValue('drachiRoleId');
            mockMember.roles.add.mockRejectedValue(new Error('Missing Permissions'));

            // Act & Assert
            await expect(reactionAdded.execute(mockReaction, mockUser)).resolves.toBeUndefined();
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Missing Permissions'),
                expect.anything());
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
            getId.mockResolvedValue('otherMessageId');

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

        // Creates a reaction of a message, whose users are only known after fetching them
        const createMessageReaction = (userIds) => {
            const cache = new Map();
            return {
                users: {
                    cache,
                    fetch: jest.fn().mockImplementation(async () => {
                        userIds.forEach(id => cache.set(id, { id }));
                        return cache;
                    }),
                },
            };
        };

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();

            mockMessage = {
                id: 'messageId',
                channelId: 'channelId',
                reactions: {
                    cache: new Map(),
                },
            };

            mockChannel = {
                messages: {
                    fetch: jest.fn().mockResolvedValue(mockMessage),
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
                emoji: { id: null },
                users: {
                    remove: jest.fn(),
                },
            };

            mockUser = {
                id: 'userId',
                username: 'testUser',
                bot: false,
            };

            getId.mockResolvedValue('otherMessageId');
        });

        test('should remove reaction, when max votes reached', async () => {
            // Arrange
            getPoll.mockResolvedValue({ maxVotes: 1 });
            mockMessage.reactions.cache.set('1', createMessageReaction(['userId']));
            mockMessage.reactions.cache.set('2', createMessageReaction(['userId']));

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
        });

        test('should do nothing, when max votes not reached', async () => {
            // Arrange
            getPoll.mockResolvedValue({ maxVotes: 1 });
            mockMessage.reactions.cache.set('1', createMessageReaction(['userId']));

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            expect(mockReaction.users.remove).not.toHaveBeenCalled();
        });

        test('should only count reactions of the user and fetch the users of every reaction', async () => {
            // Arrange
            getPoll.mockResolvedValue({ maxVotes: 1 });
            const reactions = [
                createMessageReaction(['userId']),
                createMessageReaction(['userId']),
                createMessageReaction(['otherUserId']),
            ];
            reactions.forEach((r, index) => mockMessage.reactions.cache.set(String(index), r));

            // Act
            await reactionAdded.execute(mockReaction, mockUser);

            // Assert
            reactions.forEach(r => expect(r.users.fetch).toHaveBeenCalled());
            expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
        });

        test('should not throw and log a warning, when the votes cannot be checked', async () => {
            // Arrange
            getPoll.mockResolvedValue({ maxVotes: 1 });
            mockChannel.messages.fetch.mockRejectedValue(new Error('fail'));

            // Act & Assert
            await expect(reactionAdded.execute(mockReaction, mockUser)).resolves.toBeUndefined();
            expect(logger.warn).toHaveBeenCalled();
            expect(mockReaction.users.remove).not.toHaveBeenCalled();
        });
    });
});
