---
title: Emulator Cores
description: Known emulator cores, their canonical slugs, and the systems they run.
---

An emulator core is the engine that actually runs the game, as distinct from the frontend or device that hosts it, which
is an [app](/registries/apps/). The registry covers four kinds:

- **`libretro`** — software cores hosted by RetroArch, on its own or inside Onion and most handheld firmwares. The
  canonical name is the core's `library_name`, the exact string RetroArch uses to name a `saves/<core>/` folder.
- **`mister`** — MiSTer FPGA cores. The canonical name is the core's repository name in the MiSTer-devel organization
  (`NES_MiSTer`), which derives to `nes-mister`; the `MiSTer` suffix namespaces the slug on its own.
- **`openfpga`** — Analogue Pocket openFPGA cores. The canonical name is the `Author.Platform` folder the core installs
  to on the SD card, so the slug carries its author.
- **`standalone`** — engines that ship as emulators of their own and have no build under the kinds above, such as
  Mednafen. The canonical name is the name the emulator goes by.

The slug is what a producer writes in the Universal Saves Format's [`source.core`](/specifications/bundle/#source-map)
field when a save was produced by that core, beside the app that ran it in `source.app`. A core listed here MUST use its
slug rather than a reverse-DNS name, even if it holds a domain, so that one core has one spelling. A slug is derived
mechanically from the kind's canonical name: lowercase, with every run of non-alphanumeric characters replaced by a
single `-`, and any leading or trailing one dropped. The result conforms to the
[slug grammar](/specifications/common-types/slug/) every vocabulary here shares. Where a core also exists as a
standalone emulator (mGBA, DuckStation) or as a frontend's own build (OpenEmu's Snes9x), one slug covers them all; the
engine is the same. A fork that has diverged under a name of its own is a separate core: the Beetle cores began as
Mednafen's and are not `mednafen`.

A libretro core is named by the `library_name` it reports, not by the name RetroArch's core list shows, so builds that
report one name write to one folder and are one core here. bsnes-mercury's Accuracy, Balanced and Performance profiles
all report `bsnes-mercury`, and PCSX ReARMed's NEON build reports `PCSX-ReARMed`. HBMAME, though a fork, reports `MAME`,
so its saves can only read as `mame`.

The **Systems** column uses slugs from the [System Slugs registry](/registries/systems/). The **Also seen as** column
records other names for the same core:

- Former names: the Mednafen cores were renamed Beetle, and Genesis_MiSTer became MegaDrive_MiSTer.
- The SD-card saves folders a MiSTer core writes to (`/media/fat/saves/<name>/`).
- Analogizer builds of a Pocket core, which count as the same core.

They help mapping folders and old data, and are never emitted. Standalone Mednafen is one `mednafen` core rather than
one per system, so that no slug derived from a Beetle core's former name, such as `Mednafen PCE Fast`, names it. Where a
collision cannot be avoided, the slug wins and the former name is not listed. The libretro PS2 core reported `pcsx2`
until it was renamed LRPS2 in 2024, and its 3DO core reported `4DO` before it became Opera. Saves under those names read
as `pcsx2` and `4do`, the engines both forks began from.

Cores are grouped by system family for browsing. Each core appears exactly once, and the **Systems** column is the
authoritative coverage; some cores reach past their section (blueMSX also runs `sg-1000`, PicoDrive also runs
`mastersystem`).

The list is **non-normative** and first-come; to add a core, open a PR with a row in the right section, alphabetical by
slug.

## NES

| Slug                | Core              | Kind         | Systems      | Also seen as               |
| ------------------- | ----------------- | ------------ | ------------ | -------------------------- |
| `agg23-nes`         | agg23.NES         | `openfpga`   | `nes`        | `RndMnkIII.NES_Analogizer` |
| `bnes`              | bnes              | `libretro`   | `nes`        |                            |
| `emux-nes`          | emux (nes)        | `libretro`   | `nes`        |                            |
| `fceumm`            | FCEUmm            | `libretro`   | `nes`        |                            |
| `fceux`             | FCEUX             | `standalone` | `nes`, `fds` |                            |
| `fixnes`            | fixNES            | `libretro`   | `nes`, `fds` |                            |
| `mesen`             | Mesen             | `libretro`   | `nes`        |                            |
| `nes-mister`        | NES_MiSTer        | `mister`     | `nes`, `fds` | `NES`                      |
| `nestopia`          | Nestopia          | `libretro`   | `nes`        |                            |
| `quicknes`          | QuickNES          | `libretro`   | `nes`        |                            |
| `rustynes`          | RustyNES          | `libretro`   | `nes`, `fds` |                            |
| `spiritualized-nes` | Spiritualized.NES | `openfpga`   | `nes`, `fds` |                            |

