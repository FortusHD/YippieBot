// Imports
const { Events } = require('discord.js');
const messageCreated = require('../../src/events/messageCreated');
const logger = require('../../src/logging/logger');
const { getBobbyChannelId } = require('../../src/util/config');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getBobbyChannelId: jest.fn(),
}));

jest.mock('node:path', () => ({
    join: jest.fn(() => '/mocked/path'),
}));

describe('messageCreated', () => {
    let mockMessage;

    beforeEach(() => {
        jest.clearAllMocks();

        mockMessage = {
            author: {
                bot: false,
                username: 'testUser',
            },
            content: '',
            channel: {
                id: '123456789',
                send: jest.fn().mockResolvedValue(undefined),
            },
            react: jest.fn().mockResolvedValue(undefined),
        };

        // Mock Math.random and Math.floor
        global.Math.random = jest.fn().mockReturnValue(0.5);
        global.Math.floor = jest.fn().mockReturnValue(0);
    });

    test('should have correct event name', () => {
        expect(messageCreated.name).toBe(Events.MessageCreate);
    });

    test('should do nothing if message is null', async () => {
        await messageCreated.execute(null);
        expect(logger.info).not.toHaveBeenCalled();
    });

    describe('Hunt Message Responses', () => {
        test('should respond to message containing "hunt"', async () => {
            mockMessage.content = 'Let\'s play some hunt today!';
            await messageCreated.execute(mockMessage);

            expect(mockMessage.channel.send).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Message from "testUser" matches'),
            );
        });

        test('should send image for low random value', async () => {
            mockMessage.content = 'hunt';
            global.Math.random = jest.fn().mockReturnValue(0.2);

            await messageCreated.execute(mockMessage);

            expect(mockMessage.channel.send).toHaveBeenCalledWith({
                files: [{
                    attachment: '/mocked/path',
                    name: 'hunt.jpg',
                }],
            });
        });

        test('should send text for high random value', async () => {
            mockMessage.content = 'hunt';
            global.Math.random = jest.fn().mockReturnValue(0.4);

            await messageCreated.execute(mockMessage);

            expect(mockMessage.channel.send).toHaveBeenCalledWith(
                expect.any(String),
            );
        });

        test('should not respond to bot messages', async () => {
            mockMessage.author.bot = true;
            mockMessage.content = 'hunt';

            await messageCreated.execute(mockMessage);

            expect(mockMessage.channel.send).not.toHaveBeenCalled();
        });
    });

    describe('Bobby Channel Reactions', () => {
        beforeEach(() => {
            mockMessage.author.bot = true;
            getBobbyChannelId.mockReturnValue('123456789');
        });

        test('should react to live message', async () => {
            mockMessage.content = 'Bobby is now live!';
            await messageCreated.execute(mockMessage);
            expect(mockMessage.react).toHaveBeenCalledWith('🎉');
        });

        test('should react to offline message', async () => {
            mockMessage.content = 'Bobby is now offline';
            await messageCreated.execute(mockMessage);
            expect(mockMessage.react).toHaveBeenCalledWith('😔');
        });

        test('should not react in wrong channel', async () => {
            getBobbyChannelId.mockReturnValue('different-channel');
            mockMessage.content = 'Bobby is now live!';

            await messageCreated.execute(mockMessage);

            expect(mockMessage.react).not.toHaveBeenCalled();
        });

        test('should not react to bot message without live/offline status', async () => {
            // Arrange
            mockMessage.content = 'Bobby is streaming something';
            mockMessage.author.bot = true;
            getBobbyChannelId.mockReturnValue('123456789');

            // Act
            await messageCreated.execute(mockMessage);

            // Assert
            expect(mockMessage.react).not.toHaveBeenCalled();
        });
    });
});