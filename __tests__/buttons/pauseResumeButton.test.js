// Imports
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { pauseOrResumePlayer } = require('../../src/util/musicUtil');
const pauseResumeButton = require('../../src/buttons/pauseResumeButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));
jest.mock('../../src/util/musicUtil', () => ({
    pauseOrResumePlayer: jest.fn(),
}));

describe('pauseResumeButton', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct properties', () => {
        expect(pauseResumeButton.data).toBeInstanceOf(ButtonBuilder);
        expect(pauseResumeButton.data.data.custom_id).toBe('pauseresume');
        expect(pauseResumeButton.data.data.label).toBe('Pause/Resume');
        expect(pauseResumeButton.data.data.style).toBe(ButtonStyle.Success);
    });

    test('should forward pause/play request', async () => {
        // Act
        await pauseResumeButton.execute({ user: { tag: 'testUser' } });

        // Assert
        expect(pauseOrResumePlayer).toHaveBeenCalledWith({ user: { tag: 'testUser' } });
    });
});