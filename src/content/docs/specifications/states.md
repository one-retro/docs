---
title: States
description: The `state` shape, which is one save state, the whole emulated machine at one moment.
---

A `state` bundle is one save state: what an emulator took of a running game, the whole machine at one moment. Only the
core that took it can load it, often only at that core's version, and only against the ROM it was taken with. An in-game
save is the opposite case, since the game wrote it and anything that runs the game can read it.

The two never stand in for each other. A consumer **MUST NOT** write a state's data as an in-game save. It **MUST NOT**
load an in-game save as a state either.

## Header

`shape` is `"state"`, and `source` is required.

| Key | Name          | Req? | Notes                                                                               |
| --- | ------------- | ---- | ----------------------------------------------------------------------------------- |
| 0   | `shape`       | yes  | `"state"`.                                                                          |
| 1   | `system`      | no   | The system the game runs on.                                                        |
| 2   | `game`        | no   | The game, and the ROM the state was taken against.                                  |
| 3   | `source`      | yes  | What the state loads into: a `core`, or an `app` where nothing runs one.            |
| 5   | `description` | no   | Free-form note. Where an emulator lets the player name a state, the name goes here. |
| 6   | `bundled_at`  | no   | When the bundle was assembled, not when the state was taken.                        |
| 7   | `taken_at`    | no   | When the emulator took the state.                                                   |
| 8   | `taken_with`  | no   | What the state was taken with, where that bears on loading it anywhere else.        |
| 9   | `origin`      | no   | Who made the state, when it was not the player.                                     |

