---
title: Collections
description: The `collection` shape, which is several bundles of any other shape carried in one file.
---

A `collection` bundle is several bundles in one file: cards, saves, states, screenshots, devices. It is how one file
spans systems, and it is the only shape with nothing of its own to say.

## Header

`shape` is `"collection"`. `system`, `game` and `card` are all forbidden, because a collection describes no single
system, no single game and no card: each of those belongs to an entry.

| Key | Name          | Req? | Notes                              |
| --- | ------------- | ---- | ---------------------------------- |
| 0   | `shape`       | yes  | `"collection"`.                    |
| 3   | `source`      | no   | What assembled it.                 |
| 5   | `description` | no   | Free-form note.                    |
| 6   | `bundled_at`  | no   | When the collection was assembled. |

## Parts

Every part is a [`bundle` part](/specifications/bundle/#nested-bundles), one per entry. Each entry is a complete bundle
of any shape but another collection: a [save](/specifications/saves/), a [state](/specifications/states/), a
[screenshot](/specifications/screenshots/), a [card](/specifications/cards/) or a [device](/specifications/device/). A
collection never holds another collection.

```text
1SAV                                       shape "collection"
└── parts
    ├── kind "bundle"  system "psx"        a card
    │   └── 1SAV  { shape: "card", system: "psx", card: { format: "ps1-mc", … } }
    │       └── parts   kind "bundle" per save
    ├── kind "bundle"  system "ps2"        another card, different system
    │   └── 1SAV  { shape: "card", system: "ps2", card: { format: "ps2-mc", … } }
    └── kind "bundle"  system "gb"         a plain save, no card in between
        └── 1SAV  { shape: "save", system: "gb", game: { … } }
```

Entries need not be the same shape. A collection can hold a PS1 card, a PS2 card and a loose Game Boy save side by side,
and a consumer reads each entry's own `shape` to know which it has.

The outer part's `system` and `game` repeat what the entry's own header says, so a consumer can list a collection from
the head region without opening payloads. They are an index: producers **SHOULD** keep them consistent. On a mismatch
the inner header wins.

## What a collection may hold

Any shape but another collection, which is one of the rules that keep the format from recursing. A collection holds
devices, cards, saves, states and screenshots. A device holds cards and saves, and a card holds saves. A save, a state
and a screenshot hold nothing nested. Follow that chain and it always ends, so the shapes in a bundle bound
[how deep it goes](/specifications/bundle/#nested-bundles).

Two cards out of the same console are one collection of two card bundles, even when they were read from its slots
together: a [device](/specifications/device/) holds at least one component that is not a card. Two consoles' storage in
one file is a collection of two [devices](/specifications/device/).
