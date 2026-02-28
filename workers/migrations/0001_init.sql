CREATE TABLE IF NOT EXISTS books (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source      TEXT NOT NULL CHECK(source IN ('NAROU','GOOGLE_BOOKS','OPEN_LIBRARY','AOZORA','CINII')),
  source_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  author      TEXT,
  description TEXT,
  url         TEXT,
  metadata    TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_books_source     ON books(source);
CREATE INDEX IF NOT EXISTS idx_books_author     ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at DESC);

CREATE TABLE IF NOT EXISTS sync_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  source     TEXT NOT NULL,
  status     TEXT NOT NULL CHECK(status IN ('RUNNING','SUCCESS','FAILED','PARTIAL')),
  created    INTEGER DEFAULT 0,
  updated    INTEGER DEFAULT 0,
  errors     TEXT,
  started_at DATETIME NOT NULL,
  ended_at   DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
