// Imports
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const jsonManager = require('../../src/util/json_manager');
const logger = require('../../src/logging/logger');
const participantsButton = require('../../src/buttons/participantsButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/json_manager', () => ({
    getParticipants: jest.fn(),
}));

describe('participantsButton', () => {
    let interaction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        interaction = {
            reply: jest.fn(),
            user: {
                tag: 'testUser#1234',
            },
        };
    });

    test('should have correct properties', () => {
        // Assert
        expect(participantsButton.data).toBeInstanceOf(ButtonBuilder);
        expect(participantsButton.data.data.custom_id).toBe('participants');
        expect(participantsButton.data.data.label).toBe('Teilnehmer anzeigen');
        expect(participantsButton.data.data.style).toBe(ButtonStyle.Primary);
    });

    describe('execute', () => {
        test('should show message when there are no participants', async () => {
            // Arrange
            jsonManager.getParticipants.mockReturnValue([]);

            // Act
            await participantsButton.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledWith({
                content: 'Noch nimmt niemand am Wichteln teil.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should list all participants when there are participants', async () => {
            // Arrange
            const mockParticipants = [
                { id: '123', steamFriendCode: 'ABC123' },
                { id: '456', steamFriendCode: 'DEF456' },
            ];
            jsonManager.getParticipants.mockReturnValue(mockParticipants);

            // Act
            await participantsButton.execute(interaction);

            // Assert
            const expectedMessage = 'Teilnehmer:\n<@123>, `Friend-Code: ABC123`\n<@456>, `Friend-Code: DEF456`';
            expect(interaction.reply).toHaveBeenCalledWith({
                content: expectedMessage,
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should log execution start and end', async () => {
            // Arrange
            jsonManager.getParticipants.mockReturnValue([]);

            // Act
            await participantsButton.execute(interaction);

            // Assert
            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenNthCalledWith(
                1,
                'Handling participants button pressed by "testUser#1234".',
            );
            expect(logger.info).toHaveBeenNthCalledWith(
                2,
                'Done handling participants button pressed by "testUser#1234".',
            );
        });
    });
});