---
title: x.1sav.rtc.n64dd
description: The clock in a 64DD drive, which every disk in it reads.
slug: specifications/extensions/x.1sav.rtc.n64dd
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a device
or a state · **Status:** normative schema, optional to carry

The 64DD keeps a clock in the drive rather than on its disks. The IPL asks the player to set it, and a game's file
system stamps its files with it, so every disk in the drive reads the same one. This key carries what the clock holds
and the moment a producer took it. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.n64dd.cddl

```

Key 0 is the clock as the drive returns it: year, month, day, hour, minute and second, one packed BCD byte each and in
that order. The drive hands them over two at a time, as year and month, day and hour, then minute and second. The hours
run 0 to 23. Bit 7 of the minute byte is set when the clock has stopped or its battery has run low, and a producer keeps
it as read. The drive keeps no weekday and no century.

Key 1 is the anchor: the producer's clock at the moment it took key 0. A producer that keeps one **SHOULD** carry it.
ares keeps the drive's clock in a 16-byte `time.rtc` in the 64DD's system folder: the six bytes, two bytes it does not
use, then the anchor as a little-endian count of Unix seconds. Keys 0 and 1 hold all of it. mupen64plus, Project64, MAME
and MiSTer's N64 core read the host's clock instead and keep nothing, and SummerCart64 keeps the clock in a chip on the
cartridge.

## The reading

The clock is a dating clock, and its year is two digits. libleo supplies the century: 96 to 99 are 1996 to 1999, and 00
to 95 are 2000 to 2095. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads it the same way, as though it were
UTC, as it does for every dating clock.

With bit 7 of the minute byte set, libleo reports the clock as not set, and a game does not trust it. A producer that
finds it set has no reading, and **MUST** omit `x.1sav.rtc`, as that key requires of any reading a producer cannot
compute.

## Where it goes

The [header](/specifications/bundle/#0-header-map) of a [device](/specifications/device/#the-consoles-clock) or a
[state](/specifications/states/), and nowhere else. The clock is the drive's, so a disk's
[save](/specifications/saves/#a-64dd-disk) does not carry it, and every disk a device holds reads the one clock. A
producer carrying this key **SHOULD** carry `x.1sav.rtc` on the same map. The two describe one clock, and they
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.

## When to set it

Only when the producer read the drive's clock, from a drive or from a file that keeps it, as ares's does. A tool that
runs the clock from its host's has no clock of its own to carry, and a producer reading it omits the key.
