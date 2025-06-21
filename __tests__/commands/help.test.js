// Imports
const { MessageFlags } = require('discord.js');
const { buildHelpEmbed, buildAllCommandsEmbed } = require('../../src/util/embedBuilder');
const help = require('../../src/commands/help');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildHelpEmbed: jest.fn(),
    buildAllCommandsEmbed: jest.fn(),
}));

describe('help', () => {
    test('should have required properties', () => {
        // Assert
        expect(help).toHaveProperty('guild', true);
        expect(help).toHaveProperty('dm', true);
        expect(help).toHaveProperty('data');
        expect(help).toHaveProperty('help');
        expect(help.help).toHaveProperty('usage');
        expect(help.data).toHaveProperty('name', 'help');
        expect(help.data).toHaveProperty('description');
        expect(help.data.options).toHaveLength(1);
        expect(help.data.options[0]).toHaveProperty('name', 'command');
        expect(help.data.options[0]).toHaveProperty('description');
        expect(help.data.options[0]).toHaveProperty('type', 3);
        expect(help.data.options[0]).toHaveProperty('required', false);
    });

    describe('execute', () => {
        let mockCommand;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockCommand = {
                data: {
                    name: 'test',
                    description: 'test',
                },
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                client: {
                    commands: {
                        get: jest.fn().mockReturnValue(mockCommand),
                    },
                },
                options: {
                    getString: jest.fn().mockReturnValue(null),
                },
                reply: jest.fn(),
            };

            buildHelpEmbed.mockReturnValue({ test: 'test' });
            buildAllCommandsEmbed.mockReturnValue({ test: 'test' });
        });

        test('should return all commands', async () => {
            // Act
            await help.execute(mockInteraction);

            // Assert
            expect(buildAllCommandsEmbed).toHaveBeenCalledWith(mockInteraction.client.commands);
            expect(mockInteraction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
            expect(buildHelpEmbed).not.toHaveBeenCalled();
        });

        test.each(['test', 'TEST', 'Test'])('should return help for command "%s"', async (command) => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue(command);

            // Act
            await help.execute(mockInteraction);

            // Assert
            expect(buildHelpEmbed).toHaveBeenCalledWith(mockCommand);
            expect(mockInteraction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
            expect(buildAllCommandsEmbed).not.toHaveBeenCalled();
        });

        test('should handle invalid command', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue('invalid');
            mockInteraction.client.commands.get.mockReturnValue(null);

            // Act
            await help.execute(mockInteraction);

            // Assert
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: expect.stringContaining('invalid'),
                flags: MessageFlags.Ephemeral,
            });
            expect(buildAllCommandsEmbed).not.toHaveBeenCalled();
            expect(buildHelpEmbed).not.toHaveBeenCalled();
        });
    });
});