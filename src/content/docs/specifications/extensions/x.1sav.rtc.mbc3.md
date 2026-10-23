---
title: x.1sav.rtc.mbc3
description: The clock an MBC3 Game Boy cartridge keeps, as the footer most emulators append to the save.
slug: specifications/extensions/x.1sav.rtc.mbc3
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

Most emulators keep an MBC3 cartridge's clock in the save file, as a footer after the SRAM. Pokemon Gold, Silver and
Crystal are where most people meet it. This key holds what a consumer needs to put that footer back, which the SRAM
bytes alone do not carry.

VBA, BGB, mGBA and SameBoy write that footer the same way, apart from the width of its timestamp. Gambatte and ares keep
the clock in a file of their own instead, and this key carries those clocks too. The representation belongs to no one
emulator, which puts the name in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) for the
reason [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) gives, under that key rather than beside it.

## Schema

```cddl file=./x.1sav.rtc.mbc3.cddl

```

Keys 0 and 1 hold the same five registers twice: seconds, minutes, hours, day counter low and day counter high. Key 0 is
the clock as it runs and key 1 the latched copy the game reads, and the two differ whenever the game has not latched
recently. Key 1 is null where the producer's source does not keep the latched copy, as ares and Gambatte do not.
Gambatte-Speedrun, a fork of Gambatte, keeps both.

The high register is three things at once. Bit 0 is the day counter's ninth bit, bit 6 halts the clock, and bit 7 is the
carry it sets on running past 511 days. They stay packed where the hardware puts them, so what a consumer writes back is
what it read.

Key 2 is the host clock the emulator advances the counters from on the next load. SameBoy and Gambatte-Speedrun take it
when they write the save. VBA-M and mGBA take it when the game last latched the clock, and mGBA advances key 1 from it
rather than key 0.

Gambatte and its libretro core keep a base time instead: the moment the counters would have read zero. The counters at
any moment are the time since then. A producer reading such a source takes the counters at the moment it reads them, and
carries that moment as key 2.

Key 2 is on the producer's own scale, as [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/)'s key 2
is, and need not be UTC. MiSTer's Gameboy core writes local standard time counted as though it were UTC. The
[reading](/specifications/extensions/x.1sav.rtc/#the-reading) is the counters alone, never key 2. Key 3 is how many
bytes the timestamp occupied in the footer.

## Why the timestamp width is carried

Emulators disagree about it. Some write four bytes and some eight, so one clock and one save produce two different
footers depending on which wrote it. A consumer rebuilding the footer without the width has to guess, and a wrong guess
changes the file's bytes and with them its [`sha256`](/specifications/bundle/#part-map).

Carrying it is what makes the footer regenerable rather than an opaque blob. Between the four keys, a consumer has every
byte the footer holds and the length it occupied, which is the whole of what regenerating it takes.

Key 3 is absent when the source keeps the clock outside a footer, as Gambatte and ares do. There is no footer, so there
is no width to carry.

## Filling a null

A consumer rebuilding the clock when key 1 is null **SHOULD** use key 0 for the latched copy. A game latches the clock
before it reads it, and the latch copies the running registers over the latched ones.

A consumer building a footer without key 3 **SHOULD** give the timestamp 8 bytes, as BGB, mGBA, SameBoy and VBA-M do.

## Not the same chip as the GBA

[`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/) dates: it latches a year, a month, a day and a
weekday, in BCD. This one counts, and knows nothing about the calendar. Neither shape can be read as the other, which is
why each chip has a schema of its own.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only when the cartridge's MBC3 or MBC30 carries the clock. Other Game Boy clocks take the other keys
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#chip-keys) lists.

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. A consumer that only wants to know how long the
clock has run should not have to unpack a day counter. And the two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
