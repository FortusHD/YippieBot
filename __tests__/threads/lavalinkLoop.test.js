/**
 * Tests for the Lavalink loop thread
 *
 * @group threads
 * @group lavalink
 */

// Imports
const logger = require('../../src/logging/logger');
const { startLavalinkLoop } = require('../../src/threads/lavalinkLoop');
const { getLavalinkConfig } = require('../../src/util/config');

// Mock dependencies
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getLavalinkConfig: jest.fn(),
}));

jest.mock('../../src/health/healthEndpoint', () => ({
    setLavalinkConnected: jest.fn(),
}));

describe('lavalinkLoop', () => {
    // Setup constants
    const originalEnv = process.env;

    // Test variables
    let mockClient;
    let mockSetInterval;

    // Setup and cleanup
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock client
        mockClient = {
            riffy: {
                nodeMap: new Map(),
            },
        };

        // Mock setInterval to capture the callback
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

    // Define test cases
    const testCases = [
        {
            name: 'initializes with correct client',
            setupMock: () => {},
            runTest: async () => {
                // Act
                await startLavalinkLoop(mockClient);

                // Assert
                expect(logger.info).toHaveBeenCalledWith('Starting "lavalinkLoop"');
                expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
            },
        },
        {
            name: 'attempts reconnection when disconnected',
            setupMock: () => {
                const mockNode = {
                    connected: false,
                    connect: jest.fn(),
                };
                mockClient.riffy.nodeMap.set('localhost', mockNode);
            },
            runTest: async () => {
                // Act
                await startLavalinkLoop(mockClient);
                mockSetInterval.mockCallback();

                // Assert
                const mockNode = mockClient.riffy.nodeMap.get('localhost');
                expect(mockNode.connect).toHaveBeenCalled();
                expect(logger.info).toHaveBeenCalledWith('Reconnecting to Lavalink...');
            },
        },
        {
            name: 'uses fallback values when no env variables are set',
            setupMock: () => {
                const mockNode = {
                    connected: false,
                    connect: jest.fn(),
                };
                mockClient.riffy.nodeMap.set('localhost', mockNode);
                getLavalinkConfig.mockReturnValue({ host: null });
            },
            runTest: async () => {
                // Act
                await startLavalinkLoop(mockClient);
                mockSetInterval.mockCallback();

                // Assert
                const mockNode = mockClient.riffy.nodeMap.get('localhost');
                expect(mockNode.connect).toHaveBeenCalled();
                expect(logger.info).toHaveBeenCalledWith('Reconnecting to Lavalink...');
            },
        },
        {
            name: 'handles connection errors',
            setupMock: () => {
                const mockNode = {
                    connected: false,
                    connect: jest.fn().mockImplementation(() => {
                        throw new Error('Connection failed');
                    }),
                };
                mockClient.riffy.nodeMap.set('localhost', mockNode);
            },
            runTest: async () => {
                // Act
                await startLavalinkLoop(mockClient);
                mockSetInterval.mockCallback();

                // Assert
                expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Could not connect to Lavalink'));
            },
        },
        {
            name: 'does nothing when already connected',
            setupMock: () => {
                const mockNode = {
                    connected: true,
                    connect: jest.fn(),
                };
                mockClient.riffy.nodeMap.set('localhost', mockNode);
            },
            runTest: async () => {
                // Act
                await startLavalinkLoop(mockClient);
                mockSetInterval.mockCallback();

                // Assert
                const mockNode = mockClient.riffy.nodeMap.get('localhost');
                expect(mockNode.connect).not.toHaveBeenCalled();
            },
        },
        {
            name: 'does nothing when client is null',
            setupMock: () => {},
            runTest: async () => {
                // Act
                await startLavalinkLoop(null);
                mockSetInterval.mockCallback();

                // Assert
                expect(logger.info).not.toHaveBeenCalledWith('Reconnecting to Lavalink...');
                expect(logger.warn).not.toHaveBeenCalled();
            },
        },
    ];

    // Run all test cases
    testCases.forEach(({ name, setupMock, runTest }) => {
        test(`lavalinkLoop ${name}`, async () => {
            // Arrange
            setupMock();

            // Act & Assert (handled in runTest)
            await runTest();
        });
    });
});
