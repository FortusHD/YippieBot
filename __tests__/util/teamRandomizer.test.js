// Imports
const logger = require('../../src/logging/logger');
const { buildEmbed, shuffleArray } = require('../../src/util/util');
const { randomizeTeams } = require('../../src/util/teamRandomizer');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn(),
    shuffleArray: jest.fn(),
}));

describe('teamRandomizer', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        buildEmbed.mockReturnValue({ test: 'test' });
        shuffleArray.mockReturnValue(['test4', 'test3', 'test1', 'test2']);
    });

    test('should return shuffled teams', () => {
        // Act
        const result = randomizeTeams(['test1', 'test2', 'test3', 'test4'], 2);

        // Assert
        expect(result).not.toBeNull();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2 team(s) where created '));
        expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
            title: expect.stringContaining('Teams'),
            description: expect.stringContaining('4 Teilnehmer in 2 Teams.'),
            fields: expect.any(Array),
        }));
        expect(buildEmbed.mock.calls[0][0].fields).toHaveLength(2);
    });

    test('should return shuffled teams with leftover participants', () => {
        // Arrange
        shuffleArray.mockReturnValue(['test4', 'test3', 'test1', 'test2', 'test5']);

        // Act
        const result = randomizeTeams(['test1', 'test2', 'test3', 'test4', 'test5'], 2);

        // Assert
        expect(result).not.toBeNull();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2 team(s) where created '));
        expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
            title: expect.stringContaining('Teams'),
            description: expect.stringContaining('5 Teilnehmer in 2 Teams.'),
            fields: expect.any(Array),
        }));
        expect(buildEmbed.mock.calls[0][0].fields).toHaveLength(2);
    });

    const invalidInput = [
        [0, ''],
        [1, 'test1'],
    ];

    test.each(invalidInput)('should handle invalid input', (teamNumber, participants) => {
        // Act
        const result = randomizeTeams(participants, teamNumber);

        // Assert
        expect(result).toBeNull();
        expect(buildEmbed).not.toHaveBeenCalled();
    });
});