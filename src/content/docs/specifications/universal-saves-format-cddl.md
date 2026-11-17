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

Every text a producer mints is checked. The two that are a bare `reverse-dns` are the extension keys on the header, a
part, a `game` map and `taken_with`, admitted by `* reverse-dns => any`, and the resolver names keying `game_id`. A key
that is not a well-formed reverse-DNS name, or runs past 255 characters, matches no rule and fails. What sits _under_ an
extension key is `any` and is never checked, which is deliberate rather than a gap; so is a `game_id` value, which is
whatever form its catalog publishes. A decoder checks [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) against
that key's own schema and its payload's length, which this schema leaves to it.

This schema describes v0.10 exactly. An integer key it does not list fails validation, and so does a value it does not
list in a vocabulary the spec owns: a shape, a part `kind`, a card `format`, a `binding`, a `device_kind` or an
`origin`. A shipped decoder is deliberately looser. It round-trips each of those, since the only thing one can be is a
later version's; see
[Rejecting a malformed bundle](/specifications/universal-saves-format/#rejecting-a-malformed-bundle). A schema for one
version cannot state a rule about the next one, so that difference is expected rather than a gap.

The names a producer may mint, `kind`, `app`, `core` and `platform`, are checked as a slug or a reverse-DNS name. The
system slug and `role` are checked as a slug alone, since their registries grow by a PR. One grammar covers every slug,
stated as a shape and a length separately. A validator therefore rejects an uppercase role, a name written with an
underscore or a doubled dash, one over 64 bytes, and a reverse-DNS name where only a slug goes. What it cannot check is
which arm a value was _meant_ to be in.

What each shape holds at its own level is checked. Each shape pairs its header with the parts it may hold, so a
validator rejects a save or a state holding a `bundle` part, a device or a collection holding anything else, a card
holding a bare save part, and a device component without a `role`. A `state`, `screenshot` or `system` part sits only in
the shape that holds it.

[One encoding per bundle](/specifications/universal-saves-format/#one-encoding-per-bundle) is checked where a value can
show it. Each part default fails when spelled out: `"save"` as a `kind` and `"primary"` as a `role` are excluded, and so
is an empty `path`. An optional map, text or byte string fails when empty, and `utc_offset` fails at zero. A `bundle`
part fails with a `content_type` or a `binding`, a `system` or `card-image` part with a `game`, and a part with
`bound_to` but no `binding`.

These rules are left to prose, since a schema cannot see them:

- A part's `sha256` being the SHA-256 of its payload, which for a `bundle` part is the inner bundle's content hash.
- A `bundle` part's payload decoding as a bundle, of a shape its holder may hold, and meeting every rule here itself.
  CDDL's `.cbor` could check the first two, and is left out: a reference validator's report on a rejected nested bundle
  grows too fast with depth to be of use.
- Parts in strictly ascending `id` order.
- Text in NFC.
- Each list of hash values holding at most one entry per algorithm, in ascending tag order: `rom_hashes`, and each file
  in `firmware`.
- No two parts of one kind agreeing on `role`, `path` and `slot` at once, and no two parts of a device sharing a `role`.
- A part's `game` or `source` differing from the header's, and a `bundle` part's index copies matching the inner header.
- A state holding exactly one `state` part and at most one `screenshot`.
- A `system` part for a file's directory, ahead of the file's own.
- A `dirent` as long as the format of the card it came from makes one, and a Controller Pak note's as 32 bytes.
- A Neo Geo card's `system_area` being its 64-byte header block, and an N64 pak's its 32-byte label.
- A Neo Geo save's `path` spelled from its NGH and sub-number, and an N64 note's from its pak's character table.
- An `n64` bundle's `cartridge` save part carrying [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/), a chip that
  key's page lists, and a payload as long as that chip. The key sits nowhere else.
- An `n64dd` save's RAM area being one of the lengths its [disk types](/specifications/saves/#a-64dd-disk) give.
- Part keys 7 and 8 making a part malformed even to a decoder, which ignores any other integer key it does not know.

The rules on a page that defines an extension key other than `x.1sav.n64` bind a producer and no decoder, so none of
them is listed here.

Everything about the encoding itself is checkable, since the bundle follows RFC 8949 section 4.2 with no exceptions of
its own.

```cddl file=./universal-saves-format.cddl

```