## SNES

| Slug                             | Core                           | Kind       | Systems             | Also seen as            |
| -------------------------------- | ------------------------------ | ---------- | ------------------- | ----------------------- |
| `agg23-snes`                     | agg23.SNES                     | `openfpga` | `snes`              | `agg23.SNES_Analogizer` |
| `beetle-supafaust`               | Beetle Supafaust               | `libretro` | `snes`              |                         |
| `bsnes`                          | bsnes                          | `libretro` | `snes`              |                         |
| `bsnes2014`                      | bsnes2014                      | `libretro` | `snes`              |                         |
| `bsnes-hd-beta`                  | bsnes-hd beta                  | `libretro` | `snes`              |                         |
| `bsnes-jg`                       | bsnes-jg                       | `libretro` | `snes`              |                         |
| `bsnes-mercury`                  | bsnes-mercury                  | `libretro` | `snes`              |                         |
| `chimerasnes`                    | ChimeraSNES                    | `libretro` | `snes`              |                         |
| `higan-super-famicom`            | higan (Super Famicom)          | `libretro` | `snes`, `gb`, `gbc` |                         |
| `higan-super-famicom-balanced`   | higan (Super Famicom Balanced) | `libretro` | `snes`, `gb`, `gbc` |                         |
| `mednafen-bsnes`                 | Mednafen bSNES                 | `libretro` | `snes`              |                         |
| `mesen-s`                        | Mesen-S                        | `libretro` | `snes`              |                         |
| `snes9x`                         | Snes9x                         | `libretro` | `snes`              |                         |
| `snes9x-2002`                    | Snes9x 2002                    | `libretro` | `snes`              |                         |
| `snes9x-2005`                    | Snes9x 2005                    | `libretro` | `snes`              |                         |
| `snes9x-2005-plus`               | Snes9x 2005 Plus               | `libretro` | `snes`              |                         |
| `snes9x-2010`                    | Snes9x 2010                    | `libretro` | `snes`              |                         |
| `snes-mister`                    | SNES_MiSTer                    | `mister`   | `snes`              | `SNES`                  |
| `timboettiger-pro-action-replay` | timboettiger.Pro Action Replay | `openfpga` | `snes`              |                         |

## Game Boy family

