/**
 * Tests for the general utility functions
 *
 * @group util
 * @group common
 */

// Imports
const fs = require('fs');
const path = require('path');
const config = require('../../src/util/config');
const logger = require('../../src/logging/logger');
const util = require('../../src/util/util');
// Mock dependencies
jest.mock('../../src/util/config', () => ({
    getYoutubeApiUrl: jest.fn(),
    getEnv: jest.fn(),
    getAdminUserId: jest.fn(),
    getAdminCookieNotificationMessage: jest.fn(),
    getLavalinkConfig: jest.fn(),
    getDeafenInVoiceChannel: jest.fn(),
}));

jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('fs', () => ({
    readdirSync: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn(),
}));

describe('buildEmbed', () => {
    test('builds embed with only required fields', () => {
        // Arrange
        const data = {
            color: 0x000000,
            title: 'Test Title',
            description: 'Test Description',
            origin: 'test',
        };

        // Act
        const embed = util.buildEmbed(data);

        // Assert
        expect(embed.data.color).toBe(data.color);
        expect(embed.data.title).toBe(data.title);
        expect(embed.data.description).toBe(data.description);
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.footer.text).toBe(`/${data.origin}`);
    });

    test('builds embed with all optional fields', () => {
        // Arrange
        const data = {
            color: 0x000000,
            title: 'Test Title',
            description: 'Test Description',
            fields: [{ name: 'Test Field 1', value: 'Test Value 1' }],
            thumbnail: 'https://test.com/thumbnail.png',
            image: 'https://test.com/image.png',
            footer: { text: 'Test Footer Text', iconURL: 'https://test.com/footer.png' },
            origin: 'test',

        };

        // Act
        const embed = util.buildEmbed(data);

        // Assert
        expect(embed.data.color).toBe(data.color);
        expect(embed.data.title).toBe(data.title);
        expect(embed.data.description).toBe(data.description);
        expect(embed.data.fields).toEqual(data.fields);
        expect(embed.data.thumbnail.url).toBe(data.thumbnail);
        expect(embed.data.image.url).toBe(data.image);
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.footer.text).toBe(`/${data.origin} ${data.footer.text}`);
        expect(embed.data.footer.icon_url).toBe(data.footer.iconURL);
    });

    test('builds embed with some optional fields', () => {
        // Arrange
        const data = {
            color: 0xffffff,
            title: 'Test Title 2',
            description: 'Test Description 2',
            fields: [{ name: 'Test Field 2', value: 'Test Value 2' }],
            origin: 'test2',
        };

        // Act
        const embed = util.buildEmbed(data);

        // Assert
        expect(embed.data.color).toBe(data.color);
        expect(embed.data.title).toBe(data.title);
        expect(embed.data.description).toBe(data.description);
        expect(embed.data.fields).toEqual(data.fields);
        expect(embed.data.thumbnail).toBeUndefined();
        expect(embed.data.image).toBeUndefined();
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.footer.text).toBe(`/${data.origin}`);
    });

    test('builds embed with footer text only from origin', () => {
        // Arrange
        const data = {
            color: 0x008000,
            title: 'Test Title 3',
            description: 'Test Description 3',
            footer: { iconURL: 'https://test.com/footer_3.png' },
            origin: 'test3',
        };

        // Act
        const embed = util.buildEmbed(data);

        // Assert
        expect(embed.data.footer.text).toBe(`/${data.origin}`);
    });

});

describe('buildRoleEmbed', () => {
    test('builds embed', () => {
        // Arrange
        const color = 0x000000;
        const title = 'Test Title';
        const fields = [
            { name: 'Test Field 1', value: 'Test Value 1' },
            { name: 'Test Field 2', value: 'Test Value 2' },
        ];

        // Act
        const embed = util.buildRoleEmbed(color, title, fields);

        // Assert
        expect(embed.data.color).toBe(color);
        expect(embed.data.title).toBe(title);
        expect(embed.data.fields).toEqual(fields);
    });
});

describe('formatDuration', () => {
    // Arrange
    const testCases = [[120, '2:00'], [33, '0:33'], [1, '0:01'], [0, '0:00'], [333, '5:33']];

    test.each(testCases)('converts %i seconds to %s', (seconds, expected) => {
        // Assert
        expect(util.formatDuration(seconds)).toBe(expected);
    });
});

