// Imports
const { MessageFlags } = require('discord.js');
const axios = require('axios');
const logger = require('../../src/logging/logger');
const { getRandomColor } = require('../../src/util/util');
const { buildEmbed } = require('../../src/util/embedBuilder');
const randomUser = require('../../src/commands/randomUser');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    getRandomColor: jest.fn(),
}));

jest.mock('axios', () => ({
    request: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getEnv: jest.fn().mockReturnValue('https://www.link.com/gif-creator'),
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

describe('randomUser', () => {
    test('should have required properties', () => {
        expect(randomUser).toHaveProperty('guild', true);
        expect(randomUser).toHaveProperty('dm', false);
        expect(randomUser).toHaveProperty('help');
        expect(randomUser.help).toHaveProperty('usage');
        expect(randomUser).toHaveProperty('data');
        expect(randomUser.data).toHaveProperty('name', 'randomuser');
        expect(randomUser.data).toHaveProperty('description');
        expect(randomUser.data.options).toHaveLength(10);

        for (let i = 1; i <= 10; i++) {
            expect(randomUser.data.options[i - 1]).toHaveProperty('name', `user${i}`);
            expect(randomUser.data.options[i - 1]).toHaveProperty('description');
            expect(randomUser.data.options[i - 1]).toHaveProperty('type', 6);
            expect(randomUser.data.options[i - 1]).toHaveProperty('required', i <= 2);
        }
    });

    describe('execute', () => {
        let mockMessage;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();

            mockMessage = {
                edit: jest.fn(),
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                options: {
                    getUser: jest.fn().mockImplementation((i) => {
                        if (i === 'user10') {
                            return null;
                        }

                        return {
                            id: '874267312',
                            displayAvatarURL: jest.fn().mockReturnValue(`https://www.link.com/avatar${i}.png`),
                        };
                    }),
                },
                deferReply: jest.fn(),
                editReply: jest.fn().mockResolvedValue(mockMessage),
            };

            axios.request.mockResolvedValue({
                data: {
                    filename: 'test.gif',
                },
            });
            getRandomColor.mockReturnValue(0x000aff);
            buildEmbed.mockReturnValue({
                test: 'test',
                setTitle: jest.fn(),
                setDescription: jest.fn(),
                setImage: jest.fn(),
            });
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should send embed with random user, after sending generating embed', async () => {
            // Act
            await randomUser.execute(mockInteraction);
            await jest.advanceTimersByTimeAsync(8000);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling randomUser command used by "testUser".');
            expect(mockInteraction.deferReply).toHaveBeenCalled();
            expect(axios.request).toHaveBeenCalledWith({
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://www.link.com/gif-creator',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: expect.stringContaining('https://www.link.com/avataruser1.png'),
            });
            expect(getRandomColor).toHaveBeenCalled();
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                color: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
                origin: expect.any(String),
                image: expect.stringContaining('test.gif'),
            }));
            expect(mockInteraction.editReply).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
            });
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('was selected'));
            expect(mockMessage.edit).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
            });
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('"testUser" got'));
        });

        test('should handle invalid input', async () => {
            // Arrange
            mockInteraction.options.getUser.mockReturnValue(null);

            // Act
            await randomUser.execute(mockInteraction);

            // Arrange
            expect(logger.info).toHaveBeenCalledWith('Handling randomUser command used by "testUser".');
            expect(mockInteraction.deferReply).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('"testUser" did not give enough users to select from ' +
                'when using randomUser.');
            expect(mockInteraction.editReply).toHaveBeenCalledWith({
                content: 'Es wurden keine Benutzer zum Auswählen angegeben.',
                flags: MessageFlags.Ephemeral,
            });
            expect(axios.request).not.toHaveBeenCalled();
        });

        test('should handle error when sending axios request', async () => {
            // Arrange
            axios.request.mockResolvedValue(null);

            // Act
            await randomUser.execute(mockInteraction);
            await jest.advanceTimersByTimeAsync(8000);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling randomUser command used by "testUser".');
            expect(mockInteraction.deferReply).toHaveBeenCalled();
            expect(axios.request).toHaveBeenCalledWith({
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://www.link.com/gif-creator',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: expect.stringContaining('https://www.link.com/avataruser1.png'),
            });
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Error while generating random user gif:'),
            );
            expect(mockInteraction.editReply).toHaveBeenCalledWith({
                content: expect.stringContaining('Beim generieren vom Bild ist ein Fehler aufgetreten.'),
                flags: MessageFlags.Ephemeral,
            });
            expect(getRandomColor).not.toHaveBeenCalled();
            expect(buildEmbed).not.toHaveBeenCalled();
        });
    });
});