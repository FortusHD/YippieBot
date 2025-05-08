// Imports
const path = require('path');
const { getMigrationData, migrateChanges } = require('../../src/util/json_manager');
const { getVersion } = require('../../src/util/readVersion');
const logger = require('../../src/logging/logger');
const migrate = require('../../src/migration/migration');

// Mock
jest.mock('../../src/util/json_manager', () => ({
    getMigrationData: jest.fn(),
    migrateChanges: jest.fn(),
}));
jest.mock('../../src/util/readVersion', () => ({
    getVersion: jest.fn(),
}));
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));
jest.mock('path');

describe('migration', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        path.join.mockImplementation((...args) => args.join('/'));
    });

    test('should not perform migrations when migration data is null', async () => {
        // Arrange
        getVersion.mockReturnValue('1.0.0');
        getMigrationData.mockReturnValue({ length: null });

        // Act
        await migrate();

        // Assert
        expect(getMigrationData).toHaveBeenCalled();
        expect(migrateChanges).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    test('should perform migrations for versions less than or equal to current version', async () => {
        // Arrange
        const currentVersion = '2.0.0';
        const mockMigrationData = [
            {
                version: '1.0.0',
                migrations: [
                    {
                        file: 'config.json',
                        changes: [{
                            old: 'old',
                            new: 'new',
                        }],
                    },
                ],
            },
            {
                version: '2.0.0',
                migrations: [
                    {
                        file: 'settings.json',
                        changes: [{
                            old: 'old',
                            new: 'new',
                        }],
                    },
                ],
            },
        ];

        getVersion.mockReturnValue(currentVersion);
        getMigrationData.mockReturnValue(mockMigrationData);

        // Act
        await migrate();

        // Assert
        expect(getMigrationData).toHaveBeenCalled();
        expect(migrateChanges).toHaveBeenCalledTimes(2);
        expect(logger.info).toHaveBeenCalledWith('Migrating to version 1.0.0');
        expect(logger.info).toHaveBeenCalledWith('Migrating to version 2.0.0');
        expect(logger.info).not.toHaveBeenCalledWith('Migrating to version 3.0.0');
        expect(migrateChanges).toHaveBeenCalledWith(
            expect.stringContaining('config.json'),
            [{
                old: 'old',
                new: 'new',
            }],
        );
        expect(migrateChanges).toHaveBeenCalledWith(
            expect.stringContaining('settings.json'),
            [{
                old: 'old',
                new: 'new',
            }],
        );
    });

    test('should handle migrations with multiple files per version', async () => {
        // Arrange
        const currentVersion = '1.0.0';
        const mockMigrationData = [
            {
                version: '1.0.0',
                migrations: [
                    {
                        file: 'file1.json',
                        changes: [{
                            old: 'old',
                            new: 'new',
                        }],
                    },
                    {
                        file: 'file2.json',
                        changes: [{
                            old: 'old',
                            new: 'new',
                        }],
                    },
                ],
            },
        ];
        getVersion.mockReturnValue(currentVersion);
        getMigrationData.mockReturnValue(mockMigrationData);

        // Act
        await migrate();

        // Assert
        expect(migrateChanges).toHaveBeenCalledTimes(2);
        expect(logger.info).toHaveBeenCalledWith('Migrating file1.json');
        expect(logger.info).toHaveBeenCalledWith('Migrating file2.json');
    });

    test('should handle empty migration data array', async () => {
        // Arrange
        getVersion.mockReturnValue('1.0.0');
        getMigrationData.mockReturnValue([]);

        // Act
        await migrate();

        // Assert
        expect(migrateChanges).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });

    test('should not handle future versions', async () => {
        // Arrange
        const currentVersion = '1.0.0';
        const mockMigrationData = [
            {
                version: '2.0.0',
                migrations: [
                    {
                        file: 'file.json',
                        changes: [{
                            old: 'old',
                            new: 'new',
                        }],
                    },
                ],
            },
        ];
        getVersion.mockReturnValue(currentVersion);
        getMigrationData.mockReturnValue(mockMigrationData);

        // Act
        await migrate();

        // Assert
        expect(migrateChanges).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
    });
});