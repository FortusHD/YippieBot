// Mock mysql first to make sure createPool is mocked properly
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue('mockConnection'),
    }),
    createConnection: jest.fn(),
}));

// Imports
const mysql = require('mysql2/promise');
const logger = require('../../src/logging/logger');
const { migrate } = require('../../src/database/migrator');
const { setup, getConnection } = require('../../src/database/database');

// Mocks
jest.mock('../../src/database/migrator', () => ({
    migrate: jest.fn().mockResolvedValue(0),
}));

jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getDatabase: jest.fn().mockReturnValue({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'yippie_bot',
    }),
}));

describe('database', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setup', () => {
        const fast = { retries: 3, delayMs: 0 };

        test('should connect with the configured user (no root) and run the migrations', async () => {
            // Arrange
            const mockConnection = {
                query: jest.fn().mockResolvedValue(),
                end: jest.fn().mockResolvedValue(),
            };
            mysql.createConnection.mockResolvedValue(mockConnection);

            // Act
            await setup(fast);

            // Assert
            expect(mysql.createConnection).toHaveBeenCalledTimes(1);
            expect(mysql.createConnection).toHaveBeenCalledWith(expect.objectContaining({
                user: 'root',
                password: 'password',
                database: 'yippie_bot',
            }));
            expect(migrate).toHaveBeenCalledWith(mockConnection);
            expect(mockConnection.query)
                .not.toHaveBeenCalledWith(expect.stringMatching(/CREATE (DATABASE|USER)|GRANT/));
            expect(mockConnection.end).toHaveBeenCalled();
        });

        test('should retry if the database is not reachable yet', async () => {
            // Arrange
            const mockConnection = {
                query: jest.fn().mockResolvedValue(),
                end: jest.fn().mockResolvedValue(),
            };
            const refused = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
            mysql.createConnection
                .mockRejectedValueOnce(refused)
                .mockRejectedValueOnce(refused)
                .mockResolvedValue(mockConnection);

            // Act
            await setup(fast);

            // Assert
            expect(mysql.createConnection).toHaveBeenCalledTimes(3);
            expect(logger.warn).toHaveBeenCalledTimes(2);
            expect(mockConnection.end).toHaveBeenCalled();
        });

        test('should give up after the maximum number of attempts', async () => {
            // Arrange
            const refused = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
            mysql.createConnection.mockRejectedValue(refused);

            // Act & Assert
            await expect(setup(fast)).rejects.toThrow('ECONNREFUSED');
            expect(mysql.createConnection).toHaveBeenCalledTimes(3);
        });

        test('should not retry on other errors like wrong credentials', async () => {
            // Arrange
            const denied = Object.assign(new Error('Access denied'), { code: 'ER_ACCESS_DENIED_ERROR' });
            mysql.createConnection.mockRejectedValue(denied);

            // Act & Assert
            await expect(setup(fast)).rejects.toThrow('Access denied');
            expect(mysql.createConnection).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error during database setup:'));
        });

        test('should close the connection if a migration fails', async () => {
            // Arrange
            const mockConnection = {
                query: jest.fn(),
                end: jest.fn().mockResolvedValue(),
            };
            mysql.createConnection.mockResolvedValue(mockConnection);
            migrate.mockRejectedValueOnce(new Error('Syntax error'));

            // Act & Assert
            await expect(setup(fast)).rejects.toThrow('Syntax error');
            expect(mockConnection.end).toHaveBeenCalled();
        });
    });

    describe('getConnection()', () => {
        test('should return a connection from the pool', async () => {
            // Act
            const poolConnection = await getConnection();

            // Assert
            expect(poolConnection).toBe('mockConnection');
        });
    });
});