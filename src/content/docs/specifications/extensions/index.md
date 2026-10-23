---
title: Extensions
description: Catalogue of defined extension keys for the Universal Saves Format.
sidebar:
  label: Overview
  order: 0
---

[Extension keys](/specifications/universal-saves-format/#extensions) let parsers, emulators, and third parties attach
data without the core spec having to know about them. Each sits under a
[reverse-DNS](/specifications/common-types/reverse-dns-name/) text key, on a bundle's header, on a single part, or in
the `game` map either one carries. The spec defines the _mechanism_ and the round-tripping rules; this catalogue lists
the _keys_ people have defined.

A key's schema belongs to its producer, and those entries are **non-normative**: the page records a shape these
specifications observed, and the producer may change it without notice. A key under a
[reserved name](/registries/vendors/) works the other way, because it belongs to no one producer. These specifications
define it, its page carries a normative schema even though carrying the key is optional, and it moves with the
[format's version](/specifications/universal-saves-format/#changelog) rather than with anybody's release. The `Owner`
column below is what tells the two apart.

Which tree a name sits in follows from the same split. A key whose meaning is one producer's sits under a domain that
producer holds, as [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/) does: what one parser read out of
a save is that parser's. A key whose meaning belongs to nobody takes a reserved name in the
[`x` tree](/specifications/common-types/reverse-dns-name/#the-x-tree) instead. That is where
[`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/) carries a clock reading normalized to a Unix instant, with a key
under it for each cartridge clock chip.

The `Applies to` column names every placement a key allows, and names it by
[shape](/specifications/universal-saves-format/#shapes), because a header and a part mean different things in each. A
key listed for a card's part does not belong on a device's, and one listed for a save's header does not belong on a
collection's.

Registration is first-come and non-blocking; to add a key, open a PR with a new `extensions/<key>.md` page and a row in
the table.

| Key                                                                      | Owner  | Applies to                      | Purpose                                                                   |
| ------------------------------------------------------------------------ | ------ | ------------------------------- | ------------------------------------------------------------------------- |
| [`com.1retro.forge`](/specifications/extensions/com.1retro.forge/)       | 1retro | header, part                    | What a Forge parser found, and which parser found it.                     |
| [`x.1sav.dirent`](/specifications/extensions/x.1sav.dirent/)             | (spec) | card or save part               | When a card's directory dates a save and when it last wrote it.           |
| [`x.1sav.dirent.gc-mc`](/specifications/extensions/x.1sav.dirent.gc-mc/) | (spec) | card part                       | A GameCube directory entry, field by field, for a writer that builds one. |
| [`x.1sav.icon`](/specifications/extensions/x.1sav.icon/)                 | (spec) | save header                     | The image a console shows for a save, decoded to PNG.                     |
| [`x.1sav.label`](/specifications/extensions/x.1sav.label/)               | (spec) | save header; card part as index | What a console calls a save, and what it says beneath that.               |
| [`x.1sav.rtc`](/specifications/extensions/x.1sav.rtc/)                   | (spec) | save header                     | A clock reading normalized to a Unix instant.                             |
| [`x.1sav.rtc.huc3`](/specifications/extensions/x.1sav.rtc.huc3/)         | (spec) | save header                     | The clock controller's memory in a HuC-3 Game Boy cartridge.              |
| [`x.1sav.rtc.joybus`](/specifications/extensions/x.1sav.rtc.joybus/)     | (spec) | save header                     | The clock an N64 cartridge answers on the Joybus.                         |
| [`x.1sav.rtc.mbc3`](/specifications/extensions/x.1sav.rtc.mbc3/)         | (spec) | save header                     | The clock an MBC3 Game Boy cartridge keeps.                               |
| [`x.1sav.rtc.rtc4513`](/specifications/extensions/x.1sav.rtc.rtc4513/)   | (spec) | save header                     | The Epson clock on a Super Famicom SPC7110 board.                         |
| [`x.1sav.rtc.s3511a`](/specifications/extensions/x.1sav.rtc.s3511a/)     | (spec) | save header                     | The latched state of the Seiko RTC in a GBA or WonderSwan cartridge.      |
| [`x.1sav.rtc.srtc`](/specifications/extensions/x.1sav.rtc.srtc/)         | (spec) | save header                     | The Sharp clock in a Super Famicom cartridge.                             |
| [`x.1sav.rtc.tc8521`](/specifications/extensions/x.1sav.rtc.tc8521/)     | (spec) | save header                     | The Toshiba clock in the TAMA5 Game Boy cartridge.                        |
| [`x.1sav.rtc.tpp1`](/specifications/extensions/x.1sav.rtc.tpp1/)         | (spec) | save header                     | The clock of the TPP1 homebrew Game Boy mapper.                           |
