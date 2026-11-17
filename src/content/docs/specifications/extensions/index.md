---
title: Extensions
description: Catalogue of defined extension keys for the Universal Saves Format.
sidebar:
  label: Overview
  order: 0
---

[Extension keys](/specifications/universal-saves-format/#extensions) let parsers, emulators, and third parties attach
data without the core spec having to know about them. Each sits under a
[reverse-DNS](/specifications/common-types/reverse-dns-name/) text key, on a bundle's header, on a single part, in the
`game` map either one carries, or in a state's [`taken_with`](/specifications/bundle/#taken_with-map). The spec defines
the _mechanism_ and the round-tripping rules; this catalogue lists the _keys_ people have defined.

A key's schema belongs to its producer, and those entries are **non-normative**: the page records a shape these
specifications observed, and the producer may change it without notice. A key under a
[reserved name](/registries/vendors/) works the other way, because it belongs to no one producer. These specifications
define it, its page carries a normative schema, and it moves with the
[format's version](/specifications/universal-saves-format/#changelog) rather than with anybody's release. The `Owner`
column below is what tells the two apart.

Carrying a key is optional, and the rules on these pages bind producers only. A bundle that breaks one is not malformed.
A decoder round-trips the key whatever it holds and wherever it sits, as it does any
[extension key](/specifications/universal-saves-format/#extensions). What a page tells a consumer about reading a key it
knows is never a reason to reject a bundle.

[`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) is the one exception. An N64 cartridge's save part carries it,
and it is the one extension value a decoder checks.

Which tree a name sits in follows from whose meaning it carries. A key whose meaning is one producer's sits under a
domain that producer holds, as [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/) does: what one parser
read out of a save is that parser's. A key whose meaning belongs to nobody takes a reserved name in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) instead. That is where
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries a clock reading on the Unix scale, with a key under it
for each clock chip. A program that writes no bundles mints no keys, so what only it keeps takes a reserved name too.
[`x.1sav.cheats.mgba`](/specifications/extensions/x.1sav.cheats.mgba/) carries mGBA's cheat list that way.

The `Applies to` column names every placement a key allows, and names it by
[shape](/specifications/universal-saves-format/#shapes), because a header and a part mean different things in each. A
producer puts a key only where its row says. One listed for a card's part does not go on a device's, and one listed for
a save's header does not go on a collection's.

To add a key, open a PR with:

- a page at `extensions/<key>.md`;
- its schema beside the page, at `extensions/<key>.cddl`, which the page renders;
- a block in `test/extensions/fixtures.js`, with values the schema accepts and values it rejects;
- a row in the table below.

A key under a name its producer holds is listed first-come, and listing it blocks nobody from using it. A key under
`x.1sav` is part of the format instead. It changes only with a new version of these specifications, and the changelog
records each change.

| Key                                                                            | Owner  | Applies to                                   | Purpose                                                                           |
| ------------------------------------------------------------------------------ | ------ | -------------------------------------------- | --------------------------------------------------------------------------------- |
| [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/)             | 1retro | header, part                                 | What a Forge parser found, and which parser found it.                             |
| [`x.1sav.cheats.mgba`](/specifications/extensions/x.1sav.cheats.mgba/)         | (spec) | state's state part                           | The cheat list mGBA keeps in a state, set by set.                                 |
| [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/)                   | (spec) | card or save part                            | When a card's directory dates a save, and when it was last written.               |
| [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/)       | (spec) | card part                                    | A GameCube directory entry, field by field, for a writer that builds one.         |
| [`x.1sav.dirent.n64-cpak`](/specifications/extensions/x.1sav.dirent.n64-cpak/) | (spec) | card part                                    | An N64 Controller Pak note's entry, field by field, for a writer that builds one. |
| [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/)                       | (spec) | save header                                  | The image a console shows for a save, decoded to PNG.                             |
| [`x.1sav.label`](/specifications/extensions/x.1sav.label/)                     | (spec) | save header; card part as index              | What a console calls a save, and what it says beneath that.                       |
| [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/)                         | (spec) | `n64` save or state's `cartridge` part       | Which save chip an N64 cartridge has, and so how long its payload is.             |
| [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)                         | (spec) | save or state, header or part; device header | A clock reading on the Unix scale.                                                |
| [`x.1sav.rtc.huc3`](/specifications/extensions/x.1sav.rtc.huc3/)               | (spec) | save or state, header or part                | The clock controller's memory in a HuC-3 Game Boy cartridge.                      |
| [`x.1sav.rtc.joybus`](/specifications/extensions/x.1sav.rtc.joybus/)           | (spec) | save or state, header or part                | The clock an N64 cartridge answers on the Joybus.                                 |
| [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)               | (spec) | save or state, header or part                | The clock an MBC3 Game Boy cartridge keeps.                                       |
| [`x.1sav.rtc.n64dd`](/specifications/extensions/x.1sav.rtc.n64dd/)             | (spec) | device or state header                       | The clock in a 64DD drive, which every disk in it reads.                          |
| [`x.1sav.rtc.rtc4513`](/specifications/extensions/x.1sav.rtc.rtc4513/)         | (spec) | save or state, header or part                | The Epson clock on a Super Famicom SPC7110 board.                                 |
| [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/)           | (spec) | save or state, header or part                | The latched registers of the Seiko RTC in a GBA or WonderSwan cartridge.          |
| [`x.1sav.rtc.smpc`](/specifications/extensions/x.1sav.rtc.smpc/)               | (spec) | device or state header                       | The clock in a Sega Saturn's SMPC, and the memory beside it.                      |
| [`x.1sav.rtc.srtc`](/specifications/extensions/x.1sav.rtc.srtc/)               | (spec) | save or state, header or part                | The Sharp clock in a Super Famicom cartridge.                                     |
| [`x.1sav.rtc.tc8521`](/specifications/extensions/x.1sav.rtc.tc8521/)           | (spec) | save or state, header or part                | The Toshiba clock in the TAMA5 Game Boy cartridge.                                |
| [`x.1sav.rtc.tpp1`](/specifications/extensions/x.1sav.rtc.tpp1/)               | (spec) | save or state, header or part                | The clock of the TPP1 homebrew Game Boy mapper.                                   |
| [`x.1sav.rtc.upd4990a`](/specifications/extensions/x.1sav.rtc.upd4990a/)       | (spec) | device or state header                       | The NEC clock on a Neo Geo MVS board.                                             |
