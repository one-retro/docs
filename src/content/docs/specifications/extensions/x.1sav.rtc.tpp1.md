---
title: x.1sav.rtc.tpp1
description: The clock of the TPP1 homebrew Game Boy mapper, in its own registers.
slug: specifications/extensions/x.1sav.rtc.tpp1
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a save's bundle header
· **Status:** normative schema, optional to carry

TPP1 is a homebrew Game Boy mapper with an optional clock. Its specification defines the registers and no save format.
This key carries the registers and the moment a producer took them.
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries the reading.

The representation belongs to no one emulator, so the name sits in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree), under `x.1sav.rtc`.

## Schema

```cddl file=./x.1sav.rtc.tpp1.cddl

```

Keys 0 and 1 hold the same four registers twice, one byte each:

- **RTCW** is the week, 0 to 255.
- **RTCDH** holds the weekday, 0 to 6, in bits 5 to 7, and the hour, 0 to 23, in bits 0 to 4.
- **RTCM** is the minutes and **RTCS** the seconds, each 0 to 59.

Key 0 is the clock as it runs and key 1 the latched copy the game reads. Key 1 is null where the producer's source does
not keep the latched copy, as SameBoy's save does not.

Key 2 is the MR4 register. Bit 2 is set while the clock runs, and bit 3 once the week counter has overflowed. Bits 0 and
1 are the rumble speed, which is not clock state, so a producer clears them.

Key 3 is the anchor: the producer's clock at the moment it took the registers. It is the moment the producer advances
the clock from when the save is next loaded. A producer that keeps one **SHOULD** carry it.

## Filling a null

A consumer rebuilding the clock when key 1 is null **SHOULD** use key 0 for the latched copy. A game latches the clock
before it reads it, and the latch copies the running registers over the latched ones.

## The reading

TPP1 is a counting clock. [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#the-reading) for it is the elapsed time
the running registers give, after 1970-01-01T00:00:00Z: seven days for each week, then the weekday, the hours, the
minutes and the seconds.

## Where it goes

Wherever [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#where-it-goes) goes and nowhere else: the
[header](/specifications/bundle/#0-header-map) of a bundle whose `shape` is [`save`](/specifications/saves/). A producer
carrying this key and `x.1sav.rtc` puts both in the same place, since they describe one clock.

## When to set it

Only for a TPP1 ROM whose header asks for the clock. Other Game Boy clocks take the other keys
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/#chip-keys) lists.

This key's placement follows [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)'s
[scope rules](/specifications/extensions/x.1sav.rtc/#where-it-goes), including the prohibition on a
[`bundle` part](/specifications/bundle/#nested-bundles). A producer **SHOULD** carry
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) on the same map. The two
[may disagree](/specifications/extensions/x.1sav.rtc/#disagreeing-with-the-chip-is-not-an-error) without either being
wrong.
