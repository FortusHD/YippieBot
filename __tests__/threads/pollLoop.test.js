// Imports
const logger = require('../../src/logging/logger');
const { checkPollsEnd } = require('../../src/util/json_manager');
const { buildEmbed } = require('../../src/util/embedBuilder');
const { startPollLoop } = require('../../src/threads/pollLoop');

// Mock dependencies
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));
jest.mock('../../src/util/json_manager', () => ({
    checkPollsEnd: jest.fn(),
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
        await startPollLoop(mockClient);

        expect(logger.info).toHaveBeenCalledWith('Starting "pollLoop"');
        expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    test('pollLoop processes ended polls correctly', async () => {
        const mockPoll = {
            channelId: '123',
            messageId: '456',
        };
        checkPollsEnd.mockReturnValue([mockPoll]);

        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();

        await new Promise(process.nextTick); // Wait for promises to resolve

        expect(mockClient.channels.fetch).toHaveBeenCalledWith('123');
        expect(mockChannel.messages.fetch).toHaveBeenCalledWith('456');
        expect(buildEmbed).toHaveBeenCalledWith(expect.objectContaining({
            color: 0x2210e8,
            title: 'Umfrage-Ergebnisse',
            description: 'Test Poll Question',
            fields: expect.any(Array),
        }));
        expect(mockChannel.send).toHaveBeenCalledWith({ embeds: [expect.any(Object)] });
    });

    test('pollLoop handles empty poll list', async () => {
        checkPollsEnd.mockReturnValue([]);

        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();

        expect(mockClient.channels.fetch).not.toHaveBeenCalled();
        expect(buildEmbed).not.toHaveBeenCalled();
        expect(mockChannel.send).not.toHaveBeenCalled();
    });

    test('pollLoop processes multiple answers correctly', async () => {
        const mockPoll = {
            channelId: '123',
            messageId: '456',
        };

        mockMessage.embeds[0].fields[0].value = '👍 Yes\n👎 No\n😊 Maybe';
        mockMessage.reactions.resolve
            .mockReturnValueOnce({ count: 5 })
            .mockReturnValueOnce({ count: 3 })
            .mockReturnValueOnce({ count: 4 });

        checkPollsEnd.mockReturnValue([mockPoll]);

        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(process.nextTick); // Wait for promises to resolve

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
        const mockPolls = [
            { channelId: '123', messageId: '456' },
            { channelId: '789', messageId: '012' },
        ];
        checkPollsEnd.mockReturnValue(mockPolls);

        await startPollLoop(mockClient);
        mockSetInterval.mockCallback();
        await new Promise(process.nextTick); // Wait for promises to resolve

        expect(mockClient.channels.fetch).toHaveBeenCalledTimes(2);
        expect(buildEmbed).toHaveBeenCalledTimes(2);
        expect(mockChannel.send).toHaveBeenCalledTimes(2);
    });
});