---
title: x.1sav.rtc.s3511a
description: The latched state of the Seiko S-3511A clock in a GBA cartridge, for byte-exact round-tripping.
slug: specifications/extensions/x.1sav.rtc.s3511a
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

The GBA's clock is a Seiko S-3511A on the cartridge. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the
instant a consumer needs to display it. This key carries what the chip itself holds and the moment a producer took it.
That is what a producer handing the cartridge back byte for byte needs.

Every emulator that keeps this clock keeps the same values, so the representation belongs to no one of them. The name
sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) for the reason
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) gives, under that key rather than beside it.

## Schema

```cddl file=./x.1sav.rtc.s3511a.cddl

```

Key 0 is what the chip latches on a read: year since 2000, month, day, weekday, hour, minute and second, one BCD byte
each and in that order. Bit 7 of the hour byte carries PM, and only when 24-hour mode is off. Key 1 is the control
register as read, whose bit 6 is that 24-hour flag and whose bit 7 is the power-off status.

Key 2 is the producer's clock at the moment it took the components, in whole epoch seconds. It is the anchor the
producer advances the chip from when the save is next loaded. It plays the part
[`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)'s key 2 does: regenerating the producer's file needs
it, and nothing else in the bundle holds it. It is optional, since a producer may keep no such moment. A producer that
keeps one **SHOULD** carry it. Without it, the file cannot be rebuilt byte for byte.

Key 2 is on the producer's scale, which need not be UTC. MiSTer hands nearly all of its cores local standard time
counted as though it were UTC, so its GBA core, saving in Pacific time, writes an anchor eight hours behind the instant.
Key 2 is never the reading, and a consumer **MUST NOT** treat it as one or as the moment the save was written.

## The reading is the components

[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) for this chip is what the components say, put on the Unix scale
by reading them as though they were UTC, the way [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/) puts a
console's wall clock on it. The chip keeps no zone, and naming one would be a guess. Reading them resolves the hour: in
12-hour mode, bit 7 of the hour byte is what says it is after noon.

It is not key 2. The chip runs from whatever the game last set it to, which need not be anywhere near the host's clock.
GBA_MiSTer starts it at 2009-12-31 23:59:45, and a game that never sets it leaves it there. So a save written in 2026
can hold a clock reading early 2010. Both dates are correct. A producer whose components are not a date **MUST** omit
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/), as that key requires of any reading a producer cannot compute.

## 24-hour mode is not a field of its own

It is bit 6 of key 1. A boolean beside the register would be a second spelling of one value, and a producer that set the
two differently would write a bundle contradicting itself. The format keeps
[one encoding per value](/specifications/universal-saves-format/#one-encoding-per-bundle) everywhere else. Read the flag
out of the register.

## What does not go here

How an emulator keeps the clock running between the moments a game reads it, beyond the one moment key 2 records. One
derives the current time from an offset against the host clock, another advances the components by the time since key 2,
and neither is chip state. A schema every producer has to satisfy can only require what the chip itself holds, which is
why key 2 is optional. An emulator with a model worth preserving carries it beside this key under a
[name of its own](/specifications/common-types/reverse-dns-name/).

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only for a GBA cartridge carrying this chip. Pokemon Ruby, Sapphire and Emerald use it, as do the Boktai games. A Game
Boy cartridge keeps a different clock and takes [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/).

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. A consumer that only wants to know what time the
game thinks it is should not have to decode BCD to find out. And the two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
