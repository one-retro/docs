---
title: x.1sav.rtc.tc8521
description: The registers of the Toshiba TC8521 clock in the TAMA5 Tamagotchi cartridge.
slug: specifications/extensions/x.1sav.rtc.tc8521
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

The TAMA5 cartridge, Game de Hakken!! Tamagotchi: Osutchi to Mesutchi, keeps its clock in a Toshiba TC8521. The chip has
the registers of the Ricoh RP5C01. This key carries what the chip holds and the moment a producer took it.
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.tc8521.cddl

```

Key 0 is the chip's four blocks, each 13 registers of four bits, in index order:

- **Block 0** is the time, in BCD. Registers 0 to 5 are the seconds, minutes and hours, each ones then tens. Register 6
  is the weekday. Registers 7 to C are the day, month and year, each ones then tens.
- **Block 1** is the alarm and the settings. Registers 2 to 8 are the alarm, laid out as block 0's minutes to day.
  Register A is 1 in 24-hour mode and 0 in 12-hour mode. Register B counts years since a leap year, 0 to 3. Registers 0,
  1, 9 and C read zero.
- **Blocks 2 and 3** are RAM.

Key 1 is the mode register, D. Bits 0 and 1 select the block a game sees, bit 2 enables the alarm, and bit 3 is set
while the clock runs. The test and reset registers, E and F, are write-only, and the key does not carry them.

Emulators keep different amounts of this chip. A register, in a block or in key 1, is null where the producer's source
does not keep it. mGBA keeps every block, while ares keeps block 0 without the weekday, the two settings, and nothing
else.

Key 2 is the anchor: the producer's clock at the moment it took the registers. It is the moment the producer advances
the clock from when the save is next loaded. A producer that keeps one **SHOULD** carry it.

## Filling a null

A consumer rebuilding the chip needs a value for each null register. It **SHOULD** use these:

- **Key 1**, the mode: 8. The clock runs, block 0 is selected, and the alarm is off.
- **Block 1, register A**: 1, for 24-hour mode, as MAME starts the chip.
- **Block 1, register B**: block 0's year modulo 4, as MAME sets it, or 0 when the year is null too.
- **Any other register**: 0, where MAME starts the alarm and the RAM. That includes the weekday. The chip counts it from
  whatever the game set, so the date does not give it.

## The reading

The TC8521 is a dating clock. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads block 0 as though it were
UTC, as it does for every dating clock.

- The year is two digits with no century, so a producer supplies one.
- A producer **MUST** omit `x.1sav.rtc` when a block 0 register the date or time needs is null, as that key requires of
  any reading a producer cannot compute.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/) or
[`state`](/specifications/states/). A producer carrying this key and `x.1sav.rtc` puts both in the same place, since
they describe one clock.

## When to set it

Only for the TAMA5 cartridge, the one game on that board. Other Game Boy clocks take the other keys
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#chip-keys) lists.

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. The two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
