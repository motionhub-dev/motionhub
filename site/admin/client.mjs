// Served as source text so Worker bundling cannot inject helper references into browser functions.
export const client = String.raw`
  const $ = (s, root = document) => root.querySelector(s);
  const content = $("#content"),
    notice = $("#notice"),
    section = document.body.dataset.section;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const word = (v) =>
    typeof v === "object" && v ? v.en || Object.values(v)[0] || "" : (v ?? "");
  const stamp = (v) =>
    v
      ? (typeof v === "number"
          ? new Date(v * 1000)
          : new Date(v)
        ).toLocaleString()
      : "—";
  const badge = (v) =>
    '<span class="badge ' +
    (["blocked", "rejected", "failure", "needs_review"].includes(v)
      ? "warn"
      : "") +
    '">' +
    esc(v) +
    "</span>";
  const link = (section, id, label) =>
    '<a class="details-link" href="/admin/' +
    section +
    "/detail?id=" +
    encodeURIComponent(id) +
    '">' +
    esc(label || id) +
    "</a>";
  const safeURL = (s) => {
    try {
      const u = new URL(s, location.origin);
      return ["https:", "http:"].includes(u.protocol) ? u.href : "#";
    } catch {
      return "#";
    }
  };
  const ext = (url, label) =>
    '<a class="button" target="_blank" rel="noopener noreferrer" href="' +
    esc(safeURL(url)) +
    '">' +
    esc(label) +
    " ↗</a>";
  const pre = (s) =>
    "<pre>" +
    esc(typeof s === "string" ? s : JSON.stringify(s, null, 2)) +
    "</pre>";
  const field = (label, name, value = "", type = "text", attrs = "") =>
    "<label>" +
    label +
    '<input type="' +
    type +
    '" name="' +
    name +
    '" value="' +
    esc(value) +
    '" ' +
    attrs +
    "></label>";
  const area = (label, name, value = "", attrs = "") =>
    "<label>" +
    label +
    '<textarea name="' +
    name +
    '" ' +
    attrs +
    ">" +
    esc(value) +
    "</textarea></label>";
  const select = (label, name, values, current) =>
    "<label>" +
    label +
    '<select name="' +
    name +
    '">' +
    values
      .map(
        (v) =>
          "<option " +
          (v === current ? "selected" : "") +
          ">" +
          esc(v) +
          "</option>",
      )
      .join("") +
    "</select></label>";
  const reason = () =>
    area("Reason", "reason", "", 'required maxlength="1000"');
  const submit = (label) =>
    '<div class="sticky"><button class="primary">' +
    label +
    '</button><p role="status" class="status-line"></p></div>';
  const form = (endpoint, body, confirm = "") =>
    '<form class="form-stack" data-endpoint="' +
    endpoint +
    '" ' +
    (confirm ? 'data-confirm="' + esc(confirm) + '"' : "") +
    ">" +
    body +
    "</form>";
  const hidden = (name, value) =>
    '<input type="hidden" name="' + name + '" value="' + esc(value) + '">';
  let permissions = [];
  const allowed = (p) => permissions.includes(p);
  async function request(resource, data) {
    const response = await fetch(
      "/api/admin/" + resource,
      data === undefined
        ? {}
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
          },
    );
    let result;
    try {
      result = await response.json();
    } catch {
      throw Error(
        "Service returned an invalid response. Your changes are still here.",
      );
    }
    if (!response.ok) throw Error(result.error || "Request failed.");
    return result;
  }
  function say(message) {
    notice.textContent = message;
    notice.hidden = false;
  }
  const theme = $("#theme"),
    system = matchMedia("(prefers-color-scheme:dark)");
  function applyTheme() {
    let value = "system";
    try {
      value = localStorage.getItem("mh-admin-theme") || "system";
    } catch {}
    theme.value = value;
    document.documentElement.dataset.theme =
      value === "system" ? (system.matches ? "dark" : "light") : value;
  }
  theme.addEventListener("change", () => {
    try {
      localStorage.setItem("mh-admin-theme", theme.value);
    } catch {}
    applyTheme();
  });
  system.addEventListener("change", applyTheme);
  applyTheme();
  const nav = $("#navigation"),
    toggle = $(".open-nav"),
    backdrop = $(".backdrop"),
    mobile = matchMedia("(max-width:767px)");
  function closeNav() {
    nav.classList.remove("open");
    backdrop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    nav.inert = mobile.matches;
    nav.removeAttribute("role");
    nav.removeAttribute("aria-modal");
  }
  function openNav() {
    nav.inert = false;
    nav.classList.add("open");
    backdrop.hidden = false;
    nav.setAttribute("role", "dialog");
    nav.setAttribute("aria-modal", "true");
    toggle.setAttribute("aria-expanded", "true");
    $(".close-nav").focus();
  }
  toggle.onclick = openNav;
  $(".close-nav").onclick = () => {
    closeNav();
    toggle.focus();
  };
  backdrop.onclick = () => {
    closeNav();
    toggle.focus();
  };
  mobile.addEventListener("change", closeNav);
  closeNav();
  nav.addEventListener("keydown", (e) => {
    if (!mobile.matches || !nav.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeNav();
      toggle.focus();
    }
    if (e.key === "Tab") {
      const els = [...nav.querySelectorAll("a,button,select")].filter(
        (el) => el.getClientRects().length,
      );
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  const editor = $("#editor");
  $("[data-close]").onclick = () => editor.close();
  function drawer(title, html) {
    $("#editor-title").textContent = title;
    $("#editor-content").innerHTML = html;
    editor.showModal();
    bindForms(editor);
  }
  const ask = (message) =>
    new Promise((resolve) => {
      const d = $("#confirm");
      $("#confirm-message").textContent = message;
      d.returnValue = "cancel";
      d.addEventListener("close", () => resolve(d.returnValue === "confirm"), {
        once: true,
      });
      d.showModal();
    });
  function bindForms(root = document) {
    for (const f of root.querySelectorAll("form[data-endpoint]")) {
      if (f.dataset.bound) continue;
      f.dataset.bound = "1";
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const button = e.submitter,
          status = $("[role=status]", f);
        if (f.dataset.confirm && !(await ask(f.dataset.confirm))) return;
        const data = Object.fromEntries(new FormData(f));
        if (data.version !== undefined) data.version = Number(data.version);
        if (data.position !== undefined) data.position = Number(data.position);
        if (data.items !== undefined)
          data.items = data.items
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (data.tags !== undefined)
          data.tags = data.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (f.elements.dco) data.dco = f.elements.dco.checked;
        button.disabled = true;
        f.setAttribute("aria-busy", "true");
        status.textContent = "Saving…";
        status.classList.remove("error");
        try {
          const result = await request(f.dataset.endpoint, data);
          if (result.url && f.dataset.endpoint === "preview") {
            status.textContent = "Preview expires in 15 minutes.";
            const frame = document.createElement("iframe");
            frame.className = "review-frame";
            frame.title = "Private artifact review";
            frame.sandbox = "allow-scripts";
            frame.referrerPolicy = "no-referrer";
            frame.src = result.url;
            f.parentElement.append(frame);
          } else if (result.url) {
            status.textContent =
              "Pull request opened. Publication follows checks, merge and deployment.";
            const a = document.createElement("a");
            a.href = safeURL(result.url);
            a.textContent = "Open pull request ↗";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            status.append(a);
          } else {
            try {
              sessionStorage.setItem("mh-admin-saved", "Changes saved.");
            } catch {}
            location.reload();
          }
        } catch (error) {
          status.textContent = error.message;
          status.classList.add("error");
        } finally {
          button.disabled = false;
          f.removeAttribute("aria-busy");
        }
      });
    }
  }
  function table(head, rows) {
    return rows.length
      ? '<div class="table-scroll"><table><thead><tr>' +
          head.map((h) => "<th>" + h + "</th>").join("") +
          "</tr></thead><tbody>" +
          rows
            .map(
              (r) =>
                "<tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>",
            )
            .join("") +
          "</tbody></table></div>"
      : '<div class="panel empty">No matching records.</div>';
  }
  function search(statuses = []) {
    const params = new URLSearchParams(location.search);
    return (
      '<form class="toolbar" method="get"><label class="sr">Search<input name="q" value="' +
      esc(params.get("q") || "") +
      '" placeholder="Search records"></label>' +
      (statuses.length
        ? '<label>Status<select name="status"><option value="">All statuses</option>' +
          statuses
            .map(
              (s) =>
                "<option " +
                (params.get("status") === s ? "selected" : "") +
                ">" +
                s +
                "</option>",
            )
            .join("") +
          "</select></label>"
        : "") +
      '<label>Sort<select name="sort"><option value="">Default order</option>' +
      [
        ["az", "A to Z"],
        ["newest", "Newest"],
        ["oldest", "Oldest"],
      ]
        .map(
          ([v, t]) =>
            '<option value="' +
            v +
            '" ' +
            (params.get("sort") === v ? "selected" : "") +
            ">" +
            t +
            "</option>",
        )
        .join("") +
      '</select></label><button>Search</button><a class="button" href="/admin/' +
      section +
      '">Clear</a></form>'
    );
  }
  function pagination(data) {
    const url = new URL(location);
    const p = (n) => {
      url.searchParams.set("page", String(n));
      return esc(url.pathname + url.search);
    };
    return (
      '<div class="pagination"><span>' +
      data.total +
      " records · page " +
      data.page +
      " / " +
      data.pages +
      '</span><div class="actions">' +
      (data.page > 1
        ? '<a class="button" href="' + p(data.page - 1) + '">Previous</a>'
        : "") +
      (data.page < data.pages
        ? '<a class="button" href="' + p(data.page + 1) + '">Next</a>'
        : "") +
      "</div></div>" +
      (data.bounded
        ? '<p class="warning">Showing the latest 2,000 records. Narrow your query or use database exports for older history.</p>'
        : "")
    );
  }
  function moderation(entity, row) {
    const perm = entity === "person" ? "people" : "moderate";
    if (!allowed(perm)) return "";
    const id = row.id ?? row.slug;
    return (
      '<h3 class="section-label">' +
      (entity === "submission" ? "Review decision" : "Access status") +
      "</h3>" +
      form(
        "state",
        hidden("entity", entity) +
          hidden("id", id) +
          hidden("version", row.moderation?.version ?? 0) +
          select(
            "Status",
            "status",
            entity === "submission"
              ? ["pending", "approved", "changes_requested", "rejected"]
              : ["active", "blocked"],
            row.admin_status || "active",
          ) +
          '<p class="muted">' +
          (entity === "submission"
            ? "This records an editorial decision. GitHub checks and merge still control publication."
            : "Blocking takes effect on site access. Restoring does not recreate revoked links or sessions.") +
          "</p>" +
          reason() +
          submit("Save status"),
        "Apply this access or review status?",
      )
    );
  }
  function metadata(row, keys) {
    return (
      "<dl>" +
      keys
        .map(
          (k) =>
            "<dt>" +
            esc(k.replaceAll("_", " ")) +
            "</dt><dd>" +
            esc(typeof row[k] === "object" ? word(row[k]) : (row[k] ?? "—")) +
            "</dd>",
        )
        .join("") +
      "</dl>"
    );
  }
  async function dashboard() {
    const days =
        new URLSearchParams(location.search).get("days") === "7" ? "7" : "30",
      d = await request("dashboard?days=" + days);
    $("#description").textContent =
      "Current inventory, editorial work and recorded service activity.";
    return (
      '<div class="stats">' +
      [
        [
          "Visible motions",
          d.counts.visible,
          "of " + d.counts.motions + " total",
        ],
        ["Awaiting review", d.counts.pending, "Submitted PRs"],
        ["Artifacts", d.counts.artifacts, "All publication states"],
        ["People", d.counts.people, "Signed-in accounts"],
      ]
        .map(
          ([k, v, n]) =>
            '<div class="stat">' +
            k +
            "<strong>" +
            v +
            "</strong><small>" +
            n +
            "</small></div>",
        )
        .join("") +
      '</div><div class="columns"><section class="panel"><div class="actions"><h2>Activity</h2><a class="button" href="?days=7">7 days</a><a class="button" href="?days=30">30 days</a></div><p class="muted">Rolling ' +
      days +
      " days; recorded views and downloads, not unique visitors.</p>" +
      (d.analytics_error
        ? '<p class="warning">' + esc(d.analytics_error) + "</p>"
        : table(
            ["Day (UTC)", "Event", "Count"],
            d.activity.map((a) => [esc(a.day), esc(a.kind), esc(a.total)]),
          )) +
      '</section><section class="panel"><h2>Needs attention</h2>' +
      table(
        ["Task", "State"],
        d.failures.map((j) => [esc(j.kind), badge(j.status)]),
      ) +
      '<p><a href="/admin/jobs">View jobs →</a></p></section></div><section class="panel"><h2>Recent management activity</h2>' +
      auditTable(d.recent) +
      "</section>"
    );
  }
  function auditTable(rows) {
    return table(
      ["Time", "Actor", "Object", "Action / reason"],
      rows.map((r) => [
        esc(stamp(r.created_at)),
        esc(r.actor),
        esc(r.entity + ": " + r.entity_id),
        esc(r.action) +
          "<small>" +
          esc(r.reason) +
          "</small><details><summary>Changes</summary>" +
          pre({
            before: JSON.parse(r.before_json),
            after: JSON.parse(r.after_json),
          }) +
          "</details>",
      ]),
    );
  }
  async function list() {
    const params = new URLSearchParams(location.search);
    params.delete("id");
    const d = await request(section + "?" + params);
    $("#description").textContent =
      {
        motions: "Published catalogue and access controls.",
        submissions:
          "Review submitted packages and follow their GitHub publication.",
        artifacts: "Uploaded works, versions and publication controls.",
        people: "GitHub accounts, contribution history and account access.",
        collections: "Curated selections, display order and publication.",
        audit: "Recorded administrator actions and changes.",
      }[section] || "";
    let head, rows;
    if (section === "motions") {
      head = ["Motion", "Version", "Catalogs / tags", "Access"];
      rows = d.rows.map((r) => [
        '<img class="poster" src="' +
          esc(r.poster) +
          '" alt=""> ' +
          link(section, r.slug, word(r.name)) +
          "<small>" +
          esc(r.slug) +
          "</small>",
        esc(r.version),
        esc([...(r.catalogs || []), ...(r.tags || [])].join(", ")),
        badge(r.admin_status),
      ]);
    }
    if (section === "submissions") {
      head = ["Motion", "Submitted by", "Submission / review", "PR", "Created"];
      rows = d.rows.map((r) => [
        link(section, r.id, r.motion) + "<small>" + esc(r.version) + "</small>",
        esc(r.login || "Not claimed"),
        badge(r.status) + " " + badge(r.moderation?.status || "pending"),
        r.pr
          ? ext(
              "https://github.com/motionhub-dev/motions/pull/" + r.pr,
              "#" + r.pr,
            )
          : "—",
        esc(stamp(r.created_at)),
      ]);
    }
    if (section === "artifacts") {
      head = ["Artifact", "Creator", "Publication", "Versions", "Access"];
      rows = d.rows.map((r) => [
        link(section, r.id, r.title) +
          "<small>" +
          esc(r.description) +
          "</small>",
        esc(r.login),
        badge(r.public_version ? "published" : "private"),
        esc(r.versions),
        badge(r.admin_status),
      ]);
    }
    if (section === "people") {
      head = ["Person", "Artifacts", "Submissions", "Last seen", "Access"];
      rows = d.rows.map((r) => [
        link(section, r.id, r.name || r.login) +
          "<small>@" +
          esc(r.login) +
          " · " +
          r.id +
          "</small>",
        esc(r.artifacts),
        esc(r.submissions),
        esc(stamp(r.seen_at)),
        badge(r.admin_status),
      ]);
    }
    if (section === "collections") {
      head = ["Collection", "Motions", "Order", "Status"];
      rows = d.rows.map((r) => [
        link(section, r.slug, r.title) +
          "<small>" +
          esc(r.description) +
          "</small>",
        esc(JSON.parse(r.items_json).length),
        esc(r.position),
        badge(r.status),
      ]);
    }
    const statuses =
      section === "submissions"
        ? [
            "pending",
            "approved",
            "changes_requested",
            "rejected",
            "submitted",
            "uploaded",
          ]
        : section === "collections"
          ? ["draft", "published", "archived"]
          : section === "audit"
            ? []
            : ["active", "blocked"];
    return (
      search(statuses) +
      (section === "collections" && allowed("collections")
        ? '<p><a class="button primary" href="/admin/collections/new">New collection</a></p>'
        : "") +
      (section === "audit" ? auditTable(d.rows) : table(head, rows)) +
      pagination(d)
    );
  }
  async function motionDetail(id) {
    const d = await request("motions?id=" + encodeURIComponent(id)),
      r = d.row;
    $("#description").textContent = id;
    return (
      '<div class="full-editor"><p><a href="/admin/motions">← Motions</a></p><section class="panel"><h2>' +
      esc(word(r.name)) +
      "</h2>" +
      metadata(r, ["slug", "version", "admin_status"]) +
      ext("/m/" + r.slug + "/", "Public page") +
      "<details><summary>Published MOTION.md</summary>" +
      pre(d.document) +
      "</details><details><summary>Tokens</summary>" +
      pre(d.tokens) +
      "</details><details><summary>Credits</summary>" +
      pre(d.credits) +
      "</details>" +
      moderation("motion", r) +
      "</section>" +
      (allowed("proposal")
        ? '<section class="panel"><h2>Propose a new version</h2><p>Creates a signed-off PR as your configured GitHub identity. You must be a published author. Existing files remain in the next version. Checks, merge and deployment determine when it goes live.</p>' +
          form(
            "proposal",
            hidden("id", id) +
              field(
                "New version",
                "new_version",
                "",
                "text",
                'required placeholder="Higher than ' + esc(r.version) + '"',
              ) +
              field(
                "English name",
                "name",
                word(r.name),
                "text",
                'required maxlength="120"',
              ) +
              field(
                "English description",
                "line",
                word(r.line),
                "text",
                'required maxlength="300"',
              ) +
              field(
                "Tags, comma-separated",
                "tags",
                (r.tags || []).join(", "),
                "text",
                'maxlength="800"',
              ) +
              area(
                "MOTION.md",
                "document",
                d.document,
                'required maxlength="60000"',
              ) +
              reason() +
              '<label class="check"><input type="checkbox" name="dco" required><span>I certify the <a href="https://developercertificate.org/" target="_blank" rel="noopener">Developer Certificate of Origin</a> for this change.</span></label>' +
              submit("Create pull request"),
            "Create a signed-off pull request for this new version?",
          ) +
          "</section>"
        : "") +
      "</div>"
    );
  }
  async function detail(id) {
    const d = await request(section + "?id=" + encodeURIComponent(id)),
      r = d.row;
    if (!r) throw Error("Record not found.");
    let body = "";
    if (section === "submissions") {
      body =
        metadata(r, [
          "motion",
          "version",
          "login",
          "status",
          "sha256",
          "bytes",
        ]) +
        (r.pr
          ? ext(
              "https://github.com/motionhub-dev/motions/pull/" + r.pr,
              "Open PR",
            )
          : "") +
        '<p class="warning">Review approval does not merge or deploy the PR.</p>' +
        (d.package_error
          ? '<p class="warning">' + esc(d.package_error) + "</p>"
          : "<h3>Package parsed successfully</h3><p>Archive and manifest intake checks passed. Full motion rules and ownership are checked by CI.</p>") +
        pre(d.document || "No retained document.") +
        table(
          ["File", "Bytes"],
          (d.files || []).map((f) => [esc(f.path), esc(f.bytes)]),
        ) +
        moderation("submission", r);
    }
    if (section === "people") {
      body =
        metadata(r, [
          "id",
          "login",
          "name",
          "created_at",
          "seen_at",
          "admin_status",
        ]) +
        table(
          ["Artifact", "Visibility"],
          d.artifacts.map((a) => [
            link("artifacts", a.id, a.title),
            badge(a.public_version ? "published" : "private"),
          ]),
        ) +
        table(
          ["Submission", "Status"],
          d.submissions.map((s) => [
            link("submissions", s.id, s.motion),
            badge(s.status),
          ]),
        ) +
        moderation("person", r) +
        (allowed("people")
          ? "<h3>Revoke all sessions</h3>" +
            form(
              "revoke-sessions",
              hidden("id", id) +
                reason() +
                submit("Revoke web and CLI sessions"),
              "Revoke all web and CLI sessions for this account?",
            )
          : "");
    }
    if (section === "artifacts") {
      body =
        metadata(r, [
          "id",
          "title",
          "login",
          "public_version",
          "draft_version",
          "admin_status",
        ]) +
        "<p>" +
        ext("/works/" + id, "Public work") +
        "</p>" +
        table(
          ["Version", "Created", "State"],
          d.versions.map((v) => [
            esc(v.id),
            esc(stamp(v.created_at)),
            badge(v.ready ? "ready" : "uploading"),
          ]),
        ) +
        "<p>" +
        esc(d.shares[0]?.count || 0) +
        " active share links.</p>" +
        moderation("artifact", r) +
        (allowed("moderate")
          ? "<h3>Revoke access links</h3>" +
            form(
              "revoke-links",
              hidden("id", id) +
                reason() +
                submit("Revoke share and preview links"),
              "Revoke every share and preview link for this artifact?",
            )
          : "") +
        (allowed("preview")
          ? "<h3>Review a private version</h3><p>Access is audited. The sandboxed preview expires after 15 minutes.</p>" +
            form(
              "preview",
              hidden("id", id) +
                select(
                  "Version",
                  "artifact_version",
                  d.versions.filter((v) => v.ready).map((v) => v.id),
                  r.draft_version,
                ) +
                reason() +
                submit("Open private preview"),
            )
          : "");
    }
    return { r, body };
  }
  async function collectionEditor(id) {
    let r = {
      slug: "",
      title: "",
      description: "",
      items_json: "[]",
      status: "draft",
      position: 0,
      version: 0,
    };
    if (id) {
      const d = await request("collections?id=" + encodeURIComponent(id));
      if (!d.row) throw Error("Collection not found.");
      r = d.row;
    }
    return (
      '<p><a href="/admin/collections">← Collections</a></p><section class="panel full-editor"><h2>' +
      esc(id ? "Edit collection" : "New collection") +
      "</h2><p>Published collections appear on the home page and /api/collections.json. List motion IDs in display order, one per line.</p>" +
      form(
        "collections",
        hidden("version", r.version) +
          field(
            "Slug",
            "slug",
            r.slug,
            "text",
            'required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80" ' +
              (id ? "readonly" : ""),
          ) +
          field("Title", "title", r.title, "text", 'required maxlength="160"') +
          area(
            "Description",
            "description",
            r.description,
            'maxlength="1000"',
          ) +
          area(
            "Motion IDs, in display order",
            "items",
            JSON.parse(r.items_json).join("\n"),
          ) +
          select(
            "Publication",
            "status",
            ["draft", "published", "archived"],
            r.status,
          ) +
          field(
            "Display position",
            "position",
            r.position,
            "number",
            'required min="0" max="9999"',
          ) +
          reason() +
          submit("Save collection"),
      ) +
      "</section>"
    );
  }
  async function jobs() {
    const d = await request("jobs");
    $("#description").textContent =
      "GitHub workflow state and recorded administrative tasks. Remote failures may require manual review.";
    return (
      (d.github_error
        ? '<p class="warning">' + esc(d.github_error) + "</p>"
        : "") +
      "<h2>GitHub workflows</h2>" +
      table(
        ["Workflow", "State", "Updated", "Actions"],
        d.workflows.map((r) => [
          esc(r.name),
          badge(r.conclusion || r.status),
          esc(stamp(r.updated_at)),
          ext(r.url, "Logs") +
            (allowed("jobs") &&
            d.retry_enabled &&
            ["failure", "cancelled", "timed_out"].includes(r.conclusion)
              ? '<button data-retry="' + r.id + '">Retry failed jobs</button>'
              : ""),
        ]),
      ) +
      (!d.retry_enabled
        ? '<p class="muted">Workflow retries require ADMIN_GITHUB_TOKEN with Actions write access.</p>'
        : "") +
      '<h2 class="section-label">Administrative tasks</h2>' +
      table(
        ["Task", "Actor", "State", "Result"],
        d.rows.map((r) => [
          esc(r.kind) + "<small>" + esc(r.id) + "</small>",
          esc(r.actor),
          badge(r.status),
          pre(JSON.parse(r.result_json)),
        ]),
      )
    );
  }
  async function settings() {
    if (!allowed("settings"))
      return '<div class="panel">System settings require superadmin access.</div>';
    const d = await request("settings");
    $("#description").textContent =
      "Feature availability, administrator roles and runtime configuration status.";
    const s = new Map(
      d.states.filter((s) => s.entity === "setting").map((s) => [s.id, s]),
    );
    const q = new Map(
      d.states.filter((s) => s.entity === "quota").map((s) => [s.id, s]),
    );
    return (
      '<div class="columns"><section class="panel"><h2>Feature switches</h2><p>These switches can disable a configured feature. Enabling here cannot replace missing bindings or credentials.</p>' +
      ["submissions", "artifacts"]
        .map((id) =>
          form(
            "state",
            hidden("entity", "setting") +
              hidden("id", id) +
              hidden("version", s.get(id)?.version || 0) +
              select(id, "status", ["on", "off"], s.get(id)?.status || "on") +
              reason() +
              submit("Save " + id),
            "Change this site feature?",
          ),
        )
        .join("") +
      '</section><section class="panel"><h2>Service configuration</h2>' +
      metadata(d.capabilities, Object.keys(d.capabilities)) +
      "<h3>Current upload limits</h3>" +
      metadata(d.limits, Object.keys(d.limits)) +
      '<p class="muted">Quotas can be lowered within supported limits. Existing files are retained. Secrets and infrastructure are configured outside the console.</p>' +
      Object.entries(d.limits)
        .map(([id, value]) =>
          form(
            "state",
            hidden("entity", "quota") +
              hidden("id", id) +
              hidden("version", q.get(id)?.version || 0) +
              field(
                id.replaceAll("_", " "),
                "status",
                value,
                "number",
                'required min="1" max="' + d.quota_maxima[id] + '"',
              ) +
              reason() +
              submit("Save quota"),
            "Apply this upload quota?",
          ),
        )
        .join("") +
      '</section></div><section class="panel"><h2>Administrators</h2><p>Bootstrap superadmins: ' +
      esc(d.bootstrap.join(", ") || "Local development only") +
      "</p>" +
      table(
        ["Email", "Role", "Version", ""],
        d.roles.map((r) => [
          esc(r.email),
          badge(r.role),
          r.version,
          '<button data-role="' +
            esc(r.email) +
            '" data-version="' +
            r.version +
            '" data-current="' +
            r.role +
            '">Edit</button>',
        ]),
      ) +
      "<h3>Add administrator</h3>" +
      roleForm("", 0, "viewer") +
      "</section>"
    );
  }
  function roleForm(email, v, role) {
    return form(
      "roles",
      hidden("version", v) +
        field(
          "Access email",
          "email",
          email,
          "email",
          "required " + (email ? "readonly" : ""),
        ) +
        select(
          "Role",
          "role",
          [
            "viewer",
            "reviewer",
            "operator",
            "superadmin",
            ...(email ? ["remove"] : []),
          ],
          role,
        ) +
        reason() +
        submit("Save administrator"),
      "Apply this administrator role?",
    );
  }
  async function main() {
    try {
      const me = await request("me");
      permissions = me.permissions;
      try {
        const saved = sessionStorage.getItem("mh-admin-saved");
        if (saved) {
          say(saved);
          sessionStorage.removeItem("mh-admin-saved");
        }
      } catch {}
      const id = new URLSearchParams(location.search).get("id");
      if (section === "dashboard") content.innerHTML = await dashboard();
      else if (section === "jobs") content.innerHTML = await jobs();
      else if (section === "settings") content.innerHTML = await settings();
      else if (
        section === "collections" &&
        (location.pathname.endsWith("/new") || id)
      )
        content.innerHTML = await collectionEditor(id);
      else if (section === "motions" && id)
        content.innerHTML = await motionDetail(id);
      else if (id && ["people", "artifacts", "submissions"].includes(section)) {
        content.innerHTML = await list();
        const d = await detail(id);
        drawer(d.r.title || d.r.motion || d.r.login, d.body);
      } else content.innerHTML = await list();
      bindForms();
      for (const b of document.querySelectorAll("[data-role]"))
        b.onclick = () =>
          drawer(
            "Edit administrator",
            roleForm(
              b.dataset.role,
              Number(b.dataset.version),
              b.dataset.current,
            ),
          );
      for (const b of document.querySelectorAll("[data-retry]"))
        b.onclick = () =>
          drawer(
            "Retry workflow",
            form(
              "retry",
              hidden("id", b.dataset.retry) +
                reason() +
                submit("Retry failed jobs"),
              "Retry this failed GitHub workflow?",
            ),
          );
    } catch (error) {
      content.replaceChildren();
      const p = document.createElement("p");
      p.className = "warning";
      p.textContent = error.message;
      content.append(p);
    } finally {
      content.removeAttribute("aria-busy");
    }
  }
  main();
`;
