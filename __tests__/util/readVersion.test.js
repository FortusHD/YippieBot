// Imports
const fs = require('fs');
const logger = require('../../src/logging/logger');
const { getVersion } = require('../../src/util/readVersion');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

jest.mock('fs');

describe('getVersion', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return the version of package.json', () => {
        // Arrange
        const mockVersion = '1.2.3';
        const mockData = JSON.stringify({ version: mockVersion });
        fs.readFileSync.mockReturnValue(mockData);

        // Act
        const version = getVersion('./package.json');

        // Assert
        expect(version).toBe(mockVersion);
    });

    test('should return -1, if package.json can not be parsed', () => {
        // Arrange
        fs.readFileSync.mockReturnValue('invalid JSON');

        // Act
        const version = getVersion('./package.json');

        // Assert
        expect(version).toBe('-1');
        expect(logger.warn).toHaveBeenCalled();
        expect(logger.warn.mock.calls[0][0]).toContain('SyntaxError');
    });

    test('should return -1, if package.json does not exist', () => {
        // Arrange
        const mockError = new Error('ENOENT: no such file or directory, open \'./package.json\'');
        fs.readFileSync.mockImplementation(() => {
            throw mockError;
        });

        // Act
        const version = getVersion('./package.json');

        // Assert
        expect(version).toBe('-1');
        expect(logger.warn).toHaveBeenCalled();
        expect(logger.warn.mock.calls[0][0]).toContain('ENOENT');
    });

});
