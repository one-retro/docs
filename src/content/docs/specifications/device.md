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

A device holds at least one component that is not a removable card: the console's own storage, or a cartridge's. Cards
read out of a console's slots and nothing else are a card, or a collection of cards. Each card's parts can name the slot
it was in, as [Cards](/specifications/cards/#parts) says.

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
what a consumer puts the component back by. Writing it is required rather than merely advised, because `role` otherwise
[defaults to `primary`](/specifications/bundle/#part-map), and two components that both fell back to it would be a
device whose halves a consumer cannot tell apart.

```text
1SAV                                       { shape: "device", system: "sega-cd" }
└── parts
    ├── kind "bundle"  role "internal"     the console's own backup RAM
    │   └── 1SAV  { shape: "save", system: "sega-cd" }
    └── kind "bundle"  role "ram-cart"     the Backup RAM Cart
        └── 1SAV  { shape: "save", system: "sega-cd" }
```

A component whose medium has a card [`format`](/specifications/memory-cards/#per-format-facts) is a `card`. Any other is
a `save`, carrying no `game` where it holds saves for several. The Sega CD's backup RAM keeps a directory, but no card
format describes it, so both its components above are saves. Those are the only two shapes, since a device holds no
device and no collection.

- A device's parts **MUST NOT** share a `role`.

That is stricter than the ordinary [addressing rule](/specifications/bundle/#part-map), and it is the whole of what
keeps two components apart.

A component names the system that reads it, which need not be the device's. A Game Boy cartridge in an N64's Transfer
Pak is a `gb` save, in an `n64` device, under the role `transfer-pak-1`.

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
An N64 cartridge save beside its Controller Pak is a device, and the pak is a card of its own. The card holds every note
on the pak, or only that game's where the producer carries no others. Either way the cartridge's own part has the role
`cartridge` and carries [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/), so the save means the same lifted out of
the device.

### Nintendo 64 files

Several tools keep an N64's storage across components rather than one game's save per file. A producer reading the
cartridge's chip and the paks together makes a device of a `cartridge` save and a `controller-pak-<n>` card per pak that
holds a note. With no note in any pak, it is just the cartridge's [save](/specifications/saves/).
[`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) gives each chip's payload, whatever order the tool keeps it in.

Mupen64Plus-Next keeps it all in one `.srm` per game, 0x48800 bytes long. It has a slot for every chip and all four
paks, whatever the game uses. ParaLLEl N64 lays the same slots out the same way:

| Offset    | Length       | Holds                                        |
| --------- | ------------ | -------------------------------------------- |
| `0x00000` | `0x800`      | EEPROM, a 4 Kbit chip in its first 512 bytes |
| `0x00800` | 4 × `0x8000` | Controller Paks, port 1 to port 4            |
| `0x20800` | `0x8000`     | SRAM                                         |
| `0x28800` | `0x20000`    | FlashRAM                                     |

SRAM and FlashRAM are 32-bit words in the host's order there, and EEPROM and the paks are as the console reads them. The
cores format all four paks, so a pak with no note holds nothing a game wrote. The file has no room for 768 Kbit or 1
Mbit SRAM. ParaLLEl N64's file runs on past 0x48800, with room after FlashRAM for a whole 64DD disk. Older builds kept
the disk there, and newer ones keep it in a file of their own. Either way it is an
[`n64dd` save](/specifications/saves/#a-64dd-disk) apart from this device.

A game that saves only to a Controller Pak has no save chip. What its file holds is then paks alone, which are a card,
or a collection of cards.

- A producer reading a file that keeps a slot for every pak **MUST NOT** carry a pak that holds no note.

mupen64plus keeps the chip in a file of its own, and all four paks in one `.mpk` of 128 KiB, port 1 first, as the
console reads them. ares keeps one file per chip and one `.pak` per pak, all as the console reads them. Its `.rtc` file
is the cartridge's clock, which [`x.1sav.rtc.joybus`](/specifications/extensions/x.1sav.rtc.joybus/) carries.

MiSTer's N64 core keeps the chip in a file named for it: `.eep`, `.sra` or `.fla`, each as long as the chip. `.sra` and
`.fla` are 32-bit words in the reverse of the console's order, and `.eep` is as the console reads it. Each Controller
Pak is a `.cpk` of its own, numbered by port. A `.tpk` holds the save of the Game Boy cartridge in a Transfer Pak, which
is a [`gb` save](/specifications/bundle/#two-systems-and-what-each-answers) under the role `transfer-pak-1`. Older
builds kept it all in one `.sav`: the chip, then a Transfer Pak's cartridge save where one was enabled, then the
Controller Paks.

A flash cartridge keeps the chip in a file of its own on its SD card, as the console reads it. The EverDrive 64 keeps
`.eep`, `.srm` or `.fla` in `ED64/gamedata/`. Its OS kept them in `ED64/save/` before 3.07, and in `ED64/SAVE/` before
3.00, with SRAM as `.sra`. The 64drive keeps its files in a `Saves` folder or beside the ROM. N64FlashcartMenu, which
runs on SummerCart64 and the 64drive, keeps every chip as a `.sav` in a `saves` folder beside the ROM, as long as the
chip, and the extension names no chip. altra64 keeps its files in `ED64/SDSAVE/`. None of them keeps a Controller Pak or
the cartridge's clock in a file while a game runs. They copy a physical pak to a file on request, 32 KiB a bank and bank
0 first, and keep the clock in a chip on the cartridge.

A consumer rebuilding any of these files puts each component back where the file keeps it, in the file's order. It fills
a slot it has no component for as that tool fills it in a file it creates.

## The console's clock

Some consoles keep a clock of their own, and so does the 64DD drive: a Saturn's SMPC, an MVS board's uPD4990A, a
GameCube's or a DS's. Every game on the console reads it, so no save carries it. A device does, on its header, as
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) and the
[chip key](/specifications/extensions/x.1sav.rtc/#chip-keys) for that clock where there is one. A cartridge's clock is
the cartridge's own, and stays on the cartridge's save.

A clock is not a component, so it does not make a device on its own. It goes with the storage of the console it came
from: a Saturn's with its internal backup RAM, an MVS's with its backup RAM and its card, a DS's with the cartridge in
it. A 64DD drive's goes on an `n64` device holding the disk's save under the role `64dd`, beside the cartridge and paks
where there are any.

## Merging two devices

A consumer **MAY** merge two device bundles when they name the same `system` and no part of one shares a `role` with a
part of the other. The result is a new device whose parts are the union of theirs, each given a new `id`. This is the
case worth having: a producer that read the internal RAM on Monday and the cart on Tuesday can put the pair together
without either dump having anticipated the other.

Where two parts do share a `role`, the two bundles hold the same component read twice, and this format does not say
which wins. A consumer **MUST NOT** merge them silently: decline, or ask. Identical is the one case it may settle alone,
since two parts with the same [content hash](/specifications/bundle/#content-hash) are the same component and either
will do. A clock on both headers is the same clock read twice, and a consumer settles it the same way.

A merged bundle is newly assembled, so its `bundled_at` is the time of the merge and its `source` is whatever performed
it. What each component says about itself is untouched, because merging moves nested bundles whole and never opens one.

Merging the _contents_ of two components is a different question and not one this format answers. Two dumps of one card
whose directories disagree need a rule about which save wins, and that rule belongs to whatever is doing the merging.
