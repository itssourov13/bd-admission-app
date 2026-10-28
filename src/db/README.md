# Local database module

The planned runtime source of truth is an on-device SQLite database managed by Expo SQLite. The implementation phase should add ordered migrations, database initialization, repository boundaries, indexes, transaction-safe imports, and persistence for user-owned practice data.

The target schema and data contract are documented in docs/ARCHITECTURE.md and docs/QUESTION_DATA_SCHEMA.md. No runtime database or question tables are claimed to be implemented in this foundation commit.
