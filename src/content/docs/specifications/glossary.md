---
title: Glossary
description: The terms these specifications use, and where each one is actually defined.
---

These specifications use a small vocabulary precisely. `bundle` and `save` are not synonyms, a `save` is not a `state`,
and a `part` is not a file. A `producer` is not a `consumer`, and a `writer` is one particular consumer. Most normative
rules are addressed to one of them.

Non-normative. Each entry points at the text that defines the term, and that text wins on a disagreement.

## Containers

- **Bundle.** A complete `1SAV` document: the tag, the header and the array of parts. What a bundle _represents_ is
  whatever its header says, so the word alone does not say whether you hold one save, one card or a collection. It is
  the format's atomic unit and [means the same thing sliced out](/specifications/bundle/#nested-bundles) as in place.
- **Part.** One addressed entry inside a bundle, and not the atomic unit. Its
  [`kind`, `role` and `path`](/specifications/bundle/#part-map) fall back to defaults, and its `source` and `game` fall
  back to the header. So a part lifted out of its bundle loses most of what it meant.
- **Nested bundle.** A complete bundle carried as a part's payload. This is how a card holds its saves and a collection
  holds its cards. See [Nested bundles](/specifications/bundle/#nested-bundles).
- **`bundle` part.** The part carrying a nested bundle, whose `sha256` is that bundle's content hash. Several extension
  keys turn on whether a part is this kind rather than an ordinary one.
- **Shape.** Which of `save`, `state`, `screenshot`, `card`, `device` or `collection` a bundle is, carried in the header
  and never inferred. Each has a document of its own, and the vocabulary is closed.
- **Save.** An in-game save: what a game wrote to its medium, be that battery-backed RAM, flash, a memory card or a
  console's own storage. Also the [`save` shape](/specifications/saves/). Inside a card, a save is a nested bundle
  rather than a part.
- **State.** A save state: an emulator's snapshot of the whole machine at one moment, which only the core that took it
  loads. Also the [`state` shape](/specifications/states/).
- **Screenshot.** An image of a game's screen. A state carries one as a `screenshot` part, and the
  [`screenshot` shape](/specifications/screenshots/) carries one on its own.
- **Card.** The [`card` shape](/specifications/cards/): one memory card, its saves nested one per part. The
  [`card` map](/specifications/bundle/#card-map) is required on it and forbidden elsewhere.
- **Device.** The [`device` shape](/specifications/device/): one console's storage read whole, its components nested one
  per part and told apart by `role`. At least one component is not a removable card. `system` is required, which is what
  separates it from a collection.
- **Collection.** The [`collection` shape](/specifications/collections/): every part a `bundle` part, and no `system`,
  `game` or `card` of its own. It is how one file spans systems.
- **Containment.** Which shapes a bundle may hold, which follows from its own. A collection holds any shape but a
  collection, a device holds cards and saves, and a card holds saves. A save, a state and a screenshot hold nothing
  nested. The chain never leads back to itself, so what a file holds bounds how deep it goes.

`save` and `state` never stand for each other. Where a sentence needs both, or could be read either way, it uses the
long forms: in-game save and save state.

## Addressing a part

- **Kind.** What a part's bytes are: absent for a save, or
  [`state`, `screenshot`, `bundle`, `system`, `card-image` or `aux`](/specifications/bundle/#part-kinds).
- **Role.** Which socket the bytes came out of, not what medium they are on. A controller pak is a card that lives in a
  controller. Names come from the [Save Roles registry](/registries/roles/).
- **Path.** Where the bytes sat in the container they came from, as a relative path. On a card's `bundle` part it is the
  name the card's directory holds, which is what tells two saves of one game apart. On a `system` part it is required,
  and says where on the card the entry sits.
- **Slot.** A part's index in the container it came from: a card's directory slot, or an emulator's state slot. It is
  required where a container lets two entries share a name.
- **`dirent`.** The container's directory entry for a part, carried verbatim as bytes. The format never says what a byte
  in one means: it is input for a writer, not a description of the save.
- **Index copy.** A value repeated on an outer part so a consumer can list a container without stepping into payloads.
  The inner header is authoritative and [wins on a mismatch](/specifications/bundle/#nested-bundles).

`role`, `path` and `slot` together are [how a consumer names a part](/specifications/bundle/#part-map). No two parts of
one kind in a bundle agree on all three.

## Who does what

Most normative rules name one of these, and which one is the whole meaning of the rule.

- **Producer.** Whatever built the bundle: the emulator, card reader or tool that read a save off something and wrote it
  down. Rules about what a bundle may claim are addressed to a producer.
- **Consumer.** Anything that reads a bundle. A consumer is never assumed to know any card format's internals, which is
  what the per-format [extension keys](/specifications/extensions/) are for.
- **Decoder.** The part of a consumer that turns a file into a bundle, and decides whether it is malformed.
- **Encoder.** The part of a producer that turns a bundle into a file.
- **Writer.** A consumer that puts saves back onto real media. A writer
  [regenerates everything structural](/specifications/memory-cards/#what-a-writer-regenerates), block chains, allocation
  tables, checksums and directory ordering, rather than reading it out of the bundle.

## Payloads and integrity

- **Content hash.** The SHA-256 of a bundle's bytes. A bundle has one encoding, so it is a pure function of what the
  bundle says, and a nested save's identity. See [Content hash](/specifications/bundle/#content-hash).
- **Normal form.** How an N64 cartridge's save memory sits in a payload: the whole chip, in the order the console reads
  it. See [`x.1sav.n64`](/specifications/extensions/x.1sav.n64/#the-payload).
- **Bound payload.** A payload tied to the console, account or medium it came from, which a consumer
  [must not present as restorable](/specifications/bundle/#bound-payloads) anywhere else.
- **Malformed.** A bundle that breaks a rule of these specifications, at any depth. A decoder
  [rejects the whole file](/specifications/universal-saves-format/#rejecting-a-malformed-bundle). A bundle carrying
  something a later version defines is not malformed.

## Cards

- **Block.** The unit a card allocates in, fixed per format alongside the length of a `dirent`. See
  [Per-format facts](/specifications/memory-cards/#per-format-facts).
- **Capacity.** The size of a card's data area, which is neither the room left for saves nor the length of a dump. See
  [Capacity](/specifications/memory-cards/#capacity-and-out-of-band-bytes).
- **System area.** Bytes at a fixed place on a card that belong to no save, carried on the `card` map rather than on any
  part.
- **System entry.** A file or directory on a card that belongs to the card or the console rather than to any game,
  carried as a [`system` part](/specifications/cards/#system-entries).

## Names

- **Extension key.** A [reverse-DNS](/specifications/common-types/reverse-dns-name/) text key on a header, a part, a
  `game` map or a state's `taken_with`, carrying what the core format does not define. See
  [Extensions](/specifications/universal-saves-format/#extensions).
- **The `x` tree.** [Names](/specifications/common-types/reverse-dns-name/#the-x-tree) for values that belong to no
  single producer, which these specifications define.
- **Reserved name.** A [Vendor Names](/registries/vendors/) entry that belongs to nobody, which is what lets these
  specifications define keys under it and own their schemas.
- **Minting a name.** Coining a [reverse-DNS name](/specifications/common-types/reverse-dns-name/) for a field that is
  the producer's own to name, such as a part's `kind` or a source's `app`. A field holding a
  [slug](/specifications/common-types/slug/) is not minted into: its list grows by a PR against the spec or a registry.
