// The registries reference each other, and nothing at build time notices when
// one drifts from another. A row can name a system slug that does not exist,
// or a slug can quietly stop matching the grammar every vocabulary shares, and
// the site builds and deploys either way because both are just table cells.
//
// This is the same class of gap the extension suite closes for schemas: two
// documents that agree only by convention until something checks.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { decode, everyPart } from "./cbor.js";

const REGISTRIES = "src/content/docs/registries";
const VALID = "conformance/universal-saves/valid";

// Each markdown table in a file, as its header cells and its rows of cells.
// A table is a run of lines starting with `|`; its separator line is skipped.
function tables(markdown) {
  const out = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) {
      current = null;
      continue;
    }
    if (/^\|[\s:|-]+\|$/.test(line.trim())) continue;
    const cells = line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
    if (current) current.rows.push(cells);
    else out.push((current = { header: cells, rows: [] }));
  }
  return out;
}

// Cells under a named header, across every table in the file that has one.
function column(markdown, header) {
  return tables(markdown).flatMap(({ header: cells, rows }) => {
    const at = cells.indexOf(header);
    return at === -1 ? [] : rows.map((row) => row[at]).filter(Boolean);
  });
}

const slugs = (cell) => [...cell.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
const read = (name) => readFileSync(`${REGISTRIES}/${name}.md`, "utf8");

// The one grammar every vocabulary in these specifications shares.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isSlug = (name) => SLUG.test(name) && Buffer.byteLength(name, "utf8") <= 64;

// The registries whose rows are keyed by a slug in a Slug column.
const KEYED = ["systems", "cores", "apps", "platforms"];

// Roles, read loosely because the page's layout is not fixed: any backticked
// name under a Role or Prefix header counts. A name ending in `-`, or written
// as `memcard-<n>`, is a numbered-socket prefix; anything else is a role.
function roleNames() {
  const roles = read("roles");
  const names = new Set();
  const prefixes = new Set();
  for (const cell of [...column(roles, "Role"), ...column(roles, "Prefix")]) {
    for (const [, name] of cell.matchAll(/`([^`]+)`/g)) {
      const numbered = /^([a-z0-9-]+-)(<n>)?$/.exec(name);
      if (numbered) prefixes.add(numbered[1]);
      else names.add(name);
    }
  }
  return { names, prefixes };
}

// A prefix covers its name followed by a decimal number with no leading zero.
const isRegisteredRole = ({ names, prefixes }, role) =>
  names.has(role) ||
  [...prefixes].some((prefix) => role.startsWith(prefix) && /^[1-9][0-9]*$/.test(role.slice(prefix.length)));

// Alphabetical as a reader means it, with hyphens ignored: `nes-mister` sorts
// before `nestopia` and `msx1-mister` before `msx-mister`, as in a dictionary.
// Two slugs that differ only in hyphens fall back to plain byte order.
function alphabetical(a, b) {
  const [x, y] = [a.replaceAll("-", ""), b.replaceAll("-", "")];
  if (x !== y) return x < y ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

describe("registries", () => {
  const systems = new Set(column(read("systems"), "Slug").flatMap(slugs));

  it("has a plausible number of systems", () => {
    assert.ok(systems.size > 40, `found ${systems.size} system slugs, which suggests the table did not parse`);
  });

  // A Slug cell that is not one backticked slug would be skipped by every
  // check that reads slugs out of cells, so the cell itself is checked here.
  it("gives every system, core, app and platform a slug that matches the shared grammar", () => {
    for (const name of KEYED) {
      const cells = column(read(name), "Slug");
      assert.ok(cells.length > 0, `no Slug column found in ${name}.md`);
      for (const cell of cells) {
        const slug = /^`([^`]*)`$/.exec(cell)?.[1];
        assert.ok(slug !== undefined, `${name}.md: Slug cell ${cell} is not one backticked slug`);
        assert.match(slug, SLUG, `${name}.md: ${slug}`);
        assert.ok(isSlug(slug), `${name}.md: ${slug} is over 64 bytes`);
      }
    }
  });

  // An alias maps a tool's folder or label to one system. One that is another
  // system's slug, or sits on two rows, would send that folder two ways.
  it("gives every system alias one system, and never another system's slug", () => {
    const owner = new Map();
    for (const { header, rows } of tables(read("systems"))) {
      const at = { slug: header.indexOf("Slug"), alias: header.indexOf("Also seen as") };
      if (at.slug === -1 || at.alias === -1) continue;
      for (const cells of rows) {
        const slug = slugs(cells[at.slug])[0];
        for (const [, alias] of (cells[at.alias] ?? "").matchAll(/`([^`]+)`/g)) {
          assert.ok(!systems.has(alias), `systems.md: \`${alias}\` on \`${slug}\` is a system slug`);
          assert.ok(!owner.has(alias), `systems.md: \`${alias}\` is on both \`${owner.get(alias)}\` and \`${slug}\``);
          owner.set(alias, slug);
        }
      }
    }
    assert.ok(owner.size > 100, `found ${owner.size} system aliases, which suggests the table did not parse`);
  });

  // A prefix is not itself a slug, so the check is that appending a number
  // yields one: that is exactly the claim the registry makes about it.
  it("gives every role either a valid slug or a usable prefix", () => {
    const { names, prefixes } = roleNames();
    assert.ok(names.size > 0, "no roles found under a Role header in roles.md");
    assert.ok(prefixes.size > 0, "no numbered-socket prefixes found in roles.md");
    for (const name of names) assert.ok(isSlug(name), `roles.md: ${name} is not a slug of at most 64 bytes`);
    for (const prefix of prefixes) assert.ok(isSlug(`${prefix}1`), `roles.md: prefix ${prefix} does not form a slug`);
  });

  // Each page says its rows go in alphabetical order by slug, and the cores
  // page that each core appears once across all its sections. A slug listed
  // twice is two entries a producer could pick between.
  it("lists each slug once, in alphabetical order", () => {
    for (const name of KEYED) {
      const page = read(name);
      assert.match(page, /alphabetical/, `${name}.md no longer says how its rows are ordered`);
      const seen = new Set();
      for (const { header, rows } of tables(page)) {
        const at = header.indexOf("Slug");
        if (at === -1) continue;
        const listed = rows.map((row) => row[at].replaceAll("`", ""));
        for (const slug of listed) {
          assert.ok(!seen.has(slug), `${name}.md lists \`${slug}\` more than once`);
          seen.add(slug);
        }
        for (let i = 1; i < listed.length; i++)
          assert.ok(
            alphabetical(listed[i - 1], listed[i]) < 0,
            `${name}.md: \`${listed[i]}\` should sort before \`${listed[i - 1]}\``,
          );
      }
    }
  });

  // The roles page makes no claim about order, and one role legitimately
  // appears in several sections, but within one table a role is one row.
  it("lists each role once per table in the roles registry", () => {
    for (const { header, rows } of tables(read("roles"))) {
      const at = header.findIndex((cell) => cell === "Role" || cell === "Prefix");
      if (at === -1) continue;
      const seen = new Set();
      for (const row of rows)
        for (const [, name] of row[at].matchAll(/`([^`]+)`/g)) {
          assert.ok(!seen.has(name), `roles.md lists \`${name}\` twice in the table headed ${header.join(" | ")}`);
          seen.add(name);
        }
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
    for (const { header, rows } of tables(read("cores"))) {
      const at = { slug: header.indexOf("Slug"), alias: header.indexOf("Also seen as") };
      if (at.slug === -1) continue;
      for (const cells of rows)
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

  // A device whose firmware loads cores is the app and has no platform beneath
  // it, so a name listed in both would give that device two places to go.
  it("lists no name as both an app and a platform", () => {
    const apps = new Set(column(read("apps"), "Slug").flatMap(slugs));
    for (const slug of column(read("platforms"), "Slug").flatMap(slugs))
      assert.ok(!apps.has(slug), `\`${slug}\` is listed as both an app and a platform`);
  });

  // An app runs either every core of a kind or a core of its own, so each name
  // in its Cores column has to be one the cores registry knows as one or the
  // other. The two lists are kept apart: a core slugged like a kind would make
  // that name mean two things in an app's row. `standalone` is a kind no app
  // loads, since a standalone emulator lists its one engine instead.
  it("names only real core kinds or cores in the apps registry", () => {
    const cores = read("cores");
    const kinds = new Set([...cores.matchAll(/^- \*\*`([a-z0-9-]+)`\*\*/gm)].map((m) => m[1]));
    kinds.delete("standalone");
    const engines = new Set(column(cores, "Slug").flatMap(slugs));
    for (const kind of kinds) assert.ok(!engines.has(kind), `cores.md has a core slugged \`${kind}\`, like a kind`);
    const cited = column(read("apps"), "Cores").flatMap(slugs);
    assert.ok(cited.length > 0, "no Cores column found in apps.md");
    for (const name of cited)
      assert.ok(
        kinds.has(name) || engines.has(name),
        `apps.md names \`${name}\`, which is neither a core kind nor a core`,
      );
  });

  // The valid fixtures are what an implementer copies, so a system or role in
  // one that the registries do not list would teach the wrong spelling. Every
  // bundle is read, nested ones included: header key 1 is its system, a part's
  // key 2 its role, and a nested part's key 12 the system it indexes.
  it("uses only registered systems and roles in the valid conformance fixtures", () => {
    const roles = roleNames();
    const files = readdirSync(VALID).filter((f) => f.endsWith(".cbor"));
    assert.ok(files.length > 0, `no fixtures found in ${VALID}`);
    const problems = [];
    const checkSystem = (file, system) => {
      if (system !== undefined && !systems.has(system))
        problems.push(`${file}: system \`${system}\` is not registered`);
    };
    for (const file of files) {
      const top = decode(readFileSync(`${VALID}/${file}`));
      checkSystem(file, top.value[0].get(1));
      for (const { part, bundle } of everyPart(top)) {
        const role = part.get(2);
        if (role !== undefined && !isRegisteredRole(roles, role))
          problems.push(`${file}: role \`${role}\` is not registered`);
        checkSystem(file, part.get(12));
        if (bundle) checkSystem(file, bundle.value[0].get(1));
      }
    }
    assert.deepEqual([...new Set(problems)], []);
  });
});
