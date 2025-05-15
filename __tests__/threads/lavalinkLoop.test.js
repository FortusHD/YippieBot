// Imports
const logger = require('../../src/logging/logger');
const { startLavalinkLoop } = require('../../src/threads/lavalinkLoop');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
}));

describe('lavalinkLoop', () => {
    const originalEnv = process.env;

    let mockClient;
    let mockSetInterval;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            riffy: {
                nodeMap: new Map(),
            },
        };

        mockSetInterval = jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
            mockSetInterval.mockCallback = cb;
            return 123;
        });

        process.env = {};
    });

    afterEach(() => {
        mockSetInterval.mockRestore();

        process.env = originalEnv;
    });

    test('startLavalinkLoop initializes with correct client', async () => {
        // Act
        await startLavalinkLoop(mockClient);

        // Assert
        expect(logger.info).toHaveBeenCalledWith('Starting "lavalinkLoop"');
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    test('lavalinkLoop attempts reconnection when disconnected', async () => {
        // Arrange
        const mockNode = {
            connected: false,
            connect: jest.fn(),
        };
        mockClient.riffy.nodeMap.set('localhost', mockNode);

        // Act
        await startLavalinkLoop(mockClient);
        mockSetInterval.mockCallback();

        // Assert
        expect(mockNode.connect).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Reconnecting to Lavalink...');
    });

    test('lavalinkLoop handles connection errors', async () => {
        // Arrange
        const mockNode = {
            connected: false,
            connect: jest.fn().mockImplementation(() => {
                throw new Error('Connection failed');
            }),
        };
        mockClient.riffy.nodeMap.set('localhost', mockNode);

        // Act
        await startLavalinkLoop(mockClient);
        mockSetInterval.mockCallback();

        // Assert
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Could not connect to Lavalink'));
    });

    test('lavalinkLoop does nothing when already connected', async () => {
        // Arrange
        const mockNode = {
            connected: true,
            connect: jest.fn(),
        };
        mockClient.riffy.nodeMap.set('localhost', mockNode);

        // Act
        await startLavalinkLoop(mockClient);
        mockSetInterval.mockCallback();

        // Assert
        expect(mockNode.connect).not.toHaveBeenCalled();
    });

    test('lavalinkLoop does nothing when client is null', async () => {
        // Act
        await startLavalinkLoop(null);
        mockSetInterval.mockCallback();

        // Assert
        expect(logger.info).not.toHaveBeenCalledWith('Reconnecting to Lavalink...');
        expect(logger.warn).not.toHaveBeenCalled();
    });
});