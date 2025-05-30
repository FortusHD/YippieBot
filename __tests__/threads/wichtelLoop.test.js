// Imports
const logger = require('../../src/logging/logger');
const {
    getWichteln,
    getWichtelEnd,
    getWichtelTime,
    getMessageID,
    getParticipants,
    resetWichtelData,
} = require('../../src/util/json_manager');
const { buildEmbed } = require('../../src/util/util');
const datetime = require('date-and-time');
const { startWichtelLoop, endWichteln } = require('../../src/threads/wichtelLoop');

// Mock dependencies
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));
jest.mock('../../src/util/json_manager', () => ({
    getWichteln: jest.fn(),
    getWichtelEnd: jest.fn(),
    getWichtelTime: jest.fn(),
    getMessageID: jest.fn(),
    updateMessageID: jest.fn(),
    getParticipants: jest.fn(),
    resetWichtelData: jest.fn(),
}));
jest.mock('../../src/util/util', () => ({
    buildEmbed: jest.fn().mockReturnValue({
        toJSON: () => ({
            color: 0xDB27B7,
            title: 'Wichtel-Post',
            description: expect.any(String),
            fields: expect.any(Array),
        }),
    }),
}));
jest.mock('../../src/util/config', () => ({
    getGuildId: jest.fn().mockReturnValue('guildId'),
    getWichtelChannelId: jest.fn().mockReturnValue('channelId'),
}));

