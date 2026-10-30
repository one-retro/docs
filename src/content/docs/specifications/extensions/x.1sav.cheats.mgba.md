---
title: x.1sav.cheats.mgba
description: The cheat list mGBA keeps inside a state, set by set.
slug: specifications/extensions/x.1sav.cheats.mgba
---

**Owner:** these specifications, under a [reserved name](/registries/vendors/) · **Applies to:** a state's `state` part
· **Status:** normative schema, optional to carry

mGBA keeps the player's cheat list inside each state it takes. This key carries that list, so a consumer rebuilding
mGBA's file can put it back.

The list is mGBA's, but mGBA writes no bundles, so nobody holding `io.mgba` will mint a key for it. These specifications
take a name in the [`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) instead.

## Schema

```cddl file=./x.1sav.cheats.mgba.cddl

```

mGBA groups codes into sets. A set has a name, can be switched off, and holds the codes the player entered, one per
line. Directives tell mGBA how to read a set's codes. For the GBA they are `GSAv1`, `GSAv1 raw`, `PARv3` and
`PARv3 raw`, and the Game Boy has none.

The order of the sets is mGBA's, and it matters. Each set starts from where the one before it left off, its code type
included. Moving a set can change how mGBA reads its codes.

## mGBA's text

mGBA stores the list as the text of its `.cheats` files. It writes each set as these lines, in this order:

1. `!disabled` on a line of its own, when the set is switched off.
2. Each directive after a `!`, one per line.
3. `#`, a space and the name.
4. The codes, one per line.

A producer reads that text into the sets above. A consumer rebuilding mGBA's state file writes the sets back the same
way, as the file's cheat section. The text need not come back byte for byte, as long as mGBA reads the same sets.

## What it does on load

mGBA writes the list into every state by default. It reads the list back only when its setting to load cheats from a
state is on, which by default it is not. When it is, loading the state replaces the player's cheats with these.

The list changes nothing in the core's data, which loads the same with or without it. A cheat that was on when the state
was taken has already changed the memory the state holds. The list decides only which cheats stay on afterwards.

## Where it goes

The [`state` part](/specifications/states/#parts) of a [state](/specifications/states/) whose `source` names the `mgba`
app. A producer **MUST NOT** put it on any other part, or on any header. mGBA's libretro core keeps no cheats in its
states, so a state taken in RetroArch never carries this key.

The list sits on the part because mGBA loads it with the core's data. A consumer that lifts the in-game save out of the
state leaves the list behind. The game wrote the save, and the cheats are the player's.

## When to set it

Only when mGBA's file holds a cheat section with at least one set in it. An empty section is the same as none to mGBA,
so the key is absent for both.
