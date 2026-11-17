---
title: x.1sav.rtc
description: A game's real-time clock reading on the Unix scale, for the games that keep one.
slug: specifications/extensions/x.1sav.rtc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a save, a
state or a device, or a part of a save or a state · **Status:** normative schema, optional to carry

A snapshot of a clock a game reads, put on the Unix scale so that any consumer can read it without knowing which chip
produced it.

## Schema

```cddl file=./x.1sav.rtc.cddl

```

`reading` is whole seconds: tag 1 over an integer, never a float. `accuracy_ms` gives the uncertainty of the reading,
and is omitted when a producer has nothing useful to say about it.

## The reading

`reading` is the game's clock when the bundle was written, put on the Unix scale. On a [state](/specifications/states/),
it is the clock when the registers it comes from were taken, which can be before the state was; see
[On a state](#on-a-state). How depends on the kind of clock:

- A **counting clock** holds elapsed time. The reading is that many days, hours, minutes and seconds after
  1970-01-01T00:00:00Z. An [MBC3](/specifications/extensions/x.1sav.rtc.mbc3/) clock that has run for two minutes and
  twelve seconds reads 1970-01-01 00:02:12.
- A **dating clock** holds a date and a time of day. The reading is those components read as though they were UTC. The
  [S-3511A](/specifications/extensions/x.1sav.rtc.s3511a/) in a GBA cartridge is one.

A game may show its clock with an offset of its own, kept in save memory. The reading does not include it.

Most clocks a game reads are on its cartridge, and the key on a save reads that one. Some are the console's own, or a
drive's beside it, which every game on that console shares. The key on a
[device](/specifications/device/#the-consoles-clock) reads that one.

A chip key may also carry an anchor: the host clock at the moment the producer took the chip's registers. Each chip
key's page says which of its keys holds it. The anchor is not the reading, and is not added to it. It is on the
producer's scale, which need not be UTC, and the bundle's `source` relates that scale to UTC in
[`utc_offset`](/specifications/bundle/#the-scale-of-a-clocks-anchor).

A producer that cannot compute the reading **MUST** omit the key rather than write the anchor in its place.

## Chip keys

Each clock has a key of its own under this one, which carries what the chip holds.

Some chip keys allow null for a register. Null means the chip holds a value the producer's source did not keep. An
absent key means there is no value at all, as when a producer keeps no anchor.

A consumer that rebuilds a chip from its key needs a value for each null, and an anchor. Each chip key's page gives the
value to use for a null. Where a chip key carries no anchor, a consumer **SHOULD** use the moment it rebuilds the chip.
The clock then resumes from the registers with no time passed. It **SHOULD NOT** use
[`bundled_at`](/specifications/bundle/#0-header-map) instead. That is when the bundle was assembled, not when the
producer took the registers.

| Key                                                                      | Clock                  | Kind     | Carried by                                          |
| ------------------------------------------------------------------------ | ---------------------- | -------- | --------------------------------------------------- |
| [`x.1sav.rtc.huc3`](/specifications/extensions/x.1sav.rtc.huc3/)         | Hudson HuC-3           | counting | Game Boy: Robopon, Pocket Family GB                 |
| [`x.1sav.rtc.joybus`](/specifications/extensions/x.1sav.rtc.joybus/)     | the Joybus clock       | dating   | N64: Doubutsu no Mori                               |
| [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)         | MBC3 and MBC30         | counting | Game Boy: Pokemon Gold, Silver and Crystal          |
| [`x.1sav.rtc.rtc4513`](/specifications/extensions/x.1sav.rtc.rtc4513/)   | Epson RTC-4513         | dating   | Super Famicom: Tengai Makyou Zero                   |
| [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/)     | Seiko S-3511A          | dating   | GBA: Pokemon Ruby, Sapphire and Emerald; WonderSwan |
| [`x.1sav.rtc.srtc`](/specifications/extensions/x.1sav.rtc.srtc/)         | Sharp S-RTC            | dating   | Super Famicom: Daikaijuu Monogatari II              |
| [`x.1sav.rtc.tc8521`](/specifications/extensions/x.1sav.rtc.tc8521/)     | Toshiba TC8521         | dating   | Game Boy: the TAMA5 Tamagotchi cartridge            |
| [`x.1sav.rtc.tpp1`](/specifications/extensions/x.1sav.rtc.tpp1/)         | TPP1                   | counting | Game Boy: homebrew                                  |
| [`x.1sav.rtc.n64dd`](/specifications/extensions/x.1sav.rtc.n64dd/)       | the 64DD drive's clock | dating   | 64DD: the drive, for every disk in it               |
| [`x.1sav.rtc.smpc`](/specifications/extensions/x.1sav.rtc.smpc/)         | Saturn SMPC            | dating   | Saturn: the console                                 |
| [`x.1sav.rtc.upd4990a`](/specifications/extensions/x.1sav.rtc.upd4990a/) | NEC uPD4990A           | dating   | Neo Geo MVS: the board                              |

The last three are a console's clock or a drive's, and go on a device. A console whose clock no tool keeps in a file,
such as a GameCube's, a DS's or a PS2's, has no chip key. A producer that read one carries `x.1sav.rtc` alone, and a
consumer sets the console's clock from it.

## Disagreeing with the chip is not an error

The [chip keys](#chip-keys) carry what a chip holds, in the chip's own terms. This key carries the reading on the Unix
scale. A consumer **MUST NOT** treat a difference between them as malformed. Neither is authoritative. Putting a chip's
value on the Unix scale involves choices, such as how to read a two-digit year, so two correct producers can disagree.

Read this key for the clock's value, and the chip's key to rebuild the bytes.

## What does not go here

- Raw chip values: BCD components, the weekday byte, a day counter, 12/24-hour mode, the PM flag. Each chip has a key of
  its own for those. A producer that wants byte-exact round-tripping carries both this key and the chip's.
- Which clock produced the reading. The chip key names it, and [`source`](/specifications/bundle/#source-map) names the
  producer.
- An emulator's own model of how the clock runs between reads. That goes under a name of the emulator's own.
- When a memory card wrote a save. That is [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/).
- A clock a memory card keeps for itself, as a VMU does. A VMU runs its clock in RAM, which no dump of its card holds.
  The date in its root block, from when the card was formatted, stays in
  [`system_area`](/specifications/bundle/#card-map).

## Where it goes

The [header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/) or
[`state`](/specifications/states/), or one of that bundle's [parts](/specifications/bundle/#part-map). On the header,
the key reads the game's clock: its cartridge's, or on a state whose cartridge has none, the console's. On a part, it
reads the clock beside that part's memory, as on a state's in-game save part.

The header of a [device](/specifications/device/#the-consoles-clock) too, where the key reads the console's clock or a
drive's. A save never carries that clock, since it belongs to no one game. A cartridge's clock goes on the cartridge's
save, inside the device as anywhere else.

A producer **MUST NOT** put the key anywhere else.

### On a state

A state's clock sits inside the core's data, which is what the core loads. This key and the chip's key are a reading of
that clock. They let a consumer that cannot parse the core's data show the time. They never change what the state loads.

A producer takes the registers from the core's data, or from a clock footer on the in-game save the emulator kept beside
it. mGBA keeps a Game Boy cartridge's save that way, with the footer its save file carries. The footer becomes this key
and the chip's key, as it does on a save, and the save part holds the save memory alone. The keys sit on the state's
header or on its in-game save part. On the part, an in-game save lifted out of the state takes them with it.

A chip key's anchor is the host clock when the registers were taken. From the core's data, that is when the emulator
took the state. From a footer, it is when the emulator last wrote the footer, which can be before the state was taken.
The anchor and [`taken_at`](/specifications/bundle/#0-header-map) can then differ.

A producer that can read the registers from neither omits both keys.

## When to set it

On a save, only when the game's cartridge has one of the clocks [Chip keys](#chip-keys) lists, and the save carries it.
Most games have no clock, and their bundles omit the key. On a device, only when the producer read the console's clock
or the drive's, from the hardware or from a file that keeps it. A tool that runs a console's clock from its host's has
no clock of its own to carry, and a producer reading it omits the key. On a state, for either kind, when the state
carries it.

The reading is not when the bundle was assembled. That is [`bundled_at`](/specifications/bundle/#0-header-map), and the
two can differ by decades.
