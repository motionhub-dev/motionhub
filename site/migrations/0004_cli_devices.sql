CREATE TABLE cli_devices (
  code_hash TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL UNIQUE,
  person INTEGER REFERENCES people(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  token_hash TEXT UNIQUE
);
CREATE INDEX cli_devices_expiry ON cli_devices(expires_at);
