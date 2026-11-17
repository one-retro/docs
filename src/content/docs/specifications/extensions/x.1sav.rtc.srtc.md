---
title: x.1sav.rtc.srtc
description: The registers of the Sharp S-RTC in Daikaijuu Monogatari II, for byte-exact round-tripping.
slug: specifications/extensions/x.1sav.rtc.srtc
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** the header of a save or
state, or one of its parts · **Status:** normative schema, optional to carry

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
| 9, A  | year, ones then tens                        |
| B     | century, in binary: 9 for 19xx, 10 for 20xx |
| C     | weekday, 0 to 6                             |

Key 1 is the anchor: the producer's clock at the moment it took the registers. It is the moment the producer advances
the chip from when the save is next loaded. A producer that keeps one **SHOULD** carry it. bsnes and Snes9x each write
one, in files of different layouts. The registers and the anchor are everything either file holds.

## The reading

The S-RTC is a dating clock, and its registers give the whole year: 1000, plus 100 times the century, plus the two year
digits. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads the components as though they were UTC, as it does
for every dating clock. The chip has no 12-hour mode, so the hours need no flag to read.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes, and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a [save](/specifications/saves/) or a
[state](/specifications/states/), or one of its [parts](/specifications/bundle/#part-map). A producer carrying this key
**SHOULD** carry `x.1sav.rtc` on the same map. The two describe one clock, and a consumer that wants only the time then
reads it without knowing the chip. They
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.

## When to set it

Only for Daikaijuu Monogatari II. The other Super Famicom clock is the Epson RTC-4513 in Tengai Makyou Zero, which takes
[`x.1sav.rtc.rtc4513`](/specifications/extensions/x.1sav.rtc.rtc4513/).
