/**
 * Tests for the JSON manager utility module
 *
 * @group util
 * @group json
 */

// Imports
const fs = require('fs');
const path = require('node:path');
const logger = require('../../src/logging/logger');
const { handleError, ErrorType } = require('../../src/logging/errorHandler');
const jsonManager = require('../../src/util/json_manager');

// Mock dependencies
jest.mock('fs');
jest.mock('node:path');
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));
jest.mock('../../src/logging/errorHandler', () => ({
    handleError: jest.fn(),
    ErrorType: {
        FILE_NOT_CREATED: 'FILE_NOT_CREATED',
        FILE_NULL: 'FILE_NULL',
        FILE_OPERATION_FAILED: 'FILE_OPERATION_FAILED',
    },
}));

const participants = [
    {
        id: '12345',
        dcName: 'TestUser1',
        steamName: 'SteamUser1',
        steamFriendCode: 'STEAM123',
        participates: true,
    },
    {
        id: '123456',
        dcName: 'TestUser2',
        steamName: 'SteamUser2',
        steamFriendCode: 'STEAM1234',
        participates: false,
    },
    {
        id: '1234567',
        dcName: 'TestUser3',
        steamName: 'SteamUser3',
        steamFriendCode: 'STEAM12356',
        participates: true,
    },
];

