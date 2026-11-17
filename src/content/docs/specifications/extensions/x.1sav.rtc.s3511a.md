---
title: x.1sav.rtc.s3511a
description:
  The latched registers of the Seiko S-3511A clock in a GBA or WonderSwan cartridge, for byte-exact round-tripping.
slug: specifications/extensions/x.1sav.rtc.s3511a
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a save or
state, or one of its parts · **Status:** normative schema, optional to carry

The GBA's clock is a Seiko S-3511A on the cartridge. A WonderSwan cartridge with a clock carries the same chip, behind
its Bandai 2003 mapper. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading a consumer displays.
This key carries what the chip itself holds and the moment a producer took it. That is what a producer handing the
cartridge back byte for byte needs.

Every emulator that keeps this clock keeps the same values, so the representation belongs to no one emulator. The name
sits in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.s3511a.cddl

```

Key 0 is what the chip latches on a read: year since 2000, month, day, weekday, hour, minute and second, one BCD byte
each and in that order. Bit 7 of the hour byte carries PM. In 24-hour mode the chip sets it itself for the hours 12 to
23, and a write cannot change it. Key 1 is the control register as read, one byte, whose bit 6 is the 24-hour flag and
whose bit 7 is the power-off status.

Key 1 is null when the producer's source does not keep the control register. MiSTer's WonderSwan core and Mednafen keep
the time alone.

Key 2 is the producer's clock at the moment it took the components, in whole epoch seconds. It is the anchor the
producer advances the chip from when the save is next loaded. It plays the part
[`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)'s key 2 does: regenerating the producer's file needs
it, and nothing else in the bundle holds it. It is optional, since a producer may keep no such moment. A producer that
keeps one **SHOULD** carry it. Without it, the file cannot be rebuilt byte for byte.

Key 2 is on the producer's scale, which need not be UTC. MiSTer hands nearly all of its cores local standard time
counted as though it were UTC, so its GBA core, saving in Pacific time, writes an anchor eight hours behind the instant.
The bundle's `source` says how far the scale is from UTC in
[`utc_offset`](/specifications/bundle/#the-scale-of-a-clocks-anchor). Key 2 is never the reading, and a consumer **MUST
NOT** treat it as one or as the moment the save was written.

Key 3 is the alarm register: two bytes, as a game last wrote them, holding an alarm hour and minute or an interrupt
frequency. The chip reads it back as all ones, so only a producer that saw the write holds it. ares keeps it on both
systems.

Key 3 is absent when the game never sets the alarm, as Pokemon Ruby, Sapphire and Emerald never do. It is null when the
game may have set it and the producer's source does not keep it. A producer that does not have the alarm **SHOULD**
carry null, unless it knows the game never sets one.

## Filling a null

A consumer rebuilding the chip without key 3, or with key 3 null, **SHOULD** use 0x00 for byte 0 and 0x80 for byte 1.
That is the alarm the chip holds at power-on. A game cannot read the alarm back, so it sees the difference only in when
the chip interrupts it.

A consumer rebuilding the chip with key 1 null **SHOULD** use 0x40: 24-hour mode, with the power on and no interrupt.
That is the mode every game this page names sets, and the one MiSTer's WonderSwan core runs in.

## The reading

The S-3511A is a dating clock. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#the-reading) for it is what key 0
says, read as though it were UTC, as it reads every dating clock. The year counts from 2000. In 12-hour mode, bit 7 of
the hour byte says the hour is after noon, and a producer resolves the hour from it. In 24-hour mode, and where key 1 is
null, the hour's digits are the hour, and bit 7 adds nothing to them.

The reading is not key 2. The chip runs from whatever the game last set it to, which need not be anywhere near the
host's clock. GBA_MiSTer starts it at 2009-12-31 23:59:45, and a game that never sets it leaves it there. So a save
written in 2026 can hold a clock reading early 2010. Both dates are correct. A producer whose components are not a date
**MUST** omit [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/), as that key requires of any reading a producer
cannot compute.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes, and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a [save](/specifications/saves/) or a
[state](/specifications/states/), or one of its [parts](/specifications/bundle/#part-map). A producer carrying this key
**SHOULD** carry `x.1sav.rtc` on the same map. The two describe one clock, and a consumer that wants only the time then
reads it without knowing the chip. They
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.

## When to set it

Only for a cartridge carrying this chip. On the GBA, Pokemon Ruby, Sapphire and Emerald use it, as do the Boktai games.
On the WonderSwan, Dokodemo Hamster 3, Inuyasha: Kagome no Sengoku Nikki and Dicing Knight do. A Game Boy cartridge
keeps a different clock, under one of the other keys [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#chip-keys)
lists.