| Slug                    | Core                  | Kind       | Systems            | Also seen as                  |
| ----------------------- | --------------------- | ---------- | ------------------ | ----------------------------- |
| `beetle-gba`            | Beetle GBA            | `libretro` | `gba`              |                               |
| `boytacean`             | Boytacean             | `libretro` | `gb`, `gbc`        |                               |
| `budude2-gb`            | budude2.GB            | `openfpga` | `gb`               | `budude2.GB_Analogizer`       |
| `budude2-gbc`           | budude2.GBC           | `openfpga` | `gbc`              | `budude2.GBC_Analogizer`      |
| `doublecherrygb`        | DoubleCherryGB        | `libretro` | `gb`, `gbc`        |                               |
| `emux-gb`               | emux (gb)             | `libretro` | `gb`, `gbc`        |                               |
| `fixgb`                 | fixGB                 | `libretro` | `gb`, `gbc`        |                               |
| `gambatte`              | Gambatte              | `libretro` | `gb`, `gbc`        |                               |
| `gameboy-mister`        | Gameboy_MiSTer        | `mister`   | `gb`, `gbc`        | `GAMEBOY`, `GAMEBOY2P`, `GBC` |
| `gba-mister`            | GBA_MiSTer            | `mister`   | `gba`              | `GBA`, `GBA2P`                |
| `gearboy`               | Gearboy               | `libretro` | `gb`, `gbc`        |                               |
| `gpsp`                  | gpSP                  | `libretro` | `gba`              |                               |
| `irogb`                 | IroGB                 | `libretro` | `gb`, `gbc`        |                               |
| `mgba`                  | mGBA                  | `libretro` | `gba`, `gbc`, `gb` |                               |
| `mincer-ray-gba`        | mincer_ray.GBA        | `openfpga` | `gba`              |                               |
| `sameboy`               | SameBoy               | `libretro` | `gb`, `gbc`        |                               |
| `sgb-mister`            | SGB_MiSTer            | `mister`   | `gb`               | `SGB`                         |
| `skyemu`                | SkyEmu                | `libretro` | `gb`, `gba`, `nds` |                               |
| `spiritualized-gb`      | Spiritualized.GB      | `openfpga` | `gb`               |                               |
| `spiritualized-gba`     | Spiritualized.GBA     | `openfpga` | `gba`              |                               |
| `spiritualized-gbc`     | Spiritualized.GBC     | `openfpga` | `gbc`              |                               |
| `spiritualized-supergb` | Spiritualized.SuperGB | `openfpga` | `gb`               |                               |
| `tempgba`               | TempGBA               | `libretro` | `gba`              |                               |
| `tgb-dual`              | TGB Dual              | `libretro` | `gb`, `gbc`        |                               |
| `vba-m`                 | VBA-M                 | `libretro` | `gba`, `gbc`, `gb` |                               |
| `vba-next`              | VBA Next              | `libretro` | `gba`              |                               |

## Nintendo 64

| Slug               | Core             | Kind         | Systems | Also seen as |
| ------------------ | ---------------- | ------------ | ------- | ------------ |
| `mupen64plus`      | Mupen64Plus      | `standalone` | `n64`   |              |
| `mupen64plus-next` | Mupen64Plus-Next | `libretro`   | `n64`   |              |
| `n64-mister`       | N64_MiSTer       | `mister`     | `n64`   | `N64`        |
| `parallel-n64`     | ParaLLEl N64     | `libretro`   | `n64`   |              |

## GameCube and Wii

| Slug          | Core        | Kind       | Systems     | Also seen as |
| ------------- | ----------- | ---------- | ----------- | ------------ |
| `dolphin-emu` | dolphin-emu | `libretro` | `gc`, `wii` |              |
| `ishiiruka`   | Ishiiruka   | `libretro` | `gc`, `wii` |              |

## Nintendo DS

| Slug           | Core         | Kind       | Systems | Also seen as |
| -------------- | ------------ | ---------- | ------- | ------------ |
| `desmume`      | DeSmuME      | `libretro` | `nds`   |              |
| `desmume-2015` | DeSmuME 2015 | `libretro` | `nds`   |              |
| `melonds`      | melonDS      | `libretro` | `nds`   |              |
| `melonds-ds`   | melonDS DS   | `libretro` | `nds`   |              |
| `noods`        | NooDS        | `libretro` | `nds`   |              |

## Nintendo 3DS

| Slug           | Core         | Kind         | Systems | Also seen as |
| -------------- | ------------ | ------------ | ------- | ------------ |
| `azahar`       | Azahar       | `libretro`   | `3ds`   |              |
| `citra`        | Citra        | `libretro`   | `3ds`   |              |
| `citra2018`    | Citra2018    | `libretro`   | `3ds`   |              |
| `citra-canary` | Citra Canary | `libretro`   | `3ds`   |              |
| `emuthreeds`   | emuThreeDS   | `standalone` | `3ds`   |              |
| `panda3ds`     | Panda3DS     | `libretro`   | `3ds`   |              |
| `trident`      | Trident      | `libretro`   | `3ds`   |              |

## Virtual Boy

| Slug        | Core      | Kind       | Systems      | Also seen as  |
| ----------- | --------- | ---------- | ------------ | ------------- |
| `beetle-vb` | Beetle VB | `libretro` | `virtualboy` | `Mednafen VB` |

## Sega 8- and 16-bit