describe('createFileIfNotExists', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
        path.basename.mockImplementation(filePath => filePath ? filePath.split('/').pop() : '');
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
        fs.accessSync = jest.fn(() => true);
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

    test('should update participant when they exist', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                id: '12345',
                dcName: 'TestUser',
                steamName: 'SteamUser',
                steamFriendCode: 'STEAM123',
                participates: false,
            },
        ]));
        fs.writeFileSync = jest.fn();

        const participant = {
            id: '12345',
            dcName: 'TestUser',
            steamName: 'SteamUser',
            steamFriendCode: 'STEAM123',
        };

        // Act
        jsonManager.participantJoined(participant);

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

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        jsonManager.participantJoined(null);

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in participantJoined: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });

    test('should handle error when participant is invalid', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));

        // Act
        jsonManager.participantJoined(null);

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            expect.stringContaining('Error in participantJoined: TypeError:'),
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('resetParticipants', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should set participates to false for all participants', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(participants));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.resetParticipants();

        // Assert
        expect(JSON.parse(fs.writeFileSync.mock.calls[0][1])).toEqual(
            expect.arrayContaining([]),
        );
        expect(JSON.parse(fs.writeFileSync.mock.calls[0][1]).every(obj => obj.participates === false)).toBe(true);
    });

    test('should do nothing for empty file', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.resetParticipants();

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledTimes(0);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        jsonManager.resetParticipants();

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in resetParticipants: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                id: '12345',
                dcName: 'TestUser1',
                steamName: 'SteamUser1',
                steamFriendCode: 'STEAM123',
                participates: true,
            },
        ]));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        jsonManager.resetParticipants();

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in resetParticipants: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('getParticipants', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return participants, with participates=true', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(participants));

        // Act
        const result = jsonManager.getParticipants();

        // Assert
        expect(result).toEqual([
            {
                id: '12345',
                dcName: 'TestUser1',
                steamName: 'SteamUser1',
                steamFriendCode: 'STEAM123',
                participates: true,
            },
            {
                id: '1234567',
                dcName: 'TestUser3',
                steamName: 'SteamUser3',
                steamFriendCode: 'STEAM12356',
                participates: true,
            },
        ]);
    });

    test('should return empty list, when nobody participates', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                id: '12345',
                dcName: 'TestUser',
                steamName: 'SteamUser',
                steamFriendCode: 'STEAM123',
                participates: false,
            },
        ]));

        // Act
        const result = jsonManager.getParticipants();

        // Assert
        expect(result).toEqual([]);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        jsonManager.getParticipants();

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in getParticipants: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('updateMessageID', () => {
    const mockMessageIdPath = path.join(__dirname, '../../data/messageID.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should update message ID in file', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(
            {
                roleId: '123',
                wichtelId: '1234',
            },
        ));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.updateMessageID('roleId', '123456');

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockMessageIdPath,
            JSON.stringify({
                roleId: '123456',
                wichtelId: '1234',
            }),
            'utf-8',
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should create file with ID, when file does not exist', () => {
        // Arrange
        fs.accessSync = jest.fn(() => false);
        fs.readFileSync = jest.fn(() => JSON.stringify(
            {
                roleId: '',
                wichtelId: '',
            },
        ));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.updateMessageID('roleId', '123456');

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockMessageIdPath,
            JSON.stringify({
                roleId: '123456',
                wichtelId: '',
            }),
            'utf-8',
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        jsonManager.updateMessageID('roleId', '123456');

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in updateMessageID: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(
            {
                roleId: '123',
                wichtelId: '1234',
            },
        ));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        jsonManager.updateMessageID('roleId', '123456');

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in updateMessageID: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('getMessageID', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const ids = [
        ['roleId', '123456'],
        ['wichtelId', '1234567'],
        ['randomOtherID', ''],
    ];

    test.each(ids)('return correct id from file', (key, value) => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(
            {
                roleId: '123456',
                wichtelId: '1234567',
            },
        ));

        // Act
        const result = jsonManager.getMessageID(key);

        // Assert
        expect(result).toEqual(value);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getMessageID('roleId');

        // Assert
        expect(result).toEqual('');
        expect(handleError).toHaveBeenCalledWith(
            'Error in getMessageID: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('setWichtelData', () => {
    const mockWichtelPath = path.join(__dirname, '../../data/wichtel.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should update wichtel data in file', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                wichteln: false,
                end: '',
                time: '',
            },
        ]));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.setWichtelData('11.12.2025, 18:00:00', '18.12.2025 um 15:00 Uhr');

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockWichtelPath,
            JSON.stringify([{
                wichteln: true,
                end: '11.12.2025, 18:00:00',
                time: '18.12.2025 um 15:00 Uhr',
            }]),
            'utf-8',
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                wichteln: false,
                end: '',
                time: '',
            },
        ]));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        jsonManager.setWichtelData('11.12.2025, 18:00:00', '18.12.2025 um 15:00 Uhr');

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in setWichtelData: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('resetWichtelData', () => {
    const mockWichtelPath = path.join(__dirname, '../../data/wichtel.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should reset the data to default', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([{
            wichteln: true,
            end: '11.12.2025, 18:00:00',
            time: '18.12.2025 um 15:00 Uhr',
        }]));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.resetWichtelData();

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockWichtelPath,
            JSON.stringify([
                {
                    wichteln: false,
                    end: '',
                    time: '',
                },
            ]),
            'utf-8',
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                wichteln: false,
                end: '',
                time: '',
            },
        ]));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        jsonManager.resetWichtelData();

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in resetWichtelData: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('getWichteln', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testData = [
        [
            [{
                wichteln: true,
                end: '11.12.2025, 18:00:00',
                time: '18.12.2025 um 15:00 Uhr',
            }],
            true,
        ],
        [
            [{
                wichteln: false,
                end: '',
                time: '',
            }],
            false,
        ],
    ];

    test.each(testData)('should return correct wichteln data', (data, expected) => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(data));

        // Act
        const result = jsonManager.getWichteln();

        // Assert
        expect(result).toEqual(expected);
    });

    test('should return false if data is empty', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));

        // Act
        const result = jsonManager.getWichteln();

        // Assert
        expect(result).toEqual(false);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getWichteln();

        // Assert
        expect(result).toEqual(false);
        expect(handleError).toHaveBeenCalledWith(
            'Error in getWichteln: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('getWichtelEnd', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testData = [
        [
            [{
                wichteln: true,
                end: '11.12.2025, 18:00:00',
                time: '18.12.2025 um 15:00 Uhr',
            }],
            '11.12.2025, 18:00:00',
        ],
        [
            [{
                wichteln: false,
                end: '',
                time: '',
            }],
            '',
        ],
    ];

    test.each(testData)('should return correct wichteln data', (data, expected) => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(data));

        // Act
        const result = jsonManager.getWichtelEnd();

        // Assert
        expect(result).toEqual(expected);
    });

    test('should return empty string if data is empty', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));

        // Act
        const result = jsonManager.getWichtelEnd();

        // Assert
        expect(result).toEqual('');
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getWichtelEnd();

        // Assert
        expect(result).toEqual('');
        expect(handleError).toHaveBeenCalledWith(
            'Error in getWichtelEnd: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('getWichtelTime', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testData = [
        [
            [{
                wichteln: true,
                end: '11.12.2025, 18:00:00',
                time: '18.12.2025 um 15:00 Uhr',
            }],
            '18.12.2025 um 15:00 Uhr',
        ],
        [
            [{
                wichteln: false,
                end: '',
                time: '',
            }],
            '',
        ],
    ];

    test.each(testData)('should return correct wichteln data', (data, expected) => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(data));

        // Act
        const result = jsonManager.getWichtelTime();

        // Assert
        expect(result).toEqual(expected);
    });

    test('should return empty string if data is empty', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));

        // Act
        const result = jsonManager.getWichtelTime();

        // Assert
        expect(result).toEqual('');
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getWichtelTime();

        // Assert
        expect(result).toEqual('');
        expect(handleError).toHaveBeenCalledWith(
            'Error in getWichtelTime: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('checkPollsEnd', () => {
    const mockPollsPath = path.join(__dirname, '../../data/polls.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-03-20T12:00:00Z'));

    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should remove expired polls and return them', () => {
        // Arrange
        const mockPolls = [
            { messageId: '1', endTime: Math.floor(new Date().getTime() / 1000) - 3600 },
            { messageId: '2', endTime: Math.floor(new Date().getTime() / 1000) + 3600 },
        ];

        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(mockPolls));
        fs.writeFileSync = jest.fn();

        // Act
        const result = jsonManager.checkPollsEnd();

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].messageId).toBe('1');
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockPollsPath,
            JSON.stringify([mockPolls[1]]),
            'utf-8',
        );
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should remove nothing, if polls are up to date', () => {
        // Arrange
        const mockPolls = [
            { messageId: '1', endTime: Math.floor(new Date().getTime() / 1000) + 3600 },
            { messageId: '2', endTime: Math.floor(new Date().getTime() / 1000) + 3600 },
        ];

        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(mockPolls));
        fs.writeFileSync = jest.fn();

        // Act
        const result = jsonManager.checkPollsEnd();

        // Assert
        expect(result).toHaveLength(0);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(0);
        expect(logger.info).toHaveBeenCalledTimes(0);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.checkPollsEnd();

        // Assert
        expect(result).toHaveLength(0);
        expect(handleError).toHaveBeenCalledWith(
            'Error in checkPollsEnd: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(0);
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        const mockPolls = [
            { messageId: '1', endTime: Math.floor(new Date().getTime() / 1000) - 3600 },
            { messageId: '2', endTime: Math.floor(new Date().getTime() / 1000) + 3600 },
        ];

        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(mockPolls));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        const result = jsonManager.checkPollsEnd();

        // Assert
        expect(result).toHaveLength(0);
        expect(handleError).toHaveBeenCalledWith(
            'Error in checkPollsEnd: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('addPoll', () => {
    const mockPollsPath = path.join(__dirname, '../../data/polls.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should add valid poll to file', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));
        fs.writeFileSync = jest.fn();

        // Act
        jsonManager.addPoll('1234567890', '1647782400', '1709657400', 1);

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockPollsPath,
            JSON.stringify([{
                messageId: '1234567890',
                channelId: '1647782400',
                endTime: '1709657400',
                maxVotes: 1,
            }]),
            'utf-8',
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        jsonManager.addPoll('1234567890', '1647782400', '1709657400', 1);

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in addPoll: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(0);
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        jsonManager.addPoll('1234567890', '1647782400', '1709657400', 1);

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in addPoll: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});

