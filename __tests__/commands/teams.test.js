// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { buildEmbed } = require('../../src/util/util');
const teams = require('../../src/commands/teams');
// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn(),
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

            buildEmbed.mockReturnValue({ test: 'test' });
        });

        test('should return shuffled teams', async () => {
            // Act
            await teams.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling teams command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2 team(s) where created '));
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('Teams'),
                description: expect.stringContaining('4 Teilnehmer in 2 Teams.'),
                fields: expect.any(Array),
            }));
            expect(buildEmbed.mock.calls[0][0].fields).toHaveLength(2);
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.any(Object));
        });

        test('should return shuffled teams with leftover participants', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue('test1,test2,test3,test4,test5');

            // Act
            await teams.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling teams command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2 team(s) where created '));
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('Teams'),
                description: expect.stringContaining('5 Teilnehmer in 2 Teams.'),
                fields: expect.any(Array),
            }));
            expect(buildEmbed.mock.calls[0][0].fields).toHaveLength(2);
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.any(Object));
        });

        const invalidInput = [
            [0, ''],
            [1, 'test1'],
        ];

        test.each(invalidInput)('should handle invalid input', async (teamNumber, participants) => {
            // Arrange
            mockInteraction.options.getInteger.mockReturnValue(teamNumber);
            mockInteraction.options.getString.mockReturnValue(participants);

            // Act
            await teams.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling teams command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('"testUser" requested teams, but team number was not greater '
                + 'than 0 or not enough participants where entered.');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Die Anzahl an Teams muss größer als 0 sein und es müssen mindestens so viele Mitglieder '
                    + 'angegeben werden, wie es Teams gibt!',
                flags: MessageFlags.Ephemeral,
            });
        });
    });
});