/**
 * Tests for the config utility module
 *
 * @group util
 * @group config
 */

// Imports
const configBuildIn = require('config');
const config = require('../../src/util/config');

// Mock dependencies
jest.mock('config', () => ({
    get: jest.fn(),
}));

describe('getEnv', () => {
    const originalEnv = process.env;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        process.env = {};
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('returns environment variable when it exists', () => {
        // Arrange
        process.env.TEST_KEY = 'test-value';

        // Act
        const result = config.getEnv('TEST_KEY', 'default');

        // Assert
        expect(result).toBe('test-value');
    });

    test('returns default value when environment variable does not exist', () => {
        // Act
        const result = config.getEnv('NONEXISTENT_KEY', 'default-value');

        // Assert
        expect(result).toBe('default-value');
    });

    test('returns undefined when no default value is provided and env var does not exist', () => {
        // Act
        const result = config.getEnv('NONEXISTENT_KEY');

        // Assert
        expect(result).toBeUndefined();
    });
});

describe('getYoutubeApiUrl', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        configBuildIn.get.mockImplementation((path) => {
            switch (path) {
            case 'api.youtube.baseUrl':
                return 'https://www.googleapis.com/youtube/v3';
            case 'api.youtube.searchEndpoint':
                return '/search';
            case 'api.youtube.videosEndpoint':
                return '/videos';
            case 'api.youtube.playlistsEndpoint':
                return '/playlists';
            case 'api.youtube.searchParams':
                return 'key=YOUR_API_KEY&type=video';
            case 'api.youtube.videosParams':
                return 'key=YOUR_API_KEY';
            case 'api.youtube.playlistsParams':
                return 'key=YOUR_API_KEY';
            default:
                throw new Error(`Unexpected config path: ${path}`);
            }
        });
    });

    test('should construct search URL with parameters', () => {
        // Arrange
        const params = {
            q: 'test video',
            maxResults: '25',
        };

        // Act
        const result = config.getYoutubeApiUrl('search', params);

        // Assert
        expect(result).toMatch(/^https:\/\/www\.googleapis\.com\/youtube\/v3\/search\?/);
        expect(result).toContain('key=YOUR_API_KEY');
        expect(result).toContain('type=video');
        expect(result).toContain('q=test video');
        expect(result).toContain('maxResults=25');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.baseUrl');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.searchEndpoint');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.searchParams');
    });

    test('should construct videos URL with parameters', () => {
        // Arrange
        const params = {
            part: 'snippet',
            id: 'video123',
        };

        // Act
        const result = config.getYoutubeApiUrl('videos', params);

        // Assert
        expect(result).toMatch(/^https:\/\/www\.googleapis\.com\/youtube\/v3\/videos\?/);
        expect(result).toContain('key=YOUR_API_KEY');
        expect(result).toContain('part=snippet');
        expect(result).toContain('id=video123');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.baseUrl');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.videosEndpoint');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.videosParams');
    });

    test('should construct playlists URL with empty parameters', () => {
        // Act
        const result = config.getYoutubeApiUrl('playlists', {});

        // Assert
        expect(result).toBe('https://www.googleapis.com/youtube/v3/playlists?key=YOUR_API_KEY');
        expect(result).toMatch(/^https:\/\/www\.googleapis\.com\/youtube\/v3\/playlists\?/);
        expect(result).toContain('key=YOUR_API_KEY');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.baseUrl');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.playlistsEndpoint');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.playlistsParams');
    });

    test('should handle special characters in parameters', () => {
        // Arrange
        const params = {
            q: 'test & special + characters',
            maxResults: '10',
        };

        // Act
        const result = config.getYoutubeApiUrl('search', params);

        // Assert
        expect(result).toContain('q=test & special + characters');
        expect(result).toContain('maxResults=10');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.baseUrl');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.searchEndpoint');
        expect(configBuildIn.get).toHaveBeenCalledWith('api.youtube.searchParams');
    });

    test('should throw error for invalid endpoint', () => {
        // Arrange
        configBuildIn.get.mockImplementation((path) => {
            if (path === 'api.youtube.baseUrl') {
                return 'https://www.googleapis.com/youtube/v3';
            }
            throw new Error('Invalid configuration path');
        });

        // Assert
        expect(() => {
            config.getYoutubeApiUrl('invalidEndpoint', {});
        }).toThrow();
    });
});

