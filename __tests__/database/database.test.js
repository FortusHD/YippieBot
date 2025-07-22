// Mock mysql first to make sure createPool is mocked properly
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue('mockConnection'),
    }),
    createConnection: jest.fn(),
}));

// Imports
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('node:path');
const logger = require('../../src/logging/logger');
const { setup, getConnection } = require('../../src/database/database');

// Mocks
jest.mock('fs');

jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/config', () => ({
    getDatabase: jest.fn().mockReturnValue({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'yippie_bot',
    }),
    getDbRootPassword: jest.fn().mockReturnValue('rPassword'),
}));

describe('database', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setup', () => {
        test('should create the database if it does not exist', async () => {
            // Arrange
            const mockConnection = {
                query: jest.fn().mockResolvedValue(),
                end: jest.fn().mockResolvedValue(),
            };
            mysql.createConnection.mockResolvedValue(mockConnection);
            fs.readdir.mockReturnValue(['table1.js']);
            jest.mock(path.join(__dirname, 'tables', 'table1.js'), () => ({
                name: 'table1',
                schema: 'CREATE TABLE table1 (id INT)',
            }), { virtual: true });

            // Act
            await setup();

            // Assert
            expect(mysql.createConnection).toHaveBeenCalled();
            expect(mockConnection.query).toHaveBeenCalledWith(
                'CREATE DATABASE IF NOT EXISTS yippie_bot',
            );
            expect(mockConnection.end).toHaveBeenCalled();
        });

        test('should log an error if setup fails', async () => {
            // Arrange
            const mockError = new Error('Mock error');
            mysql.createConnection.mockRejectedValue(mockError);

            // Act
            await setup();

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error during database setup:'), mockError,
            );
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