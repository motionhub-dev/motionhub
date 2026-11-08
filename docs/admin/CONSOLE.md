# MotionHub admin console

The console at `/admin` follows Awesome Builders' navigation, compact tables, review drawers, independent workspace scrolling, mobile navigation and separate light/dark/system theme preference. It uses MotionHub's existing brand tokens. Public GitHub sessions do not grant administrator access.

## Included workflows

| Page        | Capabilities                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Dashboard   | Current inventory, pending editorial reviews, rolling 7/30-day recorded activity, recent audits and tasks requiring attention |
| Motions     | Search, access status, published metadata/document/tokens/credits, and author-attributed new-version PR proposals             |
| Submissions | Search/status filters, retained package intake checks, file inventory, document, PR link and editorial decisions              |
| Artifacts   | Publication/version inventory, access restrictions, share/preview revocation and audited 15-minute sandboxed private previews |
| People      | GitHub identity, contribution history, account restriction/restoration and revocation of web/CLI sessions                     |
| Collections | Draft/published/archived selections, ordered motion IDs, position, editing and public home-page/API publication               |
| Jobs        | Latest GitHub workflows, log links, retries of failed check/render/deploy attempts and durable administrative task outcomes   |
| Audit       | Searchable before/after records, actor, action, object, reason and timestamp                                                  |
| Settings    | Feature switches, upload/account/version quotas, service configuration status and administrator roles                         |

Simple records open in a dialog drawer. Motion and collection editing use full pages. Failed saves retain inputs; stale versions return HTTP 409. Every business write requires a same-origin JSON request and server-side permission checks. Dynamic admin responses are private/no-store and excluded from indexing.

The default role matrix:

| Role       | Access                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| viewer     | Read business records, dashboard, job status and audits                                                         |
| reviewer   | Viewer + content moderation, private artifact review and author-qualified Motion proposals                      |
| operator   | Viewer + collection management and author-qualified Motion proposals                                            |
| superadmin | All permissions, including account restrictions, sessions, roles, quotas, feature switches and workflow retries |

Operators cannot view private artifact contents. Administrative private previews require a reason, are audited, use the existing separate content origin and sandbox, and expire after 15 minutes. Review grants permit inspecting a blocked work without restoring public visibility; they are separate from author previews. Restoring an account or artifact never recreates revoked sessions or links.

## Data and publication rules

Migration `site/migrations/0006_admin.sql` adds roles, moderation/setting overlays, collections, audit records and remote-operation jobs. Published Git packages remain immutable.

- Motion changes create a GitHub App PR using the existing submission mechanism. They require a strictly higher stable version, a mapped GitHub identity that is a published author, and explicit DCO certification. Name, description, tags and `MOTION.md` are editable; remaining package files are retained. The proposed gzip tar is retained at `admin/proposals/<job-id>.tgz` in the private package bucket, and its SHA-256 is recorded in the signed-off commit. No endpoint writes directly to main or merges a PR.
- A submission's editorial approval/rejection is separate from GitHub checks, merge and deployment. Rejection prevents a retained upload from being submitted through the site; it does not close an already opened PR or override repository reviews. Use the linked GitHub PR for those actions.
- Motion blocking denies detail/files, immutable package downloads, videos and reels at the Worker. It also filters the public catalogue, statistics, catalog membership, rendered links/cards and gallery search index. Previously downloaded files cannot be recalled. Existing brand/docs text is not rewritten into an alternative source of truth.
- Artifact/account blocking is checked for public works, portfolios, shares, uploaded content and owner upload/preview paths. Restoring preserves the author's publication choices.
- Collections are served through `/api/collections.json` and prepended to the home page. Hidden motions are omitted; empty collections are not shown. Global Git-owned `catalogs.json` still follows repository review; collections do not mutate it.
- Upload quota settings can lower the existing hard maxima: 8 MiB, 20 artifacts/account and 20 versions/artifact. Existing data is retained. Archive decompression/file-count limits remain enforced by the uploader.
- Remote writes reserve a durable job before contacting GitHub. An attempt is not automatically redispatched after an uncertain response. `needs_review` means inspect GitHub before taking further action; it does not mean the remote operation definitely failed. Workflow retry reservations are keyed by run ID and attempt.

Inventory lists for users, artifacts, submissions and audits expose at most the latest 2,000 records, with an explicit boundary notice. Jobs show 100 administrative tasks and 30 GitHub workflow runs. Bulk actions, CSV export, newsletters, automatic ingestion, destructive storage deletion and arbitrary repository editing are not part of this version.

## Local development

Use the existing checkout; no worktree is needed. Requirements: Node >=22.12 (validated with 24.22.1), installed `site/` dependencies and Chromium for browser tests. Set `npm_config_cache` or `XDG_CONFIG_HOME` to writable directories if the cloud runtime's home directory is read-only.

