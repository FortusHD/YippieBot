// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const participateButton = require('../../src/buttons/participateButton');
const logger = require('../../src/logging/logger');
const wichtelModal = require('../../src/modals/wichtelModal');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/modals/wichtelModal', () => ({
    data: {
        customId: 'steamData',
        title: 'Steam-Daten',
    },
}));

describe('participateButton', () => {
    let interaction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        interaction = {
            showModal: jest.fn(),
            user: {
                tag: 'testUser#1234',
            },
        };
    });

    test('should have correct properties', () => {
        expect(participateButton.data).toBeInstanceOf(ButtonBuilder);
        expect(participateButton.data.data.custom_id).toBe('participate');
        expect(participateButton.data.data.label).toBe('Teilnehmen');
        expect(participateButton.data.data.style).toBe(ButtonStyle.Primary);
    });

    describe('execute', () => {
        test('should show wichtel modal when button is pressed', async () => {
            // Act
            await participateButton.execute(interaction);

            // Assert
            expect(interaction.showModal).toHaveBeenCalledWith(wichtelModal.data);
        });

        test('should log execution start and end', async () => {
            // Act
            await participateButton.execute(interaction);

            // Assert
            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenNthCalledWith(
                1,
                'Handling participate button pressed by "testUser#1234".',
            );
            expect(logger.info).toHaveBeenNthCalledWith(
                2,
                'Done handling participate button pressed by "testUser#1234".',
            );
        });

        test('should handle modal display errors', async () => {
            // Arrange
            interaction.showModal.mockRejectedValue(new Error('Failed to show modal'));

            // Assert
            await expect(participateButton.execute(interaction)).rejects.toThrow('Failed to show modal');
        });
    });

});