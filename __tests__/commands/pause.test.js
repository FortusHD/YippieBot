// Imports
const pause = require('../../src/commands/pause');
const { pauseOrResumePlayer } = require('../../src/util/musicUtil');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/musicUtil', () => ({
    pauseOrResumePlayer: jest.fn(),
}));

describe('pause', () => {
    test('should have required properties', () => {
        // Assert
        expect(pause).toHaveProperty('guild', true);
        expect(pause).toHaveProperty('dm', false);
        expect(pause).toHaveProperty('player', true);
        expect(pause).toHaveProperty('help');
        expect(pause.help).toHaveProperty('category', 'Musik');
        expect(pause.help).toHaveProperty('usage');
        expect(pause).toHaveProperty('data');
        expect(pause.data).toHaveProperty('name', 'pause');
        expect(pause.data).toHaveProperty('description');
        expect(pause.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should forward pause/play request', async () => {
            // Act
            await pause.execute({ user: { tag: 'testUser' } });

            // Assert
            expect(pauseOrResumePlayer).toHaveBeenCalledWith({ user: { tag: 'testUser' } });
        });
    });
});