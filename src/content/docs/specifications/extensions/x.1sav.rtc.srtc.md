---
title: x.1sav.rtc.srtc
description: The registers of the Sharp S-RTC in Daikaijuu Monogatari II, for byte-exact round-tripping.
slug: specifications/extensions/x.1sav.rtc.srtc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

Daikaijuu Monogatari II keeps a Sharp S-RTC on its cartridge, and no other game does. This key carries what the chip
holds and the moment a producer took it. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.srtc.cddl

```

Key 0 is the chip's 13 registers, four bits each, in the order a read returns them:

| Index | Holds                                       |
| ----- | ------------------------------------------- |
| 0, 1  | seconds, ones then tens                     |
| 2, 3  | minutes, ones then tens                     |
| 4, 5  | hours, ones then tens, 0 to 23              |
| 6, 7  | day of the month, ones then tens            |
| 8     | month, 1 to 12, in binary                   |
| 9, 10 | year, ones then tens                        |
| 11    | century, in binary: 9 for 19xx, 10 for 20xx |
| 12    | weekday, 0 to 6                             |

Key 1 is the anchor: the producer's clock at the moment it took the registers. It is the moment the producer advances
the chip from when the save is next loaded. A producer that keeps one **SHOULD** carry it. bsnes and Snes9x each write
one, in files of different layouts. The registers and the anchor are everything either file holds.

## The reading

The S-RTC is a dating clock, and its registers give the whole year: 1000, plus 100 times the century, plus the two year
digits. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads the components as though they were UTC, as it does
for every dating clock. The chip has no 12-hour mode, so the hours need no flag to read.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only for Daikaijuu Monogatari II. The other Super Famicom clock is the Epson RTC-4513 in Tengai Makyou Zero, which takes
[`x.1sav.rtc.rtc4513`](/specifications/extensions/x.1sav.rtc.rtc4513/).

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. The two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
