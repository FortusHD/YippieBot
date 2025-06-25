// Mock
jest.mock('../../src/logging/logger', () => ({
    error: jest.fn(),
}));
jest.mock('config', () => ({
    get: jest.fn(),
}));
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

const setupMocks = () => {
    jest.resetAllMocks();
    jest.resetModules();
};

const setupProcessExitMock = () => {
    return jest.spyOn(process, 'exit').mockImplementation(() => {});
};

describe('Config and Environment Validation', () => {
    describe('validateEnv', () => {
        // Setup
        let processExitMock;

        beforeEach(() => {
            setupMocks();
            delete require.cache[require.resolve('../../src/util/config')];
            processExitMock = setupProcessExitMock();
        });

        test('should exit when env variables are missing', () => {
            // Arrange
            require('dotenv').config.mockImplementation(() => ({ parsed: { } }));

            // Act
            require('../../src/util/config');

            // Assert
            expect(processExitMock).toHaveBeenCalledWith(1);
            expect(processExitMock).toHaveBeenCalledTimes(1);
        });

        test('should not exit when all env variables are present', () => {
            // Arrange
            require('dotenv').config.mockImplementation(() => {
                process.env = {
                    APP_ENV: 'dev',
                    BOT_TOKEN_DEV: 'value',
                    BOT_CLIENT_ID_DEV: 'value',
                    BOT_TOKEN_PROD: 'value',
                    BOT_CLIENT_ID_PROD: 'value',
                    GOOGLE_KEY: 'value',
                    LAVALINK_HOST: 'value',
                    LAVALINK_PORT: 'value',
                    LAVALINK_PW: 'value',
                };
                return { parsed: process.env };
            });

            // Act
            require('../../src/util/config');

            // Assert
            expect(processExitMock).not.toHaveBeenCalled();
        });
    });

    describe('config module', () => {
        // Setup
        let config;
        let mockConfig;

        beforeEach(() => {
            setupMocks();
            delete require.cache[require.resolve('../../src/util/config')];
            config = require('../../src/util/config');
            mockConfig = require('config');
        });

        describe('getEnv', () => {
            test.each([
                { key: 'TEST_KEY', value: 'test-value', default: 'default', expected: 'test-value' },
                { key: 'NONEXISTENT_KEY', value: undefined, default: 'default-value', expected: 'default-value' },
                { key: 'NONEXISTENT_KEY', value: undefined, default: undefined, expected: undefined },
            ])('should return correct value for $key', ({ key, value, default: defaultValue, expected }) => {
                // Arrange
                process.env[key] = value;

                // Act
                const result = config.getEnv(key, defaultValue);

                // Assert
                expect(result).toBe(expected);
            });
        });

        describe('getYoutubeApiUrl', () => {
            // Setup
            beforeEach(() => {
                mockConfig.get.mockImplementation((path) => {
                    const paths = {
                        'api.youtube.baseUrl': 'https://www.googleapis.com/youtube/v3',
                        'api.youtube.searchEndpoint': '/search',
                        'api.youtube.videosEndpoint': '/videos',
                        'api.youtube.playlistsEndpoint': '/playlists',
                        'api.youtube.searchParams': 'key=YOUR_API_KEY&type=video',
                        'api.youtube.videosParams': 'key=YOUR_API_KEY',
                        'api.youtube.playlistsParams': 'key=YOUR_API_KEY',
                    };
                    return paths[path];
                });
            });

            test.each([
                { endpoint: 'search', params: { q: 'test', maxResults: '25' }, expectedPart: 'search?' },
                { endpoint: 'videos', params: { part: 'snippet', id: 'test123' }, expectedPart: 'videos?' },
                { endpoint: 'playlists', params: {}, expectedPart: 'playlists?' },
            ])('should construct $endpoint URL correctly', ({ endpoint, params, expectedPart }) => {
                // Act
                const result = config.getYoutubeApiUrl(endpoint, params);

                // Assert
                expect(result).toContain(expectedPart);
                expect(mockConfig.get).toHaveBeenCalled();
            });
        });

        describe('getDatabase', () => {
            // Setup
            const originalEnv = { ...process.env };

            afterEach(() => {
                process.env = originalEnv;
            });

            test.each([
                { envVars: {}, expected: { host: 'localhost', user: 'root', password: '' } },
                {
                    envVars: {
                        DB_HOST: 'custom.host',
                        DB_USER: 'some_user',
                        DB_PASSWORD: 'password',
                    },
                    expected: { host: 'custom.host', user: 'some_user', password: 'password' },
                },
            ])('should return correct database config', ({ envVars, expected }) => {
                // Arrange
                process.env = { ...envVars };

                // Assert
                expect(config.getDatabase()).toEqual(expected);
            });
        });

        describe('getLavalinkConfig', () => {
            // Setup
            const originalEnv = { ...process.env };

            afterEach(() => {
                process.env = originalEnv;
            });

            test.each([
                { envVars: {}, expected: { host: 'localhost', port: 2333, password: '', secure: false } },
                {
                    envVars: {
                        LAVALINK_HOST: 'custom.host',
                        LAVALINK_PORT: '8080',
                        LAVALINK_PW: 'password',
                        LAVALINK_SECURE: 'true',
                    },
                    expected: { host: 'custom.host', port: 8080, password: 'password', secure: true },
                },
            ])('should return correct Lavalink config', ({ envVars, expected }) => {
                // Arrange
                process.env = { ...envVars };

                // Assert
                expect(config.getLavalinkConfig()).toEqual(expected);
            });
        });

        describe('getLavalinkSearch', () => {
            test.each([
                { configValue: undefined, expected: 'ytsearch' },
                { configValue: 'scsearch', expected: 'scsearch' },
            ])('should return $expected for search platform', ({ configValue, expected }) => {
                // Arrange
                mockConfig.get.mockReturnValue(configValue);

                // Assert
                expect(config.getLavalinkSearch()).toEqual(expected);
            });
        });

        describe('getLavalinkRest', () => {
            // Setup
            beforeEach(() => {
                jest.clearAllMocks();
            });

            test.each([
                {
                    configValue: undefined,
                    expected: 'v4',
                    description: 'returns default rest version when not configured',
                },
                { configValue: 'v3', expected: 'v3', description: 'returns configured rest version' },
            ])('$description', ({ configValue, expected }) => {
                // Arrange
                mockConfig.get.mockImplementation(() => configValue);

                // Act
                const result = config.getLavalinkRest();

                // Assert
                expect(result).toBe(expected);
                expect(mockConfig.get).toHaveBeenCalledWith('lavalink.restVersion');
            });
        });

        describe('getDiscord', () => {
            // Setup
            beforeEach(() => {
                jest.clearAllMocks();

                mockConfig.get.mockImplementation((path) => {
                    const configMap = {
                        'discord.guild.id': '1176213369378',
                        'discord.users.admin': '8468456407876',
                        'discord.channels.afk': '3216213369378',
                        'discord.channels.wichtel': '2132133693782',
                        'discord.channels.role': '1378084687791',
                        'discord.channels.bobby': '2106347624848',
                        'discord.roles.drachi': '1245200946547',
                        'discord.roles.free': '3501876484567',
                        'discord.roles.nsfw': '4896105468475',
                        'discord.roles.bobby': '1350186794613',
                        'discord.emojis.drachi': '5648431860876',
                        'discord.emojis.free': '7643464643123',
                        'discord.emojis.nsfw': '9485647078645',
                        'discord.emojis.bobby': '2354105404846',
                        'discord.bot.deafenInVoiceChannel': true,
                    };
                    if (!(path in configMap)) {
                        throw new Error(`Unexpected config path: ${path}`);
                    }
                    return configMap[path];
                });
            });

            test.each([
                { method: 'getGuildId', key: 'discord.guild.id', expected: '1176213369378' },
                { method: 'getAdminUserId', key: 'discord.users.admin', expected: '8468456407876' },
                { method: 'getAfkChannelId', key: 'discord.channels.afk', expected: '3216213369378' },
                { method: 'getWichtelChannelId', key: 'discord.channels.wichtel', expected: '2132133693782' },
                { method: 'getRoleChannelId', key: 'discord.channels.role', expected: '1378084687791' },
                { method: 'getBobbyChannelId', key: 'discord.channels.bobby', expected: '2106347624848' },
                { method: 'getDrachiRoleId', key: 'discord.roles.drachi', expected: '1245200946547' },
                { method: 'getFreeRoleId', key: 'discord.roles.free', expected: '3501876484567' },
                { method: 'getNsfwRoleId', key: 'discord.roles.nsfw', expected: '4896105468475' },
                { method: 'getBobbyRoleId', key: 'discord.roles.bobby', expected: '1350186794613' },
                { method: 'getDrachiEmojiId', key: 'discord.emojis.drachi', expected: '5648431860876' },
                { method: 'getFreeEmojiId', key: 'discord.emojis.free', expected: '7643464643123' },
                { method: 'getNsfwEmojiId', key: 'discord.emojis.nsfw', expected: '9485647078645' },
                { method: 'getBobbyEmojiId', key: 'discord.emojis.bobby', expected: '2354105404846' },
                { method: 'getDeafenInVoiceChannel', key: 'discord.bot.deafenInVoiceChannel', expected: true },
            ])('should return $expected for $key', ({ method, key, expected }) => {
                // Act
                const result = config[method]();

                // Assert
                expect(result).toBe(expected);
                expect(mockConfig.get).toHaveBeenCalledWith(key);
            });
        });

        describe('getUi', () => {
            // Setup
            beforeEach(() => {
                jest.clearAllMocks();

                mockConfig.get.mockImplementation((path) => {
                    const configMap = {
                        'ui.embeds.titles.playlistAdded': 'message1',
                        'ui.embeds.titles.songAdded': 'message2',
                        'ui.embeds.messages.adminCookieNotification': 'message3',
                    };
                    if (!(path in configMap)) {
                        throw new Error(`Unexpected config path: ${path}`);
                    }
                    return configMap[path];
                });
            });

            test.each([
                { method: 'getPlaylistAddedTitle', key: 'ui.embeds.titles.playlistAdded', expected: 'message1' },
                { method: 'getSongAddedTitle', key: 'ui.embeds.titles.songAdded', expected: 'message2' },
                {
                    method: 'getAdminCookieNotificationMessage',
                    key: 'ui.embeds.messages.adminCookieNotification',
                    expected: 'message3',
                },
            ])('should return $expected for $key', ({ method, key, expected }) => {
                // Act
                const result = config[method]();

                // Assert
                expect(result).toBe(expected);
                expect(mockConfig.get).toHaveBeenCalledWith(key);
            });
        });

        describe('getHttp', () => {
            // Setup
            beforeEach(() => {
                jest.clearAllMocks();

                mockConfig.get.mockImplementation((path) => {
                    const configMap = {
                        'http.port': 1111,
                    };
                    if (!(path in configMap)) {
                        throw new Error(`Unexpected config path: ${path}`);
                    }
                    return configMap[path];
                });
            });

            test.each([
                { mockValue: 1111, description: 'should return http port', expected: 1111 },
                { mockValue: null, description: 'should return default http port', expected: 7635 },
            ])('$description', ({ mockValue, expected }) => {
                // Arrange
                mockConfig.get.mockImplementation(() => mockValue);

                // Act
                const result = config.getHttpPort();

                // Assert
                expect(result).toBe(expected);
                expect(mockConfig.get).toHaveBeenCalledWith('http.port');
            });
        });

        describe('getLavalinkNotConnectedMessage', () => {
            // Setup
            beforeEach(() => {
                jest.clearAllMocks();
            });

            test.each([
                {
                    description: 'should return formatted message with admin user ID',
                    mockMessage: 'Lavalink is not connected. Please contact <@{adminUserId}>',
                    mockAdminId: '123456789',
                    expected: 'Lavalink is not connected. Please contact <@123456789>',
                },
                {
                    description: 'should handle different message formats',
                    mockMessage: 'Server error: {adminUserId} needs to check Lavalink',
                    mockAdminId: '987654321',
                    expected: 'Server error: 987654321 needs to check Lavalink',
                },
                {
                    description: 'should handle empty message',
                    mockMessage: '',
                    mockAdminId: '123456789',
                    expected: '',
                },
            ])('$description', ({ mockMessage, mockAdminId, expected }) => {
                // Arrange
                mockConfig.get.mockImplementation((path) => {
                    switch (path) {
                    case 'ui.embeds.messages.lavalinkNotConnected':
                        return mockMessage;
                    case 'discord.users.admin':
                        return () => mockAdminId;
                    default:
                        return undefined;
                    }
                });

                // Act
                const result = config.getLavalinkNotConnectedMessage();

                // Assert
                expect(result).toBe(expected);
                expect(mockConfig.get).toHaveBeenCalledWith('ui.embeds.messages.lavalinkNotConnected');
                expect(mockConfig.get).toHaveBeenCalledWith('discord.users.admin');
            });
        });
    });
});