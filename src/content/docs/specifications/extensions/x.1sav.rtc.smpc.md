---
title: x.1sav.rtc.smpc
description: The clock in a Sega Saturn's SMPC, and the four bytes of memory it keeps beside it.
slug: specifications/extensions/x.1sav.rtc.smpc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a device
or a state · **Status:** normative schema, optional to carry

A Saturn keeps its clock in the SMPC, the chip that also runs its controllers and its power, on the battery that keeps
its backup RAM. Beside the clock, the SMPC keeps four bytes of memory where the BIOS keeps the console's settings. This
key carries both and the moment a producer took them. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the
reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.smpc.cddl

```

Key 0 is the clock as the SMPC returns it, seven bytes in this order:

- the year, four BCD digits in two bytes, high byte first;
- the weekday, 0 to 6, in the high nibble, and the month, 1 to 12 in binary, in the low one;
- the day, hour, minute and second, one BCD byte each.

The hours run 0 to 23.

Key 1 is the four bytes of memory. It is null when the producer's source does not keep them. A consumer rebuilding the
chip with key 1 null fills it as the tool it writes for does on a console it starts from nothing.

Key 2 is the anchor: the producer's clock at the moment it took key 0. A producer that keeps one **SHOULD** carry it.

Mednafen keeps the SMPC in a `.smpc` file of 12 bytes: one saying whether the clock has been set, the seven of key 0,
then the four of key 1. It keeps no anchor. Beetle Saturn keeps one such file per game, and by default sets the clock
from the host's whenever it loads one. Kronos keeps the four bytes of memory alone, and MiSTer's Saturn core reads the
host's clock.

## The reading

The clock is a dating clock, and key 0 gives the whole year. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)
reads it as though it were UTC, as it does for every dating clock.

A Mednafen file whose first byte says the clock was never set holds no reading. A producer reading one omits both this
key and `x.1sav.rtc`.

## Where it goes

The [header](/specifications/bundle/#0-header-map) of a [device](/specifications/device/#the-consoles-clock) or a
[state](/specifications/states/), and nowhere else. The clock is the console's, so a save does not carry it, even where
a tool keeps one clock per game. A producer reading Beetle Saturn's files for one game makes a device of them: the
internal backup RAM, the cartridge's where there is one, and this key on the header. A producer carrying this key
**SHOULD** carry `x.1sav.rtc` on the same map, and the two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.

## When to set it

Only when the producer read the console's clock, from a console or from a file that keeps it, as Mednafen's does. A tool
that runs the clock from its host's has no clock of its own to carry, and a producer reading it omits the key.
