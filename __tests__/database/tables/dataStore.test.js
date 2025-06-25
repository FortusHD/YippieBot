// Imports
const { getConnection } = require('../../../src/database/database');
const logger = require('../../../src/logging/logger');
const dataStore = require('../../../src/database/tables/dataStore');

// Mocks
jest.mock('../../../src/logging/logger', () => ({
    debug: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../../src/database/database', () => ({
    getConnection: jest.fn(),
}));

describe('dataStore', () => {
    test('should have correct properties', () => {
        const normalize = (str) => str.replace(/\s+/g, ' ').trim();

        // Assert
        expect(dataStore).toHaveProperty('name', 'data_store');
        expect(dataStore).toHaveProperty('schema');

        const receivedSchema = normalize(dataStore.schema);
        const expectedSchema = normalize(`
            CREATE TABLE IF NOT EXISTS data_store (
                id VARCHAR(255) PRIMARY KEY,
                data JSON NOT NULL
            )
        `);

        expect(receivedSchema).toBe(expectedSchema);
    });

    describe('functions', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('getWichtelData', () => {
            test('should return wichtel data', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[{
                        data: '{ "wichteln": true, "end": "some_time", "time": "some_other_time" }',
                    }]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await dataStore.getWichtelData();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT data FROM data_store WHERE id = ?',
                    ['wichtelData'],
                );
                expect(result).toEqual({ wichteln: true, end: 'some_time', time: 'some_other_time' });
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle no wichtel data', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await dataStore.getWichtelData();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT data FROM data_store WHERE id = ?',
                    ['wichtelData'],
                );
                expect(result).toBeNull();
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle invalid json data', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[{
                        data: '{ wichteln: true, "end": "some_time", "time": "some_other_time" }',
                    }]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await dataStore.getWichtelData();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT data FROM data_store WHERE id = ?',
                    ['wichtelData'],
                );
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('SyntaxError'),
                    expect.stringContaining('database\\tables\\dataStore.js'),
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
                const result = await dataStore.getWichtelData();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT data FROM data_store WHERE id = ?',
                    ['wichtelData'],
                );
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\dataStore.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await dataStore.getWichtelData();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(result).toBeNull();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\dataStore.js'),
                );
            });
        });

        describe('setWichtelData', () => {
            test('should set wichtel data', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue(),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                const mockData = { wichteln: true, end: 'some_time', time: 'some_other_time' };

                // Act
                await dataStore.setWichtelData(mockData);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['wichtelData', '{"wichteln":true,"end":"some_time","time":"some_other_time"}'],
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle invalid json data', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue(),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                const mockData = {};
                mockData.self = mockData;

                // Act
                await dataStore.setWichtelData(mockData);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('TypeError'),
                    expect.stringContaining('database\\tables\\dataStore.js'),
                );
                expect(mockConnection.query).not.toHaveBeenCalled();
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle error during query', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockRejectedValue(new Error('Error while querying database.')),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                const mockData = { wichteln: true, end: 'some_time', time: 'some_other_time' };

                // Act
                await dataStore.setWichtelData(mockData);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['wichtelData', '{"wichteln":true,"end":"some_time","time":"some_other_time"}'],
                );
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\dataStore.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await dataStore.setWichtelData();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\dataStore.js'),
                );
            });
        });
    });
});