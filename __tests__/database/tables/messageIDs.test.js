// Imports
const { getConnection } = require('../../../src/database/database');
const logger = require('../../../src/logging/logger');
const messageIDs = require('../../../src/database/tables/messageIDs');

// Mocks
jest.mock('../../../src/logging/logger', () => ({
    debug: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../../src/database/database', () => ({
    getConnection: jest.fn(),
}));

describe('messageIDs', () => {
    test('should have correct properties', () => {
        const normalize = (str) => str.replace(/\s+/g, ' ').trim();

        // Assert
        expect(messageIDs).toHaveProperty('name', 'message_ids');
        expect(messageIDs).toHaveProperty('schema');

        const receivedSchema = normalize(messageIDs.schema);
        const expectedSchema = normalize(`
            CREATE TABLE IF NOT EXISTS message_ids (
                id VARCHAR(255) PRIMARY KEY,
                value VARCHAR(255)
            )
        `);

        expect(receivedSchema).toBe(expectedSchema);
    });

    describe('functions', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('getId', () => {
            test('should return id value', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[{
                        value: '123',
                    }]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await messageIDs.getId('testId');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT value FROM message_ids WHERE id = ?',
                    ['testId'],
                );
                expect(result).toBe('123');
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle unknown id', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await messageIDs.getId('unknownId');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT value FROM message_ids WHERE id = ?',
                    ['unknownId'],
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
                const result = await messageIDs.getId('testId');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT value FROM message_ids WHERE id = ?',
                    ['testId'],
                );
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\messageIDs.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await messageIDs.getId('testId');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\messageIDs.js'),
                );
            });
        });

        describe('insertOrUpdateId', () => {
            test('should set id', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue(),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await messageIDs.insertOrUpdateId('testId', '456');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['testId', '456'],
                );
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
                await messageIDs.insertOrUpdateId('testId', '456');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['testId', '456'],
                );
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\messageIDs.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await messageIDs.insertOrUpdateId('testId', '456');

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\messageIDs.js'),
                );
            });
        });
    });
});