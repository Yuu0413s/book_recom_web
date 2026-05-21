ALTER TABLE books ADD COLUMN has_embedding INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_books_has_embedding ON books(has_embedding);
