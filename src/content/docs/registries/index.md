---
title: Registries
description: Non-normative lists of known values for the open vocabularies in the specifications.
sidebar:
  label: Overview
  order: 0
---

The specifications keep several vocabularies open on purpose: a bundle can name a system, an app or an extension key the
spec has never heard of, and decoders round-trip it unchanged. These pages list the known values, so producers reuse
existing names instead of inventing overlapping ones.

Every registry here is **non-normative**: the meaning of a value belongs to the spec or the producer that minted it, not
to the list. The rules for writing and reading a registry's slugs are in
[Slug](/specifications/common-types/slug/#registered-slugs).

Registration is first-come and non-blocking: to add an entry, open a PR against its page, with every column that page's
table has. A slug is never given to another entry, and from 1.0 none is removed. A project that renames itself keeps its
slug, and its new name goes in **Also seen as** where the registry has that column.

| Registry                             | Contents                                           |
| ------------------------------------ | -------------------------------------------------- |
| [System Slugs](/registries/systems/) | The canonical slug for every known gaming system.  |
| [Emulator Cores](/registries/cores/) | Known emulator cores and the systems they run.     |
| [Apps](/registries/apps/)            | Known apps that run cores, and which ones.         |
| [Platforms](/registries/platforms/)  | Known operating systems and firmwares apps run on. |
| [Save Roles](/registries/roles/)     | The socket a save came out of, per system.         |
| [Vendor Names](/registries/vendors/) | Assigned `x.*` names for producers with no domain. |
