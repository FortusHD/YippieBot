// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { buildEmbed } = require('../../src/util/util');
const rollDice = require('../../src/commands/rollDice');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn(),
}));

describe('rollDice', () => {
    test('should have required properties', () => {
        expect(rollDice).toHaveProperty('guild', true);
        expect(rollDice).toHaveProperty('dm', true);
        expect(rollDice).toHaveProperty('data');
        expect(rollDice.data).toHaveProperty('name', 'roll');
        expect(rollDice.data).toHaveProperty('description');
        expect(rollDice.data.options).toHaveLength(1);
        expect(rollDice.data.options[0]).toHaveProperty('name', 'prompt');
        expect(rollDice.data.options[0]).toHaveProperty('description');
        expect(rollDice.data.options[0]).toHaveProperty('type', 3);
        expect(rollDice.data.options[0]).toHaveProperty('required', true);
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
                    getString: jest.fn(),
                },
                reply: jest.fn(),
            };

            buildEmbed.mockReturnValue({ mock: 'embed' });
        });

        test('should handle valid input and generate dice rolls', async () => {
            // Arrange
            const input = '2d6+4';
            mockInteraction.options.getString.mockReturnValue(input);

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling roll command used by "testUser".',
            );
            expect(buildEmbed).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Würfelergebnisse',
                    description: `Du hast \`${input}\` gewürfelt.`,
                }),
            );
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
            });
        });

        test('should handle kept dice (kh)', async () => {
            // Arrange
            const input = '4d6kh2';
            mockInteraction.options.getString.mockReturnValue(input);

            // Mock dice rolls
            jest.spyOn(global.Math, 'random')
                .mockReturnValueOnce(0.7) // 5
                .mockReturnValueOnce(0.5) // 4
                .mockReturnValueOnce(0.2) // 2
                .mockReturnValueOnce(0.9); // 6

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(buildEmbed).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: '__4 × D6__ (kh2)',
                            value: '**Würfe:** 5, 4, 2, 6\n**Gehalten:** 6, 5\n**Ergebnis:** 6 + 5 = 11',
                        }),
                    ]),
                }),
            );
        });

        test('should handle kept dice (kl)', async () => {
            // Arrange
            const input = '4d6kl';
            mockInteraction.options.getString.mockReturnValue(input);

            // Mock dice rolls
            jest.spyOn(global.Math, 'random')
                .mockReturnValueOnce(0.7) // 5
                .mockReturnValueOnce(0.5) // 4
                .mockReturnValueOnce(0.2) // 2
                .mockReturnValueOnce(0.9); // 6

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(buildEmbed).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: '__4 × D6__ (kl)',
                            value: '**Würfe:** 5, 4, 2, 6\n**Gehalten:** 2',
                        }),
                    ]),
                }),
            );

            Math.random.mockRestore();
        });

        test('should handle kept dice with negative modifier', async () => {
            // Arrange
            const input = '4d6kh2-1';
            mockInteraction.options.getString.mockReturnValue(input);

            // Mock dice rolls
            jest.spyOn(global.Math, 'random')
                .mockReturnValueOnce(0.7) // 5
                .mockReturnValueOnce(0.5) // 4
                .mockReturnValueOnce(0.2) // 2
                .mockReturnValueOnce(0.9); // 6

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(buildEmbed).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: '__4 × D6__ (kh2 | -1)',
                            value: '**Würfe:** 5, 4, 2, 6\n**Gehalten:** 6, 5\n**Ergebnis:** 6 + 5 - 1 = 10',
                        }),
                    ]),
                }),
            );

            Math.random.mockRestore();
        });

        test('should handle single die', async () => {
            // Arrange
            const input = 'd6';
            mockInteraction.options.getString.mockReturnValue(input);

            // Mock die roll
            jest.spyOn(global.Math, 'random')
                .mockReturnValueOnce(0.7); // 5

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(buildEmbed).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: '__1 × D6__',
                            value: '**Wurf:** 5',
                        }),
                    ]),
                }),
            );

            Math.random.mockRestore();
        });

        test('should handle single die with modifier', async () => {
            // Arrange
            const input = 'd6+3';
            mockInteraction.options.getString.mockReturnValue(input);

            // Mock die roll
            jest.spyOn(global.Math, 'random')
                .mockReturnValueOnce(0.7); // 5

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(buildEmbed).toHaveBeenCalledWith(
                expect.objectContaining({
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: '__1 × D6__ (+3)',
                            value: '**Wurf:** 5\n**Ergebnis:** 5 + 3 = 8',
                        }),
                    ]),
                }),
            );

            Math.random.mockRestore();
        });

        test('should handle empty results', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue('0d6');

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Es konnten leider keine Würfelergebnisse erstellt werden.',
                flags: MessageFlags.Ephemeral,
            });
        });

        test('should handle invalid input format', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue('invalid input');

            // Act
            await rollDice.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith(
                'Handling roll command used by "testUser".',
            );
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Bitte überprüfe deine Eingabe. Falls du Hilfe brauchst, verwende bitte `/rollhelp`',
                flags: MessageFlags.Ephemeral,
            });
        });

    });
});