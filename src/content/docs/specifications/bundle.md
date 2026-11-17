---
title: Bundle
description:
  Every field a bundle carries, shared by every shape. The header, the parts, and how a payload is addressed and hashed.
slug: specifications/bundle
---

The field reference for the format. What a bundle is made of, what every key means, and how payloads are carried and
hashed. It is the same for every [shape](/specifications/universal-saves-format/#shapes); what differs is which keys
apply and what the parts stand for, which each shape's own document says.

Read [Universal Saves Format](/specifications/universal-saves-format/) first for how the format works. Most producers
need that page and their shape's, and come here for a field they have to get exactly right.

## Top-Level CBOR Document

The bundle is a CBOR array of two elements. There is no format or version field: the application tag identifies the
document, and from 1.0 [its major version](/specifications/universal-saves-format/#format-overview).

```text
[
  <header>,  // what this bundle is: identity, provenance, interpretation
  <parts>,   // the bytes: array of typed parts, numbered
]
```

### [0] Header (`map`)

Everything the bundle says about itself: which shape it is, which game and system, who produced it, and whatever a
parser or emulator attached. Keys are small unsigned integers, for a compact canonical encoding.

`shape` is the one key that is always required, because it says which document governs the bundle and therefore what
everything else means. The rest is best-effort context, so a save's header of nothing but a `shape` is valid and
describes a bundle whose parts are all a consumer knows about it. The other shapes each require a key of their own.

| Key | Name          | Type             | Req?          | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------- | ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `shape`       | text             | **yes**       | Which of `"save"`, `"state"`, `"screenshot"`, `"card"`, `"device"` or `"collection"` this bundle is, and so which document defines what its parts mean. Spec-owned: a producer **MUST NOT** mint one. See [Shapes](/specifications/universal-saves-format/#shapes).                                                                                                                                                                                        |
| 1   | `system`      | text             | on `"device"` | Required when `shape` is `"device"`, optional on a save, a state, a screenshot or a card, and forbidden on a collection. A [slug](/specifications/common-types/slug/) from the [System Registry](/registries/systems/) naming the system **these bytes are a save for**: the one that reads them natively, whatever happened to write them (`"gb"`, `"snes"`, `"n64"`, `"3ds"`, ...). The note below says why it sits beside `game` rather than inside it. |
| 2   | `game`        | map (hints)      | no            | Forbidden on a device and on a collection, which hold saves for many games rather than for one. Optional bag of game-identification clues. If absent, the bundle is _unidentified_, and a consumer stores it as-is and lets the user associate it later or uses other means (e.g. filename).                                                                                                                                                               |
| 3   | `source`      | map              | on `"state"`  | Who assembled the bundle, and the default source for every part. Required on a state, where it also says what the state loads into. See below.                                                                                                                                                                                                                                                                                                             |
| 4   | `card`        | map              | on `"card"`   | Required when `shape` is `"card"`, and forbidden otherwise. Carries the card's format, its capacity, and the bytes belonging to no save. See below.                                                                                                                                                                                                                                                                                                        |
| 5   | `description` | text             | no            | Free-form human-readable note about this bundle ("Right before the final boss", "100% completion run"). No length limit, though a list view shows only so much.                                                                                                                                                                                                                                                                                            |
| 6   | `bundled_at`  | CBOR tag 1 (int) | no            | When the bundle was assembled, in whole epoch seconds. Tag 1 also admits a float, which this format forbids; see [One encoding per bundle](/specifications/universal-saves-format/#one-encoding-per-bundle).                                                                                                                                                                                                                                               |
| 7   | `taken_at`    | CBOR tag 1 (int) | no            | On a state or a screenshot only: when it was taken, in whole epoch seconds. Not `bundled_at`, which can come long after.                                                                                                                                                                                                                                                                                                                                   |
| 8   | `taken_with`  | map              | no            | On a state only: what it was taken with, where that bears on loading it anywhere else. See below.                                                                                                                                                                                                                                                                                                                                                          |
| 9   | `origin`      | text             | no            | On a state only: `"auto"` or `"undo"`, for a state the emulator made rather than the player. Absent means the player made it. A spec-owned [slug](/specifications/common-types/slug/); see [States](/specifications/states/#origin).                                                                                                                                                                                                                       |

What a bundle's parts mean follows from its `shape`, and each shape has a document of its own that says so:

- A [save](/specifications/saves/) carries one game's in-game save.
- A [state](/specifications/states/) carries one save state, and at most one screenshot taken with it.
- A [screenshot](/specifications/screenshots/) carries one image of a game's screen.
- A [card](/specifications/cards/) carries one [`bundle` part](#nested-bundles) per save it holds.
- A [device](/specifications/device/) carries one `bundle` part per component of a console's storage.
- A [collection](/specifications/collections/) carries one `bundle` part per entry, of any shape but a collection.

Everything else a bundle carries is named by a [part kind](#part-kinds).

That counts saves as the medium stored them, not as a player would. This format never looks inside a payload, so a game
that keeps several slots of its own in one blob is one save here. A Link to the Past holds three playthroughs in a
single 8 KB SRAM image, and splitting them would mean parsing a format per game.

#### Two systems, and what each answers

A bundle can carry the word `system` twice, and the two are not the same field.

The header's [`system`](#0-header-map) is **what will load these bytes**, never what wrote them. The two come apart on
real hardware. An N64 Transfer Pak lets Pokemon Stadium write a Game Boy cartridge's SRAM, and that is a `gb` save
whatever produced it. It is a property of the medium rather than of the reader. A `.vmp` virtual PS1 card on a PSP
memory stick is `psx`, and so is a PS1 card read through a PS2; the hosting platform is recorded in
[`source`](#source-map) instead. A consumer restoring a save reads this one.

[`game`](#game-hints-map)'s `system` is **which system's release these hints identify**. It is there because a title
alone does not settle it. Sonic Adventure is a Dreamcast game and a GameCube game, and a catalog handed only the title
cannot tell which. A consumer resolving the game against a catalog reads this one, and falls back to the header's where
it is absent.

They usually agree. Where they differ, neither is wrong and neither overrides the other: they answer different
questions, so a consumer picks by what it is doing rather than by precedence.

The header's `system` sits outside `game` because a card has a system and often no game at all, and because a part can
refine `game` but not `system`. Saves for several systems are several bundles in a
[collection](/specifications/collections/).

#### `game` (hints map)

A producer fills in as many clues as it has; a consumer matches with whatever its catalog can resolve. This spec fixes
no resolution order, because the hints answer different questions rather than the same one with different confidence:

- A `sha256` or `sha1` hash identifies one dump.
- `serial` identifies one release, which many dumps share.
- `crc32`, `rom_filename` and `title` narrow the field without settling it.
- `system` tells apart two releases that share a title.

A producer that wants the answer pinned rather than inferred emits `game_id`, which is what it is for. All keys are
optional.

| Key | Name           | Type              | Notes                                                                                                                                                    |
| --- | -------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `game_id`      | map (see below)   | Ids for this game in one or more catalogs, keyed by resolver name. Skips resolution at the consumer. If unsure, omit and use a hash or filename instead. |
| 1   | `rom_hashes`   | array (see below) | Any subset of known ROM hashes, each a tagged byte string.                                                                                               |
| 2   | `rom_filename` | text              | Original ROM filename or stem (`"pokemon_red.gb"`). Useful for filename- or normalized-name-based catalog lookup.                                        |
| 3   | `serial`       | text              | Per-system serial code from the ROM header: GBA `AGB-XXXX-USA`, DS `NTR-XXXX`, PS1 disc serial (`SLUS-00404`). Only a real serial belongs here.          |
| 4   | `title`        | text              | Best-known game title as a free string. Also where a title that is not a serial goes, such as the Game Boy header's title bytes.                         |
| 5   | `system`       | text              | A [slug](/specifications/common-types/slug/) naming the system whose release these hints identify. Not the header's `system`; see below.                 |

`game_id` is itself a map from resolver name to this game's id in that catalog
(`{"com.1retro": 1234, "com.mobygames": 5501}`). The resolver name is the catalog's domain in
[reverse-DNS form](/specifications/common-types/reverse-dns-name/), the same convention as extension keys: own the
domain and the name is yours, with no registry needed to avoid collisions. The id is an unsigned integer or a string,
whichever form the catalog publishes. A producer aligned with several catalogs records one entry per catalog. Consumers
MUST round-trip entries with unknown resolver names unchanged and skip them when matching. Known resolvers: `com.1retro`
(the 1retro catalog), `com.mobygames` (MobyGames game id), `org.hasheous` (Hasheous id), `org.mamedev` (MAME romset
short name, `"sf2ce"`). An arcade machine is identified this way rather than by `serial`, which is a code from a ROM
header and not a catalog's key. To list a new resolver here, open a PR against this spec; the listing is only for
discovery.

`rom_hashes` is an array of [hash values](/specifications/common-types/hash-value/), which is where the four algorithms,
their tags, their ordering and their comparison rules all live. A producer emits every hash it has already computed and
computes none it doesn't need: a consumer matching against a catalog only needs one hash the catalog also carries.

An N64 ROM circulates in three byte orders: big-endian as a `.z64` file holds it, in swapped 16-bit words as `.v64`, and
in reversed 32-bit words as `.n64`. Each order hashes differently, and No-Intro catalogs the big-endian one.

- A producer **MUST** hash an N64 ROM in big-endian order, whatever order the file it read keeps.

A 64DD disk's retail dump is 0x3DEC800 bytes, its blocks in [block order](/specifications/saves/#a-64dd-disk), and
No-Intro catalogs that form. MAME's image of the same disk is laid out another way.

- A producer **MUST** hash a 64DD disk in the form of its retail dump.

Some files put a header of their own in front of a ROM: an iNES or FDS header, a Lynx or Atari 7800 header, a copier's
512 bytes on a SNES ROM. The header describes the file rather than the cartridge, and No-Intro catalogs the ROM without
it.

- A producer **MUST** hash a ROM without any header a file format or a copier put in front of it.

`game` also takes [extension keys](/specifications/universal-saves-format/#extensions), flat beside its integer keys as
on the header and a part. That is where a clue goes that none of the six names, such as the revision byte a ROM header
carries beside its serial, which tells apart two releases that share one. A consumer matching against a catalog skips an
extension key it does not recognise, as it skips an unknown resolver in `game_id`, and round-trips it unchanged. A key
here describes the game and says nothing about this save, so two saves of one game still carry the same `game`. A clock
reading, or what a parser found in the payload, stays on the header or the part.

#### `source` (map)

Who produced the bytes. The same map attaches in two places. In the header (key 3) it names the producer that assembled
the bundle, and serves as the default source for every part. On a part (key 10) it names the producer of that part's
bytes, for bundles whose saves don't all come from the same place; a part without its own `source` inherits the
header's. Provenance belongs to each save, not just to the file around it: a bundle can hold one save read from a real
cartridge and another exported by an emulator, each carrying its own part-level `source`. All keys are optional.
Consumers use the map for display and provenance, never for game matching. They act on `utc_offset` to put a clock back,
and on a state's `core` or `app` to load it.

| Key | Name               | Type | Notes                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `device_kind`      | text | What kind of producer read the bytes. See vocabulary below.                                                                                                                                                                                                                                                                   |
| 1   | `fingerprint`      | text | Opaque stable identifier for the specific device or install, so two bundles can be traced to the same producer. SHOULD carry no personal information.                                                                                                                                                                         |
| 2   | `app`              | text | The producing software or device. Either a [slug](/specifications/common-types/slug/) from the [Apps registry](/registries/apps/) (`"retroarch"`), or, for a producer with no entry, a [reverse-DNS name](/specifications/common-types/reverse-dns-name/) it mints for itself (`"io.epilogue"`). See below for which applies. |
| 3   | `app_version`      | text | Version of `app`, in whatever scheme that app uses.                                                                                                                                                                                                                                                                           |
| 4   | `core`             | text | The emulator core `app` ran to produce the bytes, for an app that runs one. Either a slug from the [Emulator Cores registry](/registries/cores/) (`"mgba"`), or, for a core with no entry, a reverse-DNS name.                                                                                                                |
| 5   | `core_version`     | text | Version of `core`, in whatever scheme that core uses. A libretro core reports it as `library_version`.                                                                                                                                                                                                                        |
| 6   | `platform`         | text | The operating system or firmware `app` ran on: a handheld firmware such as muOS, or a general-purpose system such as Windows. Either a slug from the [Platforms registry](/registries/platforms/) (`"muos"`), or, for a platform with no entry, a reverse-DNS name.                                                           |
| 7   | `platform_version` | text | Version of `platform`, in whatever scheme that platform uses.                                                                                                                                                                                                                                                                 |
| 8   | `utc_offset`       | int  | Seconds east of UTC of the scale this producer's clock anchors are on, so an anchor minus this is the instant. Absent unless the producer knows that scale is not UTC. See [The scale of a clock's anchor](#the-scale-of-a-clocks-anchor).                                                                                    |

`platform`, `app` and `core` are three fields because each comes apart from the others.

One app runs many cores, and one core runs in many apps. RetroArch running mGBA is `app: "retroarch"` with
`core: "mgba"`. The same game played on RetroArch's Gambatte core differs only in `core` and `core_version`.

One app also ships on many platforms, and a firmware that ships an app is the platform rather than the app. RetroArch on
a handheld running muOS is `platform: "muos"` with `app: "retroarch"`. The same RetroArch on a desktop differs only in
`platform` and `platform_version`.

A device whose firmware loads cores itself, such as the Analogue Pocket, is the app, with no platform beneath it to
name. A standalone emulator is an app around an engine of its own, and names both: mGBA run on its own is `app: "mgba"`
with `core: "mgba"`. A producer that runs no core, such as a cartridge reader, a flashcart or a service, leaves `core`
out. It has no slug to take in the Apps registry either, so it names itself in reverse-DNS.

Which arm applies is not a preference, and the rule is the same for all three fields. A field naming software its
registry lists **MUST** hold that slug. A field naming software with no entry **MUST** hold a reverse-DNS name that
software's owner minted, or be left out. Each piece of software has exactly one spelling either way: RetroArch is
`retroarch` because it is listed, never `com.libretro.retroarch`, and mGBA is `mgba` in both fields, never `io.mgba`,
though both hold their domains. Left to taste, two producers would describe one piece of software two ways, and `source`
sits in the header where that changes the [content hash](#content-hash).

The slug is also the string a consumer already has. A core's slug derives mechanically from the `saves/<core>/` folder
it writes to. The app is whichever install that folder sits in, and the platform is whatever that install runs on.

That matters because most of `source` names somebody else's software. An app names the core it ran and the platform
beneath it, and a tool reporting saves it found on someone's muOS handheld names all three. Minting a reverse-DNS name
on behalf of muOS, RetroArch or a core would claim a name in a namespace the producer does not hold. So when the
software has no entry and the producer does not own it, the producer leaves that field out rather than mint a name.
Shipping the software does not make the producer its owner: Provenance runs its own build of PokeMini, which has no
entry, so a save from that build carries no `core`.

A producer that writes a reverse-DNS name and is later listed switches to the slug. Bundles written before keep the name
they were written with and round-trip unchanged, the same way an [`x` name](/registries/vendors/) stays assigned after a
vendor acquires a domain.

##### The scale of a clock's anchor

A [clock chip key](/specifications/extensions/x.1sav.rtc/#chip-keys) carries an anchor: the producer's clock when it
took the chip's registers. That clock is the producer's, and need not run on UTC. MiSTer hands nearly every core local
standard time counted as though it were UTC, so a MiSTer in Pacific time stamps a Game Boy save eight hours behind the
instant, in summer as in winter. An emulator advances the chip from the anchor by its own clock, so a clock moved
between two producers on different scales gains or loses the difference.

`utc_offset` closes that gap, in seconds east of UTC, in the range real zones occupy, -12:00 through +14:00. A producer
whose anchors are not on UTC **SHOULD** carry it when it knows the offset. A tool running on a MiSTer knows it from the
device's own zone. Absent means the anchors are taken as UTC, so zero is never written.

- A producer **MUST NOT** write `utc_offset` for a scale it does not know.
- A producer **MUST NOT** write `utc_offset` for anchors on UTC, which is nearly every emulator.

A consumer rebuilding a clock for a producer on another scale moves the anchor by the difference between the two
offsets. One rebuilding it for a producer on the same scale changes nothing, so a MiSTer's file goes back to a MiSTer
byte for byte. The offset is a fact about the producer, which is why it sits here and not in each chip key: every anchor
a producer writes is on the same scale.

`device_kind` values. The list is spec-owned, so a new category comes from a PR against this spec rather than from a
producer. `app`, `core` and `platform` above are the opposite case: they name somebody's software, so its owner mints a
name where the registry has none.

| Value              | Meaning                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `console`          | Real console hardware writing its own save: a PS2 to its memory card, an N64 to a Transfer Pak cartridge. |
| `emulator`         | A software emulator or emulator front-end.                                                                |
| `cartridge-reader` | Hardware that reads a physical cartridge or memory card (Epilogue GB Operator, GBxCart RW, Sanni reader). |
| `flashcart`        | A flash cartridge that carries saves on real hardware (EverDrive, EZ-Flash).                              |
| `service`          | A server-side producer, such as a sync or conversion service.                                             |

#### `card` (map)

Present when the bundle _is_ a memory card. Its saves are then the bundle's [`bundle` parts](#nested-bundles), one per
save, each carrying that save's directory entry. A file or directory on the card that belongs to no game is a
[`system` part](#part-kinds) instead. Everything hardware-specific about cards is in
[Memory Cards](/specifications/memory-cards/): what each format fixes, what a writer has to regenerate, and what
splitting a card drops.

| Key | Name          | Type | Req? | Notes                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------- | ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | `format`      | text | yes  | `ps1-mc` \| `ps2-mc` \| `n64-cpak` \| `gc-mc` \| `neogeo-mc` \| `vmu` \| `saturn-bup`. A spec-owned [slug](/specifications/common-types/slug/); a new format comes from a PR against this spec. A consumer that does not recognise one **MUST NOT** attempt to write the card, since it cannot rebuild what it cannot read. It round-trips the bundle. |
| 1   | `capacity`    | uint | yes  | The size of the card's **data area** in bytes, the blocks the filesystem keeps for itself included and any out-of-band area excluded. Neither the room left for saves nor the length of a dump, which a [`card-image`](#part-kinds)'s payload gives by its own length. See [Capacity](/specifications/memory-cards/#capacity-and-out-of-band-bytes).   |
| 2   | `system_area` | bstr | no   | The card-level bytes that belong to no save, verbatim and opaque: bytes at a fixed place on the medium, such as a pak's label. A whole file or directory belonging to no game is a [`system` part](#part-kinds) instead.                                                                                                                               |

`format` and [`system`](#0-header-map) answer different questions. `system` decides which emulators can load these bytes
at all. `format` decides how they are laid out: it fixes the length of each save's `dirent` and the size of a block, and
selects which rebuild rules apply. Both are properties of the medium rather than of the reader, for the reason
[`system`](#two-systems-and-what-each-answers) gives, so a PS1 card read through a PS2 is `system: "psx"` and
`format: "ps1-mc"` at once.

#### `taken_with` (map)

What a [state](/specifications/states/) was taken with, where that bears on loading it anywhere else. The map is
optional, and so is every key in it. A key is null where the producer does not know the value, and absent where the
value does not apply. A producer that records none of it leaves the map out. The map takes
[extension keys](/specifications/universal-saves-format/#extensions), as the header does, for a condition none of its
keys names.

| Key | Name             | Type | Notes                                                                                                                                                                                                                                   |
| --- | ---------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `byte_order`     | text | `"little"` or `"big"`: the host's. Absent where the core's states do not depend on it.                                                                                                                                                  |
| 1   | `word_size`      | uint | `32` or `64`: the host's, in bits. Absent where the core's states do not depend on it.                                                                                                                                                  |
| 2   | `firmware`       | map  | Each file the machine booted, keyed by the path the core loads it from, to its [hash values](/specifications/common-types/hash-value/). A key follows the rules of a part's [`path`](#part-map). Absent where the core ran without one. |
| 3   | `language`       | text | The machine's language setting, as a BCP 47 tag: `"ja"`, `"en-US"`, `"zh-Hans"`. Absent where the system has no such setting.                                                                                                           |
| 4   | `options`        | map  | The core's options, text to text, under the names the core gives them.                                                                                                                                                                  |
| 5   | `format_version` | uint | The version the emulator stamps on its states outside the core's data, as DuckStation does in its file's header. Absent where the version sits inside the data, where the state part already carries it.                                |

A language tag is written in the case [BCP 47](https://www.rfc-editor.org/rfc/rfc5646#section-2.1.1) gives it. The
language is in lower case, a script in title case and a region in upper case. So one setting has one spelling. The tag
stops at the region, which is as far as any console's language setting goes.

### [1] Parts (`array of Part`)

A bundle holds at least one part. There is no upper limit. Most bundles hold a handful, but a producer that splits a
memory card into one part per save legitimately reaches into the dozens.

Decoders MAY reject a bundle with more parts than they are willing to handle. Decoders SHOULD NOT size any buffer from
the array's declared count before reading that many parts. The count costs an attacker nothing to inflate.

#### Part kinds

A part's `kind` (key 1) says what its bytes are. It is absent on the common case:

| Kind         | Notes                                                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(absent)_   | `save`: an in-game save. The vast majority of parts are save data, so the common case carries no kind at all.                                                                                                                                                                       |
| `state`      | A save state's own data, as the core that took it loads it. Only in a [state](/specifications/states/), which holds exactly one; it names no `content_type`, since the data has no media type.                                                                                      |
| `screenshot` | An image of the game's screen. Only in a [state](/specifications/states/), which holds at most one, or as the one part of a [screenshot](/specifications/screenshots/). `content_type` is required and is `image/png` or `image/jpeg`.                                              |
| `card-image` | A complete memory-card image, kept whole instead of split into its saves (PS1 and PS2 memcards, N64 controller pak, GameCube memory card, Dreamcast VMU). Handled like a save; `content_type` optional, since these rarely have a registered type.                                  |
| `bundle`     | The payload is itself a complete `1SAV` bundle. This is how a card holds its saves. See [Nested bundles](#nested-bundles).                                                                                                                                                          |
| `system`     | A file or directory on a [card](/specifications/cards/) that belongs to the card or the console rather than to any game, such as a PS2's network settings. Only in a card. `path` is required and `game` is forbidden; see [System entries](/specifications/cards/#system-entries). |
| `aux`        | Opaque binary: the format carries it and never reads it. This is also where an unrecognized kind lands, so it is the handling every kind a consumer has not heard of falls back to. `content_type` SHOULD be set.                                                                   |

A `card-image` says the blob is a whole card rather than one game's save, so a consumer knows to stop reading the
bundle's `game` as a description of its contents. A `system` part says the same of itself: it belongs to no game, so a
header `game` does not describe it either, even on a card whose saves are all one game's.

A `state` part takes `slot` and no other optional key. A `screenshot` part takes `content_type` and no other. Each takes
extension keys, as every part does.

A producer MAY carry both: the image as a byte-exact archive of one physical card, and that card's saves as `bundle`
parts for portability. Keeping the image alongside the split saves is how a producer preserves what splitting drops; see
[`system_area`](#card-map).

`aux` is the escape hatch that keeps the vocabulary small. A producer with a blob the format has no name for carries it
as `aux` with a `content_type`, rather than minting a kind. A name that only describes the bytes changes nothing about
how a consumer handles them. And a consumer handles a minted kind it does not recognise as `aux` in the end anyway. Box
art and the container file a bundle was read from belong here. A screenshot has a kind of its own, because a consumer
shows it rather than carrying it.

##### Minting a kind

The seven above are this spec's [slugs](/specifications/common-types/slug/); a producer with a kind of its own takes a
[reverse-DNS name](/specifications/common-types/reverse-dns-name/) instead. A decoder handles a kind it does not
recognise as `aux`, and round-trips the part.

Mint sparingly, and only for a name that changes how a consumer has to **handle** the part. A name that merely describes
the bytes changes no behaviour, and describing the bytes is [`content_type`](#part-map)'s job.

#### Nested bundles

A `bundle` part's payload is a complete `1SAV` bundle, carried as an ordinary byte string. Nothing about the outer part
changes: `sha256` is the hash of those bytes, as it is for any other payload.

This is how a [card](/specifications/cards/) holds its saves, a [device](/specifications/device/) its components and a
[collection](/specifications/collections/) its entries, and each of those pages draws its own arrangement.

Grouping saves this way is structural rather than inferred, which matters because a card routinely holds several saves
for the same game, carrying byte-identical `game` maps that only their nesting, `slot` and `path` tell apart. See
[several saves for the same game](/specifications/memory-cards/#several-saves-for-the-same-game).

The rules a decoder enforces:

- **`sha256` is the inner bundle's identity.** A card is therefore a list of content hashes. That makes extracting a
  save a byte copy rather than a re-encode, and it lets two producers of the same save agree on what to call it.
- **A malformed nested bundle makes its holder malformed.** So a decoder that finds one
  [rejects the whole file](/specifications/universal-saves-format/#rejecting-a-malformed-bundle).
- **Nothing is inherited.** An inner bundle does not read `system`, `game` or `source` from the enclosing header. It
  means the same thing sliced out as it does in place, which is the entire point.
- **What a bundle may hold follows from its shape**, and decoders MUST enforce it. A
  [collection](/specifications/collections/) holds any shape but another collection. A [device](/specifications/device/)
  holds cards and saves, and a [card](/specifications/cards/) holds saves. A [save](/specifications/saves/), a
  [state](/specifications/states/) and a [screenshot](/specifications/screenshots/) hold no nested bundle at all.
  Nothing in that chain leads back to itself. So a decoder that checks each nested bundle against the shape of the one
  holding it terminates without counting levels. The depth is bounded without a limit being written down.
- **Which other parts sit beside them follows from the shape too.** A card's `bundle` parts sit beside its `system`,
  `card-image` and `aux` parts. A device and a collection hold nothing but `bundle` parts.
- **The outer `game` and `system` are an index.** They repeat what the inner header says so a consumer can list a card's
  or a collection's contents from the head region without stepping into payloads. A copy equal to the holding header's
  `game` is left out, since absence already says it. Producers **SHOULD** keep the copies consistent. On a mismatch the
  inner header wins.
- **A `bundle` part names no `content_type`.** It is `application/vnd.1saves+cbor` by construction. It names no
  `binding` either, which belongs on the part holding the bound bytes inside.

These arrangements are required rather than conventional. A `bundle` part is what says that its payload is one save. A
producer **MUST NOT** flatten that boundary away.

A card, a device and a collection carry what is inside them as `bundle` parts. Every save such a bundle splits out
**MUST** be one of those `bundle` parts, not an ordinary part beside the container's own. Where such a save is itself
made of several files, those files **MUST** be parts of that save's own bundle. They **MUST NOT** be parts of the
container's. What a card holds that is no game's save is not a `bundle` part at all: it is a
[`system` part](#part-kinds).

A producer holding only a byte-exact dump carries a [`card-image`](#part-kinds) and splits out no saves at all. That is
a different thing from flattening one.

A card holds no ordinary save part, so a decoder sees a save flattened into a card. It cannot see one flattened into a
save: three files of one save and three saves of one card are the same shape there. A save flattened into its container
has no bundle to hash, and so no [content hash](#content-hash) to carry, slice out or compare against a copy.

#### `Part` (map)

| Key | Name           | Type        | Req? | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------- | ----------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | `id`           | uint        | yes  | Stable numeric identifier within the bundle, any CBOR unsigned integer, unique among its parts. `id` is what an extension key names when it needs to point at one particular part. See below.                                                                                                                                                                                                                                          |
| 1   | `kind`         | text        | no   | What this part's bytes are. Absent means `save`. See [Part kinds](#part-kinds).                                                                                                                                                                                                                                                                                                                                                        |
| 2   | `role`         | text        | no   | Which socket these bytes came out of, not what medium they are on: a controller pak is a card that lives in a controller. Absent means `"primary"`, the only socket or the principal one. A [slug](/specifications/common-types/slug/) from the [Save Roles registry](/registries/roles/), which grows by a PR. A role a consumer does not recognise is handled as [Slug](/specifications/common-types/slug/#an-unfamiliar-slug) says. |
| 3   | `path`         | text        | no   | Where these bytes sat in the container they came from, as a relative path. Absent when the role is the whole address. On a card's [`bundle`](#nested-bundles) part, the name the card's directory holds for that save, which is what tells two saves of one game apart. On a [`system`](#part-kinds) part, which requires it, where the entry sits on the card. See below.                                                             |
| 4   | `slot`         | uint        | no   | The index this part occupied in whatever container it came out of: a card's directory slot, an emulator's save-state slot. Display order, not an address. A writer that packs the parts into different slots has not done anything wrong.                                                                                                                                                                                              |
| 5   | `dirent`       | byte string | no   | That container's own directory entry for this part, verbatim. Fully opaque: this spec never says what a byte inside it means, which is what keeps a card-format parser out of the container. Its length is fixed by the container's format; see below.                                                                                                                                                                                 |
| 6   | `content_type` | text        | no   | Media type of the payload. A `screenshot` requires it and a `state` has none to name. For any other [kind](#part-kinds) it is optional. It is the only place the format says what a blob is, so set it whenever there is a registered type to name.                                                                                                                                                                                    |
| 9   | `sha256`       | tagged bstr | yes  | SHA-256 over the payload, as a [hash value](/specifications/common-types/hash-value/): 32 bytes under tag `18540`. Only that tag is legal, so identity and dedup have one answer; the tag is there so a generic CBOR tool can name the digest without knowing this format.                                                                                                                                                             |
| 10  | `source`       | map         | no   | Who produced this part's bytes, when that differs from the bundle's [`source`](#source-map). Same shape as the header map, and it replaces the header's whole rather than merging with it. Absent means the header's source applies.                                                                                                                                                                                                   |
| 11  | `game`         | map         | no   | Which game this part's bytes belong to, when that differs from the bundle's [`game`](#game-hints-map). Same shape as the header map, and it replaces the header's whole rather than merging with it. Absent means the header's game applies, except on a `system` or `card-image` part, which belongs to no game. A `system` or `card-image` part **MUST NOT** carry one.                                                              |
| 12  | `system`       | text        | no   | [Index copy](#nested-bundles) of a nested bundle's [`system`](#0-header-map). Only on a `bundle` part.                                                                                                                                                                                                                                                                                                                                 |
| 13  | `binding`      | text        | no   | Present when this payload is bound to the console, account or medium it came from, so it will not restore anywhere else. `device` \| `account` \| `device-account` \| `medium`. A spec-owned [slug](/specifications/common-types/slug/); a new one comes from a PR against this spec. Absent means the bytes are portable. See [Bound payloads](#bound-payloads).                                                                      |
| 14  | `bound_to`     | map         | no   | What a bound payload is bound to: the console, the account or the medium, each by the identifier its system binds the bytes with. Only beside `binding`. See [Bound payloads](#bound-payloads).                                                                                                                                                                                                                                        |
| -1  | `payload`      | bstr        | yes  | The payload bytes. Negative, so the whole unsigned range stays free for later versions; see [Additive integer keys](/specifications/universal-saves-format/#additive-integer-keys).                                                                                                                                                                                                                                                    |

- Parts **MUST** sit in strictly ascending `id` order, so no two share one.
- A decoder **MUST** reject a part whose `sha256` is not the SHA-256 of its payload.
- A `path` **MUST NOT** begin or end with `/`, or hold an empty, `.` or `..` segment.

`/` is the one separator in a `path`, and a path runs to at most 512 bytes. A producer editing a bundle keeps each
part's `id`, and gives a removed part's `id` to no new one, so a stored reference dangles rather than pointing at
something else.

A `dirent`'s length is fixed by the [`format`](#card-map) of the card it came from, on every format. That holds on a
card's own parts and on the parts of a save nested in that card. `saturn-bup` keeps its entry at the head of the save's
own first block rather than in a directory region, which changes where a reader finds those bytes and not whether they
can be carried. A save sliced off its card names no format, and its parts' entries are carried unchecked.

Two limits are worth knowing. The payload lands after every unsigned key because it sits at
[-1](/specifications/universal-saves-format/#additive-integer-keys) and not because of where the others are numbered, so
that property survives any later assignment. And extension keys are text, which sorts after `-1`, so a producer's own
data arrives _after_ the bytes it describes. Anything a consumer needs in order to read the payload belongs in an
integer key rather than an extension. [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) is not that: the bytes read
the same without it, and a decoder checks their length against the chip once both have arrived.

`slot` and `dirent` describe a part's place in the container it came from, and they apply at both nesting levels. On a
card's [`bundle`](#nested-bundles) part they carry the save's own directory entry. Inside that nested bundle they carry
each file's. A PS2 save needs both levels, since it is a directory with an entry of its own and an entry per file.

A part's `game` refines the header's exactly as its `source` does, and for the same reason: identity belongs to each
save, not only to the file around it. A bundle holding a memory card whose saves span several titles leaves the header's
`game` absent, because none of them describes the card, and each `bundle` part names its own. A card whose saves are all
for one game may name it in the header instead, and that is the honest answer to "what is this card"; see
[a card of one game](/specifications/memory-cards/#a-card-of-one-game).

Whether the parts then repeat it is the [index copy](#nested-bundles) question, not an identity question.

- Two parts of one kind in one bundle **MUST NOT** agree on `role`, `path` and `slot` together.

Those three are how a consumer names a part to a user and matches it against a target, so two parts a consumer cannot
tell apart is a bundle it cannot act on. Parts of different [kinds](#part-kinds) never clash, so a state part and its
screenshot carry no `role` or `path`. Where a container allows duplicate names, the producer **MUST** carry `slot`. An
N64 controller pak permits two notes with the same game code and note name, and `slot` is what keeps them distinct.

Every part carries its bytes inline and uncompressed, so a bundle always works on its own. Keys 7 and 8 are
[retired](/specifications/universal-saves-format/#additive-integer-keys).

#### Byte order

A part that holds a medium's bytes holds them in the order the console's hardware addresses them. That covers a `save`
part, a `card-image` and a `system` part. Memory the console addresses a byte at a time, which is most save memory,
keeps that order whatever its words are: on a 68000 that puts each word's high byte first, because the 68000 keeps it at
the lower address. Some media are addressed only in whole words, and the hardware gives their bytes no order. There the
order is this spec's to choose, and like [every order it chooses](/specifications/universal-saves-format/#byte-order) it
is most significant byte first, network order. That is also the order a serial EEPROM shifts a word out in, a bit at a
time. A Game Boy MBC7's 93LC56 sends each 16-bit word high bit first, so its payload holds each word's high byte first,
though the CPU reading it is little-endian; a GBA's EEPROM is the same, eight bytes at a time. Most significant byte
first reads the same whatever width the words are taken to be, so this spec names none.

- A producer **MUST** put a payload's bytes in that order where the file it read keeps another. SameBoy, Gearboy and
  Epilogue's GB Operator keep an MBC7's words least significant byte first, and SkyEmu keeps a GBA EEPROM's eight-byte
  blocks back to front.
- The order is the medium's, never the game's. A game that writes a little-endian number into memory addressed a byte at
  a time has written bytes, and they stay as it wrote them.

The payload is the medium's bytes and nothing else. Much of a Mega Drive cartridge's SRAM sits on the odd byte lane of
the 16-bit bus alone, so its bytes are every other address. Genesis Plus GX, PicoDrive, clownmdemu and the Mega
EverDrive keep a copy of the whole address window, with the even lane filled; MiSTer and BlastEm keep the SRAM's bytes
one after another, and the payload is those. The Mega EverDrive PRO maps the window straight onto its memory, so a game
whose SRAM is 16 bits wide keeps both lanes there, and the payload is both. A file can also pad a chip out: gpSP pads
every GBA save to 128 KiB, and VBA Next keeps an EEPROM 128 KiB into its file. The payload is the chip.

- A producer **MUST NOT** carry another lane's bytes, or a file's padding, in a payload where it can tell them from the
  medium's. It tells them apart by the cartridge, as its header declares it, or by a layout only one reading fits.
- A consumer writing a file for such a tool lays the payload out the way that tool keeps it, and pads it the way that
  tool pads it. MiSTer's GBA core reads a 4 Kbit EEPROM only from a file of 8 KiB, which is the size it writes. The
  EverDrive GBA writes the chip's 512 bytes.

Some tools keep save memory in their host's order instead, and [MiSTer's NeoGeo core](/specifications/device/#parts) is
one. mupen64plus and Project64 keep an N64 cartridge's SRAM and FlashRAM that way, and
[`x.1sav.n64`](/specifications/extensions/x.1sav.n64/) gives the form each of its chips takes. A consumer rebuilding
such a tool's file puts the bytes back in the file's order. A `state` part follows a rule of its own: it is the core's
data as the core loads it, in the order [`taken_with`](#taken_with-map) records.

#### Bound payloads

Every console from roughly the Wii onward encrypts or signs its saves against the hardware that wrote them, binding the
bytes to it. A Wii `data.bin` is bound by the console's per-unit key. 3DS savedata and extdata on the SD card are
encrypted under a key derived from `movable.sed`, which is console-unique. PS3 and Vita saves are signed per console and
often per account.

A save can also be bound to the thing carrying it rather than to any console. An amiibo is a few hundred bytes on an NFC
tag, signed against that tag's own serial. Any console can write one and the result stays valid, but a copy on a second
tag does not. Skylanders and Disney Infinity figures work the same way. Those are `medium`, and the field is worth
having for them precisely because nothing else in the part would say the bytes are stuck where they are.

Every other field in such a part reads as an ordinary save, so without `binding` a consumer would offer the file to
another console and the restore would fail or corrupt. Its presence is what a consumer acts on; the value only names
what the payload is bound to, so a consumer that has never seen the value still knows not to treat it as portable.

| Value            | Bound to                                                                       | `bound_to` keys |
| ---------------- | ------------------------------------------------------------------------------ | --------------- |
| `device`         | The console that wrote it.                                                     | 0               |
| `account`        | The user account that wrote it, whatever console it runs on.                   | 1               |
| `device-account` | Both, which is the strictest and the most common on modern consoles.           | 0 and 1         |
| `medium`         | The physical thing carrying the bytes, whatever console or account wrote them. | 2               |

`bound_to` names what the payload is bound to, so a consumer can tell the one target that will accept it.

| Key | Name      | Type | Notes                                                     |
| --- | --------- | ---- | --------------------------------------------------------- |
| 0   | `device`  | bstr | The console's identifier, such as a Wii's console ID.     |
| 1   | `account` | bstr | The account's identifier, such as a PSN account ID.       |
| 2   | `medium`  | bstr | The medium's identifier, such as an amiibo tag's NFC UID. |

Each is the identifier the system binds the bytes with, in the bytes the system stores it as. A consumer compares one
byte for byte against its target's and reads nothing else into it.

The rules:

- A producer that knows the bytes it read are bound **MUST** set `binding`.
- A producer that cannot tell **MUST NOT** set `binding`. Absent means no producer knew the bytes to be bound.
- Bytes that merely _mention_ where they live are not bound. A GameCube save for Phantasy Star Online carries the
  destination card's flash serial and a checksum over it. A writer re-signs both on every copy, so the save is portable.
  A producer **MUST NOT** set `binding` on it. The test is whether anything but the original can be made to accept it.
- A producer that sets `binding` **SHOULD** carry each identifier the table gives for its value, where it knows them.
- A producer **MUST NOT** carry an identifier the table does not give for its `binding`, or `bound_to` without
  `binding`.
- A consumer **MUST NOT** present a bound payload as restorable to a target `bound_to` does not name. Where `bound_to`
  is absent it names none.
- A consumer **MUST** still store, sync, hash and round-trip a bound payload like any other part.
- `binding` belongs on the part holding the bound bytes. On a card, that is a part inside the nested bundle, not the
  `bundle` part wrapping it.

Two consoles writing the same save produce different bound bytes, so they produce different `sha256` values and
different [content hashes](#content-hash). Bound saves do not deduplicate across devices, and cannot.

### Layout consequences

The two-element shape pins `parts` to position [1], which encodes after the header [0]. That is the whole of the layout
this format guarantees. Where a key sits inside a part is not part of that guarantee. `payload` at [-1](#part-map) does
sort after every unsigned key, so a blob lands after its part's integer keys in practice, but nothing may depend on
that.

- **Cheap identification**: the header occupies a small head region (typically <2 KiB), so a consumer that only needs to
  know what a bundle is reads the front and stops. Listing what a card or a
  [collection](/specifications/universal-saves-format/#shapes) _holds_ is a different read: entry two sits behind entry
  one's blob, so a consumer walks the parts and skips each payload by its length prefix. That is a handful of seeks
  rather than a decode, and it never touches a nested bundle's bytes.
- **Cheap header rewrites**: changing the header re-encodes the head region only. Part bytes shift by the size delta,
  but none of their content changes, so a producer rewriting the header copies them through without re-encoding or
  re-hashing anything.
- **Appending a part**: parts sort by ascending `id`, so a new one with a higher `id` goes last. An encoder updates the
  array's count and appends, without touching a byte of any existing part.
- **Payloads are contiguous and length-prefixed**: every payload is a definite-length byte string at a known offset. A
  decoder can mmap the file and hand out payload slices without copying, and never has to hold a blob in memory to parse
  the parts around it.
- **In-place blob streaming on encode**: an encoder can serialize the head, then stream each part's bytes directly into
  the output without holding them in memory.

### Content hash

A bundle's **content hash** is the SHA-256 of its bytes: the bundle tag and the array, as encoded. A bundle has
[one encoding](/specifications/universal-saves-format/#one-encoding-per-bundle), so the hash is a pure function of what
it says. Two producers that build the same bundle, part for part and `id` for `id`, agree on it. It is what an integrity
check compares, the identifier a content-addressable store keys on, and the value a [`bundle`](#nested-bundles) part's
`sha256` holds.

#### What a content hash does not answer

A content hash is over bytes, and identical bytes are a stronger claim than identical save. Two honest dumps of one
cartridge can still differ where a producer cannot tell a file's padding from the chip. Two consoles produce different
[bound](#bound-payloads) bytes for the same progress. So one save can arrive under two content hashes.

The format fixes a payload's [byte order](#byte-order), keeps it to the medium's bytes, and gives an N64 cartridge's
[normal form](/specifications/extensions/x.1sav.n64/#the-payload) and a
[64DD disk's](/specifications/saves/#a-64dd-disk) RAM area. Beyond those it has no canonical byte form for a save and
does not try to acquire one. Deciding that a 64 KB dump and its 32 KB half are the same save takes exactly the
per-system parsing this container keeps out. The content hash answers "are these the same bytes", which is what a store
needs to deduplicate safely. A producer that wants "is this the same playthrough" builds that on top.

## Appendix A: CDDL schema

A [CDDL](https://www.rfc-editor.org/rfc/rfc8610) (RFC 8610) schema describes a bundle. It lives in
[`universal-saves-format.cddl`](https://github.com/one-retro/docs/blob/main/src/content/docs/specifications/universal-saves-format.cddl),
the single source of truth that validators such as `cddl` and `cuddle` consume directly. The
[rendered copy](/specifications/universal-saves-format-cddl/) carries it alongside the list of what a schema can and
cannot check here.