describe('wichtelLoop', () => {
    let mockClient;
    let mockSetInterval;
    let mockChannel;
    let mockGuild;
    let mockUser;
    let mockMessage;
    let messagesFetchPromise;
    let userFetchPromise;
    let deletePromise;
    let sendPromise;
    let dmSendPromise;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        deletePromise = Promise.resolve();

        sendPromise = Promise.resolve();
        dmSendPromise = Promise.resolve();

        mockMessage = {
            delete: jest.fn().mockReturnValue(deletePromise),
        };

        messagesFetchPromise = Promise.resolve({
            size: 1,
            get: jest.fn().mockReturnValue(mockMessage),
        });

        mockChannel = {
            messages: {
                fetch: jest.fn().mockReturnValue(messagesFetchPromise),
            },
            send: jest.fn().mockReturnValue(sendPromise),
        };

        mockUser = {
            send: jest.fn().mockReturnValue(dmSendPromise),
        };

        userFetchPromise = Promise.resolve(mockUser);

        mockGuild = {
            channels: {
                cache: {
                    get: jest.fn().mockReturnValue(mockChannel),
                },
            },
        };

        mockClient = {
            guilds: {
                cache: {
                    get: jest.fn().mockReturnValue(mockGuild),
                },
            },
            users: {
                fetch: jest.fn().mockReturnValue(userFetchPromise),
            },
        };

        mockSetInterval = jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
            mockSetInterval.mockCallback = cb;
            return 123;
        });

        getWichteln.mockReturnValue(true);
        getWichtelEnd.mockReturnValue('01.01.2024, 12:00:00');
        getWichtelTime.mockReturnValue('25.12.2023, 20:00');
        getMessageID.mockReturnValue('messageId');
        getParticipants.mockReturnValue([
            { id: '1', dcName: 'user1', steamName: 'steam1', steamFriendCode: 'code1' },
            { id: '2', dcName: 'user2', steamName: 'steam2', steamFriendCode: 'code2' },
        ]);
    });

    afterEach(() => {
        jest.clearAllTimers();
        mockSetInterval.mockRestore();
    });

    test('startWichtelLoop initializes when wichteln is true', async () => {
        // Act
        await startWichtelLoop(mockClient);

        // Assert
        expect(logger.info).toHaveBeenCalledWith('Starting "wichtelLoop"');
        expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    test('startWichtelLoop does not initialize when wichteln is false', async () => {
        // Arrange
        getWichteln.mockReturnValue(false);

        // Act
        await startWichtelLoop(mockClient);

        // Assert
        expect(logger.info).not.toHaveBeenCalledWith('Starting "wichtelLoop"');
        expect(mockSetInterval).not.toHaveBeenCalled();
    });

    test('wichtelLoop ends when current time exceeds end time', async () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() - 1);
        getWichtelEnd.mockReturnValue(datetime.format(futureDate, 'DD.MM.YYYY, HH:mm:ss'));

        // Act
        await startWichtelLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(process.nextTick);

        // Assert
        expect(resetWichtelData).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Ending "wichtelLoop"');
        expect(logger.info).toHaveBeenCalledWith('"wichtelLoop" ended automatically');
    });

    test('wichtelLoop handles invalid end date format', async () => {
        // Arrange
        getWichtelEnd.mockReturnValue('invalid-date');

        // Act
        await startWichtelLoop(mockClient);
        mockSetInterval.mockCallback();

        // Assert
        expect(resetWichtelData).toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No end date found'));
    });

    test('endWichteln matches participants and sends DMs', async () => {
        // Act
        await startWichtelLoop(mockClient);
        const result = await endWichteln();
        await new Promise(process.nextTick);

        // Assert
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/Ending Wichteln at .*/));
        expect(mockClient.users.fetch).toHaveBeenCalled();
        expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
            color: 0xDB27B7,
            title: 'Wichtel-Post',
            description: expect.any(String),
            fields: expect.any(Array),
        }));
        expect(mockUser.send).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
        expect(result).toBe('Das Wichteln wurde beendet!');
    });
    test('endWichteln handles no participants', async () => {
        // Arrange
        getParticipants.mockReturnValue([]);

        // Act
        await startWichtelLoop(mockClient);
        await endWichteln();
        await Promise.all([messagesFetchPromise, deletePromise, sendPromise]);

        // Assert
        expect(mockChannel.send).toHaveBeenCalledWith(
            expect.stringContaining('Leider haben nicht genug Personen am Schrottwichteln teilgenommen'),
        );
        expect(buildEmbed).not.toHaveBeenCalled();
    });

    test('endWichteln handles missing wichtel channel', async () => {
        // Arrange
        mockGuild.channels.cache.get.mockReturnValue(undefined);

        // Act
        await startWichtelLoop(mockClient);
        const result = await endWichteln();

        // Assert
        expect(result).toBe('Der Wichtel-Channel konnte nicht gefunden werden!');
        expect(logger.warn).toHaveBeenCalled();
        expect(buildEmbed).not.toHaveBeenCalled();
    });

    test('endWichteln handles missing wichtel time', async () => {
        // Arrange
        getWichtelTime.mockReturnValue(null);

        // Act
        await startWichtelLoop(mockClient);
        const result = await endWichteln();

        // Assert
        expect(result).toBe('Die wichtel_time konnte nicht gefunden werden!');
        expect(logger.warn).toHaveBeenCalled();
        expect(buildEmbed).not.toHaveBeenCalled();
    });

    test('wichtelLoop continues when current time has not exceeded end time', async () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        getWichtelEnd.mockReturnValue(datetime.format(futureDate, 'DD.MM.YYYY, HH:mm:ss'));
        getWichteln.mockReturnValue(true);

        // Act
        await startWichtelLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        expect(logger.info).not.toHaveBeenCalledWith('Ending "wichtelLoop"');
        expect(logger.info).not.toHaveBeenCalledWith('"wichtelLoop" ended automatically');
        expect(resetWichtelData).not.toHaveBeenCalled();
        expect(mockSetInterval).toHaveBeenCalledTimes(1);
    });

    test('endWichteln handles empty messages collection', async () => {
        // Arrange
        messagesFetchPromise = Promise.resolve({
            size: 0,
            get: jest.fn().mockReturnValue(undefined),
        });
        mockChannel.messages.fetch.mockReturnValue(messagesFetchPromise);

        // Act
        await startWichtelLoop(mockClient);
        const result = await endWichteln();
        await Promise.all([messagesFetchPromise]);

        // Assert
        expect(mockMessage.delete).not.toHaveBeenCalled();
        expect(mockChannel.send).toHaveBeenCalled();
        expect(result).toBe('Das Wichteln wurde beendet!');
        expect(resetWichtelData).toHaveBeenCalled();
    });

    describe('matchParticipants tests', () => {
        let originalMathRandom;

        // Setup
        beforeEach(() => {
            originalMathRandom = Math.random;
        });

        afterEach(() => {
            Math.random = originalMathRandom;
        });

        test('retries matching until success with three participants', async () => {
            // Arrange
            const participants = [
                { id: '1', dcName: 'user1', steamName: 'steam1', steamFriendCode: 'code1' },
                { id: '2', dcName: 'user2', steamName: 'steam2', steamFriendCode: 'code2' },
                { id: '3', dcName: 'user3', steamName: 'steam3', steamFriendCode: 'code3' },
            ];

            // Fail twice and succeed on the third try
            let callCount = 0;
            Math.random = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount <= 6) { // First two attempts (3 calls each)
                    return 0; // Will create an impossible matching
                }
                // The Third attempt will succeed with different values
                return 0.5; // Will create a valid circular matching
            });

            await startWichtelLoop(mockClient);
            getParticipants.mockReturnValue(participants);

            const result = await endWichteln();
            await Promise.all([messagesFetchPromise, deletePromise, sendPromise, userFetchPromise, dmSendPromise]);

            // Verify success
            expect(result).toBe('Das Wichteln wurde beendet!');
            expect(buildEmbed).toHaveBeenCalled();
            expect(Math.random).toHaveBeenCalledTimes(9); // 3 calls per attempt, 3 attempts
            expect(mockChannel.send).not.toHaveBeenCalledWith(
                expect.stringContaining('Leider haben nicht genug Personen am Schrottwichteln teilgenommen'),
            );
        });

        test('always succeeds with even number of participants', async () => {
            // Arrange
            const participants = [
                { id: '1', dcName: 'user1', steamName: 'steam1', steamFriendCode: 'code1' },
                { id: '2', dcName: 'user2', steamName: 'steam2', steamFriendCode: 'code2' },
                { id: '3', dcName: 'user3', steamName: 'steam3', steamFriendCode: 'code3' },
                { id: '4', dcName: 'user4', steamName: 'steam4', steamFriendCode: 'code4' },
            ];

            await startWichtelLoop(mockClient);
            getParticipants.mockReturnValue(participants);

            const result = await endWichteln();
            await Promise.all([messagesFetchPromise, deletePromise, sendPromise, userFetchPromise, dmSendPromise]);

            expect(result).toBe('Das Wichteln wurde beendet!');
            expect(buildEmbed).toHaveBeenCalled();
        });
    });
});