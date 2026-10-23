---
title: x.1sav.rtc.joybus
description: The clock an N64 cartridge answers on the Joybus, as Doubutsu no Mori's does.
slug: specifications/extensions/x.1sav.rtc.joybus
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

Doubutsu no Mori is the one N64 cartridge with a clock. The console reaches it over the Joybus, the serial bus the
controllers and the save EEPROM share, and reads and writes it in blocks of eight bytes. This key carries those blocks
and the moment a producer took them. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.joybus.cddl

```

Keys 0, 1 and 2 are blocks 0, 1 and 2, each as a read of that block returns it:

- **Block 0** is control. Bit 0 of byte 0 write-protects block 1, and bit 1 write-protects block 2. Bits 1 and 2 of byte
  1 stop the clock. Bytes 4 and 5 hold values with no known effect, which a producer keeps as read. The other bytes read
  zero.
- **Block 1** is eight bytes of battery-backed RAM. Doubutsu no Mori does not use it.
- **Block 2** is the time, one packed BCD byte each: seconds, minutes, hours, day of the month, weekday, month, year,
  century. The hours run 0 to 23 with bit 7 set. The century counts from 1900, so it is 0 or 1.

Block 3 always reads zero, and the key does not carry it.

Key 3 is the anchor: the producer's clock at the moment it took the blocks. It is the moment the producer advances the
clock from when the save is next loaded. A producer that keeps one **SHOULD** carry it. ares is the one emulator that
writes the clock to a file, and the three blocks and the anchor are everything that file holds.

## The reading

The clock is a dating clock, and block 2 gives the whole year: 1900, plus 100 times the century, plus the two year
digits. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads the components as though they were UTC, as it does
for every dating clock. The clock has no 12-hour mode.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only for a cartridge with this clock: Doubutsu no Mori, or a homebrew ROM whose header asks for it. The 64DD's clock is
in the drive rather than on the disk, so a disk save does not carry it.

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. The two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
