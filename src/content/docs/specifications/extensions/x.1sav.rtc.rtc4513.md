---
title: x.1sav.rtc.rtc4513
description: The registers of the Epson RTC-4513 in Tengai Makyou Zero, and when a producer took them.
slug: specifications/extensions/x.1sav.rtc.rtc4513
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

Tengai Makyou Zero has an Epson RTC-4513 beside the SPC7110 on its board. The two other SPC7110 games have no clock.
This key carries what the chip holds and the moment a producer took it.
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.rtc4513.cddl

```

Key 0 is the chip's 16 registers, four bits each, in index order. Each holds what a read of it returns. The digits are
BCD, and the flags sit in the bits the chip gives them:

| Index | Holds                                                          |
| ----- | -------------------------------------------------------------- |
| 0     | seconds, ones                                                  |
| 1     | seconds, tens in bits 0 to 2; LOST in bit 3                    |
| 2     | minutes, ones                                                  |
| 3     | minutes, tens in bits 0 to 2; WRAP in bit 3                    |
| 4     | hours, ones                                                    |
| 5     | hours, tens in bits 0 and 1; PM in bit 2; WRAP in bit 3        |
| 6     | day, ones                                                      |
| 7     | day, tens in bits 0 and 1; RAM in bit 2; WRAP in bit 3         |
| 8     | month, ones                                                    |
| 9     | month, tens in bit 0; RAM in bits 1 and 2; WRAP in bit 3       |
| A     | year, ones                                                     |
| B     | year, tens                                                     |
| C     | weekday, 0 to 6, in bits 0 to 2; WRAP in bit 3                 |
| D     | HOLD in bit 0, CAL/HW in bit 1, IRQ-F in bit 2, 30ADJ in bit 3 |
| E     | MASK in bit 0, DUTY in bit 1, RATE in bits 2 and 3             |
| F     | RESET in bit 0, STOP in bit 1, 24/12 in bit 2, TEST in bit 3   |

Key 1 is the anchor: the producer's clock at the moment it took the registers. It is the moment the producer advances
the chip from when the save is next loaded. A producer that keeps one **SHOULD** carry it. bsnes, Snes9x and Mesen2 each
write one, in files of three different layouts.

## The reading

The RTC-4513 is a dating clock. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) reads its components as though
they were UTC, as it does for every dating clock.

- The year is two digits with no century, so a producer supplies one.
- With 24/12 clear the clock runs in 12-hour mode, and PM is what says the hour is after noon.
- With CAL/HW clear the day, month and year registers are user RAM rather than a date. A producer **MUST** omit
  `x.1sav.rtc` then, as that key requires of any reading a producer cannot compute.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only for Tengai Makyou Zero, including its Shounen Jump no Shou edition. The other Super Famicom clock is the Sharp
S-RTC in Daikaijuu Monogatari II, which takes [`x.1sav.rtc.srtc`](/specifications/extensions/x.1sav.rtc.srtc/).

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. The two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
