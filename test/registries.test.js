// The registries reference each other, and nothing at build time notices when
// one drifts from another. A row can name a system slug that does not exist,
// or a slug can quietly stop matching the grammar every vocabulary shares, and
// the site builds and deploys either way because both are just table cells.
//
// This is the same class of gap the extension suite closes for schemas: two
// documents that agree only by convention until something checks.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const REGISTRIES = "src/content/docs/registries";

// Rows of a markdown table, as arrays of trimmed cells. Header separators and
// prose are skipped, so a file's several tables come back as one list.
function rows(markdown) {
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|[\s:-]+\|/.test(l))
    .map((l) =>
      l
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
    );
}

// Cells under a named header, across every table in the file that has one.
function column(markdown, header) {
  const out = [];
  let at = -1;
  for (const cells of rows(markdown)) {
    const found = cells.indexOf(header);
    if (found !== -1) {
      at = found;
      continue;
    }
    if (at !== -1 && cells[at]) out.push(cells[at]);
  }
  return out;
}

const slugs = (cell) => [...cell.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
const read = (name) => readFileSync(`${REGISTRIES}/${name}.md`, "utf8");

// The one grammar every vocabulary in these specifications shares.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("registries", () => {
  const systems = new Set(column(read("systems"), "Slug").flatMap(slugs));

  it("has a plausible number of systems", () => {
    assert.ok(systems.size > 40, `found ${systems.size} system slugs, which suggests the table did not parse`);
  });

  it("gives every system a slug that matches the shared grammar", () => {
    for (const slug of systems) {
      assert.match(slug, SLUG, `system slug ${slug}`);
      assert.ok(slug.length <= 64, `system slug ${slug} is over 64 bytes`);
    }
  });

  // A role is only meaningful against a system, so a role row naming a system
  // that does not exist describes a socket on a machine this project has never
  // heard of.
  it("names only real systems in the roles registry", () => {
    const cited = new Set(column(read("roles"), "System").flatMap(slugs));
    assert.ok(cited.size > 0, "no System column found in roles.md");
    for (const slug of cited)
      assert.ok(systems.has(slug), `roles.md names system \`${slug}\`, which is not registered`);
  });

  it("names only real systems in the cores registry", () => {
    const cited = new Set(column(read("cores"), "Systems").flatMap(slugs));
    assert.ok(cited.size > 0, "no Systems column found in cores.md");
    for (const slug of cited)
      assert.ok(systems.has(slug), `cores.md names system \`${slug}\`, which is not registered`);
  });

  it("gives every core a slug that matches the shared grammar", () => {
    for (const cell of column(read("cores"), "Slug")) {
      for (const slug of slugs(cell)) assert.match(slug, SLUG, `cores.md: ${slug}`);
    }
  });

  // A core's kind is where its slug comes from, so a Kind cell the page never
  // describes leaves the slug with no canonical name to derive from.
  it("gives every core a kind the cores registry describes", () => {
    const cores = read("cores");
    const kinds = new Set([...cores.matchAll(/^- \*\*`([a-z0-9-]+)`\*\*/gm)].map((m) => m[1]));
    assert.ok(kinds.size > 0, "no kinds described in cores.md");
    for (const kind of column(cores, "Kind").flatMap(slugs))
      assert.ok(kinds.has(kind), `cores.md uses kind \`${kind}\`, which the page does not describe`);
  });

  // An alias is how a tool maps a folder or an old name to a core, so one that
  // derives to another core's slug would send the same folder two ways.
  it("derives no alias in the cores registry to another core's slug", () => {
    const derive = (name) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const listed = [];
    let at;
    for (const cells of rows(read("cores"))) {
      if (cells.includes("Slug")) {
        at = { slug: cells.indexOf("Slug"), alias: cells.indexOf("Also seen as") };
        continue;
      }
      if (at)
        listed.push([slugs(cells[at.slug])[0], [...(cells[at.alias] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1])]);
    }
    const cores = new Set(listed.map(([slug]) => slug));
    assert.ok(cores.size > 100, `found ${cores.size} cores, which suggests the tables did not parse`);
    for (const [slug, aliases] of listed)
      for (const alias of aliases) {
        const derived = derive(alias);
        assert.ok(
          derived === slug || !cores.has(derived),
          `cores.md: \`${alias}\` on \`${slug}\` derives to \`${derived}\``,
        );
      }
  });

  it("gives every app a slug that matches the shared grammar", () => {
    const apps = column(read("apps"), "Slug").flatMap(slugs);
    assert.ok(apps.length > 0, "no Slug column found in apps.md");
    for (const slug of apps) assert.match(slug, SLUG, `apps.md: ${slug}`);
  });

  it("gives every platform a slug that matches the shared grammar", () => {
    const platforms = column(read("platforms"), "Slug").flatMap(slugs);
    assert.ok(platforms.length > 0, "no Slug column found in platforms.md");
    for (const slug of platforms) assert.match(slug, SLUG, `platforms.md: ${slug}`);
  });

  // A device whose firmware loads cores is the app and has no platform beneath
  // it, so a name listed in both would give that device two places to go.
  it("lists no name as both an app and a platform", () => {
    const apps = new Set(column(read("apps"), "Slug").flatMap(slugs));
    for (const slug of column(read("platforms"), "Slug").flatMap(slugs))
      assert.ok(!apps.has(slug), `\`${slug}\` is listed as both an app and a platform`);
  });

  // An app runs either every core of a kind or a core of its own, so each name
  // in its Cores column has to be one the cores registry knows as one or the
  // other.
  it("names only real core kinds or cores in the apps registry", () => {
    const cores = read("cores");
    const known = new Set([...column(cores, "Kind"), ...column(cores, "Slug")].flatMap(slugs));
    const cited = column(read("apps"), "Cores").flatMap(slugs);
    assert.ok(cited.length > 0, "no Cores column found in apps.md");
    for (const name of cited)
      assert.ok(known.has(name), `apps.md names \`${name}\`, which is neither a core kind nor a core`);
  });

  // A role cell holds either a slug or a numbered-socket prefix. A prefix ends
  // in `-` and is not itself a slug, so the check is that appending a number
  // yields one: that is exactly the claim the registry makes about it.
  it("gives every role either a valid slug or a usable prefix", () => {
    const cells = [...new Set([...column(read("roles"), "Role"), ...column(read("roles"), "Prefix")])];
    assert.ok(cells.length > 0, "no Role or Prefix column found in roles.md");
    for (const cell of cells) {
      for (const name of slugs(cell.replace(/`([a-z0-9-]*-)`/g, "`$1PREFIX`"))) {
        if (name.endsWith("-prefix")) {
          const prefix = name.slice(0, -"prefix".length);
          assert.match(`${prefix}1`, SLUG, `roles.md: prefix ${prefix} does not form a slug`);
        } else {
          assert.match(name, SLUG, `roles.md: ${name}`);
        }
      }
    }
  });
});
