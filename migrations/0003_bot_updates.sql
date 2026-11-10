CREATE TABLE IF NOT EXISTS bot_updates (
  update_id INTEGER PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sent')),
  touched_at INTEGER NOT NULL
);
