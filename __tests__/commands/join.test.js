// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { getAdminUserId } = require('../../src/util/config');
const { getOrCreatePlayer } = require('../../src/util/util');
const join = require('../../src/commands/join');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getAdminUserId: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    getOrCreatePlayer: jest.fn(),
}));

describe('join', () => {
    test('should have required properties', () => {
        // Assert
        expect(join).toHaveProperty('guild', true);
        expect(join).toHaveProperty('dm', false);
        expect(join).toHaveProperty('vc', true);
        expect(join).toHaveProperty('help');
        expect(join.help).toHaveProperty('category', 'Musik');
        expect(join.help).toHaveProperty('usage');
        expect(join).toHaveProperty('data');
        expect(join.data).toHaveProperty('name', 'join');
        expect(join.data).toHaveProperty('description');
        expect(join.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                member: {
                    voice: {
                        channel: {
                            name: 'testChannel',
                            id: '456',
                        },
                    },
                },
                client: {
                    riffy: {
                        nodeMap: {
                            get: jest.fn().mockReturnValue({
                                connected: true,
                            }),
                        },
                        createConnection: jest.fn(),
                    },
                },
                guild: {
                    id: '123',
                },
                channel: {
                    id: '369',
                },
                reply: jest.fn(),
            };
        });

        test('should join user to voice channel', async () => {
            // Arrange
            const playerMock = {
                node: { host: 'localhost' },
            };
            getOrCreatePlayer.mockResolvedValue(playerMock);

            // Act
            await join.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling join command used by "testUser".');
            expect(getOrCreatePlayer).toHaveBeenCalledWith(mockInteraction.client, mockInteraction);
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Servus',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle lavalink not connected', async () => {
            // Arrange
            getOrCreatePlayer.mockResolvedValue(null);
            getAdminUserId.mockReturnValue('123456789');

            // Act
            await join.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling join command used by "testUser".');
            expect(getOrCreatePlayer).toHaveBeenCalled();
            expect(getAdminUserId).toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: expect.stringContaining('Der Bot kann gerade leider keine Musik abspielen. Melde dich bei <@123456789>'),
            });
        });
    });
});