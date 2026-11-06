CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  person INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  draft_version TEXT,
  updated_at INTEGER NOT NULL
);
CREATE INDEX artifacts_person ON artifacts(person, updated_at);

CREATE TABLE artifact_versions (
  id TEXT PRIMARY KEY,
  artifact TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  ready INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE artifact_preview_grants (
  token_hash TEXT PRIMARY KEY,
  version TEXT NOT NULL REFERENCES artifact_versions(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX artifact_preview_grants_expiry ON artifact_preview_grants(expires_at);

CREATE TABLE artifact_storage_deletions (
  version TEXT PRIMARY KEY
);

CREATE TRIGGER queue_artifact_storage_deletion AFTER DELETE ON artifact_versions
BEGIN
  INSERT OR IGNORE INTO artifact_storage_deletions (version) VALUES (OLD.id);
END;
