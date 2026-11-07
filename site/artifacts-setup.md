# Private artifact previews

Artifact previews are disabled unless the Worker has an `ARTIFACTS` binding and a valid `ARTIFACT_CONTENT_ORIGIN`. For staging:

1. Apply the site's D1 migrations to the staging database, including `0003_artifacts.sql` through `0005_artifact_publication.sql`.
2. Bind a dedicated, private R2 bucket as `ARTIFACTS`. Do not enable a public bucket endpoint.
3. Attach `artifacts.motionhub.dev` as the pilot content domain on the same Worker and set its HTTPS origin as `ARTIFACT_CONTENT_ORIGIN`. Use this domain only for uploaded content. Set `ARTIFACT_SITE_ORIGIN` to the staging application origin and configure the GitHub login callback for that origin.
   The application origin for staging is `https://staging.motionhub.dev`. This pilot is same-site, so session and OAuth state cookies use the browser-enforced `__Host-` prefix. Existing browser sessions need to sign in again after that cookie change. Keep content on the sandboxed routes, and replace the content origin and Worker domain binding when moving to a separate registrable domain.
4. Open `/artifacts/` on the application origin. Sign in, upload an HTML file, then upload a ZIP to the same draft and refresh its URL.

ZIP files need `index.html` at the root. Use relative asset URLs; for Vite, build with `--base ./`. Remote resources, network APIs outside the preview origin, and service workers are outside the preview sandbox. Temporary frame URLs expire after 15 minutes; refresh the signed-in draft page to get a new one.

Pilot limits are 8 MiB per upload, 24 MiB after unpacking, 256 ZIP entries, 20 artifacts per account, and 20 versions per artifact. The existing Worker cron clears expired grants, abandoned uploads, and storage queued for removal.

## Production

Production runs the same pilot as staging, with `https://motionhub.dev` as the application origin. Its configuration lives in `wrangler.jsonc`, because every deploy replaces the Worker's bindings and variables with that file:

- the private R2 bucket `motionhub-artifacts`, bound as `ARTIFACTS`, with no public endpoint;
- `ARTIFACT_CONTENT_ORIGIN` set to `https://artifacts.motionhub.dev`, a custom domain of the same Worker, and `ARTIFACT_SITE_ORIGIN` set to `https://motionhub.dev`;
- the production D1 database, with `0003_artifacts.sql` to `0005_artifact_publication.sql` applied.

The content domain is same-site with the application. Every content response carries a CSP `sandbox allow-scripts` policy without `allow-same-origin`, so uploaded pages run in an opaque origin, can't read or set cookies and can't reach the application's storage. Session and OAuth state cookies are `__Host-` cookies, so the content domain never receives them. Every request runs the Worker first (`run_worker_first: true`), so the content domain answers only `/preview/*`, `/shared/*` and `/published/*` and returns 404 for every other path, the site's pages included. A separate registrable domain for content remains the long-term setup; moving to one means replacing the content origin and the Worker domain binding.

To turn Artifacts off, remove `ARTIFACT_CONTENT_ORIGIN` from `wrangler.jsonc` and deploy: every Artifact route then returns 404 and the stored drafts stay in D1 and R2.

## Staging acceptance

Set `MOTIONHUB_ARTIFACT_ORIGIN` to the staging application HTTPS origin for CLI login and Artifact upload. The CLI stores staging credentials separately from production credentials.

- Upload one self-contained HTML file, then a ZIP with a relative JavaScript module and stylesheet. Confirm that each renders in the iframe and the other account cannot open the draft URL.
- Publish version 1 and create a share link. Upload version 2 to the same draft. Confirm that the author sees version 2 and both anonymous links still show version 1. Revoke the share and unpublish the work, then check the frame URLs return 404.
- Sign in with the CLI, upload a new draft, then run `motionhub logout` and verify the old credential is rejected.
- Run the GitHub App smoke test only against an isolated test repository/app or an explicitly approved test submission. The current Motion submission client targets the production MotionHub catalog; staging Artifact configuration does not redirect `motionhub share`.
