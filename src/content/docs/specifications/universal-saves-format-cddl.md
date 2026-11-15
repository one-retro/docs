---
title: "CDDL Schema (.1saves)"
description: The CDDL schema for the Universal Saves Format, rendered with notes on how to read it.
sidebar:
  hidden: true
---

This is the [CDDL](https://www.rfc-editor.org/rfc/rfc8610) (RFC 8610) schema for the
[Universal Saves Format](/specifications/universal-saves-format/). The source of truth is
[`universal-saves-format.cddl`](https://github.com/one-retro/docs/blob/main/src/content/docs/specifications/universal-saves-format.cddl);
validators consume that file directly, and this page renders it at build time.

One thing the spec's prose leaves implicit is pinned here: the small named maps (`source`, `card`) use **integer keys in
listing order**, consistent with the format's compact-uint convention.

Every text a producer mints is checked. The two that are a bare `reverse-dns` are the extension keys on `header`, `part`
and `game`, admitted by `* reverse-dns => any`, and the resolver names keying `game_id`. A key that is not a well-formed
reverse-DNS name matches no rule and fails. What sits _under_ an extension key is `any` and is never checked, which is
deliberate rather than a gap; so is a `game_id` value, which is whatever form its catalog publishes. A decoder checks
[`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) against that key's own schema and its payload's length, which
this schema leaves to it.

This schema describes v0.9 exactly, so an integer key it does not list fails validation. A shipped decoder is
deliberately looser. It ignores and round-trips an integer key it does not recognize, since the only thing such a key
can be is a later minor version's field; see
[Additive integer keys](/specifications/universal-saves-format/#additive-integer-keys). A schema for one version cannot
state a rule about the next one, so that difference is expected rather than a gap.

The [minted names](/specifications/common-types/slug/) that also admit a bare slug are checked as `slug / reverse-dns`:
`kind`, `app`, `core` and `platform`. The six vocabularies a producer cannot mint into are checked as `slug` alone: the
system slug, a card's `format`, a part's `binding` and `role`, a source's `device_kind`, and a state's `origin`. So the
schema is where "no privately minted card formats" is actually enforced. One grammar covers all of them, stated as a
shape and a length separately, since `.and` composes the two controls that a single regexp would have to smuggle
together. A validator therefore rejects an uppercase role, a name written with an underscore or a doubled dash, one over
64 bytes, a format carrying a reverse-DNS name, and a dotted name that is not well-formed. What it cannot check is which
arm a value was _meant_ to be in. Each part default fails validation when spelled out. `"save"` as a `kind` and
`"primary"` as a `role` are excluded with `.ne`, and `path` has a minimum size of 1.

A card, a state and a screenshot each pair their header with parts of their own. That is how the schema keeps a
`system`, `state` or `screenshot` part out of every other shape. The general part takes any `kind` but those three and
`save`. A system part has to carry a `path`, and carries no `game`. A screenshot part has to carry an image type, and a
screenshot bundle holds that one part and nothing else. A state's `source` has to name a `core` or an `app`, which
`.and` checks against the plain `source` map.

Other constraints are not expressible in CDDL and remain prose-only in
[the spec](/specifications/universal-saves-format/):

- An unrecognized `kind` being treated as `aux`.
- `rom_hashes` holding at most one entry per algorithm, in ascending tag order.
- `path` avoiding a leading `/` and `..` segments.
- No two parts of one kind agreeing on `role`, `path` and `slot` at once.
- A state holding exactly one `state` part and at most one `screenshot`.
- A `system` part for a file's directory, ahead of the file's own.
- A `dirent` as long as its card's format makes one.
- A Neo Geo card's `system_area` being its 64-byte header block.
- A Neo Geo save's `path` spelled from its NGH and sub-number, and an N64 note's from its pak's character table.
- An `n64` bundle's `cartridge` save part carrying [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/), a chip that
  key's page lists, and a payload as long as that chip. The key sits nowhere else.
- Part keys 7 and 8 making a part malformed even to a decoder, which ignores any other integer key it does not know.
- An `n64dd` save's RAM area being as long as its disk's [type](/specifications/saves/#a-64dd-disk) makes it.
- A `game` map and a `taken_with` map holding at least one key.

CDDL can require a key but not "at least one of these optional keys", which is why the last of those stays prose. The
other cases of the [non-empty rule](/specifications/universal-saves-format/#one-encoding-per-bundle), on `game_id`,
`rom_hashes`, `parts`, `firmware` and `options`, are all `+` here and enforced.

Nested bundles add four more. All of them are beyond what a schema can see, because CDDL does not reach inside a byte
string:

- A `bundle` part's payload decoding as a `saves-file` at all.
- The outer part's `sha256` equaling the inner bundle's hash.
- Each nested bundle's shape being one the holding shape may contain.
- Every other rule, applied to the inner bundle. A malformed one
  [makes the outer bundle malformed too](/specifications/universal-saves-format/#rejecting-a-malformed-bundle).

Everything about the encoding itself is checkable, since the bundle follows RFC 8949 section 4.2 with no exceptions of
its own.

```cddl file=./universal-saves-format.cddl

```