| Slug                    | Core                  | Kind         | Systems                                                    | Also seen as                             |
| ----------------------- | --------------------- | ------------ | ---------------------------------------------------------- | ---------------------------------------- |
| `blastem`               | BlastEm               | `libretro`   | `genesis`                                                  |                                          |
| `clownmdemu`            | ClownMDEmu            | `libretro`   | `genesis`, `sega-cd`                                       |                                          |
| `crabemu`               | CrabEmu               | `standalone` | `mastersystem`, `sg-1000`, `colecovision`                  |                                          |
| `drizzt-gg`             | drizzt.GG             | `openfpga`   | `sega-gg`                                                  |                                          |
| `drizzt-megadrive`      | drizzt.MegaDrive      | `openfpga`   | `genesis`                                                  |                                          |
| `drizzt-sg-1000`        | drizzt.SG-1000        | `openfpga`   | `sg-1000`                                                  |                                          |
| `drizzt-sms`            | drizzt.SMS            | `openfpga`   | `mastersystem`                                             |                                          |
| `emux-sms`              | emux (sms)            | `libretro`   | `mastersystem`                                             |                                          |
| `ericlewis-genesis`     | ericlewis.Genesis     | `openfpga`   | `genesis`                                                  | `ericlewis.Genesis_Analogizer`           |
| `gearsystem`            | Gearsystem            | `libretro`   | `mastersystem`, `sega-gg`, `sg-1000`                       |                                          |
| `genesis-plus-gx`       | Genesis Plus GX       | `libretro`   | `genesis`, `mastersystem`, `sega-gg`, `sg-1000`, `sega-cd` |                                          |
| `genesis-plus-gx-wide`  | Genesis Plus GX Wide  | `libretro`   | `genesis`, `mastersystem`, `sega-gg`, `sg-1000`, `sega-cd` |                                          |
| `jeremy-megacd`         | jeremy.MegaCD         | `openfpga`   | `sega-cd`                                                  |                                          |
| `megacd-mister`         | MegaCD_MiSTer         | `mister`     | `sega-cd`                                                  | `MegaCD`                                 |
| `megadrive-mister`      | MegaDrive_MiSTer      | `mister`     | `genesis`, `mastersystem`                                  | `Genesis_MiSTer`, `MegaDrive`, `Genesis` |
| `picodrive`             | PicoDrive             | `libretro`   | `genesis`, `sega-32x`, `sega-cd`, `mastersystem`           |                                          |
| `s32x-mister`           | S32X_MiSTer           | `mister`     | `sega-32x`                                                 | `S32X`                                   |
| `sms-mister`            | SMS_MiSTer            | `mister`     | `mastersystem`, `sega-gg`, `sg-1000`                       | `SMS`                                    |
| `sms-plus-gx`           | SMS Plus GX           | `libretro`   | `mastersystem`, `sega-gg`                                  |                                          |
| `spiritualized-genesis` | Spiritualized.Genesis | `openfpga`   | `genesis`                                                  |                                          |
| `spiritualized-gg`      | Spiritualized.GG      | `openfpga`   | `sega-gg`                                                  |                                          |
| `spiritualized-sg-1000` | Spiritualized.SG-1000 | `openfpga`   | `sg-1000`                                                  |                                          |
| `spiritualized-sms`     | Spiritualized.SMS     | `openfpga`   | `mastersystem`                                             |                                          |

## Sega Saturn

| Slug            | Core          | Kind       | Systems  | Also seen as      |
| --------------- | ------------- | ---------- | -------- | ----------------- |
| `beetle-saturn` | Beetle Saturn | `libretro` | `saturn` | `Mednafen Saturn` |
| `kronos`        | Kronos        | `libretro` | `saturn` |                   |
| `saturn-mister` | Saturn_MiSTer | `mister`   | `saturn` | `Saturn`          |
| `yabasanshiro`  | YabaSanshiro  | `libretro` | `saturn` |                   |
| `yabause`       | Yabause       | `libretro` | `saturn` |                   |

## Dreamcast

| Slug      | Core    | Kind       | Systems     | Also seen as |
| --------- | ------- | ---------- | ----------- | ------------ |
| `flycast` | Flycast | `libretro` | `dreamcast` |              |