describe('buildCurrentSongPos', () => {
    const positiveTestCases = [
        [0, 180000, '●════════════════════ 0:00/3:00'],
        [90000, 180000, '══════════●══════════ 1:30/3:00'],
        [180000, 180000, '════════════════════● 3:00/3:00'],
        [45000, 180000, '═════●═══════════════ 0:45/3:00'],
        [135000, 180000, '═══════════════●═════ 2:15/3:00'],
    ];

    test.each(positiveTestCases)('builds position string for %i ms of %i ms', (currentTime, duration, expected) => {
        // Assert
        expect(util.buildCurrentSongPos(currentTime, duration)).toBe(expected);
    });

    test('builds position string for 190000 ms of 180000 ms (larger current, than duration)', () => {
        // Assert
        expect(util.buildCurrentSongPos(190000, 180000)).toBe('════════════════════● 3:10/3:00');
    });
});

describe('getTimeInSeconds', () => {
    // Arrange
    const positiveTestCases = [
        ['1:00', 60],
        ['1:00:00', 3600],
        ['1:10:10', 4210],
        ['0:45', 45],
        ['0:00', 0],
        [':10', 0],
        ['0', 0],
        ['', 0],
        ['1:10:00:00', 0],
    ];

    test.each(positiveTestCases)('converts %s to %i seconds', (time, expected) => {
        // Assert
        expect(util.getTimeInSeconds(time)).toBe(expected);
    });
});

describe('getPlaylist', () => {
    // Mock
    global.fetch = jest.fn();

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock returns
        config.getYoutubeApiUrl.mockReturnValue('https://mock-youtube-api-url');
        config.getEnv.mockReturnValue('mock-api-key');
        fetch.mockResolvedValue({
            json: () => Promise.resolve({ items: [] }),
        });
    });

    test('should call config.getYoutubeApiUrl with correct parameters', async () => {
        // Arrange
        const playlistId = 'test-playlist-123';

        // Act
        await util.getPlaylist(playlistId);

        // Assert
        expect(config.getYoutubeApiUrl).toHaveBeenCalledWith('playlist', {
            id: playlistId,
            key: 'mock-api-key',
        });
    });

    test('should fetch data from the correct URL', async () => {
        // Arrange
        const playlistId = 'test-playlist-123';

        // Act
        await util.getPlaylist(playlistId);

        // Assert
        expect(global.fetch).toHaveBeenCalledWith('https://mock-youtube-api-url');
    });

    test('should return the parsed JSON response', async () => {
        // Arrange
        const mockResponse = {
            items: [
                { id: '1', title: 'Test Video' },
            ],
        };
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
        });
        const playlistId = 'test-playlist-123';

        // Act
        const result = await util.getPlaylist(playlistId);

        // Assert
        expect(result).toEqual(mockResponse);
    });

    test('should handle API errors correctly', async () => {
        // Arrange
        fetch.mockRejectedValueOnce(new Error('API Error'));
        const playlistId = 'test-playlist-123';

        // Assert
        await expect(util.getPlaylist(playlistId)).rejects.toThrow('API Error');
    });
});

