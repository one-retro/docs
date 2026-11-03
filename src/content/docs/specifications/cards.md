---
title: Cards
description: The `card` shape, which is one memory card holding its saves one per part.
---

A `card` bundle is one memory card. Its header describes the card and nothing else. Each save it holds is a
[`bundle` part](/specifications/bundle/#nested-bundles) carrying a complete [save bundle](/specifications/saves/). Each
file or directory on it that belongs to no game is a [`system` part](#system-entries).

What a writer has to regenerate to put those saves back on real hardware, and the numbers each format fixes, are in
[Memory Cards](/specifications/memory-cards/).

## Header

`shape` is `"card"`, and `card` is required: it is what makes the bundle one.

| Key | Name          | Req? | Notes                                                                            |
| --- | ------------- | ---- | -------------------------------------------------------------------------------- |
| 0   | `shape`       | yes  | `"card"`.                                                                        |
| 1   | `system`      | no   | The system the card belongs to. A card is one system.                            |
| 2   | `game`        | no   | Only where every save on the card is for one game.                               |
| 3   | `source`      | no   | What read the card.                                                              |
| 4   | `card`        | yes  | The card's [format, capacity and system area](/specifications/bundle/#card-map). |
| 5   | `description` | no   | Free-form note.                                                                  |
| 6   | `bundled_at`  | no   | When the dump was assembled.                                                     |

The header says nothing about any individual save. What a save is called, what it looks like and what game it is for are
in that save's own header, inside its nested bundle, where they stay correct once the save is sliced out.

## Parts

One [`bundle` part](/specifications/bundle/#nested-bundles) per save, plus whatever belongs to the card itself:

```text
1SAV                                       the card
├── header  { shape: "card", system, card: { format, capacity, system_area } }
└── parts
    ├── kind "bundle"  slot 1, dirent, path, game hint
    │   └── 1SAV                           one save
    │       ├── header  { shape: "save", system, game, description }
    │       └── parts   one per file, each with its own slot and dirent
    ├── kind "bundle"  slot 2, ...
    ├── kind "system"  slot 3, dirent, path "BWNETCNF"           a directory no game owns
    ├── kind "system"  dirent, path "BWNETCNF/icon.sys"          and each file in it
    └── kind "card-image"                  optional byte-exact archive
```

A save's part carries the card's record of that save, and only that:

| Key | Name     | Notes                                                                         |
| --- | -------- | ----------------------------------------------------------------------------- |
| 3   | `path`   | The name the card's directory holds, which tells two saves of one game apart. |
| 4   | `slot`   | Its index in the directory.                                                   |
| 5   | `dirent` | Its directory entry, verbatim bytes.                                          |
| 2   | `role`   | Which socket the card was in, where that matters.                             |
| 9   | `sha256` | The inner bundle's content hash, which is the save's identity.                |

Card-level parts sit beside those: [`system`](#system-entries) for the entries on the card that no game owns, a
[`card-image`](/specifications/bundle/#part-kinds) for a byte-exact archive of the whole medium, and `aux` for anything
else binary that belongs to the card rather than to a save.

A card's nested bundles are saves and nothing else. It holds no card, no device and no collection, which is what makes a
card the last tier that nests: below it there are only a save's own parts.

A save's files are **not** parts of the card. They are parts of that save's own bundle, which is
[required and not conventional](/specifications/bundle/#nested-bundles): a save flattened into its card has no bundle to
hash, and so no identity.

## System entries

Not everything on a card is a game's. A PS2 keeps its browser's play history and its network settings in directories of
their own, each an ordinary directory with an icon and files, and neither belongs to any one game. They are not saves,
so they are not `bundle` parts, and a card does not invent a game for them. They are
[`system` parts](/specifications/bundle/#part-kinds), one per entry:

| Key | Name      | Notes                                                                                                             |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| 3   | `path`    | Required. Where the entry sits on the card: a directory's name, or a file's directory and its name joined by `/`. |
| 4   | `slot`    | Its index in the directory holding it, as on a save's part.                                                       |
| 5   | `dirent`  | Its directory entry, verbatim bytes, exactly as a save's part carries one.                                        |
| 2   | `role`    | Which socket the card was in, as on the card's saves.                                                             |
| -1  | `payload` | The file's bytes. A directory's is empty: what it holds is the parts after it.                                    |

A `system` part names no `game`, and the card header's `game` does not describe it, even on a card of one game. So every
`bundle` part on a card is a game's save. One that names no game is a save nobody has identified yet, which is
[unidentified](/specifications/bundle/#0-header-map) and not the same thing as belonging to no game.

The entries are flat rather than nested because nothing slices one out. A save nests so that it means the same thing
lifted off the card; a console's network settings are only ever the card's. Flat entries still sit in directories, so a
writer has to meet each directory before what goes in it:

- A producer **MUST** carry a `system` part for the directory of every `system` part whose `path` names one.
- That directory's part **MUST** come before the parts for what it holds.

Which entries a format's console writes, and how a writer puts them back, are in
[Memory Cards](/specifications/memory-cards/#entries-belonging-to-no-game).

Bytes the card keeps for itself at a fixed place, such as a pak's label or a VMU's colour, are not entries. They go in
[`system_area`](/specifications/bundle/#card-map).

## Extension keys

On a save's part, and on a `system` part, describing the card's record of it:

- [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/), when the directory dates the entry and last wrote it.
- [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/) and the other per-format keys, which
  decompose the entry so a writer can rebuild it.

[`x.1sav.label`](/specifications/extensions/x.1sav.label/) and [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/)
go on the nested save's own header instead, since they describe the save rather than the card. `x.1sav.label` MAY also
be repeated on the part as an index copy, so a consumer can list the card without opening every payload.
