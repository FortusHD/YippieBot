// Imports
const logger = require('../../src/logging/logger.js');
const { buildCurrentSongPos } = require('../../src/util/util');
const { buildEmbed } = require('../../src/util/embedBuilder');
const nowPlaying = require('../../src/commands/nowPlaying');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildCurrentSongPos: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

describe('nowPlaying', () => {
    test('should have required properties', () => {
        // Assert
        expect(nowPlaying).toHaveProperty('guild', true);
        expect(nowPlaying).toHaveProperty('dm', false);
        expect(nowPlaying).toHaveProperty('player', true);
        expect(nowPlaying).toHaveProperty('help');
        expect(nowPlaying.help).toHaveProperty('usage');
        expect(nowPlaying).toHaveProperty('data');
        expect(nowPlaying.data).toHaveProperty('name', 'np');
        expect(nowPlaying.data).toHaveProperty('description');
        expect(nowPlaying.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = {
                current: {
                    info: {
                        title: 'testSong',
                        requester: {
                            id: '123456789',
                            user: {
                                tag: 'testUser',
                            },
                        },
                        length: 1000,
                        uri: 'https://www.testUri.com/testSong.mp3',
                        thumbnail: 'https://www.testUri.com/testSong.png',
                    },
                },
                position: 100,
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                guildId: '123',
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

        test('should send current song embed', async () => {
            // Act
            await nowPlaying.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling nowPlaying command used by "testUser".');
            expect(buildCurrentSongPos).toHaveBeenCalledWith(mockPlayer.position, mockPlayer.current.info.length);
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                color: 0x000aff,
                title: expect.stringContaining('testSong'),
                description: expect.stringContaining('123456789'),
                origin: expect.any(String),
                thumbnail: expect.any(String),
            }));
            expect(logger.info).toHaveBeenCalledWith('testSong is now playing. This song was requested by "testUser"');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
                components: [expect.any(Object)],
            });
        });

        test('should send no song message, if no song is playing', async () => {
            // Arrange
            mockPlayer.current = null;

            // Act
            await nowPlaying.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling nowPlaying command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('Nothing playing right now.');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Gerade spielt nichts.');
            expect(buildCurrentSongPos).not.toHaveBeenCalled();
            expect(buildEmbed).not.toHaveBeenCalled();
        });
    });
});