// Imports
const { skipSong } = require('../../src/util/musicUtil');
const skip = require('../../src/commands/skip');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/musicUtil', () => ({
    skipSong: jest.fn(),
}));

describe('skip', () => {
    test('should have required properties', () => {
        expect(skip).toHaveProperty('guild', true);
        expect(skip).toHaveProperty('dm', false);
        expect(skip).toHaveProperty('player', true);
        expect(skip).toHaveProperty('help');
        expect(skip.help).toHaveProperty('category', 'Musik');
        expect(skip.help).toHaveProperty('usage');
        expect(skip).toHaveProperty('data');
        expect(skip.data).toHaveProperty('name', 'skip');
        expect(skip.data).toHaveProperty('description');
        expect(skip.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should forward skip request', async () => {
            // Act
            await skip.execute({ user: { tag: 'testUser' } });

            // Assert
            expect(skipSong).toHaveBeenCalledWith({ user: { tag: 'testUser' } });
        });
    });
});
