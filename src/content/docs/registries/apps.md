---
title: Apps
description: Known apps that run emulator cores, their canonical slugs, and the cores they run.
---

An app is the software or device that runs an [emulator core](/registries/cores/). It is a frontend that loads cores, an
FPGA device that loads them as bitstreams, or a standalone emulator built around an engine of its own. The Universal
Saves Format carries it in a [`source`](/specifications/bundle/#source-map)'s `app` field, beside the core in `core`,
because one app runs many cores and one core runs in many apps.

The slug is what a producer writes in `app` when a save was produced by that app. An app listed here MUST use its slug
rather than a reverse-DNS name, even if it holds a domain, so that one app has one spelling. A slug is the name the app
already goes by, lowercased, with every run of other characters replaced by a single `-`. The result conforms to the
[slug grammar](/specifications/common-types/slug/) every vocabulary here shares.

A firmware that ships an app is not an app here but a [platform](/registries/platforms/). muOS and most handheld
firmwares run RetroArch, so a save they wrote names `retroarch` as its `app` and the firmware as its `platform`. A
device whose firmware loads cores itself, such as the Analogue Pocket, has no app inside it to name, so the device is
the app and is listed here. A launcher that starts another app, such as ES-DE, runs no core either, so a save names the
app it launched. A producer that runs no core, such as a cartridge reader or a service, has no entry here and names
itself in reverse-DNS.

The **Cores** column says what the app runs. An app that loads a kind's cores lists that **Kind** from the
[Emulator Cores registry](/registries/cores/). An app that ships its own builds lists their core slugs, and Provenance,
which does both, lists both. A standalone emulator lists its one engine, which usually shares its slug (`duckstation`
runs `duckstation`) but need not (`dolphin` runs `dolphin-emu`, the name its libretro build reports). A frontend that
builds other emulators' engines itself, such as OpenEmu, lists each under the slug that engine already has.

The list is **non-normative** and first-come; to add an app, open a PR with a row, alphabetical by slug.

| Slug              | App             | Cores                                                                                                                                                                                                                                                    |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analogue-pocket` | Analogue Pocket | `openfpga`                                                                                                                                                                                                                                               |
| `azahar`          | Azahar          | `azahar`                                                                                                                                                                                                                                                 |
| `delta`           | Delta           | `desmume`, `gambatte`, `genesis-plus-gx`, `melonds`, `mupen64plus`, `nestopia`, `snes9x`, `vba-m`                                                                                                                                                        |
| `dolphin`         | Dolphin         | `dolphin-emu`                                                                                                                                                                                                                                            |
| `duckstation`     | DuckStation     | `duckstation`                                                                                                                                                                                                                                            |
| `flycast`         | Flycast         | `flycast`                                                                                                                                                                                                                                                |
| `mednafen`        | Mednafen        | `mednafen`                                                                                                                                                                                                                                               |
| `melonds`         | melonDS         | `melonds`                                                                                                                                                                                                                                                |
| `mgba`            | mGBA            | `mgba`                                                                                                                                                                                                                                                   |
| `mister`          | MiSTer          | `mister`                                                                                                                                                                                                                                                 |
| `openemu`         | OpenEmu         | `atari800`, `bliss`, `bsnes`, `crabemu`, `desmume`, `dolphin-emu`, `fceux`, `gambatte`, `genesis-plus-gx`, `mednafen`, `mgba`, `mupen64plus`, `nestopia`, `o2em`, `picodrive`, `ppsspp`, `prosystem`, `snes9x`, `stella`, `vecx`                         |
| `pcsx2`           | PCSX2           | `pcsx2`                                                                                                                                                                                                                                                  |
| `ppsspp`          | PPSSPP          | `ppsspp`                                                                                                                                                                                                                                                 |
| `provenance`      | Provenance      | `libretro`, `4do`, `atari800`, `bliss`, `crabemu`, `dolphin-emu`, `emuthreeds`, `fceux`, `gambatte`, `genesis-plus-gx`, `mednafen`, `mupen64plus`, `o2em`, `picodrive`, `ppsspp`, `prosystem`, `snes9x`, `stella`, `tgb-dual`, `vba-m`, `virtual-jaguar` |
| `retroarch`       | RetroArch       | `libretro`                                                                                                                                                                                                                                               |
| `snes9x`          | Snes9x          | `snes9x`                                                                                                                                                                                                                                                 |
| `vita3k`          | Vita3K          | `vita3k`                                                                                                                                                                                                                                                 |
