---
title: Saves
description: The `save` shape, which is one game's in-game save and the only document a producer of saves has to read.
---

A `save` bundle is one game's in-game save, as the medium stored it. An emulator or a cartridge reader carrying in-game
saves needs only this document. Cards and collections are other shapes, with documents of their own. A save state is a
[state](/specifications/states/), never a save.

## Header

`shape` is `"save"`. Everything else identifies what the bytes are.

| Key | Name          | Req? | Notes                                                                                                                                          |
| --- | ------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `shape`       | yes  | `"save"`.                                                                                                                                      |
| 1   | `system`      | no   | What will load these bytes. See the [System Registry](/registries/systems/). Required on an N64 cartridge's save and a 64DD disk's; see below. |
| 2   | `game`        | no   | Identification hints. Absent means unidentified, which is a valid save.                                                                        |
| 3   | `source`      | no   | What produced it.                                                                                                                              |
| 5   | `description` | no   | Free-form note.                                                                                                                                |
| 6   | `bundled_at`  | no   | When the bundle was assembled, not when the player saved.                                                                                      |

`card` is forbidden. A save that came off a card is still a save; the card it came off is a
[card bundle](/specifications/cards/) that holds it.

The full definitions are in the [header map](/specifications/bundle/#0-header-map). Everything about the save that is
not in a payload belongs here, because the header is what survives the bundle being carried anywhere.

## Parts

One part, and that part is the save. Its payload is the bytes the console wrote, its `sha256` is the digest of those
bytes, and other part keys are usually absent: `kind` defaults to `save`, `role` to `primary`, `path` to nothing. The
bytes are in the order the console's hardware addresses them, whatever order the file they came from keeps; see
[Byte order](/specifications/bundle/#byte-order).

A consumer **MAY** refuse a save bundle with more than one part. A producer that writes one part is therefore the
producer most consumers can read, and an emulator writing a cartridge save has no reason to write more.

| Key | Name      | Req? | Notes                                             |
| --- | --------- | ---- | ------------------------------------------------- |
| 0   | `id`      | yes  | Unique in the bundle. A lone part's is usually 0. |
| 9   | `sha256`  | yes  | Tag 18540 over the payload.                       |
| -1  | `payload` | yes  | The bytes, after every other integer key.         |

Most other keys are for a save the container gave more than one part, and [Bundle](/specifications/bundle/#part-map)
defines them all. [`binding`](/specifications/bundle/#bound-payloads) is not: a save bound to its console says so
whatever its part count.

An N64 cartridge's save is the other exception. Its part carries the role `cartridge`, and
[`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) naming the chip, because the bytes cannot say which chip they
came from. That page also fixes the payload's length and order.

- A producer **MUST** name `n64` as the `system` of a bundle holding an N64 cartridge's save.

### Deterministic encoding

Every container is definite-length and deterministically encoded per RFC 8949 section 4.2: map keys in canonical order,
preferred integer heads, no indefinite lengths. Text is NFC. The rule and its reasons are in
[One encoding per bundle](/specifications/universal-saves-format/#one-encoding-per-bundle), and a producer that emits
canonical CBOR meets it without doing anything special.

### When there is more than one

Three cases need it.

- **Several sockets.** One game's save spans two places on the same system. That covers a 3DS game card's savedata in
  `cartridge` beside its extdata on `sd`. [`role`](/registries/roles/) tells them apart.
- **Several files.** A PS2 save is a directory and a 3DS extdata save is a folder. An arcade board is the same case in
  different clothes: its save is battery-backed NVRAM and an EEPROM and sometimes a timekeeper chip, one part each.
  [`path`](/specifications/bundle/#part-map) tells those apart, carrying the name the dumping tool uses for the chip.
- **Anything else binary.** An [`aux` part](/specifications/bundle/#part-kinds) with a `content_type`.

A save's parts are never [`bundle` parts](/specifications/bundle/#nested-bundles). A save on a memory card is never a
part of another save either. A Controller Pak is a card, and one game's note on it is a save on that card like any
other. A game's cartridge save and its note together are a [device](/specifications/device/): the cartridge's save, and
a pak card holding that note.

- A part of a save or a state **MUST NOT** carry a role that names a memory card's slot: `memcard-<n>`,
  `controller-pak-<n>` or `neogeo-card`.

One system's software wrapping another's save is not a nesting either. A Wii Virtual Console save of an NES game is an
`nes` save, the same as any other, and what wrapped it is [`source`](/specifications/bundle/#source-map) provenance.

Two parts of one kind never agree on `role`, `path` and `slot` together, which is
[how a consumer names one](/specifications/bundle/#part-map).

## A 64DD disk

A 64DD disk keeps a game's saves in its RAM area, the part of the disk a game can write. Its save is an `n64dd` save
whose one `save` part holds that area. Nothing outside it belongs in the save: the rest of the disk is the game, as its
dump holds it. libleo refuses to write below the RAM area, and the drive write-protects the zone holding the system area
and the disk ID, so whatever a game writes lands in it.

The disk's type, 0 to 6, fixes where the RAM area starts, and it runs from there to the disk's last block. A block's
length falls from 19720 bytes in the outer zones to 9520 in the inner ones, so each type's area has a length of its own.
Blocks are numbered as libleo numbers them, from the first block after the system area:

| Type | First block | Blocks | Payload in bytes |
| ---- | ----------- | ------ | ---------------- |
| 0    | 1418        | 2874   | 38444480         |
| 1    | 1966        | 2326   | 29501120         |
| 2    | 2514        | 1778   | 21303040         |
| 3    | 3062        | 1230   | 13850240         |
| 4    | 3610        | 682    | 7142720          |
| 5    | 4088        | 204    | 1942080          |
| 6    | none        | 0      | no save          |

- A producer **MUST** name `n64dd` as the `system` of a 64DD disk's save.
- A producer **MUST** put the RAM area in a `save` part with no `role`.
- A 64DD disk's save **MUST NOT** hold another `save` part.
- A producer **MUST** put the RAM area's blocks in the payload in ascending block order, each as the drive transfers it.
- A payload **MUST** be as long as the table gives for its disk's type.

The length is how a consumer tells the type back, so a disk's save carries no key for it. A decoder finds the area as
the one `save` part in a `save` bundle naming `n64dd`, and checks its role and its length. A
[state](/specifications/states/) carries what its emulator keeps, as that page says.

mupen64plus, Project64 and MiSTer's N64 core keep the area as a `.ram` file in exactly that form, the first two by
default. Either of those can keep a full copy of the disk instead, as `.ndr`, and does whatever its setting when the
image is in MAME's format. Mupen64Plus-Next keeps a full copy as `.disk_save`, and ares as `.disk`. SummerCart64 writes
a game's changes into the `.ndd` image itself. MAME keeps nothing: what a game writes is gone once the disk is unloaded.

A copy follows the layout of the image it came from, except ares's. A retail dump runs in block order, and MAME's image
runs in the disk's physical order, where finding a block takes the disk's defect table. ares converts every disk to
MAME's order, and writes its own name and the date it loaded the disk into the disk ID, so its copy differs from the
dump outside the RAM area too. A producer reading a copy takes the RAM area's blocks out of it. A consumer rebuilding a
copy needs the disk's image as well, since the save holds the RAM area alone.

The drive keeps the 64DD's clock, so a disk's save does not carry it. A
[device](/specifications/device/#the-consoles-clock) does, on its header, as
[`x.1sav.rtc.n64dd`](/specifications/extensions/x.1sav.rtc.n64dd/) says. The dates a game's file system stamps on its
files come from that clock, and travel inside the RAM area. A game that saves to its cartridge as well as its disk, as
F-Zero X does with its Expansion Kit, has two saves, an `n64` one and an `n64dd` one, and a
[collection](/specifications/collections/) holds both in one file.

## Extension keys

These attach to the header, because they describe the save and travel with it:

- [`x.1sav.label`](/specifications/extensions/x.1sav.label/), what a console calls the save.
- [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/), the picture it shows for it.
- [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/), a clock reading, where the save carries one.

These attach to a part, because they describe those bytes:

- [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/), the chip an N64 cartridge's part holds. It is required there.
- [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/), where the clock sits beside one part's memory rather than the
  whole save's.
- [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/) and its per-format keys, on a part that carries a
  directory entry, such as a file of a PS2 save.

## The smallest valid save

A shape, one part, and the digest of its payload:

```text
827539798([
  { 0: "save", 1: "gb" },
  [ { 0: 0, 9: 18540(h'…32 bytes…'), -1: h'…the SRAM…' } ]
])
```

Everything else is optional. A save with no `game` is unidentified rather than malformed, and a consumer stores it and
lets the user associate it later.

## What a saves producer can ignore

The `card` map, `slot`, `dirent` and directory entries belong to [Cards](/specifications/cards/). Nesting and what a
shape may hold matter only where a bundle holds another one. A producer writing single saves needs none of it.
