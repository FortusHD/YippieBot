const path = require('node:path');
const { loadMigrations } = require('../../src/database/migrator');

jest.mock('../../src/logging/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

describe('real migrations', () => {
    const dir = path.join(__dirname, '../../src/database/migrations');
    const migrations = loadMigrations(dir);

    test('should have gapless versions starting at 1', () => {
        expect(migrations.map((m) => m.version)).toEqual(migrations.map((_, i) => i + 1));
    });

    test.each(migrations.map((m) => [m.file, m]))('%s should export up()', (_, migration) => {
        const module = require(path.join(dir, migration.file));
        expect(typeof module.up).toBe('function');
        expect(typeof module.description).toBe('string');
    });

    test('should run all migrations against a fake connection without errors', async () => {
        const connection = { query: jest.fn().mockResolvedValue([[]]) };
        for (const migration of migrations) {
            await require(path.join(dir, migration.file)).up(connection);
        }
        expect(connection.query).toHaveBeenCalled();
    });
});