describe('getPolls', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return correct polls', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                messageId: '1234567890',
                channelId: '1647782400',
                endTime: '1709657400',
                maxVotes: 1,
            },
        ]));

        // Act
        const result = jsonManager.getPolls();

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].messageId).toBe('1234567890');
        expect(result[0].channelId).toBe('1647782400');
        expect(result[0].endTime).toBe('1709657400');
        expect(result[0].maxVotes).toBe(1);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getPolls();

        // Assert
        expect(result).toHaveLength(0);
        expect(handleError).toHaveBeenCalledWith(
            'Error in getPolls: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('getPoll', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return correct poll', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                messageId: '1234567890',
                channelId: '1647782400',
                endTime: '1709657400',
                maxVotes: 1,
            },
            {
                messageId: '0123456789',
                channelId: '1647782400',
                endTime: '1709657400',
                maxVotes: 5,
            },
        ]));

        // Act
        const result = jsonManager.getPoll('1234567890');

        // Assert
        expect(result).toBeDefined();
        expect(result.messageId).toBe('1234567890');
        expect(result.channelId).toBe('1647782400');
        expect(result.endTime).toBe('1709657400');
        expect(result.maxVotes).toBe(1);
    });

    test('should return null, when poll is not found', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([
            {
                messageId: '1234567890',
                channelId: '1647782400',
                endTime: '1709657400',
                maxVotes: 1,
            },
        ]));

        // Act
        const result = jsonManager.getPoll('0123456789');

        // Assert
        expect(result).toBeNull();
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getPoll('123');

        // Assert
        expect(result).toBeNull();
        expect(handleError).toHaveBeenCalledWith(
            'Error in getPoll: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('getMigrationData', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const migrationData = [
        {
            version: '2.2.5',
            migrations: [
                {
                    file: 'data/messageID.json',
                    changes: [
                        {
                            old: 'role_id',
                            new: 'roleId',
                        },
                        {
                            old: 'wichtel_id',
                            new: 'wichtelId',
                        },
                    ],
                },
                {
                    file: 'data/poll.json',
                    changes: [
                        {
                            old: 'max_votes',
                            new: 'maxVotes',
                        },
                    ],
                },
            ],
        },
    ];

    test('should return data from migration file', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(migrationData));

        // Act
        const result = jsonManager.getMigrationData();

        // Assert
        expect(result).toEqual(migrationData);
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        const result = jsonManager.getMigrationData();

        // Assert
        expect(result).toHaveLength(0);
        expect(handleError).toHaveBeenCalledWith(
            'Error in getMigrationData: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });
});

