# Database migrations

Every schema change is its own file named `NNN_description.js` (consecutive number). On startup, `migrator.js`
runs all migrations that have not been applied yet, in order, and records them in the `schema_migrations` table.

```js
module.exports = {
    description: 'Add index on polls.endTime',
    async up(connection) {
        await connection.query('CREATE INDEX idx_polls_endTime ON polls (endTime)');
    },
};
```

Rules:
- **Never edit** a migration that has already been applied somewhere. Add a new one instead.
- MySQL commits DDL implicitly, so there is no rollback. If a migration fails, it is not recorded and runs
  again on the next start, so write migrations to be repeatable (`IF NOT EXISTS`, checks via
  `information_schema`; see `_helpers.js`).
- Check what `NULL` means for a column before making it `NOT NULL` (e.g. `polls.maxVotes`: `NULL` = no limit).
- The table modules in `../tables` only contain queries, no schema.
