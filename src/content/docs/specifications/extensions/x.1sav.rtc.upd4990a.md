---
title: x.1sav.rtc.upd4990a
description: The NEC uPD4990A clock on a Neo Geo MVS board, which the BIOS keeps its books by.
slug: specifications/extensions/x.1sav.rtc.upd4990a
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a device
or a state · **Status:** normative schema, optional to carry

An MVS board keeps a NEC uPD4990A clock beside its backup RAM, and the BIOS dates its bookkeeping by it. An AES console
has none. This key carries what the chip holds and the moment a producer took it.
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.upd4990a.cddl

```

Key 0 is the chip's time in the order it shifts it out: second, minute, hour and day, one BCD byte each; then a byte
holding the month, 1 to 12 in binary, in its high nibble and the weekday, 0 to 6, in its low one; then the year, two BCD
digits. The hours run 0 to 23.

Key 1 is the anchor: the producer's clock at the moment it took key 0. A producer that keeps one **SHOULD** carry it.
ares keeps the chip in a 16-byte `time.rtc` in the MVS's system folder: the six bytes, two bytes it does not use, then
the anchor as a little-endian count of Unix seconds. Keys 0 and 1 hold all of it. MAME, FinalBurn Neo and MiSTer's
NeoGeo core read the host's clock instead and keep nothing.

## The reading

The clock is a dating clock. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads its components as though they
were UTC, as it does for every dating clock. The year is two digits with no century, so a producer supplies one.

## Where it goes

The [header](/specifications/bundle/#0-header-map) of a [device](/specifications/device/#the-consoles-clock) or a
[state](/specifications/states/), and nowhere else. The clock is the board's, so a save does not carry it. An MVS's
device holds its backup RAM as the `internal` component and its card as `neogeo-card`, and this key goes on that
device's header. A producer carrying this key **SHOULD** carry `x.1sav.rtc` on the same map, and the two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.

## When to set it

Only for an MVS, and only when the producer read its clock, from a board or from a file that keeps it, as ares's does. A
tool that runs the clock from its host's has no clock of its own to carry, and a producer reading it omits the key.