## PC Engine

| Slug                       | Core                     | Kind       | Systems                                | Also seen as                          |
| -------------------------- | ------------------------ | ---------- | -------------------------------------- | ------------------------------------- |
| `agg23-pc-engine`          | agg23.PC Engine          | `openfpga` | `pcengine`, `supergrafx`               | `agg23.PC Engine_Analogizer`          |
| `beetle-pce`               | Beetle PCE               | `libretro` | `pcengine`, `pcenginecd`               |                                       |
| `beetle-pce-fast`          | Beetle PCE Fast          | `libretro` | `pcengine`, `pcenginecd`               | `Mednafen PCE Fast`                   |
| `beetle-pc-fx`             | Beetle PC-FX             | `libretro` | `pcfx`                                 |                                       |
| `beetle-supergrafx`        | Beetle SuperGrafx        | `libretro` | `supergrafx`, `pcengine`               | `Mednafen SuperGrafx`                 |
| `geargrafx`                | Geargrafx                | `libretro` | `pcengine`, `pcenginecd`, `supergrafx` |                                       |
| `mazamars312-pc-engine-cd` | Mazamars312.PC Engine CD | `openfpga` | `pcenginecd`                           | `Mazamars312.PC Engine CD_Analogizer` |
| `turbografx16-mister`      | TurboGrafx16_MiSTer      | `mister`   | `pcengine`, `supergrafx`, `pcenginecd` | `TGFX16`, `TGFX16-CD`                 |

## PlayStation

| Slug            | Core          | Kind       | Systems | Also seen as |
| --------------- | ------------- | ---------- | ------- | ------------ |
| `beetle-psx`    | Beetle PSX    | `libretro` | `psx`   |              |
| `beetle-psx-hw` | Beetle PSX HW | `libretro` | `psx`   |              |
| `duckstation`   | DuckStation   | `libretro` | `psx`   |              |
| `pcsx1`         | PCSX1         | `libretro` | `psx`   |              |
| `pcsx-rearmed`  | PCSX-ReARMed  | `libretro` | `psx`   |              |
| `psx-mister`    | PSX_MiSTer    | `mister`   | `psx`   | `PSX`        |
| `rustation`     | Rustation     | `libretro` | `psx`   |              |
| `swanstation`   | SwanStation   | `libretro` | `psx`   |              |

## PlayStation 2

| Slug     | Core   | Kind         | Systems | Also seen as |
| -------- | ------ | ------------ | ------- | ------------ |
| `armsx2` | ARMSX2 | `libretro`   | `ps2`   |              |
| `lrps2`  | LRPS2  | `libretro`   | `ps2`   |              |
| `pcee2`  | PCEE2  | `libretro`   | `ps2`   |              |
| `pcsx2`  | PCSX2  | `standalone` | `ps2`   |              |
| `play`   | Play!  | `libretro`   | `ps2`   |              |
| `yaps2`  | yaps2  | `libretro`   | `ps2`   |              |

## PlayStation Portable

| Slug     | Core   | Kind       | Systems | Also seen as |
| -------- | ------ | ---------- | ------- | ------------ |
| `ppsspp` | PPSSPP | `libretro` | `psp`   |              |

## PlayStation Vita

| Slug     | Core   | Kind       | Systems  | Also seen as |
| -------- | ------ | ---------- | -------- | ------------ |
| `vita3k` | Vita3K | `libretro` | `psvita` |              |

## WonderSwan and Neo Geo Pocket

| Slug                | Core              | Kind       | Systems                          | Also seen as          |
| ------------------- | ----------------- | ---------- | -------------------------------- | --------------------- |
| `agg23-wonderswan`  | agg23.WonderSwan  | `openfpga` | `wonderswan`, `wonderswan-color` |                       |
| `beetle-neopop`     | Beetle NeoPop     | `libretro` | `ngp`, `ngpc`                    | `Mednafen NeoPop`     |
| `beetle-wonderswan` | Beetle WonderSwan | `libretro` | `wonderswan`, `wonderswan-color` | `Mednafen WonderSwan` |
| `jotego-jtngp`      | jotego.jtngp      | `openfpga` | `ngp`                            |                       |
| `jotego-jtngpc`     | jotego.jtngpc     | `openfpga` | `ngpc`                           |                       |
| `race`              | RACE              | `libretro` | `ngp`, `ngpc`                    |                       |
| `wonderswan-mister` | WonderSwan_MiSTer | `mister`   | `wonderswan`, `wonderswan-color` | `WonderSwan`          |

