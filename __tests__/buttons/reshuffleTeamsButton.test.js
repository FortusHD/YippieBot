// Imports
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { randomizeTeams } = require('../../src/util/teamRandomizer');
const reshuffleTeamsButton = require('../../src/buttons/reshuffleTeamsButton');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/teamRandomizer', () => ({
    randomizeTeams: jest.fn(),
}));

describe('reshuffleTeamsButton', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct properties', () => {
        expect(reshuffleTeamsButton.data).toBeInstanceOf(ButtonBuilder);
        expect(reshuffleTeamsButton.data.data.custom_id).toBe('reshuffleteams');
        expect(reshuffleTeamsButton.data.data.label).toBe('Teams neu mischen');
        expect(reshuffleTeamsButton.data.data.style).toBe(ButtonStyle.Primary);
    });

    describe('execute', () => {
        // Setup
        let mockInteraction;

        beforeEach(() => {
            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                message: {
                    embeds: [{
                        description: '7 Teilnehmer in 3 Teams',
                        fields: [
                            {
                                name: 'Team 1',
                                value: 'a, b',
                            },
                            {
                                name: 'Team 2',
                                value: 'c, d',
                            },
                            {
                                name: 'Team 3',
                                value: 'e, f, g',
                            },
                        ],
                    }],
                },
                reply: jest.fn(),
                update: jest.fn(),
            };

            randomizeTeams.mockReturnValue({ test: 'test' });
        });

        test('should reshuffle the teams', () => {
            // Act
            reshuffleTeamsButton.execute(mockInteraction);

            // Assert
            expect(randomizeTeams).toHaveBeenCalledWith(
                ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
                3,
            );
            expect(mockInteraction.update).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [expect.any(Object)],
                components: [expect.any(Object)],
            }));
        });

        test('should handle invalid combination for shuffling', () => {
            // Arrange
            randomizeTeams.mockReturnValue(null);

            // Act
            reshuffleTeamsButton.execute(mockInteraction);

            // Assert
            expect(randomizeTeams).toHaveBeenCalledWith(
                ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
                3,
            );
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Die Anzahl an Teams muss größer als 0 sein und es müssen mindestens so viele Mitglieder '
                    + 'angegeben werden, wie es Teams gibt!',
                flags: MessageFlags.Ephemeral,
            });
            expect(mockInteraction.update).not.toHaveBeenCalled();
        });

        describe('error handling scenarios', () => {
            test.each([
                {
                    name: 'mismatch between description and actual participants',
                    embed: {
                        description: '7 Teilnehmer in 3 Teams',
                        fields: [
                            { name: 'Team 1', value: 'a, b' },
                            { name: 'Team 2', value: 'c, d' },
                            { name: 'Team 3', value: 'e, f' }, // Only 6 participants
                        ],
                    },
                },
                {
                    name: 'malformed embed description format',
                    embed: {
                        description: '3 Teams mit 6 Teilnehmern',
                        fields: [
                            { name: 'Team 1', value: 'a, b' },
                            { name: 'Team 2', value: 'c, d' },
                            { name: 'Team 3', value: 'e, f' },
                        ],
                    },
                },
                {
                    name: 'null embed',
                    embed: null,
                },
                {
                    name: 'empty embed fields',
                    embed: {
                        description: '6 Teilnehmer in 3 Teams',
                        fields: [],
                    },
                },
                {
                    name: 'empty team values',
                    embed: {
                        description: '6 Teilnehmer in 3 Teams',
                        fields: [
                            { name: 'Team 1', value: '' },
                            { name: 'Team 2', value: 'c, d' },
                            { name: 'Team 3', value: 'e, f' },
                        ],
                    },
                },
            ])('should handle $name', ({ embed }) => {
                // Arrange
                mockInteraction.message.embeds[0] = embed;

                // Act
                reshuffleTeamsButton.execute(mockInteraction);

                // Assert
                expect(mockInteraction.reply).toHaveBeenCalledWith({
                    content: 'Die Teams konnten nicht neu gemischt werden.',
                    flags: MessageFlags.Ephemeral,
                });
                expect(randomizeTeams).not.toHaveBeenCalled();
                expect(mockInteraction.update).not.toHaveBeenCalled();
            });
        });
    });
});