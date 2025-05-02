// Imports
const fs = require('fs');
const path = require('node:path');
const logger = require('../../src/logging/logger');
const { handleError, ErrorType } = require('../../src/logging/errorHandler');
const jsonManager = require('../../src/util/json_manager');

// Mock
jest.mock('fs');
jest.mock('node:path');
jest.mock('../../src/logging/logger');
jest.mock('../../src/logging/errorHandler');
jest.mock('../../src/util/json_manager');

describe('createFileIfNotExists', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
        path.basename.mockImplementation(filePath => filePath.split('/').pop());
    });

    test('should not create file if it already exists', () => {
        // Arrange
        const filePath = '/test/file.json';
        const initialData = { test: 'data' };
        fs.accessSync.mockImplementation(() => true);

        // Act
        jsonManager.createFileIfNotExists(filePath, initialData);

        // Assert
        expect(fs.accessSync).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    test('should create file if it does not exist', () => {
        // Arrange
        const filePath = '/test/file.json';
        const initialData = { test: 'data' };
        fs.accessSync.mockImplementation(() => {
            throw new Error('File does not exist');
        });

        // Act
        jsonManager.createFileIfNotExists(filePath, initialData);

        // Assert
        expect(fs.accessSync).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(initialData));
        expect(logger.info).toHaveBeenCalledWith('Creating "file.json" file.');
        expect(logger.info).toHaveBeenCalledWith('Created "file.json" file.');
    });

    test('should handle error when file creation fails', () => {
        // Arrange
        const filePath = '/test/file.json';
        const initialData = { test: 'data' };
        const writeError = new Error('Write failed');

        fs.accessSync.mockImplementation(() => {
            throw new Error('File does not exist');
        });
        fs.writeFileSync.mockImplementation(() => {
            throw writeError;
        });

        // Act
        jsonManager.createFileIfNotExists(filePath, initialData);

        // Assert
        expect(fs.accessSync).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
        expect(handleError).toHaveBeenCalledWith(
            `Error while creating a file: ${filePath} - ${writeError}`,
            expect.any(String),
            {
                type: ErrorType.FILE_NOT_CREATED,
                silent: true,
            },
        );
    });

    test('should handle non-JSON initialData', () => {
        // Arrange
        const filePath = '/test/file.json';
        const initialData = 'plain text';
        fs.accessSync.mockImplementation(() => {
            throw new Error('File does not exist');
        });

        // Act
        jsonManager.createFileIfNotExists(filePath, initialData);

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(initialData));
    });

    test('should work with empty initialData', () => {
        // Arrange
        const filePath = '/test/file.json';
        const initialData = {};
        fs.accessSync.mockImplementation(() => {
            throw new Error('File does not exist');
        });

        // Act
        jsonManager.createFileIfNotExists(filePath, initialData);

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(initialData));
    });
});

describe('readJsonFile', () => {
    test('should return JSON object from file', () => {
        // Arrange
        const filePath = '/test/file.json';
        const mockData = JSON.stringify({ test: 'data' });
        fs.readFileSync.mockReturnValue(mockData);

        // Act
        const data = jsonManager.readJsonFile(filePath);

        // Assert
        expect(data).toEqual({ test: 'data' });
    });
    test('should return null, if file cannot be read', () => {
        // Arrange
        const filePath = '/test/file.json';
        fs.readFileSync.mockImplementation(() => {
            throw new Error('File cannot be read');
        });

        // Act
        const data = jsonManager.readJsonFile(filePath);

        // Assert
        expect(data).toEqual(null);
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
        expect(handleError).toHaveBeenCalled();
    });
});

describe('participantJoined', () => {
    const mockParticipantsPath = path.join(__dirname, '../../data/participants.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should add new participant when they do not exist', () => {
        // Arrange
        fs.existsSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));
        fs.writeFileSync = jest.fn();

        const newParticipant = {
            id: '12345',
            dcName: 'TestUser',
            steamName: 'SteamUser',
            steamFriendCode: 'STEAM123',
        };

        // Act
        jsonManager.participantJoined(newParticipant);

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockParticipantsPath,
            JSON.stringify([{
                id: '12345',
                dcName: 'TestUser',
                steamName: 'SteamUser',
                steamFriendCode: 'STEAM123',
                participates: true,
            }]),
            'utf-8',

        );
    });
});