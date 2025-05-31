// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const teams = require('../../src/commands/teams');
const { randomizeTeams } = require('../../src/util/teamRandomizer');
// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/teamRandomizer', () => ({
    randomizeTeams: jest.fn(),
}));

describe('teams', () => {
    test('should have required properties', () => {
        expect(teams).toHaveProperty('guild', true);
        expect(teams).toHaveProperty('dm', true);
        expect(teams).toHaveProperty('data');
        expect(teams.data).toHaveProperty('name', 'teams');
        expect(teams.data).toHaveProperty('description');
        expect(teams.data.options).toHaveLength(2);
        expect(teams.data.options[0]).toHaveProperty('name', 'team-number');
        expect(teams.data.options[0]).toHaveProperty('description');
        expect(teams.data.options[0]).toHaveProperty('type', 4);
        expect(teams.data.options[0]).toHaveProperty('required', true);
        expect(teams.data.options[1]).toHaveProperty('name', 'participants');
        expect(teams.data.options[1]).toHaveProperty('description');
        expect(teams.data.options[1]).toHaveProperty('type', 3);
        expect(teams.data.options[1]).toHaveProperty('required', true);
    });

    describe('execute', () => {
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                options: {
                    getInteger: jest.fn().mockReturnValue(2),
                    getString: jest.fn().mockReturnValue('test1,test2,test3,test4'),
                },
                reply: jest.fn(),
            };

            randomizeTeams.mockReturnValue({ test: 'test' });
        });

        test('should return shuffled teams', async () => {
            // Act
            await teams.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling teams command used by "testUser".');
            expect(randomizeTeams).toHaveBeenCalledWith(['test1', 'test2', 'test3', 'test4'], 2);
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.any(Object));
        });

        test('should handle invalid input', async () => {
            // Arrange
            randomizeTeams.mockReturnValue(null);

            // Act
            await teams.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling teams command used by "testUser".');
            expect(randomizeTeams).toHaveBeenCalledWith(['test1', 'test2', 'test3', 'test4'], 2);
            expect(logger.info).toHaveBeenCalledWith('"testUser" requested teams, but team number was not '
                + 'greater than 0 or not enough participants where entered.');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Die Anzahl an Teams muss größer als 0 sein und es müssen mindestens so viele Mitglieder '
                    + 'angegeben werden, wie es Teams gibt!',
                flags: MessageFlags.Ephemeral,
            });
        });
    });
});