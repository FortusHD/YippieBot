// Imports
const logger = require('../../src/logging/logger.js');
const { buildEmbed } = require('../../src/util/embedBuilder');
const rollHelp = require('../../src/commands/rollHelp');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

describe('rollHelp', () => {
    test('should have required properties', () => {
        expect(rollHelp).toHaveProperty('guild', true);
        expect(rollHelp).toHaveProperty('dm', true);
        expect(rollHelp).toHaveProperty('help');
        expect(rollHelp.help).toHaveProperty('usage');
        expect(rollHelp).toHaveProperty('data');
        expect(rollHelp.data).toHaveProperty('name', 'rollhelp');
        expect(rollHelp.data).toHaveProperty('description');
        expect(rollHelp.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        test('should send help embed', async () => {
            // Arrange
            const mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                reply: jest.fn(),
            };
            buildEmbed.mockReturnValue({ test: 'test' });

            // Act
            await rollHelp.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling rollHelp command used by "testUser".');
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('Hilfe'),
                fields: expect.any(Array),
            }));
            expect(buildEmbed.mock.calls[0][0].fields).toHaveLength(6);
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
            });
        });
    });
});