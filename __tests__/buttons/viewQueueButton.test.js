// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildQueueEmbed } = require('../../src/util/musicUtil');
const viewQueueButton = require('../../src/buttons/viewQueueButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));
jest.mock('../../src/util/musicUtil', () => ({
    buildQueueEmbed: jest.fn(),
}));

describe('viewQueueButton', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct properties', () => {
        expect(viewQueueButton.data).toBeInstanceOf(ButtonBuilder);
        expect(viewQueueButton.data.data.custom_id).toBe('viewqueue');
        expect(viewQueueButton.data.data.label).toBe('Queue');
        expect(viewQueueButton.data.data.style).toBe(ButtonStyle.Secondary);
    });

    test('should forward skip request', async () => {
        // Act
        await viewQueueButton.execute({ user: { tag: 'testUser' } });

        // Assert
        expect(buildQueueEmbed).toHaveBeenCalledWith({ user: { tag: 'testUser' } });
    });
});