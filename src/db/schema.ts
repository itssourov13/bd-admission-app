import type { SqlDb } from "./types.ts";

/**
 * Ordered, append-only migrations. Never edit a shipped migration; add a new one.
 * Content tables (institutions … question_sources) are written only by the importer.
 * User-owned tables (user_profile, bookmarks, practice_*, session_*) are never
 * touched by imports, so content updates cannot destroy progress.
 */
export interface Migration { version: number; name: string; sql: string }

export const MIGRATIONS: readonly Migration[] = [
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
  },
  {
    version: 2,
    name: "batch_pack_signature",
    sql: `
ALTER TABLE question_batches ADD COLUMN pack_signature TEXT;
`
  },
  {
    version: 3,
    name: "exam_section_selection_config",
    sql: `
ALTER TABLE exam_rules ADD COLUMN selection_config TEXT;
`
  },
  {
    version: 4,
    name: "official_rule_component_total_marks",
    sql: `
ALTER TABLE exam_rules ADD COLUMN total_marks REAL;
`
  },
  {
    version: 5,
    name: "session_rule_component_total_marks",
    sql: `
ALTER TABLE practice_sessions ADD COLUMN rule_total_marks REAL;
`
  },
  {
    version: 6,
    name: "marking_profiles",
    sql: `
-- User-owned data only (never importer-owned content tables). Built-in profiles ship in code, not in the database.
ALTER TABLE practice_sessions ADD COLUMN rule_profile_json TEXT;

CREATE TABLE user_marking_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  profile_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- scope_key: '*' (all practice) or 'u:<universityKey>'. profile_id may name a built-in or a user profile.
CREATE TABLE marking_preferences (
  scope_key TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`
  },
  {
    version: 7,
    name: "exam_answer_review_flag",
    sql: `
-- Mark-for-review flag per exam question (user-owned session data; does not affect scoring).
ALTER TABLE session_answers ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0;
`
  },
  {
    version: 8,
    name: "publications_library",
    sql: `
-- Publisher/book content is kept apart from university papers (exam_papers/question_appearances) but reuses the shared
-- questions/question_options tables and therefore the whole practice engine. A question belongs to a book through
-- content_unit_questions; it is part of the default (university) practice pool only when it also has a paper appearance.
CREATE TABLE publishers (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  kind TEXT NOT NULL DEFAULT 'publisher' CHECK (kind IN ('publisher','coaching','institution','community')),
  description TEXT,
  website TEXT,
  logo_key TEXT,
  logo_license TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE content_books (
  id TEXT PRIMARY KEY NOT NULL,
  publisher_id TEXT NOT NULL REFERENCES publishers(id),
  title TEXT NOT NULL,
  title_bn TEXT,
  edition TEXT,
  publication_year INTEGER,
  subject TEXT,
  language TEXT NOT NULL DEFAULT 'bn' CHECK (language IN ('bn','en','mixed')),
  target_category TEXT NOT NULL DEFAULT 'general' CHECK (target_category IN ('varsity','medical','engineering','general')),
  content_type TEXT NOT NULL DEFAULT 'question_bank' CHECK (content_type IN ('book','question_bank','model_test','mixed')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified','unverified','metadata_only')),
  content_version INTEGER NOT NULL DEFAULT 1,
  version_label TEXT,
  source_note TEXT,
  license_status TEXT NOT NULL DEFAULT 'permission_pending' CHECK (license_status IN ('licensed','public_domain','owner_created','permission_pending','metadata_only')),
  license_note TEXT,
  -- Availability, not existence: 'removed' and 'catalogue_only' books keep their rows (and the questions user data points to).
  install_state TEXT NOT NULL DEFAULT 'bundled' CHECK (install_state IN ('catalogue_only','bundled','installed','removed')),
  cover_key TEXT,
  question_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_books_publisher ON content_books(publisher_id, title);

CREATE TABLE content_units (
  id TEXT PRIMARY KEY NOT NULL,
  book_id TEXT NOT NULL REFERENCES content_books(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES content_units(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'chapter' CHECK (kind IN ('chapter','unit','section','test')),
  title TEXT NOT NULL,
  title_bn TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_units_book ON content_units(book_id, sort_order);
CREATE INDEX idx_units_parent ON content_units(parent_id);

-- No cascade from questions: question rows are never deleted (bookmarks and history reference them).
CREATE TABLE content_unit_questions (
  unit_id TEXT NOT NULL REFERENCES content_units(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES content_books(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (unit_id, question_id)
);
CREATE INDEX idx_cuq_question ON content_unit_questions(question_id);
CREATE INDEX idx_cuq_book ON content_unit_questions(book_id, position);

-- Metadata-only publisher identities (no logos, no books). Bangla spellings are provisional until owner-verified.
INSERT OR IGNORE INTO publishers (id, slug, name, name_bn, kind, sort_order) VALUES
  ('pub-udvash', 'udvash', 'Udvash', 'উদ্ভাস', 'coaching', 10),
  ('pub-aspect', 'aspect', 'ASPECT', 'অ্যাসপেক্ট', 'publisher', 20),
  ('pub-acs', 'acs', 'ACS', 'এসিএস', 'publisher', 30),
  ('pub-pankouri', 'pankouri', 'Pankouri', 'পানকৌড়ি', 'publisher', 40),
  ('pub-joykoli', 'joykoli', 'Joykoli', 'জয়কলি', 'publisher', 50);
`
  }
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Applies pending migrations, each in its own transaction, tracked by PRAGMA user_version. */
export async function migrate(db: SqlDb, migrations: readonly Migration[] = MIGRATIONS): Promise<number> {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let current = row?.user_version ?? 0;
  const latest = migrations[migrations.length - 1]?.version ?? 0;
  if (current > latest) {
    throw new Error(`Database version ${current} is newer than this app (${latest}).`);
  }
  for (const migration of migrations) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async (tx) => {
      await tx.execAsync(migration.sql);
      await tx.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }
  return current;
}
