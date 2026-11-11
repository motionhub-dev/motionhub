# Security operations

The security boundaries of motionhub's catalogue and of motionhub.dev, and how this repository's settings, its npm releases and its Claude workflows are run and recovered. Repository changes do not apply GitHub rules, set secrets or configure Anthropic accounts by themselves.

motionhub.dev's site (its Worker, database, buckets, deploy and their recovery) is operated from the private repository `motionhub-dev/motionhub-web`, built over this one at a commit it pins; its runbook is `docs/operations.md` there. This repository holds no production credential.

## Boundaries

- The hub accepts one author per motion. The immutable `accounts/` mapping resolves both current and former logins to the same numeric GitHub id. An update cannot transfer authorship. Credits and `basedOn` grant no permissions. Older format versions retain their format meaning; single authorship is a hub admission rule. A motion's scope and author are a GitHub user account: an organization is not accepted as either, through motionhub.dev or the App.
- Anonymous uploads go only to `motionhub-submissions`. Main is read at an immutable SHA, and the intended author is verified before `owner_id` is stored. Only that account can preview files or confirm publication. A link or a polling token grants no draft access.
- A submitted package is immutable and its digest is checked on every read. A D1 lease and a unique active-motion index serialize submissions. GitHub's expected head prevents concurrent branch replacement; a retry reconciles its signed submission marker rather than blindly committing twice.
- `share/**` branches belong to the submission App, not Claude. Every PR commit must carry a valid GitHub verification for the expected App and the same submitter id. The App's Git commit identity is the App; the human's DCO and account id are recorded in its signed message.
- Build, render, inference, and packaging runners have no production credentials. Fresh publishing runners verify artifacts from the current run before using credentials. R2 writes use atomic `If-None-Match: *`; a 403, timeout or server failure is never interpreted as object absence.
- The Claude workflows call the Messages API without tools. They do not use Claude Code or `CLAUDE_CODE_OAUTH_TOKEN`, run code, apply patches, push, approve, merge or deploy. Optional patches are untrusted artifact data for a person to inspect. Model results cannot select a publication target or survive a changed PR head.

## Repository settings

1. Review and apply `.github/rulesets/main.json` to the existing main ruleset rather than accidentally creating conflicting rules. Generate the App-only branch rule with `node .github/scripts/submission-ruleset.mjs <numeric-submission-App-id>`; inspect its JSON and apply it through GitHub administration. The template without an App id intentionally grants no bypass. Set `MOTIONHUB_BOT` to the App's verified bot login. App installation permissions are contents/write and pull requests/write on this repository only. Do not give it main bypass.
2. Configure the `npm-release` environment for protected release tags. npm Trusted Publisher must reference this repository, `publish.yaml`, and `npm-release`. Preserve staged release approval with 2FA. Restrict release tag creation to maintainers. Each tag must point into reviewed main history. The fixed publication jobs must be reviewed before environments are approved.
3. To enable AI advice, configure a dedicated Anthropic API workspace/key with its own spend limit and retention settings. Add repository secret `ANTHROPIC_API_KEY`, set `CLAUDE_MODEL` to an explicitly selected available model id, then set `CLAUDE_ENABLED=true`. Subscription OAuth credentials are not a substitute for this API key; API billing is separate. Test `/review` on a harmless PR. Reviews now require a maintainer request; there is no automatic expensive review on contributor pushes.
4. Remove obsolete Claude GitHub App write access and its OAuth secret if they have no other use. Check and update CODEOWNERS and any explicit GitHub login configuration when a maintainer renames their account.

The main ruleset does not require an App branch to merge unrelated main commits: these protected branches stay App-signed and linear. The site rechecks the complete merged catalogue before it builds over it. The ruleset requests an independent approval, dismisses stale approvals and requires approval of the latest push. All repository paths now have a code owner. With only one maintainer, an administrator can use the **PR-only** bypass with an explicit self-review record; this is not independent two-person review. No App gets that bypass. Once there are two reviewers, remove routine administrator bypass.

## Scanning

The portable scanner refuses known credential paths, private keys and recognized token patterns. It does not prove a file contains no secrets. Gitleaks separately scans the committed history of the commit being checked (not every fetched branch) with redacted reports; a finding that is not a secret is listed by its fingerprint, with the reason, in `.gitleaksignore`. Always inspect the CLI's source directory and file list before publication; a closed public PR is not a private draft.

## Pause and recover

- Set the repository variable `PUBLISHING=off` to stop subsequent npm staging runs. Cancel any already-running publishing job separately.
- Set `CLAUDE_ENABLED=false` and cancel active AI runs to stop advice generation. A request already sent to the provider may still be billed.
- For a suspected leaked credential, revoke it at its provider, replace the narrowly scoped credential, and inspect associated commits/deployments. Deleting a log or removing a file is not credential revocation.
- For a malicious published version, suspend publication, quarantine its delivery path, purge caches and publish a fixed version with a clear advisory. Downloaded copies cannot be recalled. Keep an incident record of the account id, commit SHA, package digest and affected URLs without copying credentials into it.
- Pausing or rolling back motionhub.dev, and suspending sharing through it, are done from the site's repository (`docs/operations.md` there).

## Verification

Run `npm test`, `node tools/check.mjs`, `node tools/build.mjs`, then `npm ci`, `npm run build` and `npm run smoke` in `player/`. Smoke includes the browser regression for direct `/play/` navigation: no cookie, storage, API or popup access. Validate all workflows with actionlint.
