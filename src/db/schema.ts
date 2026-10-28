import type { SqlDb } from "./types.ts";

/**
 * Ordered, append-only migrations. Never edit a shipped migration; add a new one.
 * Content tables (institutions … question_sources) are written only by the importer.
 * User-owned tables (user_profile, bookmarks, practice_*, session_*) are never
 * touched by imports, so content updates cannot destroy progress.
 */
export const MIGRATIONS: ReadonlyArray<{ version: number; name: string; sql: string }> = [
  {
    version: 1,
    name: "initial_schema",
    sql: `
CREATE TABLE institutions (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE question_batches (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('varsity','medical','engineering')),
  description TEXT,
  schema_version INTEGER NOT NULL,
  imported_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  import_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE source_documents (
  id TEXT PRIMARY KEY NOT NULL,
  batch_id TEXT NOT NULL REFERENCES question_batches(id),
  filename TEXT NOT NULL,
  title TEXT,
  sha256 TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf','image','structured-data','other')),
  notes TEXT
);

CREATE TABLE exam_papers (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  category TEXT NOT NULL CHECK (category IN ('varsity','medical','engineering')),
  year INTEGER NOT NULL,
  academic_session TEXT,
  unit TEXT,
  title TEXT
);
CREATE INDEX idx_papers_inst_year ON exam_papers(institution_id, year DESC);
CREATE INDEX idx_papers_category ON exam_papers(category, year DESC);

CREATE TABLE exam_rules (
  id TEXT PRIMARY KEY NOT NULL,
  paper_id TEXT NOT NULL REFERENCES exam_papers(id),
  correct_marks REAL,
  incorrect_penalty REAL,
  unanswered_marks REAL,
  duration_seconds INTEGER,
  total_questions INTEGER,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified','illustrative','unconfigured')),
  source_note TEXT
);
CREATE INDEX idx_rules_paper ON exam_rules(paper_id);

CREATE TABLE questions (
  id TEXT PRIMARY KEY NOT NULL,
  batch_id TEXT NOT NULL REFERENCES question_batches(id),
  category TEXT NOT NULL CHECK (category IN ('varsity','medical','engineering')),
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single_choice','multiple_choice')),
  subject TEXT,
  topic TEXT,
  answer_status TEXT NOT NULL CHECK (answer_status IN ('verified','unverified','unknown')),
  content_status TEXT NOT NULL CHECK (content_status IN ('verified','unverified')),
  explanation TEXT,
  asset_paths TEXT,
  content_hash TEXT NOT NULL
);
CREATE INDEX idx_questions_category ON questions(category, answer_status);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_batch ON questions(batch_id);

CREATE TABLE question_options (
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0,1)),
  PRIMARY KEY (question_id, option_key)
);
CREATE INDEX idx_options_question_order ON question_options(question_id, sort_order);

CREATE TABLE question_appearances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL REFERENCES exam_papers(id),
  question_number INTEGER,
  page_number INTEGER,
  source_document_id TEXT REFERENCES source_documents(id)
);
CREATE UNIQUE INDEX uq_appearance ON question_appearances(question_id, paper_id, IFNULL(question_number, 0), IFNULL(page_number, 0));
CREATE INDEX idx_appearance_paper ON question_appearances(paper_id, question_number);

CREATE TABLE question_sources (
  question_id TEXT PRIMARY KEY NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  source_document_id TEXT NOT NULL REFERENCES source_documents(id),
  page_number INTEGER,
  question_number INTEGER
);

CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'bn' CHECK (language IN ('bn','en')),
  target_category TEXT CHECK (target_category IN ('varsity','medical','engineering')),
  flash_seconds INTEGER NOT NULL DEFAULT 30 CHECK (flash_seconds BETWEEN 5 AND 600),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE bookmarks (
  question_id TEXT PRIMARY KEY NOT NULL REFERENCES questions(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE practice_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('flash','exam')),
  status TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
  filter_json TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  deadline_at INTEGER,
  duration_seconds INTEGER,
  per_question_seconds INTEGER,
  finish_reason TEXT CHECK (finish_reason IN ('submitted','time_expired','exited')),
  rule_correct_marks REAL,
  rule_incorrect_penalty REAL,
  rule_unanswered_marks REAL,
  rule_status TEXT CHECK (rule_status IN ('verified','illustrative','unconfigured')),
  result_json TEXT
);
CREATE INDEX idx_sessions_status ON practice_sessions(status, started_at DESC);

CREATE TABLE session_questions (
  session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question_id TEXT NOT NULL REFERENCES questions(id),
  cycle INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (session_id, position)
);

CREATE TABLE session_answers (
  session_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  question_id TEXT NOT NULL REFERENCES questions(id),
  selected_keys TEXT NOT NULL DEFAULT '[]',
  outcome TEXT NOT NULL CHECK (outcome IN ('correct','incorrect','skipped','timed_out','unanswered')),
  time_spent_ms INTEGER,
  answered_at INTEGER,
  PRIMARY KEY (session_id, position),
  FOREIGN KEY (session_id, position) REFERENCES session_questions(session_id, position) ON DELETE CASCADE
);
CREATE INDEX idx_answers_question ON session_answers(question_id);
`
  }
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Applies pending migrations, each in its own transaction, tracked by PRAGMA user_version. */
export async function migrate(db: SqlDb): Promise<number> {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let current = row?.user_version ?? 0;
  if (current > LATEST_VERSION) {
    throw new Error(`Database version ${current} is newer than this app (${LATEST_VERSION}).`);
  }
  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }
  return current;
}
