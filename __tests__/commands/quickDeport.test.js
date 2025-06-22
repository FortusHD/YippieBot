// Imports
const logger = require('../../src/logging/logger');
const config = require('../../src/util/config');
const { ErrorType, handleError } = require('../../src/logging/errorHandler');
const quickDeport = require('../../src/commands/quickDeport');
// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getAfkChannelId: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    ...jest.requireActual('../../src/logging/errorHandler'),
    handleError: jest.fn(),
}));

describe('quickDeport', () => {
    test('should have required properties', () => {
        expect(quickDeport).toHaveProperty('guild', true);
        expect(quickDeport).toHaveProperty('dm', false);
        expect(quickDeport).toHaveProperty('data');
        expect(quickDeport).toHaveProperty('help');
        expect(quickDeport.help).toHaveProperty('category', 'Deportation');
        expect(quickDeport.help).toHaveProperty('usage');
        expect(quickDeport.data).toHaveProperty('name', 'quick-deport');
        expect(quickDeport.data).toHaveProperty('description');
        expect(quickDeport.data.options).toHaveLength(1);
        expect(quickDeport.data.options[0]).toHaveProperty('name', 'user');
        expect(quickDeport.data.options[0]).toHaveProperty('description');
        expect(quickDeport.data.options[0]).toHaveProperty('type', 6);
        expect(quickDeport.data.options[0]).toHaveProperty('required', true);
    });

    describe('execute', () => {
        let mockUser;
        let mockMember;
        let mockChannel;
        let mockGuild;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockUser = {
                id: '456',
                tag: 'prisonerTag',
            };

            mockMember = {
                user: mockUser,
                voice: {
                    channel: {},
                    setChannel: jest.fn(),
                },
            };

            mockChannel = {
                id: '1234',
            };

            mockGuild = {
                channels: {
                    cache: {
                        find: jest.fn(predicate => {
                            if (predicate(mockChannel)) {
                                return mockChannel;
                            }
                            return null;
                        }),
                    },
                },
                members: {
                    cache: {
                        get: jest.fn().mockReturnValue(mockMember),
                    },
                },
            };

            mockInteraction = {
                user: {
                    tag: 'userTag',
                },
                options: {
                    getUser: jest.fn().mockReturnValue(mockUser),
                },
                guild: mockGuild,
                reply: jest.fn(),
            };

            config.getAfkChannelId.mockReturnValue('1234');
        });

        test('should successfully move a user', async () => {
            // Act
            await quickDeport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling quickDeport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(mockMember.voice.setChannel).toHaveBeenCalledWith(mockChannel);
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                'prisonerTag wurde verschoben!',
            );
            expect(logger.info).toHaveBeenCalledWith(
                '"prisonerTag" was moved by "userTag".',
            );
        });

        test('should handle missing afk channel', async () => {
            // Arrange
            config.getAfkChannelId.mockReturnValue(null);

            // Act
            await quickDeport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling quickDeport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(3);
            expect(handleError).toHaveBeenCalledWith(
                expect.stringContaining('could not be found'),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.RESOURCE_NOT_FOUND,
                    interaction: mockInteraction,
                    context: {
                        command: 'quick-deport',
                        afkChannelId: null,
                    },
                }),
            );
            expect(mockMember.voice.setChannel).not.toHaveBeenCalled();
        });

        test('should handle missing member', async () => {
            // Arrange
            mockGuild.members.cache.get.mockReturnValue(null);

            // Act
            await quickDeport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling quickDeport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(handleError).toHaveBeenCalledWith(
                expect.stringContaining('Invalid user specified:'),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.INVALID_INPUT,
                    interaction: mockInteraction,
                    context: {
                        command: 'quick-deport',
                        userId: '456',
                    },
                }),
            );
            expect(mockMember.voice.setChannel).not.toHaveBeenCalled();
        });

        test('should do nothing if user is not in channel', async () => {
            // Arrange
            mockMember.voice.channel = null;

            // Act
            await quickDeport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling quickDeport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(mockMember.voice.setChannel).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                'prisonerTag wurde verschoben!',
            );
            expect(logger.info).toHaveBeenCalledWith(
                '"prisonerTag" was moved by "userTag".',
            );
        });

        test('should handle error while moving', async () => {
            // Arrange
            mockMember.voice.setChannel.mockImplementation(() => {
                throw new Error('Error while moving');
            });

            // Act
            await quickDeport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling quickDeport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(mockMember.voice.setChannel).toHaveBeenCalledWith(mockChannel);
            expect(handleError).toHaveBeenCalledWith(
                expect.stringContaining('Failed to move user to AFK channel:'),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.DISCORD_API_ERROR,
                    interaction: mockInteraction,
                    context: {
                        command: 'quick-deport',
                        userId: '456',
                        afkChannelId: '1234',
                    },
                }),
            );
        });
    });
});