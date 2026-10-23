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
deliberate rather than a gap; so is a `game_id` value, which is whatever form its catalog publishes.

This schema describes v0.5 exactly, so an integer key it does not list fails validation. A shipped decoder is
deliberately looser. It ignores and round-trips an integer key it does not recognize, since the only thing such a key
can be is a later minor version's field; see
[Additive integer keys](/specifications/universal-saves-format/#additive-integer-keys). A schema for one version cannot
state a rule about the next one, so that difference is expected rather than a gap.

The [minted names](/specifications/common-types/slug/) that also admit a bare slug are checked as `slug / reverse-dns`:
`kind`, `app`, `core` and `platform`. The five vocabularies a producer cannot mint into are checked as `slug` alone: the
system slug, a card's `format`, a part's `binding` and `role`, and a source's `device_kind`. So the schema is where "no
privately minted card formats" is actually enforced. One grammar covers all of them, stated as a shape and a length
separately, since `.and` composes the two controls that a single regexp would have to smuggle together. A validator
therefore rejects an uppercase role, a name written with an underscore or a doubled dash, one over 64 bytes, a format
carrying a reverse-DNS name, and a dotted name that is not well-formed. What it cannot check is which arm a value was
_meant_ to be in. Nor can it catch a default spelled out where the default is itself a well-formed slug. `"save"` as a
`kind` and `"primary"` as a `role` both pass, because XSD regular expressions have no negative lookahead and "any slug
but that one" cannot be written. The other two part defaults are catchable and are caught, `path` by a minimum size of 1
and `encoding` by admitting only `"zstd"`.

A part is written as a choice of two forms, which is what makes `size` checkable. `size` is present when the payload is
compressed, and absent when it is uncompressed and therefore states its own length. The arms are ordered
most-constrained-first because the tool takes the first that matches without backtracking, so reordering them would
silently start rejecting valid parts.

Other constraints are not expressible in CDDL and remain prose-only in
[the spec](/specifications/universal-saves-format/):

- An unrecognized `kind` being treated as `aux`.
- `rom_hashes` holding at most one entry per algorithm, in ascending tag order.
- `path` avoiding a leading `/` and `..` segments.
- No two parts agreeing on `role`, `path` and `slot` at once.

One of those is a gap CDDL cannot close: it can require a key but not "at least one of these optional keys", so the
[non-empty rule](/specifications/universal-saves-format/#one-encoding-per-bundle) on a `game` map stays prose. The other
empty-container rules, on `game_id`, `rom_hashes` and `parts`, are all `+` here and enforced.

Nested bundles add four more. All of them are beyond what a schema can see, because CDDL does not reach inside a byte
string:

- A `bundle` part's payload decoding as a `saves-file` at all.
- That inner bundle being normalized, with every inner part uncompressed and every payload embedded.
- The outer part's `sha256` equaling the inner bundle's hash.
- Each nested bundle's shape being one the holding shape may contain.

Everything about the encoding itself is checkable, since the bundle follows RFC 8949 section 4.2 with no exceptions of
its own.

```cddl file=./universal-saves-format.cddl

```