describe('notifyAdminCookies', () => {
    // Mock
    const mockDmChannel = {
        send: jest.fn(),
    };

    const mockAdmin = {
        dmChannel: null,
        createDM: jest.fn().mockResolvedValue(mockDmChannel),
    };

    const mockInteraction = {
        client: {
            users: {
                fetch: jest.fn(),
            },
        },
    };

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction.client.users.fetch.mockResolvedValue(mockAdmin);
        config.getAdminUserId.mockReturnValue('mock-admin-id');
        config.getAdminCookieNotificationMessage.mockReturnValue('mock-notification-message');
        mockAdmin.dmChannel = null;
    });

    test('should fetch admin user with correct ID', async () => {
        // Arrange
        mockAdmin.dmChannel = mockDmChannel;

        // Act
        await util.notifyAdminCookies(mockInteraction);

        // Assert
        expect(mockInteraction.client.users.fetch)
            .toHaveBeenCalledWith('mock-admin-id');
    });

    test('should create DM channel if it does not exist', async () => {
        // Arrange
        mockAdmin.createDM.mockImplementation(() => {
            mockAdmin.dmChannel = mockDmChannel;
            return Promise.resolve(mockDmChannel);
        });

        // Act
        await util.notifyAdminCookies(mockInteraction);

        // Assert
        expect(mockAdmin.createDM).toHaveBeenCalled();
    });

    test('should not create DM channel if it already exists', async () => {
        // Arrange
        mockAdmin.dmChannel = mockDmChannel;

        // Act
        await util.notifyAdminCookies(mockInteraction);

        // Assert
        expect(mockAdmin.createDM).not.toHaveBeenCalled();
    });

    test('should send correct notification message', async () => {
        // Arrange
        mockAdmin.dmChannel = mockDmChannel;

        // Act
        await util.notifyAdminCookies(mockInteraction);

        // Assert
        expect(mockDmChannel.send)
            .toHaveBeenCalledWith('mock-notification-message');
    });

    test('should handle errors when fetching admin user', async () => {
        // Arrange
        mockInteraction.client.users.fetch
            .mockRejectedValueOnce(new Error('Failed to fetch admin'));

        // Assert
        await expect(util.notifyAdminCookies(mockInteraction))
            .rejects.toThrow('Failed to fetch admin');
    });

    test('should handle errors when creating DM channel', async () => {
        // Arrange
        mockAdmin.createDM
            .mockRejectedValueOnce(new Error('Failed to create DM'));

        // Assert
        await expect(util.notifyAdminCookies(mockInteraction))
            .rejects.toThrow('Failed to create DM');
    });

    test('should handle errors when sending message', async () => {
        // Arrange
        mockAdmin.dmChannel = mockDmChannel;
        mockDmChannel.send.mockRejectedValueOnce(new Error('Failed to send message'));

        // Assert
        await expect(util.notifyAdminCookies(mockInteraction))
            .rejects.toThrow('Failed to send message');
    });
});

describe('editInteractionReply', () => {
    // Mock
    const mockChannel = {
        send: jest.fn(),
    };

    const mockInteraction = {
        channel: mockChannel,
        editReply: jest.fn(),
    };

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction.channel.send.mockResolvedValue(mockChannel);
        mockInteraction.editReply = jest.fn();
    });

    test('should edit interaction reply, if possible', async () => {
        // Act
        await util.editInteractionReply(mockInteraction, 'mock-message');

        // Assert
        expect(mockInteraction.editReply).toHaveBeenCalledWith('mock-message');
        expect(mockInteraction.editReply).toHaveBeenCalledTimes(1);
        expect(mockInteraction.channel.send).not.toHaveBeenCalled();
    });

    test('should send message, if interaction reply cannot be edited', async () => {
        // Arrange
        mockInteraction.editReply.mockRejectedValueOnce(new Error('Failed to edit reply'));

        // Act
        await util.editInteractionReply(mockInteraction, 'mock-message');

        // Assert
        expect(mockInteraction.editReply).toHaveBeenCalledWith('mock-message');
        expect(mockInteraction.editReply).toHaveBeenCalledTimes(1);
        expect(mockInteraction.channel.send).toHaveBeenCalledWith('mock-message');
        expect(mockInteraction.channel.send).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});

