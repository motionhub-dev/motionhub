-- Who signed in with GitHub, their sessions and their likes. A person is their GitHub account's numeric id; nothing
-- else about them is kept but what GitHub shows publicly (login, name, avatar). A session is kept as the SHA-256 of
-- its token, so this database alone signs no one in.
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  login TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  person INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_person ON sessions(person);

CREATE TABLE likes (
  motion TEXT NOT NULL,
  person INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (motion, person)
);
CREATE INDEX likes_person ON likes(person);
