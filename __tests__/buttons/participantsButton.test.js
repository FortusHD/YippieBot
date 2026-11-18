// Imports
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { getParticipants } = require('../../src/database/tables/wichtelParticipants');
const participantsButton = require('../../src/buttons/participantsButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/database/tables/wichtelParticipants', () => ({
    getParticipants: jest.fn(),
}));

describe('participantsButton', () => {
    let interaction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        interaction = {
            reply: jest.fn(),
            followUp: jest.fn(),
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
            getParticipants.mockResolvedValue([]);

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
            getParticipants.mockResolvedValue(mockParticipants);

            // Act
            await participantsButton.execute(interaction);

            // Assert
            const expectedMessage = 'Teilnehmer:\n<@123>, `Friend-Code: ABC123`\n<@456>, `Friend-Code: DEF456`';
            expect(interaction.reply).toHaveBeenCalledWith({
                content: expectedMessage,
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should remove characters that could break out of the code span', async () => {
            // Arrange
            getParticipants.mockResolvedValue([{ id: '123', steamFriendCode: '1` @everyone `\n<@&1>' }]);

            // Act
            await participantsButton.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledWith({
                content: 'Teilnehmer:\n<@123>, `Friend-Code: 1 @everyone <@&1>`',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should split a long list into several messages', async () => {
            // Arrange
            const mockParticipants = [...Array(100)].map((_, i) => ({ id: String(i), steamFriendCode: '123456789' }));
            getParticipants.mockResolvedValue(mockParticipants);

            // Act
            await participantsButton.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledTimes(1);
            expect(interaction.followUp).toHaveBeenCalled();
            const allParts = [interaction.reply.mock.calls[0][0], ...interaction.followUp.mock.calls.map(c => c[0])];
            allParts.forEach(part => expect(part.content.length).toBeLessThanOrEqual(2000));
        });

        test('should log execution start and end', async () => {
            // Arrange
            getParticipants.mockResolvedValue([]);

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