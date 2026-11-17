---
title: Slug
description:
  A short name from a list somebody else keeps, its grammar, and what a consumer does with one it has never seen.
sidebar:
  order: 2
---

A short, lowercase name drawn from a list rather than invented: `card-image`, `cartridge-reader`, `memcard-1`,
`atari-2600`, `ps1-mc`. The specifications use it wherever a field names a category everyone shares, so two producers
writing about the same thing write the same string and a consumer can group by it.

A slug belongs to the specification that defines the field, or to the registry that field names. It is not a
[reverse-DNS name](/specifications/common-types/reverse-dns-name/), which a producer mints for itself; the two grammars
are disjoint, and which one a field takes is stated at the field.

This page is **normative**. When a specification says a field holds a slug, every rule here applies to that field.

## Grammar

A slug is lowercase ASCII, at most 64 bytes, with runs separated by a single `-` and no leading or trailing one.

```text
[a-z0-9]+(-[a-z0-9]+)*
```

A slug holds no `.`, and a reverse-DNS name is two or more labels joined by `.`, so no string is both. A producer mints
a reverse-DNS name without checking what a specification might assign later, and a specification assigns without
auditing what producers have minted.

## Who adds one

Every field that holds a slug says where its list lives, and there are only two answers.

- **The specification owns it.** The list grows with a new version of the spec.
- **A registry owns it.** The list grows by a PR against that registry, without a new version of the spec.

A producer does not invent a slug for a field that holds one. Inventing into a shared category splits it rather than
extending it: two producers naming one concept differently have given a consumer two unrelated strings to group by. A
field that is a producer's own to name says so, and takes a reverse-DNS name or free-form text instead.

## Registered slugs

A registry lists each entry under one slug, and sometimes under **Also seen as** the names other tools spell it with.

- A producer naming something a registry lists **MUST** write that entry's slug.
- A producer **MUST NOT** write a name from an entry's **Also seen as** column.

Those names are for a consumer matching what other tools wrote. A registry never gives a slug to another entry, and from
1.0 never removes one, so a slug written once keeps its meaning.

## An unfamiliar slug

Four rules cover every field that holds one.

- A consumer **MUST** round-trip a slug it does not recognise, unchanged. An unfamiliar name comes from a later version
  or a newer registry entry, and is never a reason to drop what it labels.
- In a field that takes only a slug, a consumer **MUST** reject anything else, a well-formed reverse-DNS name included.
- In a field that takes either, a consumer **MUST** reject a value that is neither a well-formed slug nor a well-formed
  reverse-DNS name.
- Where a consumer cannot degrade gracefully, it **MUST** fail the operation rather than proceed on a guess.

A value that breaks the grammar is not a name anybody could have written, so there is nothing to round-trip. Preserving
a name a consumer does not understand is not licence to act as though it did.

What an unrecognised slug costs beyond grouping depends on the field, and the field says so. Most cost nothing: an
unknown `system` or `device_kind` is a label a consumer carries and does not act on, and an unknown part `kind` is
handled as `aux`. Some block an operation instead. An unknown card `format` blocks rebuilding the card. An unknown
`role` blocks matching a part to a socket: a consumer shows the role as written and does not guess which socket it
means. In both cases the consumer keeps the bundle whole and declines the write.

## Roles

The [Save Roles registry](/registries/roles/) lists each role for the systems it means something on. A role in its
**Common** table means the same on every system. Any other role means what its row says on the systems that row lists,
and is a role a consumer does not recognise on any other.

Slugs are compared whole and are opaque, with one exception. A registered role prefix ending in `-`, such as `memcard-`,
covers that prefix followed by a whole number from 1 up, written without a leading zero: `memcard-1`, `memcard-12`. A
consumer **MAY** match on the number. Nothing else in these specifications reads structure out of a slug.
