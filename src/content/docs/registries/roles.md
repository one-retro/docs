---
title: Save Roles
description: The socket a save came out of, for every system that has more than one.
---

A role names **which socket** a save came out of, not what medium it is on: a controller pak is a card that lives in a
controller, and its role says which controller. The [Universal Saves Format](/specifications/bundle/#part-map) carries
it in a part's `role` field.

A role follows the [slug grammar](/specifications/common-types/slug/) every vocabulary in these specifications shares:
lowercase ASCII, single hyphens between runs, at most 64 bytes.

A consumer uses `role` to name a part to a user and to match it against a socket when restoring. That second job is why
a producer takes a name from this registry rather than inventing one. A private name is one nothing else can match.
[Slug](/specifications/common-types/slug/#an-unfamiliar-slug) says what a consumer does with a role it does not
recognise, and [Roles](/specifications/common-types/slug/#roles) how this page's sections scope one.

The list is **non-normative** and first-come; to add a role, open a PR against the section for its system.

## Common

Roles that mean the same thing everywhere, and cover most bundles on their own.

| Role        | Socket                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `primary`   | The only socket, or the principal one. The default: a part with no `role` means this.                   |
| `cartridge` | The game cartridge's own save memory, whether battery-backed SRAM, EEPROM or flash.                     |
| `internal`  | Save storage built into the console itself, as distinct from anything removable: a Wii's NAND included. |
| `ram-cart`  | An add-on that extends the console's own save storage rather than replacing it. Saves can be in both.   |
| `sd`        | A removable SD card.                                                                                    |

## Numbered sockets

Where a system has several sockets of one kind, the role ends in a number: `memcard-1`, `controller-pak-3`. Numbering
starts at 1 and follows the console's own ordering, so player 1's controller is `controller-pak-1` and the first memory
card slot is `memcard-1`. Systems that label their slots with letters are numbered in the same order, so a GameCube's
Slot A is `memcard-1` and Slot B is `memcard-2`. The registry keeps one convention rather than mirroring each console's
silkscreen.

A prefix covers every number from 1 up, as [Roles](/specifications/common-types/slug/#roles) says, so a device with
eight card slots writes `memcard-8` without that role being listed here. The prefixes, and the systems each is listed
for:

| Prefix            | Sockets                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `memcard-`        | Memory card slots, in the console's own order.                        |
| `controller-pak-` | N64 Controller Pak slots, one per controller port.                    |
| `transfer-pak-`   | N64 Transfer Pak slots, one per controller port.                      |
| `disk-`           | Sides of a disk that are written separately, in the game's own order. |

## Nintendo

| Role              | System       | Socket                                                                                                                                               |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disk-`           | `fds`        | Disk sides carried as parts of their own, in the order the game numbers them: `disk-1` and `disk-2`. A disk carried whole as one part takes no role. |
| `controller-pak-` | `n64`        | Controller Pak slots, one per controller port.                                                                                                       |
| `transfer-pak-`   | `n64`        | The Game Boy cartridge in a Transfer Pak, one per controller port. Its save is a `gb` one.                                                           |
| `64dd`            | `n64`        | The disk in a 64DD drive. Its save is an `n64dd` one.                                                                                                |
| `memcard-`        | `gc`         | GameCube memory card Slot A and Slot B.                                                                                                              |
| `sd`              | `wii`, `3ds` | The SD card. A 3DS title's extdata is there too, told apart from its savedata by `path`.                                                             |

## Sega

| Role       | System              | Socket                                                                                                                                             |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `internal` | `sega-cd`, `saturn` | The console's built-in backup RAM.                                                                                                                 |
| `ram-cart` | `sega-cd`, `saturn` | The Backup RAM Cart.                                                                                                                               |
| `memcard-` | `dreamcast`         | VMU slots, numbered across controllers: controller _c_'s slot _s_ is `memcard-` and 2(_c_ − 1) + _s_, so controller 2's first slot is `memcard-3`. |

## NEC

| Role       | System                   | Socket                                                                                      |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `internal` | `pcenginecd`             | The backup RAM in a CD-ROM² interface unit, or built into a Duo. A HuCard console has none. |
| `ram-cart` | `pcengine`, `pcenginecd` | A backup add-on, such as the Ten no Koe 2 or a Tennokoe Bank HuCard.                        |

## SNK

| Role          | System                | Socket                                                                                                                                                                     |
| ------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `internal`    | `neogeo`, `neogeo-cd` | Built-in memory: an MVS cabinet's backup RAM behind the card slot. An AES console has none. On a Neo Geo CD, the 8 KiB its BIOS keeps saves in, laid out as a memory card. |
| `neogeo-card` | `neogeo`              | The Neo Geo memory card, which an arcade cabinet and a home console both take.                                                                                             |

## Sony

| Role       | System                 | Socket                                                                                                                                                 |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `memcard-` | `psx`, `ps2`           | Memory card slots.                                                                                                                                     |
| `internal` | `ps3`, `psp`, `psvita` | Built-in storage: a PS3's drive, a PSP Go's flash, a PCH-2000 Vita's 1 GB. A PSP or a Vita otherwise saves to its one memory card, which is `primary`. |

## Adding a role

Prefer a **Common** role if one already fits: a great many systems have exactly one place a save can live, and `primary`
covers all of them. Add a new name only when a system genuinely has a socket the list cannot express, and put it in that
system's section.

A role that turns out to recur across several systems moves to **Common**, which is where `internal` and `ram-cart` are.
