---
title: x.1sav.dirent.gc-mc
description: A GameCube memory card directory entry, field by field, for the writer that has to build one.
slug: specifications/extensions/x.1sav.dirent.gc-mc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a card's part ·
**Status:** normative schema, optional to carry

The 64 bytes a GameCube memory card keeps for one save, as fields rather than as a blob. This is the write half of
[`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/), which puts the time a card records on the Unix scale but
does not rebuild an entry. The name sits under that key rather than beside it, the way each chip has a key of its own
under [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/).

## Schema

```cddl file=./x.1sav.dirent.gc-mc.cddl

```

`game_code` and `maker_code` are the 4 and 2 bytes at 0x00 and 0x04, as the entry holds them. A retail game's are ASCII
letters and digits, such as `GFZE` and `01`. [`game`](/specifications/bundle/#game-hints-map)'s `serial` usually holds
them joined, but that is a hint a producer may reformat or omit.

`filename` is the raw name at 0x08 without its padding, carried as bytes rather than text. A Japanese save names itself
in Shift-JIS, and [`path`](/specifications/bundle/#part-map) is UTF-8 by construction. Transcoding in and back out need
not land on the same 32 bytes.

`banner_flags`, `icon_format` and `anim_speed` at 0x07, 0x30 and 0x32 stay packed as the hardware packs them, two bits
per icon and two bits per frame. The decoded picture is [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/).

`permissions` and `copy_counter` at 0x34 and 0x35 are the copy protection bits and the count a console decrements.

`image_offset` and `comments_offset` at 0x2c and 0x3c point into the payload. Each is absent where the entry holds
`0xffffffff`, so neither is ever that value.

## What a writer fills in

Five fields of the 64 bytes are not carried here.

| Field         | Offset | Instead                                                                                                                                                                                                                                       |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modtime`     | 0x28   | Carried as `modified_at` in [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/). A GameCube clock has no zone, so the reading usually takes the one-element form there, and the value is a plain shift of epoch in either direction. |
| `first_block` | 0x36   | The allocator's, and [regenerated](/specifications/memory-cards/#what-a-writer-regenerates).                                                                                                                                                  |
| `block_count` | 0x38   | Payload size over the [block size](/specifications/memory-cards/#per-format-facts).                                                                                                                                                           |
| padding       | 0x06   | Constant `0xff`.                                                                                                                                                                                                                              |
| padding       | 0x3a   | Constant `0xffff`.                                                                                                                                                                                                                            |

Re-serializing this key therefore reproduces the entry except for the fields a writer owns. A consumer that wants the
original 64 bytes reads the part's [`dirent`](/specifications/bundle/#part-map).

## Where it goes

The part of a `gc-mc` [card](/specifications/cards/) that holds one save: the
[`bundle` part](/specifications/bundle/#nested-bundles) whose [`dirent`](/specifications/bundle/#part-map) is the entry
this key takes apart. [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/) sits on the same part.

## When to set it

When the producer parsed the entry, and when something downstream may have to build one. A producer **MUST NOT** write a
value the entry does not hold. Every field here is copied from the entry unchanged, so any other value is wrong.