`card` is forbidden. The full definitions are in the [header map](/specifications/bundle/#0-header-map).

### What it loads into

On every other shape, `source` is provenance. On a state it also decides where the state can go, so it is required. It
names the `core` that took the state. A producer that runs no core names its `app` instead, as a flashcart's firmware
does for the states it takes itself.

- A consumer **MUST NOT** hand a state's data to any core but the one `source` names.
- Where `source` names no core, a consumer **MUST NOT** hand the data to anything but that app.
- A difference in `core_version` is the core's to judge. Many cores check a version of their own inside the data and
  refuse a state from another.

Converting a state for another core is a producer's work, and its result is a new state bundle whose `source` names the
new core.

### The ROM

A state loads only against the ROM it was taken with. A producer **SHOULD** carry that ROM's hashes in `game`'s
[`rom_hashes`](/specifications/bundle/#game-hints-map). A hash is what finds the right ROM on the consumer's side. On a
game that spans several discs, the hashes are those of the disc that was in the drive.

### When it was taken

`taken_at` is the moment the emulator took the state, in whole epoch seconds. It is what a list of slots shows. A
producer takes it from the emulator's own record where there is one, as mGBA keeps in its state files. Otherwise it
takes the state file's modification time. `bundled_at` is when the bundle was assembled, which can be long after.

### What it was taken with

[`taken_with`](/specifications/bundle/#taken_with-map) records what a state depends on beyond its core and its ROM.

- **Byte order and word size** are the host's. A producer **SHOULD** record them unless it knows the core's states do
  not depend on them. A libretro core says when they do, with `RETRO_SERIALIZATION_QUIRK_ENDIAN_DEPENDENT` and
  `RETRO_SERIALIZATION_QUIRK_PLATFORM_DEPENDENT`.
- **Firmware** is what the machine booted: a PS1 BIOS revision, or a real GBA BIOS where the core could have run its
  own. It is absent where the core ran without one.
- **Language** is the machine's language setting, which a game can read at boot and keep in the state.
- **Options** are the core's, under the names it gives them. They cover the model, the region and anything else one core
  configures that another does not.
- **Format version** is the version an emulator stamps outside the core's data. DuckStation puts one in its file's
  header, which a producer lifts off.

A consumer **SHOULD** compare each entry it recognises with what it would load the state with, and warn on a difference.
The core has the last word, and can load a state that differs or refuse one that matches.

### Origin

| Value      | The state                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(absent)_ | The player made it, in a slot, under a name or to a file.                                                                                                                                                                           |
| `auto`     | The emulator made it on its own, to resume from: on exit, on sleep or on a timer. RetroArch's `.state.auto`, the resume states of PCSX2 and DuckStation, and the state an Analogue Pocket takes when it sleeps are all `auto`.      |
| `undo`     | The emulator kept it so the player can undo taking or loading a state. With a `slot`, it is what that slot held before a new state replaced it. Without one, it is the game just before a state was loaded, as Snes9x's `.oops` is. |

A consumer **MUST NOT** show a state whose origin it does not recognise as one the player made.

## Parts

A state's parts are the state itself and what the emulator kept with it:

- **The state part.** Exactly one, of kind `state`: the core's own data, as the core loads it. `slot` on it is the
  number the emulator gave the state. An emulator that names its states rather than numbering them gives none.
- **A screenshot.** At most one, of kind `screenshot`: what the screen showed when the state was taken. The rules for
  the image are on [Screenshots](/specifications/screenshots/#the-image).
- **An in-game save.** Where the emulator keeps the in-game save beside the core's data, as mGBA does, it is an ordinary
  save part. It is the in-game save as it was when the state was taken, and holds the bytes the console wrote, as on a
  save. A clock footer the emulator appended to it goes into the clock's [extension keys](#extension-keys) instead. A
  consumer can lift it into a save bundle of its own.
- **Anything else** the emulator's file holds is an `aux` part, named by `path` for where it sat. That is whatever
  neither the header nor an [extension key](#extension-keys) has a place for, such as RetroArch's achievement block.

A state holds no nested bundle. A state and an in-game save of the same game travel as two bundles, and a
[collection](/specifications/collections/) holds both when they go in one file.

### The data is raw

The state part holds the core's data and nothing around it, so a consumer rebuilding the emulator's file knows what it
has. A producer **MUST** remove any compression the emulator applied. A part's own
[`encoding`](/specifications/bundle/#part-map) does that job. It **MUST** also take the data out of any file format the
emulator wrapped around it. RetroArch, for instance, loads a bare core state as readily as its own wrapped file.

### Rebuilding the emulator's file

An emulator's state file is a container: a header, the core's data, a screenshot, and sometimes more. A producer moves
what the header has a field for into the header, and what an extension key covers into that key. It carries the
remaining bytes as parts. A consumer writing the state back for that emulator rebuilds the file from the bundle. The
file need not come back byte for byte, as long as the emulator loads it.

| Emulator    | Its file holds                                                                                                                     | In the bundle                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| RetroArch   | A `RASTATE` header around the core's memory block and an achievement block, sometimes compressed, and a PNG beside it              | The memory block is the state part, the achievement block an `aux` part and the PNG the screenshot          |
| mGBA        | The core's data, a screenshot, the in-game save, the cheats, the time it was taken and what took it, in a PNG or a file of its own | A state part carrying the cheats, a screenshot, an in-game save part and its clock, `taken_at` and `source` |
| DuckStation | A header holding a version, the game's title and serial, the disc's path and a screenshot, then the data, often compressed         | `format_version`, `game`, a screenshot, and the state part uncompressed                                     |

RetroArch's slot number is in its file's name, and `.state.auto` is the one with none. Those become the state part's
`slot` and an `origin` of `auto`.

## Extension keys

A state takes these extension keys:

- [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/), and the chip key it lists for the cartridge's clock, on the
  header as on a save. They are a reading of the cartridge's clock, taken from the core's data or from a footer on the
  in-game save; see [On a state](/specifications/extensions/x.1sav.rtc/#on-a-state).
- [`x.1sav.cheats.mgba`](/specifications/extensions/x.1sav.cheats.mgba/), on the state part. It is the cheat list mGBA
  keeps in its own states, and can turn back on when it loads one.

## The smallest valid state

The core it loads into, and the core's data:

```text
827539798([
  { 0: "state", 3: { 4: "mgba" } },
  [ { 0: 0, 1: "state", 9: 18540(h'…32 bytes…'), -1: h'…the core's data…' } ]
])
```

Everything else is optional. A state with no game is unidentified rather than malformed, and it still loads into the
core that took it.