Build the standard site with `cd site && npm ci && npm run build`. Google Fonts access is required for the reel player build. For admin-only development without reel rendering, run these from the repository root:

```sh
node tools/build.mjs
cd site
node thumbs.mjs
ASTRO_TELEMETRY_DISABLED=1 npx astro build
node merge.mjs
cd ..
```

This builds the public page assets needed by the Worker; it does not validate or build reel players. Use the complete standard build before production deployment.

Use the dedicated local configuration, with local D1/R2 and no production secrets:

```sh
npx --yes wrangler@4.154.0 d1 migrations apply motionhub-admin-local --local --config wrangler.admin.local.jsonc
npx --yes wrangler@4.154.0 d1 execute motionhub-admin-local --local --config wrangler.admin.local.jsonc --file tests/fixtures/admin.sql
npx --yes wrangler@4.154.0 dev --local --config wrangler.admin.local.jsonc --port 8787
```

Seed only a new, disposable local database. The fixture contains fictional users and records, with no uploaded content bytes. Local administrator bypass requires both `ENVIRONMENT=local` and a loopback URL hostname. A non-loopback request is denied. Local artifact content serving additionally requires a separate HTTPS content origin; the example content hostname deliberately supplies no remote service. Browser tests exercise metadata and moderation without fetching private remote content.

## Production activation

`wrangler.jsonc` ships with `ADMIN_ENABLED=off`. Activating the console is a deployment/configuration operation and was not performed as part of development.

1. Apply the D1 migrations, including `0006_admin.sql`, to the intended staging database, validate, then apply them to production before enabling moderation. The tables are additive; do not recreate existing business tables.
2. Configure Cloudflare Access for both the exact paths and subpaths of `/admin` and `/api/admin`. Use an audience valid for both families and restrict the Access policy to your administrators. Origin code validates the RS256 signature, issuer, audience, issue/expiry times and email; email headers alone are rejected.
3. In the deployment configuration set `ENVIRONMENT=production`, `ACCESS_TEAM_DOMAIN=<team>.cloudflareaccess.com`, `ACCESS_AUD=<application audience>`, and `ADMIN_BOOTSTRAP_EMAILS` to a comma-separated list of administrator emails. Set `ADMIN_ENABLED=on` only after these are in place. Keep these variables in the deployment source of truth because a subsequent Wrangler deployment replaces variables.
4. Bootstrap administrators can grant application roles to other Access-authorized emails in Settings. They cannot change their own role or remove bootstrap access through the UI. Maintain the Access policy separately.
5. PR proposals require the existing `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY`, plus an out-of-band `ADMIN_GITHUB_IDENTITIES` JSON mapping from Access email to a verified `{ "id": <GitHub numeric ID>, "login": "<login>", "name": "<sign-off name>" }`. Verify the mapping before configuring it. GitHub's current account ID is checked on each proposal; published-author and repository ownership checks still apply.
6. Optional workflow retries require `ADMIN_GITHUB_TOKEN`, supplied through your secret configuration, scoped to this repository with Actions write/read access. Listing public workflow status can work without this token. Never place token values in source control or form fields.
7. Retain the existing private Artifact bucket and separate HTTPS content origin. Access must not intercept the public sandbox content routes. Configure the Analytics SQL binding for activity charts; its absence is shown explicitly rather than as zero activity.
8. Validate unauthorized access denial, each role, moderation propagation, private previews and the PR workflow on staging. Production OAuth/Access, live GitHub writes/retries and production deployment require validation in that configured environment.

Disabling `ADMIN_ENABLED` disables the moderation overlays as well as the console; it is not a way to hide the admin UI while keeping restrictions enforced. To suspend admin login while retaining moderation, change the Cloudflare Access policy instead.

## Verification

From the repository root:

```sh
npm test
node tools/check.mjs
node --test tests/admin.test.mjs
```

The admin tests use in-memory SQLite, signed local RSA test JWTs and mocked GitHub responses. They verify permission/origin denial, transactional audits, stale edits, all content access paths, session revocation, quotas, proposals and duplicate workflow retry protection.

With a seeded, isolated local Worker running:

```sh
cd site
CHROME=/usr/bin/chromium npm run test:admin-browser
```

The browser suite refuses non-loopback origins. It covers all nine pages at desktop/mobile sizes in light/dark modes, desktop workspace geometry, mobile focus/navigation, detail drawers, collection publication, conflict preservation and public HTML/search/API/file moderation. Screenshots are written to `/tmp/motions-admin-screenshots`. Use a disposable local state directory; tests create local collections and audit records.

Full reel builds/smoke tests remain the repository's standard validation for reel/player changes. This implementation does not change reel content or player code.
