// Worker-compatible archive for a proposal's DCO digest. No Node-only modules.
export async function proposalArchive(id, files) {
  const encoder = new TextEncoder(),
    chunks = [];
  for (const file of [...files].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const path = `${id}/${file.path}`,
      data = file.data,
      header = new Uint8Array(512);
    let name = path,
      prefix = "";
    if (encoder.encode(name).length > 100) {
      const cut = path.lastIndexOf("/");
      prefix = path.slice(0, cut);
      name = path.slice(cut + 1);
    }
    if (
      encoder.encode(prefix).length > 155 ||
      encoder.encode(name).length > 100
    )
      throw new Error("Proposal path exceeds tar limits.");
    const field = (at, width, value) =>
      header.set(
        encoder
          .encode(
            typeof value === "number"
              ? value.toString(8).padStart(width - 1, "0")
              : value,
          )
          .slice(0, width),
        at,
      );
    field(0, 100, name);
    field(100, 8, 0o644);
    field(108, 8, 0);
    field(116, 8, 0);
    field(124, 12, data.length);
    field(136, 12, 0);
    header.fill(32, 148, 156);
    field(156, 1, "0");
    field(257, 8, "ustar\0" + "00");
    field(345, 155, prefix);
    field(
      148,
      8,
      header
        .reduce((s, b) => s + b, 0)
        .toString(8)
        .padStart(6, "0") + "\0 ",
    );
    chunks.push(
      header,
      data,
      new Uint8Array((512 - (data.length % 512)) % 512),
    );
  }
  chunks.push(new Uint8Array(1024));
  const stream = new Blob(chunks)
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const digest = [
    ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { bytes, digest };
}
