// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const jsonManager = require('../../src/util/json_manager');
const { editInteractionReply } = require('../../src/util/util');
const { buildEmbed } = require('../../src/util/embedBuilder');
const { getGuildId, getWichtelChannelId, getEnv } = require('../../src/util/config');
const { handleError, ErrorType } = require('../../src/logging/errorHandler');
const { startWichtelLoop } = require('../../src/threads/wichtelLoop');
const wichteln = require('../../src/commands/wichteln');
// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/json_manager', () => ({
    resetParticipants: jest.fn(),
    updateMessageID: jest.fn(),
    setWichtelData: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    editInteractionReply: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getGuildId: jest.fn(),
    getWichtelChannelId: jest.fn(),
    getEnv: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    ...jest.requireActual('../../src/logging/errorHandler'),
    handleError: jest.fn(),
}));

jest.mock('../../src/threads/wichtelLoop', () => ({
    startWichtelLoop: jest.fn(),
}));

jest.mock('../../src/buttons/participateButton', () => ({
    data: {},
}));

jest.mock('../../src/buttons/participantsButton', () => ({
    data: {},
}));

jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn(),
}));

describe('wichteln', () => {
    test('should have required properties', () => {
        expect(wichteln).toHaveProperty('guild', true);
        expect(wichteln).toHaveProperty('dm', true);
        expect(wichteln).toHaveProperty('devOnly', true);
        expect(wichteln).toHaveProperty('help');
        expect(wichteln.help).toHaveProperty('usage');
        expect(wichteln).toHaveProperty('data');
        expect(wichteln.data).toHaveProperty('name', 'wichteln');
        expect(wichteln.data).toHaveProperty('description');
        expect(wichteln.data.contexts).toHaveLength(2);
        expect(wichteln.data.options).toHaveLength(2);
        expect(wichteln.data.options[0]).toHaveProperty('name', 'wichtel-date');
        expect(wichteln.data.options[0]).toHaveProperty('description');
        expect(wichteln.data.options[0]).toHaveProperty('type', 3);
        expect(wichteln.data.options[0]).toHaveProperty('required', true);
        expect(wichteln.data.options[1]).toHaveProperty('name', 'participating-time');
        expect(wichteln.data.options[1]).toHaveProperty('description');
        expect(wichteln.data.options[1]).toHaveProperty('type', 4);
        expect(wichteln.data.options[1]).toHaveProperty('required', true);
    });

    describe('execute', () => {
        let mockMessage;
        let mockChannel;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();

            jest.setSystemTime(new Date('2025-12-01T15:00:00Z'));

            mockMessage = {
                id: '789',
            };

            mockChannel = {
                id: '123',
                send: jest.fn().mockResolvedValue(mockMessage),
            };

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                options: {
                    getString: jest.fn().mockReturnValue('18.12.2025, 15:00'),
                    getInteger: jest.fn().mockReturnValue(10),
                },
                client: {
                    guilds: {
                        cache: {
                            get: jest.fn().mockReturnValue({
                                channels: {
                                    cache: {
                                        get: jest.fn().mockReturnValue(mockChannel),
                                    },
                                },
                            }),
                        },
                    },
                },
                reply: jest.fn(),
            };

            buildEmbed.mockReturnValue({ test: 'test' });
            getGuildId.mockReturnValue('1234');
            getWichtelChannelId.mockReturnValue('123');
            getEnv.mockReturnValue('false');
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should start wichtel loop', async () => {
            // Act
            await wichteln.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling wichtel command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Wichteln wird gestartet');
            expect(jsonManager.resetParticipants).toHaveBeenCalled();
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                color: expect.any(Number),
                title: 'Wichteln',
                description: expect.stringMatching(
                    /(?=.*\*\*18.12.2025 um 15:00 Uhr\*\*)(?=.*\*\*11.12.2025 um 23:59 Uhr\*\*)/s,
                ),
            }));
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
                components: [expect.any(Object)],
            });
            expect(jsonManager.updateMessageID).toHaveBeenCalledWith('wichtelId', mockMessage.id);
            expect(jsonManager.setWichtelData).toHaveBeenCalledWith(
                '11.12.2025, 23:59:59',
                '18.12.2025 um 15:00 Uhr',
            );
            expect(startWichtelLoop).toHaveBeenCalledWith(mockInteraction.client);
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, 'Das Wichteln wurde gestartet.');
            expect(logger.info).toHaveBeenCalledWith('Wichteln was started by "testUser".');
        });

        test('should add 2 mins instead of days when testing', async () => {
            // Arrange
            getEnv.mockReturnValue('true');

            // Act
            await wichteln.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling wichtel command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Wichteln wird gestartet');
            expect(jsonManager.resetParticipants).toHaveBeenCalled();
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                color: expect.any(Number),
                title: 'Wichteln',
                description: expect.stringMatching(
                    /(?=.*\*\*18.12.2025 um 15:00 Uhr\*\*)(?=.*\*\*01.12.2025 um 23:59 Uhr\*\*)/s,
                ),
            }));
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
                components: [expect.any(Object)],
            });
            expect(jsonManager.updateMessageID).toHaveBeenCalledWith('wichtelId', mockMessage.id);
            expect(jsonManager.setWichtelData).toHaveBeenCalledWith(
                '01.12.2025, 16:02:00',
                '18.12.2025 um 15:00 Uhr',
            );
            expect(startWichtelLoop).toHaveBeenCalledWith(mockInteraction.client);
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, 'Das Wichteln wurde gestartet.');
            expect(logger.info).toHaveBeenCalledWith('Wichteln was started by "testUser".');
        });

        test('should handle error when sending wichtel embed', async () => {
            // Arrange
            mockChannel.send.mockResolvedValue(null);

            // Act
            await wichteln.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling wichtel command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Wichteln wird gestartet');
            expect(jsonManager.resetParticipants).toHaveBeenCalled();
            expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
                color: expect.any(Number),
                title: 'Wichteln',
                description: expect.stringMatching(
                    /(?=.*\*\*18.12.2025 um 15:00 Uhr\*\*)(?=.*\*\*11.12.2025 um 23:59 Uhr\*\*)/s,
                ),
            }));
            expect(mockChannel.send).toHaveBeenCalledWith({
                embeds: [expect.any(Object)],
                components: [expect.any(Object)],
            });
            expect(jsonManager.updateMessageID).not.toHaveBeenCalled();
            expect(handleError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.any(String),
                expect.objectContaining({
                    type: ErrorType.MESSAGE_NOT_SENT,
                    interaction: mockInteraction,
                }),
            );
            expect(jsonManager.setWichtelData).toHaveBeenCalledWith(
                '11.12.2025, 23:59:59',
                '18.12.2025 um 15:00 Uhr',
            );
            expect(startWichtelLoop).toHaveBeenCalledWith(mockInteraction.client);
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, 'Das Wichteln wurde gestartet.');
            expect(logger.info).toHaveBeenCalledWith('Wichteln was started by "testUser".');
        });

        test('should handle missing wichtel channel', async () => {
            // Arrange
            mockInteraction.client.guilds.cache.get.mockReturnValue(
                { channels: { cache: { get: jest.fn().mockReturnValue(null) } } },
            );

            // Act
            await wichteln.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling wichtel command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Wichteln wird gestartet');
            expect(logger.info).toHaveBeenCalledWith('The wichtel-channel with id 123 could not be found.');
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, {
                content: 'Der Wichtel-Channel konnte nicht gefunden werden!',
                flags: MessageFlags.Ephemeral,
            });
            expect(jsonManager.resetParticipants).not.toHaveBeenCalled();
            expect(buildEmbed).not.toHaveBeenCalled();
            expect(jsonManager.updateMessageID).not.toHaveBeenCalled();
            expect(jsonManager.setWichtelData).not.toHaveBeenCalled();
            expect(startWichtelLoop).not.toHaveBeenCalled();
        });

        test('should handle invalid input', async () => {
            // Arrange
            mockInteraction.options.getString.mockReturnValue('abc');

            // Act
            await wichteln.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling wichtel command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('Wichteln wird gestartet');
            expect(logger.info).toHaveBeenCalledWith(
                '"testUser" entered a datetime with wrong regex when starting the wichteln.',
            );
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, {
                content: 'Du hast das "wichtel-date" falsch angegeben!',
                flags: MessageFlags.Ephemeral,
            });
            expect(jsonManager.resetParticipants).not.toHaveBeenCalled();
            expect(buildEmbed).not.toHaveBeenCalled();
            expect(jsonManager.updateMessageID).not.toHaveBeenCalled();
            expect(jsonManager.setWichtelData).not.toHaveBeenCalled();
            expect(startWichtelLoop).not.toHaveBeenCalled();
        });
    });
});