describe('getRandomColor', () => {
    test('should return a string starting with #', () => {
        // Act
        const result = util.getRandomColor();

        // Assert
        expect(result).toMatch(/^#/);
    });

    test('should return a 7-character string', () => {
        // Act
        const result = util.getRandomColor();

        // Assert
        expect(result).toHaveLength(7);
    });

    test('should only contain valid hex characters', () => {
        // Act
        const result = util.getRandomColor();

        // Assert
        expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });
});

describe('extractQueuePage', () => {
    // Arrange
    const positiveTestCases = [['4/5', 4], ['5/5', 5], ['1/13', 1], ['12/13', 12]];

    test.each(positiveTestCases)('should extract page number from %s', (input, expected) => {
        // Assert
        expect(util.extractQueuePage(input)).toBe(expected);
    });

    test('should return null, if no number is present', () => {
        // Assert
        expect(util.extractQueuePage('abc')).toBeNull();
    });
});

describe('initializeComponents', () => {
    const mockCommandsPath = '../../__tests__/__mocks__/deploy';
    const mockCommandFiles = ['validCommand.js', 'invalidCommand.js'];

    const testValidationFn = jest.fn();
    const testRegisterFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        path.join.mockImplementation((...args) => args.join('/'));
        fs.readdirSync.mockReturnValue(mockCommandFiles);
    });

    test('should initialize components', () => {
        // Arrange
        testValidationFn.mockReturnValue(true);

        // Act
        const result = util.initializeComponents(null,
            'testTypes', mockCommandsPath, testRegisterFn, testValidationFn,
        );

        // Assert
        expect(result).toEqual(2);
        expect(logger.info).toHaveBeenCalledWith('Initiating testTypes');
        expect(testValidationFn).toHaveBeenCalledTimes(2);
        expect(testRegisterFn).toHaveBeenCalledTimes(2);
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/(?=.*testType)(?=.*invalidCommand)/s));
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/(?=.*testType)(?=.*validCommand)/s));
        expect(logger.info).toHaveBeenCalledWith('testTypes initiated');
        expect(logger.warn).not.toHaveBeenCalled();
    });

    test('should not initialize invalid components', () => {
        // Arrange
        testValidationFn.mockReturnValue(false);

        // Act
        const result = util.initializeComponents(null,
            'testTypes', mockCommandsPath, testRegisterFn, testValidationFn,
        );

        // Assert
        expect(result).toEqual(0);
        expect(logger.info).toHaveBeenCalledWith('Initiating testTypes');
        expect(testValidationFn).toHaveBeenCalledTimes(2);
        expect(testRegisterFn).toHaveBeenCalledTimes(0);
        expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/(?=.*testType)(?=.*invalidCommand)/s));
        expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/(?=.*testType)(?=.*validCommand)/s));
        expect(logger.info).toHaveBeenCalledWith('testTypes initiated');
    });
});

describe('shuffleArray', () => {
    test('should return an array', () => {
        // Arrange
        const array = [1, 2, 3, 4, 5];

        // Act
        const result = util.shuffleArray(array);

        // Assert
        expect(result).toBeInstanceOf(Array);
    });

    test('should not modify the original array', () => {
        // Arrange
        const array = [1, 2, 3, 4, 5];
        const originalArray = [...array];

        // Act
        util.shuffleArray(array);

        // Assert
        expect(array).toEqual(originalArray);
    });

    test('should return an array of the same length as the input', () => {
        // Arrange
        const array = [1, 2, 3, 4, 5];

        // Act
        const result = util.shuffleArray(array);

        // Assert
        expect(result).toHaveLength(array.length);
    });

    test('should contain the same elements as the input array', () => {
        // Arrange
        const array = [1, 2, 3, 4, 5];

        // Act
        const result = util.shuffleArray(array);

        // Assert
        expect(result.sort()).toEqual(array.sort());
    });

    test('should shuffle the elements (not return in the same order)', () => {
        // Arrange
        const array = [1, 2, 3, 4, 5];

        // There's no guarantee of randomness every time, so run the test multiple times to check for changes
        let different = false;
        for (let i = 0; i < 100; i++) {
            // Act
            if (util.shuffleArray(array).toString() !== array.toString()) {
                different = true;
                break;
            }
        }

        // Assert
        expect(different).toBe(true);
    });
});

