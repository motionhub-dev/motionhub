ALTER TABLE artifacts ADD COLUMN public_version TEXT REFERENCES artifact_versions(id) ON DELETE SET NULL;
ALTER TABLE artifacts ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE artifacts ADD COLUMN main_motion TEXT NOT NULL DEFAULT '';
ALTER TABLE artifacts ADD COLUMN other_motions TEXT NOT NULL DEFAULT '';
CREATE TABLE artifact_shares (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL REFERENCES artifact_versions(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX artifact_shares_version ON artifact_shares(version);
CREATE INDEX artifacts_public_version ON artifacts(public_version);