describe('migrateChanges', () => {
    const mockTestPath = path.join(__dirname, '../../data/test.json');

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testData = {
        oldKey: 'value',
        nested: {
            oldKey: 'nestedValue',
        },
        array: [
            {
                oldKey: 'value',
            },
            {
                oldKey: 'value',
            },
        ],
    };

    const changes = [
        { old: 'oldKey', new: 'newKey' },
    ];

    test('should successfully migrate simple key changes', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify(testData));

        // Act
        jsonManager.migrateChanges(mockTestPath, changes);

        // Assert
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            mockTestPath,
            JSON.stringify({
                newKey: 'value',
                nested: {
                    newKey: 'nestedValue',
                },
                array: [
                    {
                        newKey: 'value',
                    },
                    {
                        newKey: 'value',
                    },
                ],
            }),
            'utf-8',
        );
        expect(logger.info).toHaveBeenCalledWith('Migrating oldKey to newKey');
    });

    test('should handle error when json is null', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => null);

        // Act
        jsonManager.migrateChanges(mockTestPath, changes);

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in migrateChanges: JSON file is null.',
            expect.any(String),
            {
                type: ErrorType.FILE_NULL,
                silent: true,
            },
        );
    });

    test('should handle error when file can not be written', () => {
        // Arrange
        fs.accessSync = jest.fn(() => true);
        fs.readFileSync = jest.fn(() => JSON.stringify([]));
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File cannot be written');
        });

        // Act
        jsonManager.migrateChanges(mockTestPath, changes);

        // Assert
        expect(handleError).toHaveBeenCalledWith(
            'Error in migrateChanges: Error: File cannot be written',
            expect.any(String),
            {
                type: ErrorType.FILE_OPERATION_FAILED,
                silent: true,
            },
        );
    });
});