describe('getLavalinkConfig', () => {
    const originalEnv = process.env;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        process.env = {};
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('returns default configuration when no environment variables are set', () => {
        // Act
        const result = config.getLavalinkConfig();

        // Assert
        expect(result).toEqual({
            host: 'localhost',
            port: 2333,
            password: '',
            secure: false,
        });
    });

    test('returns configuration with custom environment variables', () => {
        // Arrange
        process.env.LAVALINK_HOST = 'custom.host';
        process.env.LAVALINK_PORT = '8080';
        process.env.LAVALINK_PW = 'secretpassword';
        process.env.LAVALINK_SECURE = 'true';

        // Act
        const result = config.getLavalinkConfig();

        // Assert
        expect(result).toEqual({
            host: 'custom.host',
            port: 8080,
            password: 'secretpassword',
            secure: true,
        });
    });

    test('handles invalid port number', () => {
        // Arrange
        process.env.LAVALINK_PORT = 'not-a-number';

        // Act
        const result = config.getLavalinkConfig();

        // Assert
        expect(result.port).toBeNaN();
    });

    test('handles different secure flag values', () => {
        const testCases = [
            { input: 'true', expected: true },
            { input: 'false', expected: false },
            { input: 'TRUE', expected: false },
            { input: 'FALSE', expected: false },
            { input: '1', expected: false },
            { input: '0', expected: false },
        ];

        testCases.forEach(({ input, expected }) => {
            // Arrange
            process.env.LAVALINK_SECURE = input;

            // Act
            const result = config.getLavalinkConfig();

            // Assert
            expect(result.secure).toBe(expected);
        });
    });
});

describe('getLavalinkSearch', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns default search platform when not configured', () => {
        // Arrange
        configBuildIn.get.mockImplementation(() => undefined);

        // Act
        const result = config.getLavalinkSearch();

        // Assert
        expect(result).toBe('ytsearch');
        expect(configBuildIn.get).toHaveBeenCalledWith('lavalink.defaultSearchPlatform');
    });

    test('returns configured search platform', () => {
        // Arrange
        configBuildIn.get.mockReturnValue('scsearch');

        // Act
        const result = config.getLavalinkSearch();

        // Assert
        expect(result).toBe('scsearch');
        expect(configBuildIn.get).toHaveBeenCalledWith('lavalink.defaultSearchPlatform');
    });
});

describe('getLavalinkRest', () => {
    test('returns default rest version when not configured', () => {
        // Arrange
        configBuildIn.get.mockImplementation(() => undefined);

        // Act
        const result = config.getLavalinkRest();

        // Assert
        expect(result).toBe('v4');
        expect(configBuildIn.get).toHaveBeenCalledWith('lavalink.restVersion');
    });

    test('returns configured rest version', () => {
        // Arrange
        configBuildIn.get.mockReturnValue('v3');

        // Act
        const result = config.getLavalinkRest();

        // Assert
        expect(result).toBe('v3');
        expect(configBuildIn.get).toHaveBeenCalledWith('lavalink.restVersion');
    });
});

describe('getDiscord', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        configBuildIn.get.mockImplementation((path) => {
            switch (path) {
            case 'discord.guild.id':
                return '1176213369378';
            case 'discord.users.admin':
                return '8468456407876';
            case 'discord.channels.afk':
                return '3216213369378';
            case 'discord.channels.wichtel':
                return '2132133693782';
            case 'discord.channels.role':
                return '1378084687791';
            case 'discord.channels.bobby':
                return '2106347624848';
            case 'discord.roles.drachi':
                return '1245200946547';
            case 'discord.roles.free':
                return '3501876484567';
            case 'discord.roles.nsfw':
                return '4896105468475';
            case 'discord.roles.bobby':
                return '1350186794613';
            case 'discord.emojis.drachi':
                return '5648431860876';
            case 'discord.emojis.free':
                return '7643464643123';
            case 'discord.emojis.nsfw':
                return '9485647078645';
            case 'discord.emojis.bobby':
                return '2354105404846';
            case 'discord.bot.deafenInVoiceChannel':
                return true;
            default:
                throw new Error(`Unexpected config path: ${path}`);
            }
        });
    });

    test('should return guild id', () => {
        // Act
        const result = config.getGuildId();

        // Assert
        expect(result).toBe('1176213369378');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.guild.id');
    });

    test('should return admin user id', () => {
        // Act
        const result = config.getAdminUserId();

        // Assert
        expect(result).toBe('8468456407876');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.users.admin');
    });

    test('should return afk channel id', () => {
        // Act
        const result = config.getAfkChannelId();

        // Assert
        expect(result).toBe('3216213369378');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.channels.afk');
    });

    test('should return wichtel channel id', () => {
        // Act
        const result = config.getWichtelChannelId();

        // Assert
        expect(result).toBe('2132133693782');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.channels.wichtel');
    });

    test('should return role channel id', () => {
        // Act
        const result = config.getRoleChannelId();

        // Assert
        expect(result).toBe('1378084687791');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.channels.role');
    });

    test('should return bobby channel id', () => {
        // Act
        const result = config.getBobbyChannelId();

        // Assert
        expect(result).toBe('2106347624848');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.channels.bobby');
    });

    test('should return drachi role id', () => {
        // Act
        const result = config.getDrachiRoleId();

        // Assert
        expect(result).toBe('1245200946547');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.roles.drachi');
    });

    test('should return free role id', () => {
        // Act
        const result = config.getFreeRoleId();

        // Assert
        expect(result).toBe('3501876484567');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.roles.free');
    });

    test('should return nsfw role id', () => {
        // Act
        const result = config.getNsfwRoleId();

        // Assert
        expect(result).toBe('4896105468475');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.roles.nsfw');
    });

    test('should return bobby role id', () => {
        // Act
        const result = config.getBobbyRoleId();

        // Assert
        expect(result).toBe('1350186794613');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.roles.bobby');
    });

    test('should return drachi emoji id', () => {
        // Act
        const result = config.getDrachiEmojiId();

        // Assert
        expect(result).toBe('5648431860876');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.emojis.drachi');
    });

    test('should return free emoji id', () => {
        // Act
        const result = config.getFreeEmojiId();

        // Assert
        expect(result).toBe('7643464643123');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.emojis.free');
    });

    test('should return nsfw emoji id', () => {
        // Act
        const result = config.getNsfwEmojiId();

        // Assert
        expect(result).toBe('9485647078645');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.emojis.nsfw');
    });

    test('should return bobby emoji id', () => {
        // Act
        const result = config.getBobbyEmojiId();

        // Assert
        expect(result).toBe('2354105404846');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.emojis.bobby');
    });

    test('should return deafen in voice channel setting', () => {
        // Act
        const result = config.getDeafenInVoiceChannel();

        // Assert
        expect(result).toBe(true);
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.bot.deafenInVoiceChannel');
    });
});

