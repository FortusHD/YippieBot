// Imports
const { getConnection } = require('../../../src/database/database');
const logger = require('../../../src/logging/logger');
const wichtelParticipants = require('../../../src/database/tables/wichtelParticipants');

// Mocks
jest.mock('../../../src/logging/logger', () => ({
    debug: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../../../src/database/database', () => ({
    getConnection: jest.fn(),
}));

describe('wichtelParticipants', () => {
    test('should have correct properties', () => {
        const normalize = (str) => str.replace(/\s+/g, ' ').trim();

        // Assert
        expect(wichtelParticipants).toHaveProperty('name', 'wichtel_participants');
        expect(wichtelParticipants).toHaveProperty('schema');

        const receivedSchema = normalize(wichtelParticipants.schema);
        const expectedSchema = normalize(`
            CREATE TABLE IF NOT EXISTS wichtel_participants (
                id VARCHAR(255) PRIMARY KEY,
                dcName VARCHAR(255),
                steamName VARCHAR(255),
                steamFriendCode VARCHAR(255),
                participates BOOLEAN DEFAULT FALSE
            )
        `);

        expect(receivedSchema).toBe(expectedSchema);
    });

    describe('functions', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('getParticipants', () => {
            test('should return participants that participate', async () => {
                // Arrange
                const participants = [
                    {
                        id: '123',
                        dcName: 'DC1',
                        steamName: 'Steam1',
                        steamFriendCode: '123456',
                        participates: true,
                    },
                    {
                        id: '456',
                        dcName: 'DC2',
                        steamName: 'Steam2',
                        steamFriendCode: '456789',
                        participates: true,
                    },
                ];
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([participants]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await wichtelParticipants.getParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT * FROM wichtel_participants WHERE participates = TRUE',
                );
                expect(result).toEqual(participants);
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should return empty list, when no participants were found', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue([[]]),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await wichtelParticipants.getParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT * FROM wichtel_participants WHERE participates = TRUE',
                );
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
                const result = await wichtelParticipants.getParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'SELECT * FROM wichtel_participants WHERE participates = TRUE',
                );
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\wichtelParticipants.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                const result = await wichtelParticipants.getParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(result).toEqual([]);
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\wichtelParticipants.js'),
                );
            });
        });

        describe('insertOrUpdateParticipant', () => {
            test('should insert participant', async () => {
                // Arrange
                const participant = {
                    id: '123',
                    dcName: 'DC1',
                    steamName: 'Steam1',
                    steamFriendCode: '123456',
                };

                const mockConnection = {
                    query: jest.fn().mockResolvedValue(),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await wichtelParticipants.insertOrUpdateParticipant(participant);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['123', 'DC1', 'Steam1', '123456', true],
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should handle error during query', async () => {
                // Arrange
                const participant = {
                    id: '123',
                    dcName: 'DC1',
                    steamName: 'Steam1',
                    steamFriendCode: '123456',
                };

                const mockConnection = {
                    query: jest.fn().mockRejectedValue(new Error('Error while querying database.')),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await wichtelParticipants.insertOrUpdateParticipant(participant);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    expect.any(String),
                    ['123', 'DC1', 'Steam1', '123456', true],
                );
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\wichtelParticipants.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const participant = {
                    id: '123',
                    dcName: 'DC1',
                    steamName: 'Steam1',
                    steamFriendCode: '123456',
                };

                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await wichtelParticipants.insertOrUpdateParticipant(participant);

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\wichtelParticipants.js'),
                );
            });
        });

        describe('resetParticipants', () => {
            test('should insert participant', async () => {
                // Arrange
                const mockConnection = {
                    query: jest.fn().mockResolvedValue(),
                    release: jest.fn(),
                };
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await wichtelParticipants.resetParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'UPDATE wichtel_participants SET participates = FALSE',
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
                await wichtelParticipants.resetParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(mockConnection.query).toHaveBeenCalledWith(
                    'UPDATE wichtel_participants SET participates = FALSE',
                );
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Error while querying database.'),
                    expect.stringContaining('database\\tables\\wichtelParticipants.js'),
                );
                expect(mockConnection.release).toHaveBeenCalled();
            });

            test('should not release connection when connection is no longer active', async () => {
                // Arrange
                const mockConnection = null;
                getConnection.mockResolvedValue(mockConnection);

                // Act
                await wichtelParticipants.resetParticipants();

                // Assert
                expect(getConnection).toHaveBeenCalled();
                expect(logger.error).toHaveBeenCalledWith(
                    expect.stringContaining('Cannot read properties of null'),
                    expect.stringContaining('database\\tables\\wichtelParticipants.js'),
                );
            });
        });
    });
});