## Neo Geo and arcade

| Slug                          | Core                          | Kind       | Systems          | Also seen as                    |
| ----------------------------- | ----------------------------- | ---------- | ---------------- | ------------------------------- |
| `fb-alpha`                    | FB Alpha                      | `libretro` | `neogeo`, `mame` |                                 |
| `finalburn-neo`               | FinalBurn Neo                 | `libretro` | `neogeo`, `mame` |                                 |
| `finalburn-neo-cps12-subset`  | FinalBurn Neo (cps12 subset)  | `libretro` | `mame`           |                                 |
| `finalburn-neo-neogeo-subset` | FinalBurn Neo (neogeo subset) | `libretro` | `neogeo`         |                                 |
| `geolith`                     | Geolith                       | `libretro` | `neogeo`         |                                 |
| `mame`                        | MAME                          | `libretro` | `mame`           |                                 |
| `mame-2000`                   | MAME 2000                     | `libretro` | `mame`           |                                 |
| `mame-2003-0-78`              | MAME 2003 (0.78)              | `libretro` | `mame`           |                                 |
| `mame-2003-midway`            | MAME 2003 Midway              | `libretro` | `mame`           |                                 |
| `mame-2003-plus`              | MAME 2003-Plus                | `libretro` | `mame`           |                                 |
| `mame-2009`                   | MAME 2009                     | `libretro` | `mame`           |                                 |
| `mame-2010`                   | MAME 2010                     | `libretro` | `mame`           |                                 |
| `mame-2015`                   | MAME 2015                     | `libretro` | `mame`           |                                 |
| `mame-2016`                   | MAME 2016                     | `libretro` | `mame`           |                                 |
| `mazamars312-neogeo`          | Mazamars312.NeoGeo            | `openfpga` | `neogeo`         | `Mazamars312.NeoGeo_Analogizer` |
| `neogeo-mister`               | NeoGeo_MiSTer                 | `mister`   | `neogeo`         | `NEOGEO`                        |

## Atari

| Slug                 | Core               | Kind       | Systems                    | Also seen as              |
| -------------------- | ------------------ | ---------- | -------------------------- | ------------------------- |
| `a5200`              | a5200              | `libretro` | `atari-5200`               |                           |
| `atari7800-mister`   | Atari7800_MiSTer   | `mister`   | `atari-7800`, `atari-2600` | `ATARI7800`               |
| `atari800`           | Atari800           | `libretro` | `atari-5200`               |                           |
| `atari800-mister`    | Atari800_MiSTer    | `mister`   | `atari-5200`               | `ATARI5200`               |
| `atarilynx-mister`   | AtariLynx_MiSTer   | `mister`   | `atari-lynx`               | `AtariLynx`               |
| `beetle-lynx`        | Beetle Lynx        | `libretro` | `atari-lynx`               | `Mednafen Lynx`           |
| `budude2-lynx`       | budude2.Lynx       | `openfpga` | `atari-lynx`               | `budude2.Lynx_Analogizer` |
| `gearlynx`           | Gearlynx           | `libretro` | `atari-lynx`               |                           |
| `handy`              | Handy              | `libretro` | `atari-lynx`               |                           |
| `prosystem`          | ProSystem          | `libretro` | `atari-7800`               |                           |
| `spiritualized-2600` | Spiritualized.2600 | `openfpga` | `atari-2600`               |                           |
| `spiritualized-7800` | Spiritualized.7800 | `openfpga` | `atari-7800`               |                           |
| `stella`             | Stella             | `libretro` | `atari-2600`               |                           |
| `stella-2014`        | Stella 2014        | `libretro` | `atari-2600`               |                           |
| `stella-2023`        | Stella 2023        | `libretro` | `atari-2600`               |                           |
| `tia`                | tia                | `libretro` | `atari-2600`               |                           |
| `virtual-jaguar`     | Virtual Jaguar     | `libretro` | `atari-jaguar`             |                           |

