// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { extractQueuePage } = require('../../src/util/util');
const logger = require('../../src/logging/logger');
const { buildQueueEmbed } = require('../../src/util/queueEmbedManager');
const queueNextPageButton = require('../../src/buttons/queueNextPageButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    extractQueuePage: jest.fn(),
}));

jest.mock('../../src/util/queueEmbedManager', () => ({
    buildQueueEmbed: jest.fn(),
}));

describe('queueNextPageButton', () => {
    let interaction;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        interaction = {
            message: {
                embeds: [
                    {
                        footer: {
                            text: 'Page 1',
                        },
                    },
                ],
            },
            deferUpdate: jest.fn(),
            user: {
                tag: 'testUser#1234',
            },
        };
    });

    test('should have correct properties', () => {
        // Assert
        expect(queueNextPageButton.data).toBeInstanceOf(ButtonBuilder);
        expect(queueNextPageButton.data.data.custom_id).toBe('nextpage');
        expect(queueNextPageButton.data.data.label).toBe('Nächste Seite');
        expect(queueNextPageButton.data.data.style).toBe(ButtonStyle.Primary);
    });

    describe('execute', () => {
        test('should handle next page when page number is found', async () => {
            // Arrange
            extractQueuePage.mockReturnValue(1);

            // Act
            await queueNextPageButton.execute(interaction);

            // Assert
            expect(extractQueuePage).toHaveBeenCalledWith('Page 1');
            expect(buildQueueEmbed).toHaveBeenCalledWith(interaction, 2, true);
            expect(interaction.deferUpdate).toHaveBeenCalled();
        });

        test('should handle case when page number cannot be extracted', async () => {
            // Arrange
            extractQueuePage.mockReturnValue(null);

            // Act
            await queueNextPageButton.execute(interaction);

            // Assert
            expect(buildQueueEmbed).not.toHaveBeenCalled();
            expect(interaction.deferUpdate).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalledWith('Failed to extract queue page number.');
        });

        test('should handle message without embeds', async () => {
            // Arrange
            interaction.message.embeds = [];

            // Act
            await queueNextPageButton.execute(interaction);

            // Assert
            expect(extractQueuePage).toHaveBeenCalledWith(undefined);
            expect(buildQueueEmbed).not.toHaveBeenCalled();
            expect(interaction.deferUpdate).not.toHaveBeenCalled();
        });

        test('should log execution start and end', async () => {
            // Arrange
            extractQueuePage.mockReturnValue(1);

            // Act
            await queueNextPageButton.execute(interaction);

            // Assert
            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenNthCalledWith(1, 'Handling nextPage button pressed by "testUser#1234".');
            expect(logger.info).toHaveBeenNthCalledWith(2, 'Done handling nextPage button pressed by "testUser#1234".');
        });

        test('should handle errors in buildQueueEmbed', async () => {
            // Arrange
            extractQueuePage.mockReturnValue(1);
            buildQueueEmbed.mockRejectedValue(new Error('Failed to build queue embed'));

            // Assert
            await expect(queueNextPageButton.execute(interaction)).rejects.toThrow('Failed to build queue embed');
        });
    });
});