describe('getOrCreatePlayer', () => {
    let mockClient;
    let mockInteraction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            riffy: {
                nodeMap: new Map(),
                players: new Map(),
                createConnection: jest.fn(),
            },
        };

        mockInteraction = {
            guildId: '12345',
            member: {
                voice: {
                    channel: {
                        id: '67890',
                        name: 'General',
                    },
                },
            },
            channel: {
                id: '54321',
            },
        };

        mockClient.riffy.nodeMap.set('localhost', { connected: true });

        config.getLavalinkConfig.mockReturnValue({
            host: 'localhost',
            port: 2333,
            password: 'pw',
            secure: false,
        });
        config.getDeafenInVoiceChannel.mockReturnValue(true);
    });

    test('should return an existing player if it exists and no forceNew is provided', () => {
        // Arrange
        const existingPlayer = { id: 'existingPlayer', voiceChannel: '67890', playing: false };
        mockClient.riffy.players.set('12345', existingPlayer);

        // Act
        const player = util.getOrCreatePlayer(mockClient, mockInteraction, false);

        // Arrange
        expect(player).toEqual(existingPlayer);
        expect(mockClient.riffy.createConnection).not.toHaveBeenCalled();
    });

    test('should create and return a new player if none exists', () => {
        const playerMock = { id: 'newPlayer' };
        mockClient.riffy.createConnection.mockReturnValue(playerMock);

        const player = util.getOrCreatePlayer(mockClient, mockInteraction);

        expect(player).toEqual(playerMock);
        expect(mockClient.riffy.createConnection).toHaveBeenCalledWith({
            guildId: '12345',
            voiceChannel: '67890',
            textChannel: '54321',
            deaf: true,
        });
    });

    test('should create a new player if forceNew is true', () => {
        // Arrange
        const existingPlayer = { id: 'existingPlayer' };
        const newPlayerMock = { id: 'newPlayer' };
        mockClient.riffy.players.set('12345', existingPlayer);
        mockClient.riffy.createConnection.mockReturnValue(newPlayerMock);

        // Act
        const player = util.getOrCreatePlayer(mockClient, mockInteraction, true);

        // Assert
        expect(player).toEqual(newPlayerMock);
        expect(mockClient.riffy.createConnection).toHaveBeenCalledWith({
            guildId: '12345',
            voiceChannel: '67890',
            textChannel: '54321',
            deaf: true,
        });
    });

    const badStates = [
        { voiceChannel: '', playing: true, current: null, destroy: jest.fn() },
        { voiceChannel: '123', playing: true, current: null, destroy: jest.fn() },
    ];

    test.each(badStates)('should destroy the existing player and create a new one if in a bad state', (state) => {
        const badPlayer = state;
        const newPlayerMock = { id: 'newPlayer' };
        mockClient.riffy.players.set('12345', badPlayer);
        mockClient.riffy.createConnection.mockReturnValue(newPlayerMock);

        const player = util.getOrCreatePlayer(mockClient, mockInteraction);

        expect(badPlayer.destroy).toHaveBeenCalled();
        expect(player).toEqual(newPlayerMock);
        expect(mockClient.riffy.createConnection).toHaveBeenCalled();
    });

    test('should return null if Lavalink is not connected', () => {
        mockClient.riffy.nodeMap.get('localhost').connected = false;

        const player = util.getOrCreatePlayer(mockClient, mockInteraction);

        expect(player).toBeNull();
        expect(logger.warn).toHaveBeenCalledWith('Lavalink is not connected.');
    });
});

describe('validateUserInSameVoiceChannel', () => {
    test('should return true if user is in the same voice channel as the player', () => {
        // Arrange
        const mockInteraction = {
            member: {
                voice: {
                    channel: {
                        id: '12345',
                    },
                },
            },
        };
        const mockPlayer = {
            voiceChannel: '12345',
        };

        // Act
        const result = util.validateUserInSameVoiceChannel(mockInteraction, mockPlayer);

        // Assert
        expect(result).toBe(true);
    });

    test('should return false if user is in a different voice channel than the player', () => {
        // Arrange
        const mockInteraction = {
            member: {
                voice: {
                    channel: {
                        id: '67890',
                    },
                },
            },
        };
        const mockPlayer = {
            voiceChannel: '12345',
        };

        // Act
        const result = util.validateUserInSameVoiceChannel(mockInteraction, mockPlayer);

        // Assert
        expect(result).toBe(false);
    });

    test('should return false if user is not in any voice channel', () => {
        // Arrange
        const mockInteraction = {
            member: {
                voice: {
                    channel: null,
                },
            },
        };
        const mockPlayer = {
            voiceChannel: '12345',
        };

        // Act
        const result = util.validateUserInSameVoiceChannel(mockInteraction, mockPlayer);

        // Assert
        expect(result).toBe(false);
    });

    test('should handle cases where player.voiceChannel is undefined', () => {
        // Arrange
        const mockInteraction = {
            member: {
                voice: {
                    channel: {
                        id: '12345',
                    },
                },
            },
        };
        const mockPlayer = {
            voiceChannel: undefined,
        };

        // Act
        const result = util.validateUserInSameVoiceChannel(mockInteraction, mockPlayer);

        // Assert
        expect(result).toBe(false);
    });
});