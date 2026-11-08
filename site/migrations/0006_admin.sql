-- Operational overlays never rewrite an immutable published motion package.
CREATE TABLE admin_roles (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  role TEXT NOT NULL CHECK(role IN ('viewer','reviewer','operator','superadmin')),
  version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE admin_states (
  entity TEXT NOT NULL CHECK(entity IN ('motion','artifact','person','submission','setting','quota')),
  id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(entity,id)
);
CREATE INDEX admin_states_status ON admin_states(entity,status);
CREATE TABLE admin_audit (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX admin_audit_time ON admin_audit(created_at DESC);
CREATE TABLE admin_collections (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
  position INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE TABLE admin_jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  actor TEXT NOT NULL,
  input_json TEXT NOT NULL,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX admin_jobs_time ON admin_jobs(created_at DESC);
-- Review grants are separate from author previews: moderators can inspect blocked
-- content without restoring its public visibility. Only audited admin APIs mint them.
CREATE TABLE admin_review_grants (
  token_hash TEXT PRIMARY KEY,
  version TEXT NOT NULL REFERENCES artifact_versions(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX admin_review_grants_expiry ON admin_review_grants(expires_at);
