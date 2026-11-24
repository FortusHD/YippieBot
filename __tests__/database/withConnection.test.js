// Imports
const { getConnection } = require('../../src/database/database');
const logger = require('../../src/logging/logger');
const { withConnection } = require('../../src/database/withConnection');

// Mocks
jest.mock('../../src/logging/logger', () => ({
    error: jest.fn(),
}));

jest.mock('../../src/database/database', () => ({
    getConnection: jest.fn(),
}));

describe('withConnection', () => {
    const options = { file: 'file.js', error: 'Something failed', fallback: 'fallback' };
    let connection;

    beforeEach(() => {
        jest.clearAllMocks();
        connection = { release: jest.fn() };
        getConnection.mockResolvedValue(connection);
    });

    test('should return the result and release the connection', async () => {
        const result = await withConnection(options, async (conn) => (conn === connection ? 'result' : 'wrong'));

        expect(result).toBe('result');
        expect(connection.release).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
    });

    test('should log, return the fallback and release the connection if the function fails', async () => {
        const result = await withConnection(options, async () => {
            throw new Error('boom');
        });

        expect(result).toBe('fallback');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Something failed\nError: boom'), 'file.js');
        expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('should return the fallback if no connection can be obtained', async () => {
        getConnection.mockRejectedValue(new Error('no connection'));

        const result = await withConnection(options, async () => 'result');

        expect(result).toBe('fallback');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('no connection'), 'file.js');
    });
});
