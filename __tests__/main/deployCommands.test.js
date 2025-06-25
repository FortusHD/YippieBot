// Imports
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../src/logging/logger');
const { getEnv } = require('../../src/util/config');
const { handleError, ErrorType } = require('../../src/logging/errorHandler');
const deploy = require('../../src/main/deployCommands');

// Mock
jest.mock('fs', () => ({
    readdirSync: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn(),
}));

jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/logging/errorHandler', () => ({
    ...jest.requireActual('../../src/logging/errorHandler'),
    handleError: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getEnv: jest.fn(),
}));

jest.mock('discord.js', () => ({
    REST: jest.fn().mockImplementation(() => ({
        setToken: jest.fn().mockReturnThis(),
        put: jest.fn(),
    })),
    Routes: {
        applicationCommands: jest.fn(),
    },
}));

describe('deployCommands', () => {
    const mockCommandsPath = '../../__tests__/__mocks__/deploy';
    const mockCommandFiles = ['validCommand.js', 'invalidCommand.js'];

    const token = 'mock-token';
    const clientId = 'mock-client-id';

    beforeEach(() => {
        jest.clearAllMocks();

        path.join.mockReturnValueOnce(mockCommandsPath);
        path.join.mockImplementation((...args) => args.join('/'));
        fs.readdirSync.mockReturnValue(mockCommandFiles);

        getEnv.mockImplementation((key, defaultValue) => {
            switch (key) {
            case 'APP_ENV':
                return 'dev';
            case 'BOT_TOKEN_DEV':
            case 'BOT_TOKEN_PROD':
                return token;
            case 'BOT_CLIENT_ID_DEV':
            case 'BOT_CLIENT_ID_PROD':
                return clientId;
            default:
                return defaultValue;
            }
        });
    });

    test('should deploy valid commands', async () => {
        // Arrange
        const mockRest = new REST();
        mockRest.put.mockResolvedValue([{ id: '1234' }]);
        REST.mockImplementation(() => mockRest);

        // Act
        const result = await deploy();

        // Assert
        expect(fs.readdirSync).toHaveBeenCalledWith(mockCommandsPath);
        expect(mockRest.put).toHaveBeenCalledWith(
            Routes.applicationCommands(clientId),
            { body: [{ name: 'validCommand' }] },
        );
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('The command at'));
        expect(result).toBe(1);
    });

    test('should deploy valid commands in prod mode', async () => {
        // Arrange
        getEnv.mockImplementation((key, defaultValue) => {
            switch (key) {
            case 'APP_ENV':
                return 'prod';
            case 'BOT_TOKEN_DEV':
            case 'BOT_TOKEN_PROD':
                return token;
            case 'BOT_CLIENT_ID_DEV':
            case 'BOT_CLIENT_ID_PROD':
                return clientId;
            default:
                return defaultValue;
            }
        });
        const mockRest = new REST();
        mockRest.put.mockResolvedValue([{ id: '1234' }]);
        REST.mockImplementation(() => mockRest);

        // Act
        const result = await deploy();

        // Assert
        expect(fs.readdirSync).toHaveBeenCalledWith(mockCommandsPath);
        expect(mockRest.put).toHaveBeenCalledWith(
            Routes.applicationCommands(clientId),
            { body: [{ name: 'validCommand' }] },
        );
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('The command at'));
        expect(result).toBe(1);
    });

    test('should warn about invalid commands', async () => {
        // Arrange
        const mockRest = new REST();
        mockRest.put.mockResolvedValue([]);
        REST.mockImplementation(() => mockRest);

        // Act
        const result = await deploy();

        // Assert
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('The command at ../../__tests__/__mocks__/deploy/invalidCommand.js '
                + 'is missing a required "data" or "execute" property.'),
        );
        expect(result).toBe(0);
    });

    test('should handle error during command deployment', async () => {
        // Arrange
        const mockRest = new REST();
        mockRest.put.mockRejectedValue(new Error('API Error'));
        REST.mockImplementation(() => mockRest);

        // Act
        const result = await deploy();

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.any(String),
            expect.objectContaining({ type: ErrorType.UNKNOWN_ERROR }),
        );
        expect(result).toBe(-1);
    });

});
