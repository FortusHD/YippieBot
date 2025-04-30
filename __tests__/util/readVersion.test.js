// Imports
const fs = require('fs');
const logger = require('../../src/logging/logger');
const { getVersion } = require('../../src/util/readVersion');

jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

// Mock the fs module
jest.mock('fs');

describe('getVersion', () => {
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return the version of package.json', () => {
        const mockVersion = '1.2.3';
        const mockData = JSON.stringify({ version: mockVersion });
        fs.readFileSync.mockReturnValue(mockData);

        const version = getVersion('./package.json');
        expect(version).toBe(mockVersion);
    });

    test('should return -1, if package.json can not be parsed', () => {
        fs.readFileSync.mockReturnValue('invalid JSON');

        const version = getVersion('./package.json');
        expect(version).toBe('-1');
        expect(logger.warn).toHaveBeenCalled();
        expect(logger.warn.mock.calls[0][0]).toContain('SyntaxError');
    });

    test('should return -1, if package.json does not exist', () => {
        const mockError = new Error('ENOENT: no such file or directory, open \'./package.json\'');
        fs.readFileSync.mockImplementation(() => {
            throw mockError;
        });

        const version = getVersion('./package.json');
        expect(version).toBe('-1');
        expect(logger.warn).toHaveBeenCalled();
        expect(logger.warn.mock.calls[0][0]).toContain('ENOENT');
    });

});