## MSX and ColecoVision

| Slug                   | Core                 | Kind       | Systems                                  | Also seen as |
| ---------------------- | -------------------- | ---------- | ---------------------------------------- | ------------ |
| `bluemsx`              | blueMSX              | `libretro` | `msx`, `msx2`, `colecovision`, `sg-1000` |              |
| `boogermann-msx`       | boogermann.msx       | `openfpga` | `msx`                                    |              |
| `colecovision-mister`  | ColecoVision_MiSTer  | `mister`   | `colecovision`, `sg-1000`                | `Coleco`     |
| `fmsx`                 | fMSX                 | `libretro` | `msx`, `msx2`                            |              |
| `gearcoleco`           | Gearcoleco           | `libretro` | `colecovision`                           |              |
| `jollycv`              | JollyCV              | `libretro` | `colecovision`                           |              |
| `msx1-mister`          | MSX1_MiSTer          | `mister`   | `msx`                                    | `MSX1`       |
| `msx-mister`           | MSX_MiSTer           | `mister`   | `msx`, `msx2`                            | `MSX`        |
| `spiritualized-coleco` | Spiritualized.Coleco | `openfpga` | `colecovision`                           |              |

## Multi-system

| Slug       | Core     | Kind         | Systems                                                                                                                                                                                                                      | Also seen as |
| ---------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `mednafen` | Mednafen | `standalone` | `atari-lynx`, `fds`, `gb`, `gba`, `gbc`, `genesis`, `mastersystem`, `nes`, `ngp`, `ngpc`, `pcengine`, `pcenginecd`, `pcfx`, `psx`, `saturn`, `sega-gg`, `snes`, `supergrafx`, `virtualboy`, `wonderswan`, `wonderswan-color` |              |

## Other systems

| Slug                     | Core                   | Kind         | Systems         | Also seen as    |
| ------------------------ | ---------------------- | ------------ | --------------- | --------------- |
| `3do-mister`             | 3DO_MiSTer             | `mister`     | `3do`           | `3DO`           |
| `4do`                    | 4DO                    | `standalone` | `3do`           |                 |
| `bliss`                  | Bliss                  | `standalone` | `intellivision` |                 |
| `c64-mister`             | C64_MiSTer             | `mister`     | `c64`           | `C64`           |
| `freeintv`               | FreeIntv               | `libretro`   | `intellivision` |                 |
| `frodo`                  | Frodo                  | `libretro`   | `c64`           |                 |
| `intv-mister`            | Intv_MiSTer            | `mister`     | `intellivision` | `Intellivision` |
| `markus-zzz-myc64`       | markus-zzz.MyC64       | `openfpga`   | `c64`           |                 |
| `o2em`                   | O2EM                   | `libretro`   | `odyssey2`      |                 |
| `obsidian-vectrex`       | obsidian.Vectrex       | `openfpga`   | `vectrex`       |                 |
| `odyssey2-mister`        | Odyssey2_MiSTer        | `mister`     | `odyssey2`      | `ODYSSEY2`      |
| `opera`                  | Opera                  | `libretro`   | `3do`           |                 |
| `spiritualized-intv`     | Spiritualized.Intv     | `openfpga`   | `intellivision` |                 |
| `spiritualized-odyssey2` | Spiritualized.Odyssey2 | `openfpga`   | `odyssey2`      |                 |
| `vectrex-mister`         | Vectrex_MiSTer         | `mister`     | `vectrex`       | `VECTREX`       |
| `vecx`                   | vecx                   | `libretro`   | `vectrex`       |                 |
| `vice-x128`              | VICE x128              | `libretro`   | `c64`           |                 |
| `vice-x64`               | VICE x64               | `libretro`   | `c64`           |                 |
| `vice-x64dtv`            | VICE x64dtv            | `libretro`   | `c64`           |                 |
| `vice-x64sc`             | VICE x64sc             | `libretro`   | `c64`           |                 |
| `vice-xscpu64`           | VICE xscpu64           | `libretro`   | `c64`           |                 |
