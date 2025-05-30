// Imports
const { Events } = require('discord.js');
const logger = require('../../src/logging/logger');
const config = require('../../src/util/config');
const data = require('../../src/util/data');
const voiceStateUpdated = require('../../src/events/voiceStateUpdated');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getAfkChannelId: jest.fn().mockReturnValue('456'),
}));

jest.mock('../../src/util/data', () => ({
    isPrisoner: jest.fn(),
}));

describe('voiceStateUpdated', () => {
    let mockPlayer;
    let mockClient;
    let mockAfkChannel;
    let otherMockChannel;
    let oldState;
    let newState;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct event name', () => {
        // Assert
        expect(voiceStateUpdated.name).toBe(Events.VoiceStateUpdate);
    });

    describe('Prisoner', () => {
        // Setup
        beforeEach(() => {
            mockClient = {
                riffy: {
                    players: {
                        get: jest.fn().mockReturnValue(null),
                    },
                },
            };

            otherMockChannel = {
                id: '369',
            };
            mockAfkChannel = {
                id: '456',
            };

            oldState = {
                guild: {
                    id: '789',
                },
                client: mockClient,
            };

            newState = {
                member: {
                    id: '123',
                    voice: {
                        setChannel: jest.fn(),
                    },
                    nickname: 'Prisoner',
                    user: {
                        tag: 'PrisonerTag',
                    },
                },
                channelId: '369',
                guild: {
                    channels: {
                        cache: {
                            find: jest.fn(predicate => {
                                if (predicate(mockAfkChannel)) {
                                    return mockAfkChannel;
                                }
                                if (predicate(otherMockChannel)) {
                                    return otherMockChannel;
                                }
                                return null;
                            }),
                        },
                    },
                },
                client: mockClient,
            };
        });

        test('should move prisoner to afk channel', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(true);

            // Act
            await voiceStateUpdated.execute(oldState, newState);

            // Assert
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(newState.member.voice.setChannel).toHaveBeenCalledWith(mockAfkChannel);
            expect(logger.info).toHaveBeenCalledWith('Moved "Prisoner" into the prison.',
            );
        });

        test('should use user tag, if member nickname is null', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(true);
            newState.member.nickname = null;

            // Act
            await voiceStateUpdated.execute(oldState, newState);

            // Assert
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(newState.member.voice.setChannel).toHaveBeenCalledWith(mockAfkChannel);
            expect(logger.info).toHaveBeenCalledWith('Moved "PrisonerTag" into the prison.',
            );
        });

        test('should do nothing if user is no prisoner', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(false);

            // Act
            await voiceStateUpdated.execute(oldState, newState);

            // Assert
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(newState.member.voice.setChannel).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
        });

        test('should do nothing if user is already in prison', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(true);
            newState.channelId = '456';

            // Act
            await voiceStateUpdated.execute(oldState, newState);

            // Assert
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(newState.member.voice.setChannel).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
        });

        test('should do nothing if newState is null', async () => {
            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(config.getAfkChannelId).not.toHaveBeenCalled();
            expect(newState.member.voice.setChannel).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
        });

        test('should handle missing afkChannel', async () => {
            // Arrange
            data.isPrisoner.mockReturnValue(true);
            config.getAfkChannelId.mockReturnValue(null);

            // Act
            await voiceStateUpdated.execute(oldState, newState);

            // Assert
            expect(config.getAfkChannelId).toHaveBeenCalledTimes(1);
            expect(newState.member.voice.setChannel).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Could not find AFK channel with id'),
            );
        });
    });

    describe('Bot disconnect', () => {
        // Setup
        beforeEach(() => {
            mockPlayer = {
                voiceChannel: '123',
                disconnect: jest.fn().mockReturnValue({
                    destroy: jest.fn().mockResolvedValue(undefined),
                }),
            };

            mockClient = {
                riffy: {
                    players: {
                        get: jest.fn().mockReturnValue(mockPlayer),
                    },
                },
            };

            oldState = {
                channelId: '123',
                channel: {
                    members: {
                        size: 1,
                    },
                    name: 'TestChannel',
                },
                guild: {
                    id: '789',
                },
                client: mockClient,
            };
        });

        test('should disconnect the bot, if channel is empty', async () => {
            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(mockPlayer.disconnect).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith('Leaving TestChannel, because no one\'s in there.');
        });

        test('should do nothing, if event was in different channel', async () => {
            // Arrange
            oldState.channelId = '321';

            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(mockPlayer.disconnect).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });

        test('should do nothing, if people are still in channel', async () => {
            // Arrange
            oldState.channel.members.size = 2;

            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(mockPlayer.disconnect).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });

        test('should do nothing, if bot is not in a voice channel', async () => {
            // Arrange
            mockPlayer.voiceChannel = null;

            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(mockPlayer.disconnect).not.toHaveBeenCalled();
            expect(logger.info).not.toHaveBeenCalled();
        });

        test('should handle missing disconnect', async () => {
            // Arrange
            mockPlayer.disconnect = null;

            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(mockPlayer.disconnect).toBeNull();
            expect(logger.info).toHaveBeenCalledWith('Leaving TestChannel, because no one\'s in there.');
        });

        test('should handle missing destroy', async () => {
            // Arrange
            mockPlayer.disconnect.mockReturnValue({
                destroy: null,
            });

            // Act
            await voiceStateUpdated.execute(oldState, null);

            // Assert
            expect(mockPlayer.disconnect).toHaveBeenCalledTimes(1);
            expect(mockPlayer.disconnect.mock.results[0].value.destroy).toBeNull();
            expect(logger.info).toHaveBeenCalledWith('Leaving TestChannel, because no one\'s in there.');
        });
    });
});