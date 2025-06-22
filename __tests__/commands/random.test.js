// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { getRandomColor } = require('../../src/util/util');
const { buildEmbed } = require('../../src/util/embedBuilder');
const random = require('../../src/commands/random');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    getRandomColor: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

describe('random', () => {
    test('should have required properties', () => {
        expect(random).toHaveProperty('guild', true);
        expect(random).toHaveProperty('dm', true);
        expect(random).toHaveProperty('data');
        expect(random).toHaveProperty('help');
        expect(random.help).toHaveProperty('category', 'Zufall');
        expect(random.help).toHaveProperty('usage');
        expect(random.data).toHaveProperty('name', 'random');
        expect(random.data).toHaveProperty('description');
        expect(random.data.options).toHaveLength(1);
        expect(random.data.options[0]).toHaveProperty('name', 'objects');
        expect(random.data.options[0]).toHaveProperty('description');
        expect(random.data.options[0]).toHaveProperty('type', 3);
        expect(random.data.options[0]).toHaveProperty('required', true);
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
                    getString: jest.fn().mockReturnValue('test1, test2, test3'),
                },
                reply: jest.fn(),
            };

            getRandomColor.mockReturnValue(0x000aff);
            buildEmbed.mockReturnValue({ test: 'test' });
        });

        test('should return random object', async () => {
            // Act
            await random.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling random command used by "testUser".');
            expect(getRandomColor).toHaveBeenCalled();
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                color: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
                origin: expect.any(String),
                fields: [
                    expect.objectContaining({
                        name: expect.any(String),
                        value: '3',
                    }),
                    expect.objectContaining({
                        name: 'Wahrscheinlichkeit:',
                        value: expect.any(String),
                    }),
                    expect.objectContaining({
                        name: 'Gewinner:',
                        value: expect.stringContaining('test'),
                    }),
                ],
            }));
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
            });
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('"testUser" got'));
        });

        test('should handle invalid input', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue(null);

            // Act
            await random.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling random command used by "testUser".');
            expect(logger.info).toHaveBeenCalledWith('"testUser" did not give enough objects to select from ' +
                'when using random.');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Es wurden keine Objekte zum Auswählen angegeben.',
                flags: MessageFlags.Ephemeral,
            });
            expect(getRandomColor).not.toHaveBeenCalled();
            expect(buildEmbed).not.toHaveBeenCalled();
        });
    });
});