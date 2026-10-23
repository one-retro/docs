---
title: x.1sav.rtc.huc3
description: The memory of the clock controller in a Hudson HuC-3 Game Boy cartridge.
slug: specifications/extensions/x.1sav.rtc.huc3
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

A HuC-3 cartridge keeps its clock in a microcontroller. A game reads and writes that microcontroller's memory one nybble
at a time, through a window of 256 addresses. This key carries that memory and the moment a producer took it.
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.huc3.cddl

```

Key 0 is the 256 nybbles of the window, element _n_ at address _n_. A value wider than a nybble spans consecutive
addresses, least significant nybble first. The addresses known to mean something are these:

| Address     | Holds                                                 |
| ----------- | ----------------------------------------------------- |
| 0x00 – 0x06 | a copy of the time, which a game reads and sets whole |
| 0x10 – 0x12 | minute of the day, 0 to 1439                          |
| 0x13 – 0x15 | day counter                                           |
| 0x26        | tone selection, in bits 0 and 1                       |
| 0x27        | tone enable                                           |
| 0x58 – 0x5A | event time, minutes                                   |
| 0x5B – 0x5D | event time, days                                      |

Games keep data of their own at other addresses, so every address is carried. An element is null where the producer's
source does not keep that address. mGBA keeps all 256, while SameBoy keeps the two counters and the event time.

Key 1 is the anchor: the producer's clock at the moment it took the memory. It is the moment the producer advances the
counters from when the save is next loaded. A producer that keeps one **SHOULD** carry it.

## Filling a null

A consumer rebuilding the memory **SHOULD** use 0 for each null address, as emulators start it. A game's own data at
such an address stays lost, as it already was in the source.

## The reading

The HuC-3 is a counting clock with no seconds. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#the-reading) for it
is the day counter's days and the minute counter's minutes after 1970-01-01T00:00:00Z. A producer **MUST** omit
`x.1sav.rtc` when any of addresses 0x10 to 0x15 is null, as that key requires of any reading a producer cannot compute.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only for a HuC-3 cartridge: the Robopon games, called Robot Poncots in Japan, and Pocket Family GB and GB 2. Other Game
Boy clocks take the other keys [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#chip-keys) lists.

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. The two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
