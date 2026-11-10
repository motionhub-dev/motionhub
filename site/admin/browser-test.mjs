// Run against an isolated, seeded local Worker; never allows a remote origin.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
const base = new URL(process.env.ADMIN_TEST_ORIGIN ?? "http://localhost:8787");
if (
  !["localhost", "127.0.0.1"].includes(base.hostname) ||
  base.protocol !== "http:"
)
  throw new Error("Only a local HTTP Worker may be tested.");
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/usr/bin/chromium",
});
const errors = [],
  shots = "/tmp/motions-admin-screenshots";
await mkdir(shots, { recursive: true });
let checks = 0;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  const visit = async (path) => {
    await page.goto(new URL(path, base).href);
    await page.locator("#content:not([aria-busy])").waitFor({ timeout: 30000 });
  };
  const sections = [
    "dashboard",
    "motions",
    "submissions",
    "artifacts",
    "people",
    "collections",
    "jobs",
    "audit",
    "settings",
  ];
  for (const width of [1440, 390])
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const section of sections) {
        await visit("/admin/" + section);
        await page.locator("#theme").evaluate((el, t) => {
          localStorage.setItem("mh-admin-theme", t);
          el.value = t;
          el.dispatchEvent(new Event("change"));
        }, theme);
        assert.equal(await page.locator("nav a[aria-current=page]").count(), 1);
        assert.ok(
          !(await page
            .locator("#content")
            .innerText()
            .then((t) =>
              /Operation unavailable|invalid response|Cannot read properties/.test(
                t,
              ),
            )),
          section,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          section + " horizontal overflow",
        );
        if (width >= 768) {
          assert.equal(
            Math.round(
              await page
                .locator("#navigation")
                .evaluate((el) => el.getBoundingClientRect().width),
            ),
            224,
          );
          assert.equal(
            Math.round(
              await page
                .locator(".workspace")
                .evaluate((el) => el.getBoundingClientRect().left),
            ),
            224,
          );
        }
        await page.screenshot({
          path: shots + "/" + section + "-" + width + "-" + theme + ".png",
        });
        checks++;
      }
    }
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("/admin/motions");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  assert.equal(
    await page.locator("#navigation").getAttribute("aria-modal"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  checks++;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("/admin/submissions/detail?id=fixture-submission");
  assert.ok(await page.locator("#editor").isVisible());
  assert.match(
    await page.locator("#editor").innerText(),
    /Package expired|unavailable/,
  );
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  checks++;
  await visit("/admin/people/detail?id=900000001");
  assert.ok(await page.locator("#editor").isVisible());
  assert.match(
    await page.locator("#editor").innerText(),
    /Revoke all sessions/,
  );
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  checks++;
  await visit(
    "/admin/artifacts/detail?id=11111111-1111-4111-8111-111111111111",
  );
  assert.ok(await page.locator("#editor").isVisible());
  assert.match(
    await page.locator("#editor").innerText(),
    /Review a private version/,
  );
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  checks++;
  await visit(
    "/admin/motions/detail?id=" + encodeURIComponent("@iamsuosi/lab-notebook"),
  );
  assert.match(
    await page.locator("#content").innerText(),
    /Propose a new version/,
  );
  checks++;
  const collection = "browser-selection-" + Date.now();
  await visit("/admin/collections/new");
  await page.locator("[name=slug]").fill(collection);
  await page.locator("[name=title]").fill("Browser selection");
  await page.locator("[name=description]").fill("Local browser test");
  await page.locator("[name=items]").fill("@iamsuosi/lab-notebook");
  await page.locator("[name=status]").selectOption("published");
  await page
    .locator("[name=reason]")
    .fill("Exercise the local collection publish workflow");
  await page
    .getByRole("button", { name: "Save collection", exact: true })
    .click();
  await page.locator("#notice").filter({ hasText: "Changes saved." }).waitFor();
  const published = await context.request.get(
    new URL("/api/collections.json", base).href,
  );
  assert.ok(
    (await published.json()).collections.some((c) => c.slug === collection),
  );
  checks++;
  // A save conflict must preserve unsaved inputs.
  await visit("/admin/collections/detail?id=" + collection);
  const edit = page.locator("form[data-endpoint=collections]");
  await edit.locator("[name=title]").fill("Unsaved title");
  await edit
    .locator("[name=reason]")
    .fill("Test a stale edit without losing form input");
  await edit.locator("[name=version]").evaluate((el) => (el.value = "0"));
  await edit.getByRole("button", { name: "Save collection" }).click();
  await edit.locator("[role=status]").filter({ hasText: "changed" }).waitFor();
  assert.equal(
    await edit.locator("[name=title]").inputValue(),
    "Unsaved title",
  );
  checks++;
  // Blocking a motion removes it from HTML, embedded search, JSON, collections and direct files.
  const current = await (
    await context.request.get(
      new URL(
        "/api/admin/motions?id=" + encodeURIComponent("@iamsuosi/lab-notebook"),
        base,
      ).href,
    )
  ).json();
  const currentVersion = current.row.moderation?.version || 0;
  const moderation = await context.request.post(
    new URL("/api/admin/state", base).href,
    {
      headers: { origin: base.origin },
      data: {
        entity: "motion",
        id: "@iamsuosi/lab-notebook",
        status: "blocked",
        version: currentVersion,
        reason: "Local browser test moderation",
      },
    },
  );
  assert.equal(moderation.status(), 200);
  const api = await context.request.get(
    new URL("/api/motions.json", base).href,
  );
  assert.ok(
    !(await api.json()).motions.some(
      (r) => r.slug === "@iamsuosi/lab-notebook",
    ),
  );
  await page.goto(new URL("/motions/", base).href);
  assert.equal(
    await page.locator('[data-id="@iamsuosi/lab-notebook"]').count(),
    0,
  );
  assert.ok(
    !JSON.parse(await page.locator("#motionindex").textContent()).some(
      (r) => r.id === "@iamsuosi/lab-notebook",
    ),
  );
  assert.equal(
    (
      await context.request.get(
        new URL("/m/@iamsuosi/lab-notebook/motion.json", base).href,
      )
    ).status(),
    404,
  );
  await context.request.post(new URL("/api/admin/state", base).href, {
    headers: { origin: base.origin },
    data: {
      entity: "motion",
      id: "@iamsuosi/lab-notebook",
      status: "active",
      version: currentVersion + 1,
      reason: "Restore local browser fixture",
    },
  });
  checks++;
  for (const resource of [
    "motions",
    "submissions",
    "artifacts",
    "people",
    "collections",
    "audit",
  ]) {
    await visit("/admin/" + resource + "?q=definitely-no-matching-fixture-93x");
    assert.match(
      await page.locator("#content").innerText(),
      /No matching records/,
    );
    checks++;
  }
  await visit("/admin/settings");
  const quota = page
    .locator("form[data-endpoint=state]")
    .filter({ has: page.locator("input[name=id][value=upload_mib]") });
  await quota.locator("[name=status]").fill("4");
  await quota
    .locator("[name=reason]")
    .fill("Validate a persisted local upload quota");
  await quota.getByRole("button", { name: "Save quota", exact: true }).click();
  await page
    .locator("#confirm")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await page.locator("#notice").filter({ hasText: "Changes saved." }).waitFor();
  assert.equal(
    await page
      .locator("form[data-endpoint=state]")
      .filter({ has: page.locator("input[name=id][value=upload_mib]") })
      .locator("[name=status]")
      .inputValue(),
    "4",
  );
  checks++;
  await page.locator("#theme").selectOption("system");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  checks++;
  assert.deepEqual(errors, []);
  console.log(checks + " browser checks passed; screenshots: " + shots);
} finally {
  await browser.close();
}
