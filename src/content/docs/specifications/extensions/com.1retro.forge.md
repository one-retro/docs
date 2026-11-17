---
title: com.1retro.forge
description: What a Forge parser read out of a save, and which parser read it.
slug: specifications/extensions/com.1retro.forge
---

**Owner:** 1retro · **Applies to:** the bundle header and a part · **Status:** non-normative

What a Forge parser pulled out of a save, together with the name of the parser that pulled it.

## Schema

```cddl file=./com.1retro.forge.cddl

```

Key 0 names the parser, and key 1 holds what it found. They share one key because what a parser found means nothing
without its name: nothing in the found values says how to read them. A consumer that copies, filters or merges extension
keys takes both or neither.

### Key 0 is not a format slug

The saves format checks several vocabularies against a strict [slug grammar](/specifications/common-types/slug/):
lowercase ASCII, single dashes, at most 64 bytes. This is not one of them. What a parser is called is Forge's business,
so the value is free-form text. Compare it by equality, and do not parse it for structure that may not be there.

### Do not interpret key 1

There is no stable field set to code against. What it holds depends on the game and on the parser version, a shape
observed in one bundle says nothing about the next, and Forge is free to change both without notice.

Key 0 is what makes the rest legible. A consumer that recognises the parser name knows how to read the map beside it.
One that does not round-trips the whole thing and reads none of it.

## Where it goes

The header of the bundle whose save a Forge parser read, or one of that bundle's parts.

## When to set it

When a Forge parser has read the save. A parser that ran and found nothing worth recording still names itself, and
leaves key 1 out.

## Status

Deliberately underspecified. The Forge specification will live in this repository eventually and will define both keys
properly; until then this page fixes only the envelope. Tightening it later is a change to Forge rather than to the
saves format, which looks inside no extension key but [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/).
