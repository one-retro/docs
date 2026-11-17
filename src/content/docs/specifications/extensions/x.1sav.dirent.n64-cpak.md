---
title: x.1sav.dirent.n64-cpak
description: An N64 Controller Pak note's entry, field by field, for the writer that has to build one.
slug: specifications/extensions/x.1sav.dirent.n64-cpak
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a card's part ·
**Status:** normative schema, optional to carry

The 32 bytes a Controller Pak's note table keeps for one note, as fields rather than as a blob. This is the write half
of [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/) for the `n64-cpak` format, beside
[`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/). A Controller Pak dates nothing, so
`x.1sav.dirent` itself has nothing to say about a note.

## Schema

```cddl file=./x.1sav.dirent.n64-cpak.cddl

```

`game_code` and `company_code` are the bytes at 0x00 and 0x04: the game code a cartridge's header holds, and the
publisher's code. They are bytes rather than text because the pak takes whatever a game writes there.
[`game`](/specifications/bundle/#game-hints-map)'s `serial` is a free-form hint and need not hold either, so this key is
where a writer finds them.

`name` and `extension` are the raw 16 and 4 bytes at 0x10 and 0x0c, padding included, in the pak's own character set.
[`path`](/specifications/memory-cards/#spelling-a-name-as-path) spells them as text where every byte has a character,
and is absent where one does not. These fields carry them either way.

`status` at 0x08 has bit 1 set on every note a game has written. `reserved` at 0x09 and `data_sum` at 0x0a are as the
entry holds them. libultra never reads either, and some tools store their own data there.

## What a writer fills in

| Field        | Offset | Instead                                                                                                                                                          |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start_page` | 0x06   | The bank and page the note's chain starts at. The allocator's, and [regenerated](/specifications/memory-cards/#what-a-writer-regenerates) with the chain itself. |

Re-serializing this key therefore reproduces the entry except for the field a writer owns. A consumer that wants the
original 32 bytes reads the part's [`dirent`](/specifications/bundle/#part-map).

## Where it goes

The [`bundle` part](/specifications/bundle/#nested-bundles) of an `n64-cpak` [card](/specifications/cards/) that holds
one note's save, whose [`dirent`](/specifications/bundle/#part-map) is the note's 32-byte entry. A note is always a save
on a card, so there is no other place.

## When to set it

When the producer parsed the entry, and when something downstream may have to build one. A producer **MUST NOT** write a
value the entry does not hold. Every field here is copied from the entry unchanged, so any other value is wrong.
