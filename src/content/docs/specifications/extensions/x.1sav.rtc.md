---
title: x.1sav.rtc
description: A game's real-time clock reading on the Unix scale, for the games that keep one.
slug: specifications/extensions/x.1sav.rtc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

A snapshot of the clock a game keeps, put on the Unix scale so that any consumer can read it without knowing which chip
produced it.

## Schema

```cddl file=./x.1sav.rtc.cddl

```

`reading` is whole seconds: tag 1 over an integer, never a float. `accuracy_ms` gives the uncertainty of the reading,
and is omitted when a producer has nothing useful to say about it.

## The reading

`reading` is the game's clock when the bundle was written, put on the Unix scale. How depends on the kind of clock:

- A **counting clock** holds elapsed time. The reading is that many days, hours, minutes and seconds after
  1970-01-01T00:00:00Z. An [MBC3](/specifications/extensions/x.1sav.rtc.mbc3/) clock that has run for two minutes and
  twelve seconds reads 1970-01-01 00:02:12.
- A **dating clock** holds a date and a time of day. The reading is those components read as though they were UTC. The
  [S-3511A](/specifications/extensions/x.1sav.rtc.s3511a/) in a GBA cartridge is one.

A game may show its clock with an offset of its own, kept in save memory. The reading does not include it.

A chip key may also carry an anchor: the host clock at the moment the producer took the chip's state. Each chip key's
page says which of its keys holds it. The anchor is not the reading, and is not added to it.

A producer that cannot compute the reading **MUST** omit the key rather than write the anchor in its place.

## Chip keys

Each cartridge clock has a key of its own under this one, which carries what the chip holds.

Some chip keys allow null for a register. Null means the chip holds a value the producer's source did not keep. An
absent key means there is no value at all, as when a producer keeps no anchor.

A consumer that rebuilds a chip's state from its key needs a value for each null, and an anchor. Each chip key's page
gives the value to use for a null. Where a chip key carries no anchor, a consumer **SHOULD** use the moment it rebuilds
the state, so the clock resumes from the registers with no time passed. It **SHOULD NOT** use
[`created_at`](/specifications/bundle/#0-header-map) instead, which is when the bundle was assembled and not when the
producer took the state.

| Key                                                                    | Clock            | Kind     | Carried by                                          |
| ---------------------------------------------------------------------- | ---------------- | -------- | --------------------------------------------------- |
| [`x.1sav.rtc.huc3`](/specifications/extensions/x.1sav.rtc.huc3/)       | Hudson HuC-3     | counting | Game Boy: Robopon, Pocket Family GB                 |
| [`x.1sav.rtc.joybus`](/specifications/extensions/x.1sav.rtc.joybus/)   | the Joybus clock | dating   | N64: Doubutsu no Mori                               |
| [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)       | MBC3 and MBC30   | counting | Game Boy: Pokemon Gold, Silver and Crystal          |
| [`x.1sav.rtc.rtc4513`](/specifications/extensions/x.1sav.rtc.rtc4513/) | Epson RTC-4513   | dating   | Super Famicom: Tengai Makyou Zero                   |
| [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/)   | Seiko S-3511A    | dating   | GBA: Pokemon Ruby, Sapphire and Emerald; WonderSwan |
| [`x.1sav.rtc.srtc`](/specifications/extensions/x.1sav.rtc.srtc/)       | Sharp S-RTC      | dating   | Super Famicom: Daikaijuu Monogatari II              |
| [`x.1sav.rtc.tc8521`](/specifications/extensions/x.1sav.rtc.tc8521/)   | Toshiba TC8521   | dating   | Game Boy: the TAMA5 Tamagotchi cartridge            |
| [`x.1sav.rtc.tpp1`](/specifications/extensions/x.1sav.rtc.tpp1/)       | TPP1             | counting | Game Boy: homebrew                                  |

## Disagreeing with the chip is not an error

The [chip keys](#chip-keys) carry what a chip holds, in the chip's own terms. This key carries the reading on the Unix
scale. A consumer **MUST NOT** treat a difference between them as malformed, or prefer one as authoritative. Normalizing
a chip's value involves choices, such as how to read a two-digit year, so two correct producers can disagree.

Read this key for the clock's value, and the chip's key to rebuild the bytes.

## What does not go here

- Raw chip values: BCD components, the weekday byte, a day counter, 12/24-hour mode, the PM flag. Each chip has a key of
  its own for those. A producer that wants byte-exact round-tripping carries both this key and the chip's.
- Which clock produced the reading. The chip key names it, and [`source`](/specifications/bundle/#source-map) names the
  producer.
- An emulator's own model of how the clock runs between reads. That goes under a name of the emulator's own.
- When a memory card wrote a save. That is [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/).
- A clock a device keeps for itself, as a VMU does. Those bytes stay in
  [`system_area`](/specifications/bundle/#card-map).

## Where it goes

The [header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/), and
nowhere else. The key **MUST NOT** sit on a [part](/specifications/bundle/#part-map), or on the header of a
[card](/specifications/cards/) or a [collection](/specifications/collections/).

## When to set it

Only when the save carries a clock, which means its cartridge has one of the clocks [Chip keys](#chip-keys) lists. Most
saves have no clock, and omit the key.

The reading is not when the bundle was assembled. That is [`created_at`](/specifications/bundle/#0-header-map), and the
two can differ by decades.
