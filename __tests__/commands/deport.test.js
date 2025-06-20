// Imports
const logger = require('../../src/logging/logger');
const data = require('../../src/util/data.js');
const config = require('../../src/util/config');
const { handleError, ErrorType } = require('../../src/logging/errorHandler');
const deport = require('../../src/commands/deport');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/data.js', () => ({
    isPrisoner: jest.fn(),
    addPrisoner: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getAfkChannelId: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    ...jest.requireActual('../../src/logging/errorHandler'),
    handleError: jest.fn(),
}));

describe('deport', () => {
    test('should have required properties', () => {
        // Assert
        expect(deport).toHaveProperty('guild', true);
        expect(deport).toHaveProperty('dm', false);
        expect(deport).toHaveProperty('help');
        expect(deport.help).toHaveProperty('usage');
        expect(deport).toHaveProperty('data');
        expect(deport.data).toHaveProperty('name', 'deport');
        expect(deport.data).toHaveProperty('description');
        expect(deport.data.options).toHaveLength(1);
        expect(deport.data.options[0]).toHaveProperty('name', 'user');
        expect(deport.data.options[0]).toHaveProperty('description');
        expect(deport.data.options[0]).toHaveProperty('type', 6);
        expect(deport.data.options[0]).toHaveProperty('required', true);
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
                id: '456',
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

        test('should successfully deport a user', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(false);

            // Act
            await deport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling deport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(data.addPrisoner).toHaveBeenCalledWith('456');
            expect(mockMember.voice.setChannel).toHaveBeenCalledWith(mockChannel);
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                'prisonerTag wurde deportiert!',
            );
            expect(logger.info).toHaveBeenCalledWith(
                'prisonerTag was deported by "userTag".',
            );
        });

        test('should successfully deport a user, even if user is already prisoner', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(true);

            // Act
            await deport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling deport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(data.addPrisoner).not.toHaveBeenCalled();
            expect(mockMember.voice.setChannel).toHaveBeenCalledWith(mockChannel);
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                'prisonerTag wurde deportiert!',
            );
            expect(logger.info).toHaveBeenCalledWith(
                'prisonerTag was deported by "userTag".',
            );
        });

        test('should successfully deport a user, even if user is not in voice', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(false);
            mockMember.voice.channel = null;

            // Act
            await deport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling deport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(data.addPrisoner).toHaveBeenCalledWith('456');
            expect(mockMember.voice.setChannel).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                'prisonerTag wurde deportiert!',
            );
            expect(logger.info).toHaveBeenCalledWith(
                'prisonerTag was deported by "userTag".',
            );
        });

        test('should handle missing afkChannel', async () => {
            // Arrange
            config.getAfkChannelId.mockReturnValue(null);

            // Act
            await deport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling deport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(3);
            expect(data.addPrisoner).not.toHaveBeenCalled();
            expect(mockMember.voice.setChannel).not.toHaveBeenCalled();
            expect(handleError).toHaveBeenCalledWith(
                expect.stringContaining('could not be found'),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.RESOURCE_NOT_FOUND,
                    interaction: mockInteraction,
                    context: {
                        command: 'deport',
                        afkChannelId: null,
                    },
                }),
            );
        });

        test('should handle missing member', async () => {
            // Arrange
            mockGuild.members.cache.get.mockReturnValue(null);

            // Act
            await deport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling deport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(data.addPrisoner).not.toHaveBeenCalled();
            expect(mockMember.voice.setChannel).not.toHaveBeenCalled();
            expect(handleError).toHaveBeenCalledWith(
                expect.stringContaining('Invalid user specified:'),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.INVALID_INPUT,
                    interaction: mockInteraction,
                    context: {
                        command: 'deport',
                        userId: expect.any(String),
                    },
                }),
            );
        });

        test('should handle error while moving prisoner', async () => {
            // Arrange
            mockMember.voice.setChannel.mockImplementation(() => {
                throw new Error('Error while moving prisoner');
            });

            // Act
            await deport.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling deport command used by "userTag".',
            );
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(data.addPrisoner).toHaveBeenCalledWith('456');
            expect(mockMember.voice.setChannel).toHaveBeenCalledTimes(1);
            expect(handleError).toHaveBeenCalledWith(
                expect.stringContaining('Failed to move user to AFK channel:'),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.DISCORD_API_ERROR,
                    interaction: mockInteraction,
                    context: {
                        command: 'deport',
                        userId: expect.any(String),
                        afkChannelId: expect.any(String),
                    },
                }),
            );
        });
    });
});