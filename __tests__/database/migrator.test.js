// Imports
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { migrate, loadMigrations } = require('../../src/database/migrator');

// Mocks
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

/**
 * Creates a fake connection. `applied` are the versions already recorded in schema_migrations.
 */
function createConnection({ applied = [], lock = 1 } = {}) {
    return {
        query: jest.fn(async (sql) => {
            if (sql.includes('GET_LOCK')) {
                return [[{ acquired: lock }]];
            }
            if (sql.startsWith('SELECT version')) {
                return [applied.map((version) => ({ version }))];
            }
            return [[]];
        }),
    };
}

describe('migrator', () => {
    let dir;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'));
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    function writeMigration(file, body = 'async up(c) { await c.query(\'MIGRATE\'); }') {
        fs.writeFileSync(path.join(dir, file), `module.exports = { ${body} };`);
    }

    test('loadMigrations should sort by version and ignore other files', () => {
        writeMigration('010_b.js');
        writeMigration('002_a.js');
        fs.writeFileSync(path.join(dir, 'README.md'), '');

        expect(loadMigrations(dir).map((m) => m.version)).toEqual([2, 10]);
    });

    test('loadMigrations should reject duplicate versions', () => {
        writeMigration('001_a.js');
        writeMigration('001_b.js');

        expect(() => loadMigrations(dir)).toThrow('Duplicate migration version 1');
    });

    test('should apply only pending migrations and record them', async () => {
        writeMigration('001_a.js');
        writeMigration('002_b.js');
        const connection = createConnection({ applied: [1] });

        const count = await migrate(connection, dir);

        expect(count).toBe(1);
        const sqls = connection.query.mock.calls.map(([sql]) => sql);
        expect(sqls.filter((sql) => sql === 'MIGRATE')).toHaveLength(1);
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO schema_migrations'), [2, 'b'],
        );
        expect(sqls.some((sql) => sql.includes('RELEASE_LOCK'))).toBe(true);
    });

    test('should not record a failed migration but still release the lock', async () => {
        writeMigration('001_a.js', 'async up() { throw new Error(\'boom\'); }');
        const connection = createConnection();

        await expect(migrate(connection, dir)).rejects.toThrow('boom');

        const sqls = connection.query.mock.calls.map(([sql]) => sql);
        expect(sqls.some((sql) => sql.includes('INSERT INTO schema_migrations'))).toBe(false);
        expect(sqls.some((sql) => sql.includes('RELEASE_LOCK'))).toBe(true);
    });

    test('should fail if the lock cannot be acquired', async () => {
        writeMigration('001_a.js');
        const connection = createConnection({ lock: 0 });

        await expect(migrate(connection, dir)).rejects.toThrow('migration lock');
    });
});
