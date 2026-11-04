---
title: Devices
description: The `device` shape, which is one console's storage read whole, components and all.
slug: specifications/device
---

A `device` bundle is one console's storage as it was when read: every component that holds saves, each a complete
[card](/specifications/cards/) or [save](/specifications/saves/) of its own.

Several systems keep saves in more than one place at once:

- A Sega CD has internal backup RAM and a Backup RAM Cart.
- An MVS cabinet keeps its own backup RAM behind the card slot.

None of those pairs is one game's save, so none is a [save](/specifications/saves/). None is a single card, so none is a
[card](/specifications/cards/). And all of them came off one system, which is what a
[collection](/specifications/collections/) is not allowed to say.

## Header

`shape` is `"device"`, and `system` is required: it is what a device has that a collection does not.

| Key | Name          | Req? | Notes                                              |
| --- | ------------- | ---- | -------------------------------------------------- |
| 0   | `shape`       | yes  | `"device"`.                                        |
| 1   | `system`      | yes  | The system whose storage this is. A device is one. |
| 3   | `source`      | no   | What read it.                                      |
| 5   | `description` | no   | Free-form note.                                    |
| 6   | `bundled_at`  | no   | When the dump was assembled.                       |

`game` is forbidden, because the components hold saves for many games rather than for one, and `card` is forbidden,
because a device is not a card even when it holds one.

## Parts

Every part is a [`bundle` part](/specifications/bundle/#nested-bundles), one per component, and every part **MUST**
carry a [`role`](/registries/roles/) naming where that component sits: `internal`, `cartridge`, `memcard-1`. The role is
what a writer puts the component back by. Writing it is required rather than merely advised, because `role` otherwise
[defaults to `primary`](/specifications/bundle/#part-map), and two components that both fell back to it would be a
device whose halves a consumer cannot tell apart.

```text
1SAV                                       { shape: "device", system: "segacd" }
└── parts
    ├── kind "bundle"  role "internal"     the console's own backup RAM
    │   └── 1SAV  { shape: "save", system: "segacd" }
    └── kind "bundle"  role "cartridge"    the Backup RAM Cart
        └── 1SAV  { shape: "card", card: { … } }
```

A component with a directory is a `card`; a flat one is a `save`, carrying no `game` where it holds saves for several.
Those are the only two, since a device holds no device and no collection. No two parts may share a `role`, which is the
ordinary [addressing rule](/specifications/bundle/#part-map) and here is the whole of what keeps two components apart.

The MiSTer NeoGeo core keeps one of those pairs in a single save file per game. The file holds an MVS cabinet's 64 KiB
of backup RAM, then 8 KiB for the card in its slot. For a cartridge game the card is the first 2 KiB of those 8 KiB,
which is all the core addresses. Its `capacity` is 2048, whatever its header claims. MiSTer keeps the whole file as
16-bit words, low byte first, so every pair of bytes is swapped: in the RAM, on the card, and in a cartridge's RAM. A
producer swaps each pair back, as [byte order](/specifications/bundle/#byte-order) requires, and a consumer rebuilding
the file swaps them again.

MiSTer reads a save file that does not exist yet as all `0xFF`. Outside MVS mode nothing writes the RAM, and in MVS mode
the BIOS sets up all of it. So where every byte of the RAM is `0xFF`, the file is just the card. Otherwise it is a
device of two components, `internal` and `neogeo-card`, and that device written back is the one file. The BIOS records
the game in the RAM by its NGH number and its title, so the RAM is a `save` that names that game. A consumer rebuilding
the file from a card alone fills the rest with `0xFF`, as MiSTer does. The core lays out a Neo Geo CD file the same way,
with the RAM unused and the CD's own 8 KiB where the card would be. That file is a `card` of format `neogeo-mc`, with a
`capacity` of 8192 and a `system` of `neogeo-cd`.

Two MVS games, Jockey Grand Prix and V-Liner, keep RAM of their own on the cartridge. Their file holds that RAM where
the card would be, and holds no card at all. It is a device of `internal` and `cartridge`.

A device is also where a dump lands that holds one game's storage across two components rather than a whole console's.
An N64 cartridge save beside the whole Controller Pak is a device: the pak is a card of its own, holding notes for games
the cartridge knows nothing about. Carry only that game's note instead and there is no device, just a
[save](/specifications/saves/) with two ordinary parts.

## Merging two devices

Two device bundles **MAY** be merged when they name the same `system` and no part of one shares a `role` with a part of
the other. The result is a device whose parts are the union of theirs, renumbered by `id`. This is the case worth
having: a producer that read the internal RAM on Monday and the cart on Tuesday can put the pair together without either
dump having anticipated the other.

Where two parts do share a `role`, the two bundles hold the same component read twice, and this format does not say
which wins. A consumer **MUST NOT** merge them silently: decline, or ask. Identical is the one case it may settle alone,
since two parts with the same [content hash](/specifications/bundle/#content-hash-and-file-hash) are the same component
and either will do.

A merged bundle is newly assembled, so its `bundled_at` is the time of the merge and its `source` is whatever performed
it. What each component says about itself is untouched, because merging moves nested bundles whole and never opens one.

Merging the _contents_ of two components is a different question and not one this format answers. Two dumps of one card
whose directories disagree need a rule about which save wins, and that rule belongs to whatever is doing the merging.
