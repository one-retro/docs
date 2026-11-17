---
title: x.1sav.n64
description: Which save chip an N64 cartridge has, and the form its memory takes in the part that carries the key.
slug: specifications/extensions/x.1sav.n64
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the `cartridge` part of
an `n64` save or state · **Status:** normative schema, required on that part

A retail N64 cartridge saves to one of five chips, and the bytes do not say which. A 4 Kbit EEPROM's 512 bytes look like
the first 512 of a 16 Kbit one, and SRAM and FlashRAM answer at the same addresses. An emulator picks the chip from a
database of games, and the choice is lost once the bytes are a file. This key keeps it.

The chip also fixes what the payload beside it holds, so this is the one extension value a decoder checks. A bundle that
breaks a rule on this page is [malformed](/specifications/universal-saves-format/#rejecting-a-malformed-bundle).

The chip is the cartridge's rather than any emulator's, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree).

## Schema

```cddl file=./x.1sav.n64.cddl

```

Key 0 names the chip. The names count kilobits, the unit the chips are sold in.

| `chip`       | Save memory                          | Payload in bytes | For example                             |
| ------------ | ------------------------------------ | ---------------- | --------------------------------------- |
| `eeprom-4k`  | 4 Kbit EEPROM                        | 512              | Super Mario 64, Mario Kart 64           |
| `eeprom-16k` | 16 Kbit EEPROM                       | 2048             | Yoshi's Story, Banjo-Tooie              |
| `sram-256k`  | 256 Kbit SRAM                        | 32768            | Ocarina of Time, F-Zero X               |
| `sram-768k`  | 768 Kbit SRAM, three banks of 32 KiB | 98304            | Dezaemon 3D, the only one               |
| `flash-1m`   | 1 Mbit FlashRAM                      | 131072           | Majora's Mask, Paper Mario              |
| `sram-1m`    | 1 Mbit SRAM                          | 131072           | A homebrew ROM whose header asks for it |

The last is no retail chip. A homebrew ROM's header can ask for it, and flash cartridges and ares provide it.

- A producer **MUST** name the chip with one of the names in this table.

A cartridge reader probes the cartridge for its chip, an emulator looks the game up, and a homebrew ROM's header names
one. Where none of those settles it, the bytes cannot: a 131072-byte file is FlashRAM or 1 Mbit SRAM, and a 2 KiB file
either EEPROM.

- A producer that cannot tell the chip **MUST NOT** carry the bytes as a `cartridge` part.

It carries the file it read as an [`aux` part](/specifications/bundle/#part-kinds) instead, named by `path`, so a
consumer that can tell the chip still has the bytes.

A consumer could not tell how long a save for any other chip is, so a chip a later version adds is a breaking change.
The value's integer keys belong to this specification, as they do in the format's own maps. A decoder ignores and
round-trips one this version does not list, as
[Additive integer keys](/specifications/universal-saves-format/#additive-integer-keys) says. Such a key fails the schema
above, which describes this version exactly, and does not make a bundle malformed.

## The payload

A part carrying this key holds its chip's memory in **normal form**: every byte of the chip, in the order the console
reads them. A cartridge reader dumps a chip that way, and a flash cartridge keeps it that way.

- A payload **MUST** be as long as the table gives for its chip.

### Order

SRAM and FlashRAM sit in the address space of the console's big-endian CPU, which keeps a word's high byte at the lower
address. Normal form keeps them in address order, so each 32-bit word's high byte comes first. ares and gopher64 keep
them that way, and so do the flash cartridges: SummerCart64, the 64drive, the EverDrive 64, and the menus that run on
them. mupen64plus and Project64 keep these two chips as 32-bit words in their host's order, which reverses every word's
bytes on a little-endian host, where they run in practice. MiSTer's N64 core writes its files the same way round.
[Byte order](/specifications/bundle/#byte-order) already requires a producer to put such bytes back in the console's
order.

A banked SRAM's payload holds its banks one after another, bank 0 first. The console reaches each of Dezaemon 3D's banks
256 KiB after the one before, and Project64, ares, gopher64 and SummerCart64 each close that gap up in their files.
MiSTer's N64 core keeps a file of 98304 bytes but decodes no bank, so all three of the game's banks land on its first 32
KiB, and the rest of the file stays as the core created it. mupen64plus keeps 32 KiB and does the same. Neither file
keeps the banks apart: its first 32 KiB hold whichever bank the game last wrote at each address. A producer reading one
carries those bytes as bank 0, and the other two banks as `0xFF`.

A 1 Mbit SRAM has no retail game to say how a console reaches it. ares banks it as it banks Dezaemon 3D's, four banks
256 KiB apart, and gopher64 maps it straight. Each file still holds bank 0 first, so the payload is the same either way.

EEPROM is a byte stream. The console reaches it over the Joybus, the serial bus it shares with the controllers, in
blocks of eight bytes sent one after another. Its payload is those bytes in the order the Joybus carries them. The
emulators that reverse SRAM leave EEPROM as it is.

### Length

A file is not always as long as its chip. mupen64plus writes a 4 Kbit EEPROM as 512 bytes, and before 2017 wrote it as 2
KiB. Project64 writes each chip only as far as the game has written it. Mupen64Plus-Next and ParaLLEl N64 keep every
chip in one file, each in a [slot of fixed size](/specifications/device/#nintendo-64-files) whatever the game uses.

The region a file keeps for a chip is the whole file, or the chip's slot in a file that keeps several.

- A producer **MUST** fill a payload the region left short with `0xFF`, up to its chip's length.
- A producer **MUST NOT** make a save for a chip from a region holding anything but `0xFF` past that chip's end.

`0xFF` is what an erased EEPROM or FlashRAM cell reads as, and what emulators format SRAM to. A region that stops early
is not saying the rest holds anything, so the fill adds nothing a game wrote. Past the chip's end it is the other way
round: anything but `0xFF` there is data, and a region holding it is not a save for that chip.

### Rebuilding a tool's file

As for any payload, a consumer rebuilding a tool's file lays the chip out and pads it the way that tool does. For
mupen64plus, Project64 and MiSTer's N64 core, that means reversing each word of SRAM and FlashRAM again.

## Where it goes

On the part that holds the chip's memory, and nowhere else. That part is a save part whose [`role`](/registries/roles/)
is `cartridge`, in a bundle whose `system` is `n64`, wherever that bundle sits:

- An `n64` save of the cartridge.
- The save a [device](/specifications/device/) nests for its `cartridge` component. The `bundle` part wrapping that save
  carries the role as well, but not this key, since its payload is the save rather than the chip.
- A [state](/specifications/states/)'s in-game save, where the emulator keeps the cartridge's memory beside the core's
  data.

The rules:

- A producer **MUST** give the part holding an N64 cartridge's save memory the role `cartridge`.
- A producer **MUST** name `n64` as the `system` of the bundle holding that part.
- A producer **MUST** carry this key on that part.
- A producer **MUST NOT** carry it anywhere else.
- A bundle naming `n64` **MUST NOT** hold more than one part with the role `cartridge`.

A cartridge has one save chip here. The hardware could carry EEPROM beside SRAM or FlashRAM, but no retail cartridge is
known to.

A decoder finds the part by those marks alone: a part of kind `save`, with the role `cartridge`, in a bundle naming
`n64`. That part without the key is malformed, and so is the key on any other part, on a header or in a `game` map.
Nothing here depends on the bundle around the save, so a save lifted out of a device means what it meant inside one.
