// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger.js');
const { editInteractionReply, getTimeInSeconds } = require('../../src/util/util.js');
const seek = require('../../src/commands/seek.js');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    editInteractionReply: jest.fn(),
    getTimeInSeconds: jest.fn(),
}));

describe('seek', () => {
    test('should have required properties', () => {
        expect(seek).toHaveProperty('guild', true);
        expect(seek).toHaveProperty('dm', false);
        expect(seek).toHaveProperty('player', true);
        expect(seek).toHaveProperty('data');
        expect(seek.data).toHaveProperty('name', 'seek');
        expect(seek.data).toHaveProperty('description');
        expect(seek.data.options).toHaveLength(1);
        expect(seek.data.options[0]).toHaveProperty('name', 'time');
        expect(seek.data.options[0]).toHaveProperty('description');
        expect(seek.data.options[0]).toHaveProperty('type', 3);
        expect(seek.data.options[0]).toHaveProperty('required', true);
    });

    describe('execute', () => {
        let mockPlayer;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockPlayer = {
                current: {},
                node: {
                    host: 'localhost',
                },
                seek: jest.fn(),
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                options: {
                    getString: jest.fn().mockReturnValue('10:12'),
                },
                guildId: '1234',
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

            getTimeInSeconds.mockReturnValue(10000);
        });

        test('should jump to given time in song', async () => {
            // Act
            await seek.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling seek command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Springe zu 10:12...');
            expect(getTimeInSeconds).toHaveBeenCalledWith('10:12');
            expect(mockPlayer.seek).toHaveBeenCalledWith(10000000);
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, expect.any(String));
            expect(logger.info).toHaveBeenCalledWith('Seeked to 10:12');
        });

        test('should handle no playing song', async () => {
            // Arrange
            mockPlayer.current = null;

            // Act
            await seek.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling seek command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Springe zu 10:12...');
            expect(getTimeInSeconds).toHaveBeenCalledWith('10:12');
            expect(mockPlayer.seek).not.toHaveBeenCalled();
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, expect.any(String));
            expect(logger.info).toHaveBeenCalledWith('No song playing.');
        });

        test('should handle invalid time', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue('input');

            // Act
            await seek.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling seek command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith(
                'Bitte gebe eine gültige Zeit an!',
                { flags: MessageFlags.Ephemeral },
            );
            expect(logger.info).toHaveBeenCalledWith('"testUser" entered an invalid time');
            expect(getTimeInSeconds).not.toHaveBeenCalled();
            expect(mockPlayer.seek).not.toHaveBeenCalled();
        });
    });
});