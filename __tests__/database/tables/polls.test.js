// Imports
const { getConnection } = require('../../../src/database/database');
const logger = require('../../../src/logging/logger');
const polls = require('../../../src/database/tables/polls');

// Mocks
jest.mock('../../../src/logging/logger', () => ({
    debug: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../../src/database/database', () => ({
    getConnection: jest.fn(),
}));

describe('polls', () => {
    test('should have correct properties', () => {
        const normalize = (str) => str.replace(/\s+/g, ' ').trim();

        // Assert
        expect(polls).toHaveProperty('name', 'polls');
        expect(polls).toHaveProperty('schema');

        const receivedSchema = normalize(polls.schema);
        const expectedSchema = normalize(`
            CREATE TABLE IF NOT EXISTS polls (
                messageId VARCHAR(255) PRIMARY KEY,
                channelId VARCHAR(255),
                endTime TIMESTAMP,
                maxVotes TINYINT UNSIGNED
            )
        `);

        expect(receivedSchema).toBe(expectedSchema);
    });

    describe('functions', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('getPoll', () => {
            test('should return poll', async () => {
                // Arrange
                const date = new Date();
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[{
                        messageId: '123',
                        channelId: '456',
                        endTime: date,
                        maxVotes: 10,
                    }]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getPoll('123');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT * FROM polls WHERE messageId = ?',
                    ['123'],
                );
                expect(result).toEqual({
                    messageId: '123',
                    channelId: '456',
                    endTime: date,
                    maxVotes: 10,
                });
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should return null, when no poll was found', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getPoll('123');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT * FROM polls WHERE messageId = ?',
                    ['123'],
                );
                expect(result).toBeNull();
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle error during query', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockRejectedValue(new Error('Error while querying database.')),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getPoll('123');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT * FROM polls WHERE messageId = ?',
                    ['123'],
                );
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getPoll('123');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
            });
        });

        describe('getEndedPolls', () => {
            test('should return all ended polls', async () => {
                // Arrange
                const mockPolls = [
                    {
                        messageId: '123',
                        channelId: '456',
                        endTime: new Date(),
                        maxVotes: 10,
                    },
                    {
                        messageId: '147',
                        channelId: '456',
                        endTime: new Date(),
                        maxVotes: null,
                    },
                ];

                const mockConnection = {
                    query: jest.fn().mockResolvedValue([mockPolls]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getEndedPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM polls WHERE endTime < NOW();');
                expect(mockConnection.query).toHaveBeenCalledWith('DELETE FROM polls WHERE endTime < NOW();');
                expect(result).toEqual(mockPolls);
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should return empty list, if no ended polls were found', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getEndedPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM polls WHERE endTime < NOW();');
                expect(mockConnection.query).toHaveBeenCalledWith('DELETE FROM polls WHERE endTime < NOW();');
                expect(result).toEqual([]);
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle error during query', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockRejectedValue(new Error('Error while querying database.')),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getEndedPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM polls WHERE endTime < NOW();');
                expect(mockConnection.query).not.toHaveBeenCalledWith(
                    'DELETE FROM polls WHERE endTime < NOW();',
                );
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await polls.getEndedPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
            });
        });

        describe('getAllPolls', () => {
            test('should return all polls', async () => {
                // Arrange
                const mockPolls = [
                    {
                        messageId: '123',
                        channelId: '456',
                        endTime: new Date(),
                        maxVotes: 10,
                    },
                    {
                        messageId: '147',
                        channelId: '456',
                        endTime: new Date(),
                        maxVotes: null,
                    },
                ];

                const mockConnection = {
                    query: jest.fn().mockResolvedValue([mockPolls]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getAllPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM polls');
                expect(result).toEqual(mockPolls);
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should return empty list, if no polls were found', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getAllPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM polls');
                expect(result).toEqual([]);
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle error during query', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockRejectedValue(new Error('Error while querying database.')),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await polls.getAllPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM polls');
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await polls.getAllPolls();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
            });
        });

        describe('insertPoll', () => {
            test('should insert poll', async () => {
                // Arrange
                const date = new Date();
                const poll = {
                    messageId: '123',
                    channelId: '456',
                    endTime: date,
                    maxVotes: 10,
                };

                const mockConnection = {
                    query: jest.fn().mockResolvedValue(),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await polls.insertPoll(poll);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['123', '456', date, 10],
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle error during query', async () => {
                // Arrange
                const date = new Date();
                const poll = {
                    messageId: '123',
                    channelId: '456',
                    endTime: date,
                    maxVotes: 10,
                };

                const mockConnection = {
                    query: jest.fn().mockRejectedValue(new Error('Error while querying database.')),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await polls.insertPoll(poll);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['123', '456', date, 10],
                );
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const poll = {
                    messageId: '123',
                    channelId: '456',
                    endTime: new Date(),
                    maxVotes: 10,
                };

                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await polls.insertPoll(poll);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\polls.js'),
                );
            });
        });
    });
});