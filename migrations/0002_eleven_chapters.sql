CREATE TABLE progress_expanded (
  user_id TEXT PRIMARY KEY,
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed BETWEEN 0 AND 11),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO progress_expanded (user_id, completed, updated_at) SELECT user_id, completed, updated_at FROM progress;
DROP TABLE progress;
ALTER TABLE progress_expanded RENAME TO progress;
