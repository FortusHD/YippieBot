// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { skipSong } = require('../../src/util/musicUtil');
const skipButton = require('../../src/buttons/skipButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));
jest.mock('../../src/util/musicUtil', () => ({
    skipSong: jest.fn(),
}));

describe('skipButton', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct properties', () => {
        expect(skipButton.data).toBeInstanceOf(ButtonBuilder);
        expect(skipButton.data.data.custom_id).toBe('skipsong');
        expect(skipButton.data.data.label).toBe('Skip');
        expect(skipButton.data.data.style).toBe(ButtonStyle.Primary);
    });

    test('should forward skip request', async () => {
        // Act
        await skipButton.execute({ user: { tag: 'testUser' } });

        // Assert
        expect(skipSong).toHaveBeenCalledWith({ user: { tag: 'testUser' } });
    });
});