---
title: x.1sav.rtc.mbc3
description: The clock an MBC3 Game Boy cartridge keeps, as the footer most emulators append to the save.
slug: specifications/extensions/x.1sav.rtc.mbc3
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a save or
state, or one of its parts · **Status:** normative schema, optional to carry

Most emulators keep an MBC3 cartridge's clock in the save file, as a footer after the SRAM. Pokemon Gold, Silver and
Crystal are where most people meet it. This key holds what a consumer needs to put that footer back, which the SRAM
bytes alone do not carry. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

VBA-M, BGB, mGBA and SameBoy write that footer the same way, apart from the width of its timestamp. Gambatte and ares
keep the clock in a file of their own instead, and this key carries those clocks too. The representation belongs to no
one emulator, so the name sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under
`x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.mbc3.cddl

```

Keys 0 and 1 hold the same five registers twice, one byte each: seconds, minutes, hours, day counter low and day counter
high. Key 0 is the clock as it runs and key 1 the latched copy the game reads, and the two differ whenever the game has
not latched recently. Key 1 is null where the producer's source does not keep the latched copy, as ares and Gambatte do
not. Gambatte-Speedrun, a fork of Gambatte, keeps both, and so does the EverDrive GB X7.

The high register is three things at once. Bit 0 is the day counter's ninth bit, bit 6 halts the clock, and bit 7 is the
carry it sets on running past 511 days. They stay packed where the hardware puts them, so what a consumer writes back is
what it read.

Key 2 is the anchor: the host clock the emulator advances the counters from on the next load. SameBoy and
Gambatte-Speedrun take it when they write the save. VBA-M and mGBA take it when the game last latched the clock, and
mGBA advances key 1 from it rather than key 0. A producer that keeps one **SHOULD** carry it. Without it, the file
cannot be rebuilt byte for byte.

Gambatte and its libretro core keep a base time instead: the moment the counters would have read zero. The counters at
any moment are the time since then. A producer reading such a source takes the counters at the moment it reads them, and
carries that moment as key 2.

Key 2 is on the producer's own scale, as every chip key's anchor is, and need not be UTC. MiSTer's Gameboy core writes
local standard time counted as though it were UTC, and the bundle's `source` says how far that is from UTC in
[`utc_offset`](/specifications/bundle/#the-scale-of-a-clocks-anchor).

Key 3 is how many bytes the timestamp occupied in the footer. Emulators write four or eight, so one clock and one save
give two different footers depending on which wrote it. A consumer rebuilding the footer needs the width, since a wrong
guess changes the file's bytes and with them its [`sha256`](/specifications/bundle/#part-map). Key 3 is absent when the
source keeps the clock outside a footer, as Gambatte, ares and the EverDrive GB do.

The EverDrive GB X7 keeps the clock in a file of its own, beside the save in `GBCSYS/SAVE` and named for the game, with
the extension `.rtc`. The save beside it is the cartridge's RAM alone, with no footer. The `.rtc` file is one sector of
512 bytes: the five running registers, then the five latched ones, then zeros. It holds no anchor, so a game's clock
does not run while another game is loaded. The cartridge's OS writes no file for a game whose two high registers both
read 0x40, the halted clock at zero it gives a game that has never used one.

## Filling a null

A consumer rebuilding the clock when key 1 is null **SHOULD** use key 0 for the latched copy. A game latches the clock
before it reads it, and the latch copies the running registers over the latched ones.

A consumer building a footer without key 3 **SHOULD** give the timestamp 8 bytes, as BGB, mGBA, SameBoy and VBA-M do.

## The reading

MBC3 is a counting clock. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#the-reading) for it is the elapsed time
key 0's registers give, after 1970-01-01T00:00:00Z: the day counter's days, then the hours, the minutes and the seconds.
Key 1 is only what the game last latched, and neither it nor key 2 is the reading.

Bit 7 of the high register says the day counter has run past 511 since the game last cleared the bit. It does not say
how many times. The reading takes the counter as it stands, and the carry round-trips with the registers without adding
to it.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes, and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a [save](/specifications/saves/) or a
[state](/specifications/states/), or one of its [parts](/specifications/bundle/#part-map). A producer carrying this key
**SHOULD** carry `x.1sav.rtc` on the same map. The two describe one clock, and a consumer that wants only the time then
reads it without knowing the chip. They
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.

## When to set it

Only when the cartridge's MBC3 or MBC30 carries the clock. Other Game Boy clocks take the other keys
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#chip-keys) lists.
