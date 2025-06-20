// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const util = require('../../src/util/util');
const config = require('../../src/util/config');
const { buildEmbed } = require('../../src/util/embedBuilder');
const play = require('../../src/commands/play');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    getPlaylist: jest.fn(),
    editInteractionReply: jest.fn(),
    formatDuration: jest.fn(),
    getOrCreatePlayer: jest.fn(),
    validateUserInSameVoiceChannel: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getLavalinkConfig: jest.fn(),
    getLavalinkNotConnectedMessage: jest.fn(),
    getDeafenInVoiceChannel: jest.fn(),
    getPlaylistAddedTitle: jest.fn(),
    getSongAddedTitle: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

function generateLongPlaylist() {
    const tracks = [];
    for (let i = 0; i < 510; i++) {
        tracks.push({
            info: {
                title: `testSong${i + 1}`,
                requester: null,
                length: 1000,
                uri: `https://www.testUri.com/testSong${i + 1}.mp3`,
                thumbnail: {},
            },
        });
    }
    return tracks;
}

describe('play', () => {
    test('should have required properties', () => {
        // Assert
        expect(play).toHaveProperty('guild', true);
        expect(play).toHaveProperty('dm', false);
        expect(play).toHaveProperty('vc', true);
        expect(play).toHaveProperty('data');
        expect(play).toHaveProperty('help');
        expect(play.help).toHaveProperty('usage');
        expect(play.data).toHaveProperty('name', 'play');
        expect(play.data).toHaveProperty('description');
        expect(play.data.options).toHaveLength(2);
        expect(play.data.options[0]).toHaveProperty('name', 'song');
        expect(play.data.options[0]).toHaveProperty('description');
        expect(play.data.options[0]).toHaveProperty('type', 3);
        expect(play.data.options[0]).toHaveProperty('required', true);
        expect(play.data.options[1]).toHaveProperty('name', 'shuffle');
        expect(play.data.options[1]).toHaveProperty('description');
        expect(play.data.options[1]).toHaveProperty('type', 5);
        expect(play.data.options[1]).toHaveProperty('required', false);
    });

    describe('execute', () => {
        let mockTrack;
        let mockPlayer;
        let mockClient;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockTrack = {
                info: {
                    title: 'testSong',
                    requester: null,
                    length: 1000,
                    uri: 'https://www.testUri.com/testSong.mp3',
                    thumbnail: {},
                },
            };

            mockPlayer = {
                voiceChannel: '456',
                playing: false,
                paused: false,
                current: {},
                node: {
                    host: 'localhost',
                },
                queue: {
                    add: jest.fn(),
                },
                play: jest.fn(),
                pause: jest.fn(),
                destroy: jest.fn(),
            };

            mockClient = {
                riffy: {
                    resolve: jest.fn().mockReturnValue({
                        loadType: 'track',
                        tracks: {
                            length: 1,
                            shift: jest.fn().mockReturnValue(mockTrack),
                            map: jest.fn().mockReturnValue([mockTrack]),
                            forEach: jest.fn((callback) => callback(mockTrack)),
                        },
                        playlistInfo: null,
                    }),
                },
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                options: {
                    getString: jest.fn().mockReturnValue('https://www.testUri.com/testSong.mp3'),
                    getBoolean: jest.fn().mockReturnValue(false),
                },
                client: mockClient,
                member: {
                    voice: {
                        channel: {
                            id: '456',
                        },
                    },
                },
                channel: {
                    id: '369',
                },
                guildId: '123',
                guild: {
                    name: 'Test',
                },
                reply: jest.fn(),
            };

            util.getPlaylist.mockReturnValue({
                items: [{
                    snippet: {
                        localized: {
                            title: 'playlistTitle',
                        },
                        thumbnails: {
                            standard: {
                                url: 'https://www.testUri.com/playlistThumbnail.jpg',
                            },
                        },
                    },
                }],
            });
            util.formatDuration.mockReturnValue('1:00');
            buildEmbed.mockReturnValue({ test: 'test' });
            util.getOrCreatePlayer.mockReturnValue(mockPlayer);
            util.validateUserInSameVoiceChannel.mockReturnValue(true);
            config.getLavalinkConfig.mockReturnValue({ host: 'localhost' });
            config.getLavalinkNotConnectedMessage.mockReturnValue('Lavalink is not connected.');
            config.getDeafenInVoiceChannel.mockReturnValue(true);
            config.getPlaylistAddedTitle.mockReturnValue('Playlist added');
            config.getSongAddedTitle.mockReturnValue('Song added');
        });

        describe('Single song', () => {
            test('should add song to queue', async () => {
                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Suche "https://www.testUri.com/testSong.mp3" ...');
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/testSong.mp3',
                    requester: mockInteraction.member,
                }));
                expect(mockTrack.info.requester).toBe(mockInteraction.member);
                expect(mockPlayer.queue.add).toHaveBeenCalledWith(expect.objectContaining({
                    info: expect.objectContaining({
                        uri: 'https://www.testUri.com/testSong.mp3',
                    }),
                }));
                expect(logger.info).toHaveBeenCalledWith('testUser added the song "testSong" to the queue.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.play).toHaveBeenCalled();
            });

            test('should not start player, if player is running', async () => {
                // Arrange
                mockPlayer.playing = true;

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Suche "https://www.testUri.com/testSong.mp3" ...');
                expect(logger.info).toHaveBeenCalledWith('testUser added the song "testSong" to the queue.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.play).not.toHaveBeenCalled();
            });

            test('should resume player if paused', async () => {
                // Arrange
                mockPlayer.playing = true;
                mockPlayer.paused = true;

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Suche "https://www.testUri.com/testSong.mp3" ...');
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/testSong.mp3',
                    requester: mockInteraction.member,
                }));
                expect(mockTrack.info.requester).toBe(mockInteraction.member);
                expect(mockPlayer.queue.add).toHaveBeenCalledWith(expect.objectContaining({
                    info: expect.objectContaining({
                        uri: 'https://www.testUri.com/testSong.mp3',
                    }),
                }));
                expect(logger.info).toHaveBeenCalledWith('testUser added the song "testSong" to the queue.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.pause).toHaveBeenCalledWith(false);
            });

            test('should use fallback values if track does not provide them', async () => {
                // Arrange
                mockTrack.info.title = null;
                mockTrack.info.length = null;
                mockTrack.info.uri = null;
                mockClient.riffy.resolve.mockReturnValue({
                    loadType: 'search',
                    tracks: {
                        length: 1,
                        shift: jest.fn().mockReturnValue(mockTrack),
                    },
                    playlistInfo: null,
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith('Suche "https://www.testUri.com/testSong.mp3" ...');
                expect(logger.info).toHaveBeenCalledWith('testUser added the song "Unbekannter Name" to the queue.');
                expect(util.formatDuration).toHaveBeenCalledWith(0);
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    description: expect.stringContaining('**Unbekannter Name**'),
                }));
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object)],
                    }),
                );
            });
        });

        describe('Playlist', () => {
            let mockTracks;

            beforeEach(() => {
                mockTracks = [
                    {
                        info: {
                            title: 'testSong1',
                            requester: null,
                            length: 1000,
                            uri: 'https://www.testUri.com/testSong1.mp3',
                            thumbnail: {},
                        },
                    },
                    {
                        info: {
                            title: 'testSong2',
                            requester: null,
                            length: 1000,
                            uri: 'https://www.testUri.com/testSong1.mp3',
                            thumbnail: {},
                        },
                    },
                    {
                        info: {
                            title: 'testSong3',
                            requester: null,
                            length: 1000,
                            uri: 'https://www.testUri.com/testSong1.mp3',
                            thumbnail: {},
                        },
                    },
                ];

                mockClient.riffy.resolve.mockReturnValue({
                    loadType: 'playlist',
                    tracks: {
                        length: 3,
                        shift: jest.fn().mockReturnValue(mockTrack),
                        map: jest.fn().mockReturnValue(mockTracks),
                        [Symbol.iterator]: function* () {
                            for (let i = 0; i < this.length; i++) {
                                yield mockTracks[i];
                            }
                        },
                    },
                    playlistInfo: {
                        name: 'testPlaylistName',
                    },
                });

                mockInteraction.options.getString.mockReturnValue('https://www.testUri.com/list=testPlaylist');
            });

            test('should add song from playlist to queue', async () => {
                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/list=testPlaylist',
                    requester: mockInteraction.member,
                }));
                expect(mockPlayer.queue.add).toHaveBeenCalledTimes(3);
                expect(util.getPlaylist).toHaveBeenCalledWith('testPlaylist');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "playlistTitle" to the queue.',
                );
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    color: 0x000aff,
                    title: 'Playlist added',
                    description: expect.stringContaining('**playlistTitle**'),
                    image: 'https://www.testUri.com/playlistThumbnail.jpg',
                }));
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.play).toHaveBeenCalled();
            });

            test('should use fallback values if playlist does not provide them', async () => {
                // Arrange
                util.getPlaylist.mockReturnValue({
                    items: [{
                        snippet: {
                            localized: {
                                title: null,
                            },
                            thumbnails: {
                                standard: {
                                    url: null,
                                },
                            },
                        },
                    }],
                });
                mockClient.riffy.resolve.mockReturnValue({
                    loadType: 'playlist',
                    tracks: {
                        length: 3,
                        shift: jest.fn().mockReturnValue(mockTrack),
                        map: jest.fn().mockReturnValue(mockTracks),
                        [Symbol.iterator]: function* () {
                            for (let i = 0; i < this.length; i++) {
                                yield mockTracks[i];
                            }
                        },
                    },
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/list=testPlaylist',
                    requester: mockInteraction.member,
                }));
                expect(mockPlayer.queue.add).toHaveBeenCalledTimes(3);
                expect(util.getPlaylist).toHaveBeenCalledWith('testPlaylist');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "Playlist" to the queue.',
                );
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    color: 0x000aff,
                    title: 'Playlist added',
                    description: expect.stringContaining('**Playlist**'),
                    image: 'https://www.testUri.com/testSong1.mp3',
                }));
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from Playlist playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.play).toHaveBeenCalled();
            });

            test('should handle empty playlist data', async () => {
                // Arrange
                util.getPlaylist.mockReturnValue({
                    items: null,
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/list=testPlaylist',
                    requester: mockInteraction.member,
                }));
                expect(mockPlayer.queue.add).toHaveBeenCalledTimes(3);
                expect(util.getPlaylist).toHaveBeenCalledWith('testPlaylist');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "testPlaylistName" to the queue.',
                );
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    color: 0x000aff,
                    title: 'Playlist added',
                    description: expect.stringContaining('**testPlaylistName**'),
                    image: 'https://www.testUri.com/testSong1.mp3',
                }));
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.play).toHaveBeenCalled();
            });

            test('should handle no playlist id', async () => {
                // Arrange
                mockInteraction.options.getString.mockReturnValue('https://www.testUri.com/stuff');

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/stuff" ...',
                );
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/stuff',
                    requester: mockInteraction.member,
                }));
                expect(mockPlayer.queue.add).toHaveBeenCalledTimes(3);
                expect(util.getPlaylist).not.toHaveBeenCalled();
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "testPlaylistName" to the queue.',
                );
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    color: 0x000aff,
                    title: 'Playlist added',
                    description: expect.stringContaining('**testPlaylistName**'),
                    image: 'https://www.testUri.com/testSong1.mp3',
                }));
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });

            test('should handle no image', async () => {
                // Arrange
                mockInteraction.options.getString.mockReturnValue('https://www.testUri.com/stuff');
                mockTracks = [
                    {
                        info: {
                            title: 'testSong1',
                            requester: null,
                            length: 1000,
                            thumbnail: {},
                        },
                    },
                    {
                        info: {
                            title: 'testSong2',
                            requester: null,
                            length: 1000,
                            uri: 'https://www.testUri.com/testSong1.mp3',
                            thumbnail: {},
                        },
                    },
                    {
                        info: {
                            title: 'testSong3',
                            requester: null,
                            length: 1000,
                            uri: 'https://www.testUri.com/testSong1.mp3',
                            thumbnail: {},
                        },
                    },
                ];
                mockClient.riffy.resolve.mockReturnValue({
                    loadType: 'playlist',
                    tracks: {
                        length: 3,
                        shift: jest.fn().mockReturnValue(mockTrack),
                        map: jest.fn().mockReturnValue(mockTracks),
                        [Symbol.iterator]: function* () {
                            for (let i = 0; i < this.length; i++) {
                                yield mockTracks[i];
                            }
                        },
                    },
                    playlistInfo: {
                        name: 'testPlaylistName',
                    },
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/stuff" ...',
                );
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/stuff',
                    requester: mockInteraction.member,
                }));
                expect(mockPlayer.queue.add).toHaveBeenCalledTimes(3);
                expect(util.getPlaylist).not.toHaveBeenCalled();
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "testPlaylistName" to the queue.',
                );
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    color: 0x000aff,
                    title: 'Playlist added',
                    description: expect.stringContaining('**testPlaylistName**'),
                    image: null,
                }));
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });

            test('should resume player if paused', async () => {
                // Arrange
                mockPlayer.playing = true;
                mockPlayer.paused = true;

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(mockClient.riffy.resolve).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'https://www.testUri.com/list=testPlaylist',
                    requester: mockInteraction.member,
                }));
                expect(mockPlayer.queue.add).toHaveBeenCalledTimes(3);
                expect(util.getPlaylist).toHaveBeenCalledWith('testPlaylist');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "playlistTitle" to the queue.',
                );
                expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                    color: 0x000aff,
                    title: 'Playlist added',
                    description: expect.stringContaining('**playlistTitle**'),
                    image: 'https://www.testUri.com/playlistThumbnail.jpg',
                }));
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.pause).toHaveBeenCalledWith(false);
            });

            test('should not start player, if player is running', async () => {
                // Arrange
                mockPlayer.playing = true;

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "playlistTitle" to the queue.',
                );
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
                expect(mockPlayer.play).not.toHaveBeenCalled();
            });

            test('should shuffle tracks when set to true', async () => {
                // Arrange
                mockInteraction.options.getBoolean.mockReturnValue(true);

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(logger.info).toHaveBeenCalledWith('Shuffled playlist with 3 tracks.');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "playlistTitle" to the queue.',
                );
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });

            test('should not shuffle tracks when no bool is set', async () => {
                // Arrange
                mockInteraction.options.getBoolean.mockReturnValue(null);

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(logger.info).not.toHaveBeenCalledWith('Shuffled playlist with 3 tracks.');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "playlistTitle" to the queue.',
                );
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });

            test('should only load 500 songs max', async () => {
                // Arrange
                mockTracks = generateLongPlaylist();
                mockClient.riffy.resolve.mockReturnValue({
                    loadType: 'playlist',
                    tracks: {
                        length: 510,
                        shift: jest.fn().mockReturnValue(mockTrack),
                        map: jest.fn().mockReturnValue(mockTracks),
                        [Symbol.iterator]: function* () {
                            for (let i = 0; i < this.length; i++) {
                                yield mockTracks[i];
                            }
                        },
                    },
                    playlistInfo: {
                        name: 'testPlaylistName',
                    },
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(logger.warn).toHaveBeenCalledWith('Playlist has 510 tracks, limiting to 500.');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" added the playlist "playlistTitle" to the queue.',
                );
                expect(logger.info).toHaveBeenCalledWith('Added 500 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });

            test('should handle error while adding playlist song', async () => {
                // Arrange
                mockPlayer.queue.add.mockImplementationOnce(() => {
                    throw new Error('test');
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(logger.warn).toHaveBeenCalledWith('Failed to add track to queue: test');
                expect(logger.info).toHaveBeenCalledWith('Added 2 songs from testPlaylistName playlist.');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });

            test('should handle error when fetching playlist details', async () => {
                // Arrange
                util.getPlaylist.mockImplementationOnce(() => {
                    throw new Error('test');
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(
                    'Suche "https://www.testUri.com/list=testPlaylist" ...',
                );
                expect(logger.info).toHaveBeenCalledWith('Added 3 songs from testPlaylistName playlist.');
                expect(logger.warn).toHaveBeenCalledWith('Failed to fetch playlist data: test');
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: '',
                        embeds: [expect.any(Object)],
                        components: [expect.any(Object), expect.any(Object)],
                    }),
                );
            });
        });

        describe('Error handling', () => {
            test('should handle lavalink not connected', async () => {
                // Arrange
                util.getOrCreatePlayer.mockReturnValue(null);

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    content: config.getLavalinkNotConnectedMessage(),
                }));
                expect(mockClient.riffy.resolve).not.toHaveBeenCalled();
                expect(mockPlayer.queue.add).not.toHaveBeenCalled();
            });

            test('should handle user in different channel, while bot is playing', async () => {
                // Arrange
                util.validateUserInSameVoiceChannel.mockReturnValue(false);

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(logger.info).toHaveBeenCalledWith('Bot is not in same channel as "testUser"');
                expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                    content: 'Der Bot wird in einem anderen Channel verwendet!',
                    flags: MessageFlags.Ephemeral,
                }));
                expect(mockClient.riffy.resolve).not.toHaveBeenCalled();
                expect(mockPlayer.queue.add).not.toHaveBeenCalled();
            });

            test('should handle missing song query', async () => {
                // Arrange
                mockInteraction.options.getString.mockReturnValue(null);

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(logger.info).toHaveBeenCalledWith(
                    '"testUser" didn\'t specify a song when using the play command.',
                );
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    expect.objectContaining({
                        content: 'Bitte gib einen Link oder Text für den Song an!',
                        flags: MessageFlags.Ephemeral,
                    }),
                );
                expect(mockClient.riffy.resolve).not.toHaveBeenCalled();
                expect(mockPlayer.queue.add).not.toHaveBeenCalled();
            });

            test('should handle no song result', async () => {
                // Arrange
                mockClient.riffy.resolve.mockReturnValue({
                    loadType: 'NONE',
                    tracks: null,
                    playlistInfo: null,
                });

                // Act
                await play.execute(mockInteraction);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Handling play command used by "testUser".');
                expect(logger.info).toHaveBeenCalledWith(
                    'Could not find result for given query: https://www.testUri.com/testSong.mp3',
                );
                expect(util.editInteractionReply).toHaveBeenCalledWith(
                    mockInteraction,
                    'Es konnte leider kein Song für deine Anfrage gefunden werden!',
                );
                expect(mockPlayer.queue.add).not.toHaveBeenCalled();
            });
        });
    });
});