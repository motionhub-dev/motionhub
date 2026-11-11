-- owner_id is fixed before a draft is readable. Old unsubmitted drafts deliberately remain unowned and expire.
ALTER TABLE submissions ADD COLUMN owner_id INTEGER;
ALTER TABLE submissions ADD COLUMN base_sha TEXT;
ALTER TABLE submissions ADD COLUMN claim_token TEXT;
ALTER TABLE submissions ADD COLUMN claimed_at INTEGER;
ALTER TABLE submissions ADD COLUMN commit_sha TEXT;
UPDATE submissions SET status = 'expired', code = '', expires_at = 0 WHERE status NOT IN ('submitted', 'withdrawn');
-- a share submitted before is its submitter's: the account that certified the DCO for it, so its page stays theirs
UPDATE submissions SET owner_id = person WHERE owner_id IS NULL AND person IS NOT NULL AND status IN ('submitted', 'withdrawn');
CREATE INDEX submissions_owner ON submissions(owner_id, created_at);
CREATE UNIQUE INDEX submissions_active_motion ON submissions(motion)
  WHERE status = 'submitting';
CREATE TRIGGER submissions_owner_immutable BEFORE UPDATE OF owner_id ON submissions
WHEN OLD.owner_id IS NOT NULL AND NEW.owner_id IS NOT OLD.owner_id
BEGIN
  SELECT RAISE(ABORT, 'submission owner is immutable');
END;
CREATE TABLE submission_budgets (
  day INTEGER PRIMARY KEY,
  attempts INTEGER NOT NULL
);
