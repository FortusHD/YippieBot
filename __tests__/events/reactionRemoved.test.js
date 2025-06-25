// Imports
const { Events } = require('discord.js');
const logger = require('../../src/logging/logger');
const config = require('../../src/util/config');
const { getId } = require('../../src/database/tables/messageIDs');
const { getPoll } = require('../../src/database/tables/polls');
const reactionRemoved = require('../../src/events/reactionRemoved');

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
    getDrachiRoleId: jest.fn(),
    getFreeRoleId: jest.fn(),
    getNsfwRoleId: jest.fn(),
    getBobbyRoleId: jest.fn(),
}));

describe('reactionRemoved', () => {
    test('should have correct event name', () => {
        // Assert
        expect(reactionRemoved.name).toBe(Events.MessageReactionRemove);
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
                    remove: jest.fn().mockResolvedValue(undefined),
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

        test('should remove Drachi role when removing with Drachi emoji', async () => {
            // Arrange
            config.getDrachiEmojiId.mockReturnValue('emojiId');
            config.getDrachiRoleId.mockReturnValue('drachiRoleId');

            // Act
            await reactionRemoved.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.remove).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Removed the "TestRole" role from "testUser"'),
            );
        });

        test('should remove Free role when removing with Free emoji', async () => {
            // Arrange
            config.getFreeEmojiId.mockReturnValue('emojiId');
            config.getFreeRoleId.mockReturnValue('freeRoleId');

            // Act
            await reactionRemoved.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.remove).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Removed the "TestRole" role from "testUser"'),
            );
        });

        test('should remove Nsfw role when removing with Nsfw emoji', async () => {
            // Arrange
            config.getNsfwEmojiId.mockReturnValue('emojiId');
            config.getNsfwRoleId.mockReturnValue('nsfwRoleId');

            // Act
            await reactionRemoved.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.remove).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Removed the "TestRole" role from "testUser"'),
            );
        });

        test('should remove Bobby role when removing with Bobby emoji', async () => {
            // Arrange
            config.getBobbyEmojiId.mockReturnValue('emojiId');
            config.getBobbyRoleId.mockReturnValue('bobbyRoleId');

            // Act
            await reactionRemoved.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.remove).toHaveBeenCalledWith(mockRole);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Removed the "TestRole" role from "testUser"'),
            );
        });

        test('should remove no role, when other emoji was removed', async () => {
            // Act
            await reactionRemoved.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.remove).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });

        test('should remove no role if message is not role message', async () => {
            // Arrange
            getId.mockResolvedValue('otherMessageId');

            // Act
            await reactionRemoved.execute(mockReaction, mockUser);

            // Assert
            expect(mockMember.roles.remove).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });
    });
});