// Imports
const logger = require('../../src/logging/logger');
const { buildEmbed } = require('../../src/util/embedBuilder');
const { getEndedPolls, deletePoll } = require('../../src/database/tables/polls');
const { startPollLoop } = require('../../src/threads/pollLoop');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));
jest.mock('../../src/database/tables/polls', () => ({
    getEndedPolls: jest.fn(),
    deletePoll: jest.fn().mockResolvedValue(),
}));
jest.mock('../../src/util/embedBuilder', () => ({
    buildEmbed: jest.fn().mockReturnValue({
        toJSON: () => ({
            color: 0x2210e8,
            title: 'Umfrage-Ergebnisse',
            description: 'Test Question',
            fields: [{ name: 'Ergebnis', value: 'Test Result', inline: false }],
        }),
    }),
}));

describe('pollLoop', () => {
    let mockClient;
    let mockSetInterval;
    let mockChannel;
    let mockMessage;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockMessage = {
            embeds: [{
                description: 'Test Poll Question',
                fields: [{
                    value: '👍 Yes\n👎 No',
                }],
            }],
            reactions: {
                resolve: jest.fn().mockReturnValue({ count: 2 }),
            },
        };

        mockChannel = {
            messages: {
                fetch: jest.fn().mockResolvedValue(mockMessage),
            },
            send: jest.fn().mockResolvedValue({}),
        };

        mockClient = {
            channels: {
                fetch: jest.fn().mockResolvedValue(mockChannel),
            },
        };

        mockSetInterval = jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
            mockSetInterval.mockCallback = cb;
            return 123;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockSetInterval.mockRestore();
    });

    test('startPollLoop initializes with correct client', async () => {
        // Act
        await startPollLoop(mockClient);

        // Assert
        expect(logger.info).toHaveBeenCalledWith('Starting "pollLoop"');
        expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 15000);
    });

    test('pollLoop processes ended polls correctly', async () => {
        // Arrange
        const mockPoll = {
            channelId: '123',
            messageId: '456',
        };
        getEndedPolls.mockResolvedValue([mockPoll]);

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(setImmediate);

        // Assert
        expect(mockClient.channels.fetch).toHaveBeenCalledWith('123');
        expect(mockChannel.messages.fetch).toHaveBeenCalledWith('456');
        expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
            color: 0x2210e8,
            title: 'Umfrage-Ergebnisse',
            description: 'Test Poll Question',
            fields: expect.any(Array),
        }));
        expect(mockChannel.send).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
        expect(deletePoll).toHaveBeenCalledWith('456');
    });

    test('pollLoop handles empty poll list', async () => {
        // Arrange
        getEndedPolls.mockResolvedValue([]);

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();

        // Assert
        expect(mockClient.channels.fetch).not.toHaveBeenCalled();
        expect(buildEmbed).not.toHaveBeenCalled();
        expect(mockChannel.send).not.toHaveBeenCalled();
    });

    test('pollLoop processes multiple answers correctly', async () => {
        // Arrange
        const mockPoll = {
            channelId: '123',
            messageId: '456',
        };

        mockMessage.embeds[0].fields[0].value = '👍 Yes\n👎 No\n😊 Maybe';
        mockMessage.reactions.resolve
            .mockReturnValueOnce({ count: 5 })
            .mockReturnValueOnce({ count: 3 })
            .mockReturnValueOnce({ count: 4 });

        getEndedPolls.mockResolvedValue([mockPoll]);

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(setImmediate);

        // Assert
        expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
            color: 0x2210e8,
            title: 'Umfrage-Ergebnisse',
            description: 'Test Poll Question',
            fields: [expect.objectContaining({
                name: 'Ergebnis',
                inline: false,
            })],
        }));
    });

    test('pollLoop handles multiple polls', async () => {
        // Arrange
        const mockPolls = [
            { channelId: '123', messageId: '456' },
            { channelId: '789', messageId: '012' },
        ];
        getEndedPolls.mockResolvedValue(mockPolls);

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(setImmediate);

        // Assert
        expect(mockClient.channels.fetch).toHaveBeenCalledTimes(2);
        expect(buildEmbed).toHaveBeenCalledTimes(2);
        expect(mockChannel.send).toHaveBeenCalledTimes(2);
    });

    test('pollLoop counts missing reactions as 0 votes', async () => {
        // Arrange
        mockMessage.reactions.resolve.mockReturnValue(null);
        getEndedPolls.mockResolvedValue([{ channelId: '123', messageId: '456' }]);

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(setImmediate);

        // Assert
        expect(mockChannel.send).toHaveBeenCalledTimes(1);
        expect(deletePoll).toHaveBeenCalledWith('456');
    });

    test('pollLoop drops a poll whose message does not exist anymore', async () => {
        // Arrange
        const error = Object.assign(new Error('Unknown Message'), { code: 10008 });
        mockChannel.messages.fetch.mockRejectedValue(error);
        getEndedPolls.mockResolvedValue([{ channelId: '123', messageId: '456' }]);

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(setImmediate);

        // Assert
        expect(mockChannel.send).not.toHaveBeenCalled();
        expect(deletePoll).toHaveBeenCalledWith('456');
    });

    test('pollLoop keeps a poll after a temporary error and drops it after too many attempts', async () => {
        // Arrange
        mockChannel.send.mockRejectedValue(new Error('Discord is down'));
        getEndedPolls.mockResolvedValue([{ channelId: '123', messageId: '789' }]);

        // Act
        await startPollLoop(mockClient);
        for (let i = 0; i < 4; i++) {
            mockSetInterval.mockCallback();
            await new Promise(setImmediate);
        }

        // Assert
        expect(deletePoll).not.toHaveBeenCalled();

        mockSetInterval.mockCallback();
        await new Promise(setImmediate);
        expect(deletePoll).toHaveBeenCalledWith('789');
    });

    test('pollLoop does not crash if the database fails', async () => {
        // Arrange
        getEndedPolls.mockRejectedValue(new Error('DB down'));

        // Act
        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(setImmediate);

        // Assert
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('DB down'), expect.any(String));
    });
});
