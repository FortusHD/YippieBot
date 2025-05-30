// Imports
const { Events, MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { handleError } = require('../../src/logging/errorHandler');
const { getAdminUserId } = require('../../src/util/config');
const { notifyAdminCookies } = require('../../src/util/util');
const interactionCreated = require('../../src/events/interactionCreated');

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
    notifyAdminCookies: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    handleError: jest.fn(),
    ErrorType: {
        UNKNOWN_COMMAND: 'UNKNOWN_COMMAND',
        PLAY_ERROR: 'PLAY_ERROR',
        INTERACTION_ERROR: 'INTERACTION_ERROR',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        UNKNOWN_BUTTON: 'UNKNOWN_BUTTON',
    },
}));

describe('interactionCreated', () => {
    let mockInteraction;
    let mockClient;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            commands: new Map(),
            buttons: new Map(),
            modals: new Map(),
            riffy: {
                players: new Map(),
            },
        };

        mockInteraction = {
            client: mockClient,
            user: { tag: 'testUser#1234', id: '123456789' },
            reply: jest.fn(),
            guild: {},
            guildId: '987654321',
        };
    });

    test('should have correct event name', () => {
        expect(interactionCreated.name).toBe(Events.InteractionCreate);
    });

    test('should do nothing for unknown interaction type', async () => {
        // Arrange
        mockInteraction.isChatInputCommand = () => false;
        mockInteraction.isButton = () => false;
        mockInteraction.isModalSubmit = () => false;

        // Act
        await interactionCreated.execute(mockInteraction);

        // Assert
        expect(handleError).not.toHaveBeenCalled();
        expect(mockInteraction.reply).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });

    describe('Chat Input Commands', () => {
        // Setup
        beforeEach(() => {
            mockInteraction.isChatInputCommand = () => true;
            mockInteraction.isButton = () => false;
            mockInteraction.isModalSubmit = () => false;
            mockInteraction.commandName = 'testCommand';
        });

        test('should handle unknown command', async () => {
            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    type: 'UNKNOWN_COMMAND',
                    interaction: mockInteraction,
                }),
            );
        });

        test('should handle guild-only command in DM', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                dm: false,
                execute: jest.fn(),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockInteraction.guild = null;

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Dieser Befehl kann nur auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle DM-only command in guild', async () => {
            // Arrange
            const mockCommand = {
                guild: false,
                dm: true,
                execute: jest.fn(),
            };
            mockClient.commands.set('testCommand', mockCommand);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Dieser Befehl kann nicht auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle player-only command, when bot is not in channel', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                player: true,
                execute: jest.fn(),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockClient.riffy.players.set('987654321', null);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Der Bot ist nicht in einem VoiceChannel.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should set player to null when guildId is not set', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                player: true,
                execute: jest.fn(),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockInteraction.guildId = null;

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Der Bot ist nicht in einem VoiceChannel.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle dev-only command for non-admin user', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                dm: true,
                devOnly: true,
                execute: jest.fn(),
            };
            mockClient.commands.set('testCommand', mockCommand);
            getAdminUserId.mockReturnValue('different-id');

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Dazu hast du keine Berechtigung!',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle voice channel requirement', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                vc: true,
                execute: jest.fn(),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockInteraction.member = { voice: { channel: null } };

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Du musst in einem VoiceChannel sein, um diesen Befehl zu benutzen',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle PlayError', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                execute: jest.fn().mockRejectedValue({ name: 'PlayError' }),
            };
            mockClient.commands.set('testCommand', mockCommand);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(notifyAdminCookies).toHaveBeenCalledWith(mockInteraction);
        });
    });

    describe('Button Interactions', () => {
        // Setup
        beforeEach(() => {
            mockInteraction.isChatInputCommand = () => false;
            mockInteraction.isButton = () => true;
            mockInteraction.isModalSubmit = () => false;
            mockInteraction.customId = 'testButton';
        });

        test('should handle unknown button', async () => {
            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    type: 'UNKNOWN_BUTTON',
                    interaction: mockInteraction,
                }),
            );
        });

        test('should execute known button', async () => {
            // Arrange
            const mockButton = {
                execute: jest.fn(),
            };
            mockClient.buttons.set('testButton', mockButton);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockButton.execute).toHaveBeenCalledWith(mockInteraction);
        });

        test('should handle button error', async () => {
            // Arrange
            const mockButton = {
                execute: jest.fn().mockRejectedValue({
                    rawError: { message: 'Some error message' },
                }),
            };
            mockClient.buttons.set('testButton', mockButton);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                expect.objectContaining({
                    type: 'UNKNOWN_ERROR',
                    interaction: mockInteraction,
                }),
            );
        });
    });

    describe('Modal Interactions', () => {
        // Setup
        beforeEach(() => {
            mockInteraction.isChatInputCommand = () => false;
            mockInteraction.isButton = () => false;
            mockInteraction.isModalSubmit = () => true;
            mockInteraction.customId = 'testModal';
        });

        test('should handle unknown modal', async () => {
            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({
                    type: 'UNKNOWN_COMMAND',
                    interaction: mockInteraction,
                }),
            );
        });

        test('should execute known modal', async () => {
            // Arrange
            const mockModal = {
                execute: jest.fn(),
            };
            mockClient.modals.set('testModal', mockModal);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(mockModal.execute).toHaveBeenCalledWith(mockInteraction);
        });

        test('should handle modal error', async () => {
            // Arrange
            const mockModal = {
                execute: jest.fn().mockRejectedValue({
                    rawError: { message: 'Some error message' },
                }),
            };
            mockClient.modals.set('testModal', mockModal);

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                expect.objectContaining({
                    type: 'UNKNOWN_ERROR',
                    interaction: mockInteraction,
                }),
            );
        });
    });

    describe('Error Handling', () => {
        // Setup
        beforeEach(() => {
            mockInteraction.isChatInputCommand = () => true;
            mockInteraction.isButton = () => false;
            mockInteraction.isModalSubmit = () => false;
            mockInteraction.commandName = 'testCommand';
        });

        test('should handle race condition errors', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                execute: jest.fn().mockRejectedValue({
                    rawError: { message: 'Unknown interaction' },
                }),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockInteraction.isChatInputCommand = () => true;

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(logger.warn).toHaveBeenCalledWith('Interaction was not found (race-condition?), ignoring.');
        });

        test('should handle InteractionNotReplied errors', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                execute: jest.fn().mockRejectedValue({ name: 'InteractionNotReplied' }),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockInteraction.isChatInputCommand = () => true;

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                expect.objectContaining({
                    type: 'INTERACTION_ERROR',
                }),
            );
        });

        test('should handle other error', async () => {
            // Arrange
            const mockCommand = {
                guild: true,
                execute: jest.fn().mockRejectedValue({ name: 'OtherError' }),
            };
            mockClient.commands.set('testCommand', mockCommand);
            mockInteraction.isChatInputCommand = () => true;

            // Act
            await interactionCreated.execute(mockInteraction);

            // Assert
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                expect.objectContaining({
                    type: 'UNKNOWN_ERROR',
                }),
            );
        });
    });
});