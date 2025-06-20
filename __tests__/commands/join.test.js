// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const config = require('../../src/util/config');
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

describe('join', () => {
    test('should have required properties', () => {
        // Assert
        expect(join).toHaveProperty('guild', true);
        expect(join).toHaveProperty('dm', false);
        expect(join).toHaveProperty('vc', true);
        expect(join).toHaveProperty('help');
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
            // Act
            await join.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling join command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('Joining testChannel.');
            expect(mockInteraction.client.riffy.createConnection).toHaveBeenCalledWith({
                guildId: '123',
                voiceChannel: '456',
                textChannel: '369',
                deaf: true,
            });
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Servus',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle lavalink not connected', async () => {
            // Arrange
            mockInteraction.client.riffy.nodeMap.get.mockReturnValue({ connected: false });

            // Act
            await join.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling join command used by "testUser".');
            expect(logger.warn).toHaveBeenCalledWith('Lavalink is not connected.');
            expect(config.getAdminUserId).toHaveBeenCalled();
            expect(mockInteraction.client.riffy.createConnection).not.toHaveBeenCalled();
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: expect.stringContaining('Der Bot kann gerade leider keine Musik abspielen.'),
            });
        });
    });
});