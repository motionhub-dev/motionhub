-- A motion shared from the command line (site/submissions.mjs): uploaded with no account, then opened and submitted by
-- a person signed in with GitHub, whom motionhub's GitHub App opens the pull request for. The package itself is in R2
-- (submissions/<id>.tgz) and is gone a day later; this keeps what the pull request and the sign-off rest on.
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,               -- 128 random bits, base64url: the share link
  poll_hash TEXT NOT NULL,           -- SHA-256 of the token the command line asks with
  code TEXT NOT NULL,                -- what the person types from their terminal, to say it is their share
  motion TEXT NOT NULL,              -- @<scope>/<slug>
  version TEXT NOT NULL,
  sha256 TEXT NOT NULL,              -- of the package: what was reviewed, signed off and committed
  bytes INTEGER NOT NULL,
  status TEXT NOT NULL,              -- uploaded, viewed, submitting (GitHub is being asked), submitted, withdrawn
  person INTEGER,                    -- the GitHub account that opened it, and submitted it
  attempts INTEGER NOT NULL DEFAULT 0,  -- wrong codes typed
  pr INTEGER,
  branch TEXT,
  dco_at INTEGER,                    -- when the person certified the Developer Certificate of Origin
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX submissions_person ON submissions(person, dco_at);
CREATE INDEX submissions_pr ON submissions(pr);
