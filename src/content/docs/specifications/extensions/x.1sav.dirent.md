---
title: x.1sav.dirent
description:
  What a card's directory records about one save, on a scale a consumer can read, with the zone where one is known.
slug: specifications/extensions/x.1sav.dirent
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a card's or save's part
· **Status:** normative schema, optional to carry

When a card's directory dates a save, and when it says the save was last written. Both are put on a scale a consumer can
read without knowing how that card counts time. Where a producer knows the zone those times are in, the key carries that
too. The entry itself is carried verbatim in [`dirent`](/specifications/bundle/#part-map), which is enough to write the
save back onto a card and useless for anything else. The name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) because the value belongs to no single producer.

## Schema

```cddl file=./x.1sav.dirent.cddl

```

`created_at` is the time the directory dates the entry from, and `modified_at` the time it records for the last write. A
format carries whichever it keeps. A PS2 entry has both, a VMU entry only a creation time, and a GameCube entry only a
modify time. A producer holding neither omits the key.

A Saturn entry's one date is `modified_at`. A game sets it from the console's clock each time it writes the save, and
writing over a save replaces the whole entry.

Each time is a reading: the wall clock the entry records, put on the Unix scale by reading it as though it were UTC. A
reading is not an instant. A GameCube sets its clock in the IPL menu with no notion of a zone, and a VMU is the same. So
the seconds such an entry holds fix a date and a time of day, and say nothing about where on Earth that was.

The offset says which zone that wall clock is in, in seconds east of UTC, so the instant is the reading minus the
offset. It follows a reading only where a producer knows that zone. A PS2 records its directory times at a fixed +9:00
whatever the console's region, so a producer can give a PS2 reading the offset 32400. A producer that does not know the
zone writes the one-element form, which is the common case and not a degraded one.

A reading means the same whether an offset follows it or not. A consumer that reads only the first element gets the wall
clock the entry records, and is never wrong by hours without being told. Each reading carries its own offset, since a
save created in winter and last written in summer was kept at two.

Four of the seven [card formats](/specifications/memory-cards/) date an entry: GameCube, PS2, VMU and Saturn. PS1, N64
and Neo Geo carry no time. Saturn's date is in its entry like the others', even though that entry sits at the head of
the save's first block rather than in a directory region.

## Where it goes

The part that stands for one entry in a directory, which is one of three places and no other:

- a [card](/specifications/cards/)'s [`bundle` part](/specifications/bundle/#nested-bundles) holding a save;
- a card's [`system` part](/specifications/cards/#system-entries), for an entry that belongs to no game;
- a [save](/specifications/saves/)'s own part where the save is a directory, as a PS2 save's files are.

These times are the directory's record and do not survive the save being sliced out, which is why they sit beside the
raw `dirent` bytes rather than in the save's own header.

It does not go on a [device](/specifications/device/)'s part or a [collection](/specifications/collections/)'s. Those
parts are a device's components and a collection's entries, which sit in a socket or in a file rather than in a
directory.

The format keys sit on the same parts as this one, wherever their format's entries are.
[`x.1sav.dirent.n64-cpak`](/specifications/extensions/x.1sav.dirent.n64-cpak/) goes on a pak's parts, where this key
does not, since a Controller Pak dates nothing.

What survives the save being sliced out sits inside it instead.
[`x.1sav.label`](/specifications/extensions/x.1sav.label/) and [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/)
sit on the nested bundle's header, and [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) on that
header or one of its parts.

## What does not go here

- **What the save is called, and what it looks like.** [`x.1sav.label`](/specifications/extensions/x.1sav.label/) and
  [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/).
- **Block counts.** Derivable from the payload and the format's
  [block size](/specifications/memory-cards/#per-format-facts).
- **The name the card's directory holds.** [`path`](/specifications/bundle/#part-map), which a consumer matches on.
- **Permission bits, copy protection, a VMU's mini-game type byte.** Format-specific, so they belong under a key named
  for the [card format](/specifications/memory-cards/#per-format-facts) it decomposes. A producer that wants a consumer
  to rebuild an entry carries the format's key, and `x.1sav.dirent` where the format dates entries.

## The format keys

Only a format whose entry holds something a writer cannot get elsewhere gets one, and two of the seven do not.

| Format       | Key                                                                            | Why                                                                                                            |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `gc-mc`      | [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/)       | Comment and image addresses, icon format, permissions.                                                         |
| `ps2-mc`     | not yet written                                                                | Mode bits and attributes.                                                                                      |
| `vmu`        | not yet written                                                                | The mini-game type byte, copy protection, a header offset.                                                     |
| `n64-cpak`   | [`x.1sav.dirent.n64-cpak`](/specifications/extensions/x.1sav.dirent.n64-cpak/) | The game and company codes, and the name's raw bytes.                                                          |
| `neogeo-mc`  | never                                                                          | Its 4 bytes are an NGH number and a sub-number, which are `path`, and a FAT index, which a writer regenerates. |
| `saturn-bup` | not yet written                                                                | The comment's language byte, which nothing else carries.                                                       |
| `ps1-mc`     | never                                                                          | Its frame holds a filename, an allocation byte and a block link: `path`, and two things a writer regenerates.  |

## When to set it

Only when the producer read the entry. A producer that would be guessing omits the key. It **MUST NOT** substitute the
time it performed the dump, which is [`bundled_at`](/specifications/bundle/#0-header-map) in the bundle header.

The offset is a separate decision from the reading it follows. Not knowing the zone is a reason to write the one-element
form, and no reason at all to drop the reading.

A producer **MUST NOT** fill the offset with the zone the _dump_ happened in. That zone is a fact about the reader
rather than about the entry. A producer **MUST NOT** fill it with a default of zero either. Zero claims UTC, and means
it.