describe('getUi', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        configBuildIn.get.mockImplementation((path) => {
            switch (path) {
            case 'ui.embeds.titles.playlistAdded':
                return 'message1';
            case 'ui.embeds.titles.songAdded':
                return 'message2';
            case 'ui.embeds.messages.adminCookieNotification':
                return 'message3';
            default:
                throw new Error(`Unexpected config path: ${path}`);
            }
        });
    });

    test('should return playlist added title', () => {
        // Act
        const result = config.getPlaylistAddedTitle();

        // Assert
        expect(result).toBe('message1');
        expect(configBuildIn.get).toHaveBeenCalledWith('ui.embeds.titles.playlistAdded');
    });

    test('should return song added title', () => {
        // Act
        const result = config.getSongAddedTitle();

        // Assert
        expect(result).toBe('message2');
        expect(configBuildIn.get).toHaveBeenCalledWith('ui.embeds.titles.songAdded');
    });

    test('should return admin cookie notification message', () => {
        // Act
        const result = config.getAdminCookieNotificationMessage();

        // Assert
        expect(result).toBe('message3');
        expect(configBuildIn.get).toHaveBeenCalledWith('ui.embeds.messages.adminCookieNotification');
    });

    test('should throw error for invalid configuration path', () => {
        // Assert
        expect(() => {
            configBuildIn.get('ui.invalid.path');
        }).toThrow('Unexpected config path: ui.invalid.path');
    });
});

describe('getHttp', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        configBuildIn.get.mockImplementation((path) => {
            switch (path) {
            case 'http.port':
                return 1111;
            default:
                throw new Error(`Unexpected config path: ${path}`);
            }
        });
    });

    test('should return http port', () => {
        // Act
        const result = config.getHttpPort();

        // Assert
        expect(result).toBe(1111);
        expect(configBuildIn.get).toHaveBeenCalledWith('http.port');
    });

    test('should return default http port', () => {
        // Arrange
        configBuildIn.get.mockImplementation(() => null);

        // Act
        const result = config.getHttpPort();

        // Assert
        expect(result).toBe(7635);
        expect(configBuildIn.get).toHaveBeenCalledWith('http.port');
    });
});

describe('getLavalinkNotConnectedMessage', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return formatted message with admin user ID', () => {
        // Arrange
        const mockMessage = 'Lavalink is not connected. Please contact <@{adminUserId}>';
        const mockAdminId = '123456789';

        configBuildIn.get.mockImplementation((path) => {
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
        expect(result).toBe('Lavalink is not connected. Please contact <@123456789>');
        expect(configBuildIn.get).toHaveBeenCalledWith('ui.embeds.messages.lavalinkNotConnected');
        expect(configBuildIn.get).toHaveBeenCalledWith('discord.users.admin');
    });

    test('should handle different message formats', () => {
        // Arrange
        const mockMessage = 'Server error: {adminUserId} needs to check Lavalink';
        const mockAdminId = '987654321';

        configBuildIn.get.mockImplementation((path) => {
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
        expect(result).toBe('Server error: 987654321 needs to check Lavalink');
    });

    test('should handle empty message', () => {
        // Arrange
        configBuildIn.get.mockImplementation((path) => {
            switch (path) {
            case 'ui.embeds.messages.lavalinkNotConnected':
                return '';
            case 'discord.users.admin':
                return () => '123456789';
            default:
                return undefined;
            }
        });

        // Act
        const result = config.getLavalinkNotConnectedMessage();

        // Assert
        expect(result).toBe('');
    });
});
