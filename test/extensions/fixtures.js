// Fixtures for each extension key, checked against that key's own schema.
//
// An extension value is `any` to the bundle schema, so nothing here is caught
// by the format's own validator. That is the point: these keys are where a
// documented shape and its example can drift apart with nobody noticing.
//
// Each entry names the schema file it validates against, so adding a key means
// adding a `.cddl` beside its page and a block here.

import { Float, Tag, map } from "../cbor.js";

const DIR = "src/content/docs/specifications/extensions";
const pattern = (length, seed = 1) => Buffer.from(Array.from({ length }, (_, i) => (i * 31 + seed) & 0xff));

// The nybble chips carry one register per array element rather than bytes.
const nybbles = (length, seed = 1) => Array.from({ length }, (_, i) => (i * 7 + seed) & 0xf);
const only = (length, known) => Array.from({ length }, (_, i) => (known.includes(i) ? (i * 7 + 1) & 0xf : null));
// A TC8521 alarm block: registers 0, 1, 9 and C read zero, A is 1 for 24-hour
// mode and B the leap-year counter.
const alarm = [0, 0, 0, 3, 7, 1, 2, 2, 2, 0, 1, 2, 0];

// A GameCube entry with no addresses, with `changes` laid over it. A change to
// undefined drops that field.
const gcEntry = (changes = {}) => {
  const fields = { 0: Buffer.from("GFZE"), 1: Buffer.from("01"), 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 };
  for (const [k, v] of Object.entries(changes)) {
    if (v === undefined) delete fields[k];
    else fields[k] = v;
  }
  return map(fields);
};

// What an S-3511A latches at 2003-02-01 14:30:00, a Saturday, one BCD byte
// each: year since 2000, month, day, weekday, hour, minute, second. Bit 7 of
// the hour byte is PM, which the chip sets itself in 24-hour mode. The 12-hour
// form is the same moment, 2:30 PM.
const S3511A_24H = Buffer.from([0x03, 0x02, 0x01, 0x06, 0x94, 0x30, 0x00]);
const S3511A_12H = Buffer.from([0x03, 0x02, 0x01, 0x06, 0x82, 0x30, 0x00]);

export const extensions = {
  // Normative: these specifications own the shape, so the negatives here are
  // real conformance tests rather than documentation checks.
  "x.1sav.rtc": {
    schema: `${DIR}/x.1sav.rtc.cddl`,
    valid: {
      full: map({ 0: new Tag(1, 1044057600), 1: 500 }),
      // `accuracy_ms` is the only optional key: a producer with nothing useful
      // to say about uncertainty omits it rather than guessing a number.
      "without-accuracy": map({ 0: new Tag(1, 1044057600) }),
    },
    invalid: {
      // The reading is the whole of what this key carries, so it is required.
      "without-reading": map({ 1: 500 }),
      // Whole seconds only, for the reason `bundled_at` gives: tag 1 admits a
      // float, and allowing it would give one reading two encodings.
      "reading-as-float": map({ 0: new Tag(1, new Float(1044057600.5)) }),
      // The reading is tagged. A bare integer could be anything.
      "reading-untagged": map({ 0: 1044057600 }),
      "accuracy-negative": map({ 0: new Tag(1, 1044057600), 1: -1 }),
      // Key 1 is the accuracy, a count of milliseconds. Which clock produced
      // the reading has no key here: the chip key beside this one says that,
      // and `source` says who read it.
      "source-clock-as-text": map({ 0: new Tag(1, 1044057600), 1: "gba-rtc" }),
      "unknown-key": map({ 0: new Tag(1, 1044057600), 2: "nope" }),
      "not-a-map": "1044057600",
    },
  },

  // What the card's directory records: the pair of times and nothing else. The
  // text and the picture are the save's, and sit on its own header.
  "x.1sav.dirent": {
    schema: `${DIR}/x.1sav.dirent.cddl`,
    valid: {
      // A PS2 entry dates the save and records the last write.
      both: map({ 0: [new Tag(1, 1044057600)], 1: [new Tag(1, 1044144000)] }),
      // A VMU entry has a creation time and no modify time; GameCube and
      // Saturn are the other way around. Each format carries the one it keeps,
      // and a GameCube clock has no zone, so the one-element form is the common
      // case rather than a degraded one.
      "created-only": map({ 0: [new Tag(1, 1044057600)] }),
      "modified-only": map({ 1: [new Tag(1, 1044144000)] }),
      // A PS2 keeps its directory times in a fixed +9 whatever the region, and
      // a producer that knows that says so on each reading.
      "with-offset": map({ 0: [new Tag(1, 1044057600), 32400], 1: [new Tag(1, 1044144000), 32400] }),
      // The case a single offset beside the pair could not express: created
      // under one offset and last written under another, which is any console
      // in a zone that keeps summer time.
      "offsets-differ": map({ 0: [new Tag(1, 1044057600), 3600], 1: [new Tag(1, 1058054400), 7200] }),
      // Knowing the zone of one reading is not knowing the zone of the other.
      "one-offset-known": map({ 0: [new Tag(1, 1044057600), 32400], 1: [new Tag(1, 1044144000)] }),
      // West of UTC, and the outer edges of the range real zones occupy.
      "negative-offset": map({ 0: [new Tag(1, 1044057600), -28800] }),
      "offset-min": map({ 0: [new Tag(1, 1044057600), -43200] }),
      "offset-max": map({ 0: [new Tag(1, 1044057600), 50400] }),
      // Zero is a claim rather than a default: this producer knows the console
      // was set to UTC, which is not the same as not knowing.
      "offset-zero": map({ 0: [new Tag(1, 1044057600), 0] }),
    },
    invalid: {
      // A producer holding neither time omits the key, so an empty map, which
      // would say nothing and still validate, is not one.
      empty: map({}),
      // The reading is an array even when it is alone, so the bare tagged form
      // a producer would reach for first is not a second way to write one.
      "time-not-an-array": map({ 0: new Tag(1, 1044057600) }),
      "time-array-empty": map({ 0: [] }),
      "time-array-overfull": map({ 0: [new Tag(1, 1044057600), 32400, 1] }),
      // Whole seconds, tagged, exactly as `x.1sav.rtc` carries a reading.
      "created-untagged": map({ 0: [1044057600] }),
      "modified-as-float": map({ 1: [new Tag(1, new Float(1044057600.5))] }),
      // The offset is a plain integer count of seconds east of UTC. Not text,
      // not a tagged time, and not a fraction, all of which a producer might
      // reach for and which would each read as a live value.
      "offset-as-text": map({ 1: [new Tag(1, 1044144000), "+09:00"] }),
      "offset-tagged": map({ 1: [new Tag(1, 1044144000), new Tag(1, 32400)] }),
      "offset-as-float": map({ 1: [new Tag(1, 1044144000), new Float(32400)] }),
      // Outside the span real zones occupy, which is what catches hours or
      // minutes mistaken for seconds once the number is large enough to land
      // out of range. The page is where the unit itself is stated.
      "offset-past-east-edge": map({ 1: [new Tag(1, 1044144000), 86400] }),
      "offset-past-west-edge": map({ 1: [new Tag(1, 1044144000), -86400] }),
      // The text is `x.1sav.label`'s. Carrying it here too would put one answer
      // in two places, able to disagree.
      "title-as-a-key": map({ 1: [new Tag(1, 1044144000)], 2: "F-ZERO GX" }),
      "not-a-map": 1044057600,
    },
  },

  // The write half of `x.1sav.dirent`: a GameCube entry as fields, named for
  // the card format it decomposes.
  "x.1sav.dirent.gc-mc": {
    schema: `${DIR}/x.1sav.dirent.gc-mc.cddl`,
    valid: {
      full: map({
        0: Buffer.from("GFZE"),
        1: Buffer.from("01"),
        2: pattern(12),
        3: 2,
        4: 5,
        5: 21,
        6: 4,
        7: 0,
        8: 0x2000,
        9: 0x40,
      }),
      // A save with neither pictures nor comments holds 0xffffffff in both
      // address fields, which this key says by leaving them out.
      "without-offsets": gcEntry(),
      // The highest address the entry can hold short of the one meaning none.
      "offset-max": gcEntry({ 8: 0xfffffffe }),
    },
    invalid: {
      // Every fixed field of the entry is present in the 64 bytes, so none of
      // them is optional here. Only the two addresses can be absent.
      "without-game-code": gcEntry({ 0: undefined }),
      "without-permissions": gcEntry({ 6: undefined }),
      // The identifiers are fixed-width on the card, so a value that is not
      // that width did not come off one.
      "game-code-too-short": gcEntry({ 0: Buffer.from("GFZ") }),
      "maker-code-too-long": gcEntry({ 1: Buffer.from("012") }),
      // The codes are bytes, as the entry holds them, even where a retail
      // game's happen to read as ASCII.
      "game-code-as-text": gcEntry({ 0: "GFZE" }),
      "maker-code-as-text": gcEntry({ 1: "01" }),
      // Bytes rather than text, because a Shift-JIS name does not round-trip
      // through `path`, which is UTF-8 by construction.
      "filename-as-text": gcEntry({ 2: "f-zero" }),
      "filename-empty": gcEntry({ 2: Buffer.alloc(0) }),
      "filename-too-long": gcEntry({ 2: pattern(33) }),
      // The packed fields are as wide as the entry makes them: one byte for
      // the flags and permissions, two for the icon format and speed.
      "permissions-too-wide": gcEntry({ 6: 256 }),
      "icon-format-too-wide": gcEntry({ 4: 65536 }),
      // 0xffffffff is how the entry says there is no address, and this key
      // says that by leaving the field out.
      "image-offset-none": gcEntry({ 8: 0xffffffff }),
      "comments-offset-none": gcEntry({ 9: 0xffffffff }),
      // The fields a writer owns are not carried: `modtime` is carried by
      // `x.1sav.dirent`, and the block fields are regenerated and derived.
      "modtime-as-a-key": gcEntry({ 10: 1044057600 }),
      "block-count-as-a-key": gcEntry({ 11: 3 }),
      "not-a-map": pattern(64),
    },
  },

  // The write half of `x.1sav.dirent` for a Controller Pak note: the 32-byte
  // entry as fields, less the start page the allocator owns.
  "x.1sav.dirent.n64-cpak": {
    schema: `${DIR}/x.1sav.dirent.n64-cpak.cddl`,
    valid: {
      // Mario Kart 64's note, as libdragon and most official saves write the
      // status and reserved bytes.
      full: map({
        0: Buffer.from("NKTE"),
        1: Buffer.from("01"),
        2: 0x02,
        3: 0x03,
        4: 0,
        5: Buffer.alloc(4),
        6: Buffer.from([0x26, 0x1a, 0x2b, 0x22, 0x28, 0x24, 0x1a, 0x2b, 0x2d, 0x16, 0x14, 0, 0, 0, 0, 0]),
      }),
    },
    invalid: {
      // Every field but the start page is in the entry, so none is optional.
      "without-game-code": map({ 1: Buffer.from("01"), 2: 2, 3: 3, 4: 0, 5: Buffer.alloc(4), 6: Buffer.alloc(16) }),
      // The codes are bytes, since the pak takes whatever a game writes.
      "game-code-as-text": map({
        0: "NKTE",
        1: Buffer.from("01"),
        2: 2,
        3: 3,
        4: 0,
        5: Buffer.alloc(4),
        6: Buffer.alloc(16),
      }),
      // The name and extension keep their padding, so each is its full width.
      "name-unpadded": map({
        0: Buffer.from("NKTE"),
        1: Buffer.from("01"),
        2: 2,
        3: 3,
        4: 0,
        5: Buffer.alloc(4),
        6: Buffer.alloc(11),
      }),
      "extension-too-long": map({
        0: Buffer.from("NKTE"),
        1: Buffer.from("01"),
        2: 2,
        3: 3,
        4: 0,
        5: Buffer.alloc(5),
        6: Buffer.alloc(16),
      }),
      // One byte each, as the entry has them.
      "status-too-wide": map({
        0: Buffer.from("NKTE"),
        1: Buffer.from("01"),
        2: 256,
        3: 3,
        4: 0,
        5: Buffer.alloc(4),
        6: Buffer.alloc(16),
      }),
      // The start page is the allocator's, so it is not carried.
      "start-page-carried": map({
        0: Buffer.from("NKTE"),
        1: Buffer.from("01"),
        2: 2,
        3: 3,
        4: 0,
        5: Buffer.alloc(4),
        6: Buffer.alloc(16),
        7: 5,
      }),
      "not-a-map": Buffer.alloc(32),
    },
  },

  // What the console calls a save, on the nested bundle's header because the
  // text travels with the save when it is sliced out.
  "x.1sav.label": {
    schema: `${DIR}/x.1sav.label.cddl`,
    valid: {
      full: map({ 0: "F-ZERO GX", 1: "Save data" }),
      // A PS1 title is one line and the save says nothing else about itself.
      "title-only": map({ 0: "FF7 MIDGAR" }),
    },
    invalid: {
      // The title is what a consumer lists, so a view without one has nothing
      // to say that `path` did not already say.
      "without-title": map({ 1: "Save data" }),
      // Absence is how a producer says it has no text, as elsewhere in the
      // format.
      "title-empty": map({ 0: "" }),
      "detail-empty": map({ 0: "F-ZERO GX", 1: "" }),
      "title-as-bytes": map({ 0: pattern(9) }),
      // The times are the card's record and live on the part, under
      // `x.1sav.dirent`. They do not survive being sliced out; this key does.
      "modified-as-a-key": map({ 0: "F-ZERO GX", 2: new Tag(1, 1044057600) }),
      "not-a-map": "F-ZERO GX",
    },
  },

  // What the console shows for a save, decoded. Separate from the label so a
  // lister reading titles does not walk past kilobytes of PNG.
  "x.1sav.icon": {
    schema: `${DIR}/x.1sav.icon.cddl`,
    valid: {
      // A PS1 icon that does not animate: one frame, no hold.
      still: map({ 0: [[pattern(64)]] }),
      // A GameCube icon varies the hold per frame, so each carries its own.
      animated: map({
        0: [
          [pattern(64), 250],
          [pattern(64, 2), 125],
        ],
      }),
      // The banner is a second picture beside the icon, not instead of it.
      "with-banner": map({ 0: [[pattern(64)]], 1: pattern(256) }),
    },
    invalid: {
      // The icon is the whole of what this key carries, so a banner alone is a
      // value with nothing in it a consumer came for.
      "banner-only": map({ 1: pattern(256) }),
      "frames-empty": map({ 0: [] }),
      // A frame is an array so it has somewhere to put its hold.
      "frame-not-wrapped": map({ 0: [pattern(64)] }),
      "frame-empty-image": map({ 0: [[Buffer.alloc(0)]] }),
      "hold-negative": map({
        0: [
          [pattern(64), 250],
          [pattern(64, 2), -1],
        ],
      }),
      "frame-with-third-element": map({
        0: [
          [pattern(64), 250, 1],
          [pattern(64, 2), 125],
        ],
      }),
      // A still icon shows its one frame for as long as it is shown, so a hold
      // there says nothing.
      "still-with-hold": map({ 0: [[pattern(64), 250]] }),
      // Every frame of an animated icon carries its hold, even where a format
      // runs them all at one rate.
      "animated-frame-without-hold": map({ 0: [[pattern(64), 250], [pattern(64, 2)]] }),
      "animated-without-holds": map({ 0: [[pattern(64)], [pattern(64, 2)]] }),
      "banner-as-text": map({ 0: [[pattern(64)]], 1: "banner.png" }),
      "unknown-key": map({ 0: [[pattern(64)]], 2: "nope" }),
      "not-a-map": pattern(64),
    },
  },

  // Which chip an N64 cartridge saves to. The one key a decoder checks, since
  // the chip fixes how long the payload beside it is.
  "x.1sav.n64": {
    schema: `${DIR}/x.1sav.n64.cddl`,
    valid: {
      "eeprom-4k": map({ 0: "eeprom-4k" }),
      "eeprom-16k": map({ 0: "eeprom-16k" }),
      "sram-256k": map({ 0: "sram-256k" }),
      "sram-768k": map({ 0: "sram-768k" }),
      "flash-1m": map({ 0: "flash-1m" }),
      // No retail cartridge has it, but a homebrew ROM's header can ask for it.
      "sram-1m": map({ 0: "sram-1m" }),
    },
    invalid: {
      // The chip is the whole of what the key says, so it is required.
      empty: map({}),
      // The names count kilobits, as the chips are sold. A name counting the
      // payload's bytes is no chip the page lists.
      "chip-named-by-bytes": map({ 0: "sram-32k" }),
      "chip-uppercase": map({ 0: "EEPROM-4K" }),
      // The number a homebrew ROM header gives the chip is not its name.
      "chip-as-number": map({ 0: 1 }),
      // The byte order is not the producer's to choose: the payload is in the
      // console's order whatever file it came from.
      "word-order-carried": map({ 0: "sram-256k", 1: "swapped" }),
      "not-a-map": "eeprom-4k",
    },
  },

  // The GBA cartridge clock, spec-owned for the same reason: the S-3511A's
  // latched bytes are written the same way by everyone who keeps them.
  "x.1sav.rtc.s3511a": {
    schema: `${DIR}/x.1sav.rtc.s3511a.cddl`,
    valid: {
      // Control 0x40 is bit 6 set, which is 24-hour mode. There is no separate
      // flag to agree with, which is the point of carrying the raw register.
      documented: map({ 0: S3511A_24H, 1: 0x40 }),
      // The same moment with 24-hour mode off: 2:30 PM, PM in bit 7 of the hour.
      "12-hour-mode": map({ 0: S3511A_12H, 1: 0x00 }),
      // A WonderSwan cartridge with its alarm register as ares keeps it, here
      // at the chip's power-on value. The chip reads the register back as all
      // ones, so only a producer that saw the write holds it.
      "with-alarm": map({ 0: S3511A_24H, 1: 0x40, 2: new Tag(1, 1044057600), 3: Buffer.from([0x00, 0x80]) }),
      // A game that may have set an alarm, from a source that does not keep
      // it. Absent would say the game never sets one.
      "alarm-unknown": map({ 0: S3511A_24H, 1: 0x40, 3: null }),
      // MiSTer's WonderSwan core and Mednafen keep the time alone, so the
      // register the chip still holds is null.
      "control-unknown": map({ 0: S3511A_24H, 1: null }),
    },
    invalid: {
      // The S-3511A latches seven BCD bytes: year, month, day, weekday, hour,
      // minute, second. Any other length is a different chip.
      "components-too-long": map({ 0: pattern(8), 1: 0x40 }),
      "components-too-short": map({ 0: pattern(6), 1: 0x40 }),
      // Neither key is derivable from the other, so neither is optional.
      "without-components": map({ 1: 0x40 }),
      "without-control": map({ 0: S3511A_24H }),
      // 24-hour mode lives in bit 6 of the control register. A field beside it
      // would be a second spelling of one value, and the two could disagree.
      "hour24-as-its-own-key": map({ 0: S3511A_24H, 1: 0x40, 4: true }),
      // The latched bytes are a byte string, not seven numbers: what a
      // consumer writes back has to be what it read.
      "components-as-array": map({ 0: [0, 1, 2, 3, 4, 5, 6], 1: 0x40 }),
      "control-negative": map({ 0: S3511A_24H, 1: -1 }),
      // The control register is one byte.
      "control-too-wide": map({ 0: S3511A_24H, 1: 0x140 }),
      // The alarm is the two bytes a game writes, not a number assembled from
      // them in an order a producer chose.
      "alarm-as-integer": map({ 0: S3511A_24H, 1: 0x40, 3: 0x8000 }),
      "alarm-too-long": map({ 0: S3511A_24H, 1: 0x40, 3: pattern(3) }),
      "not-a-map": "40",
    },
  },

  // The 64DD drive's clock: six BCD bytes, no weekday and no century, as ares
  // keeps them with its anchor. 2001-04-14 12:34:56.
  "x.1sav.rtc.n64dd": {
    schema: `${DIR}/x.1sav.rtc.n64dd.cddl`,
    valid: {
      documented: map({ 0: Buffer.from([0x01, 0x04, 0x14, 0x12, 0x34, 0x56]), 1: new Tag(1, 1044057600) }),
      // Bit 7 of the minute byte says the clock stopped. The key keeps it as
      // read, and it is x.1sav.rtc that has to be left out.
      stopped: map({ 0: Buffer.from([0x01, 0x04, 0x14, 0x12, 0xb4, 0x56]) }),
    },
    invalid: {
      // A weekday or a century would be a byte the drive does not have.
      "with-weekday": map({ 0: Buffer.from([0x01, 0x04, 0x14, 0x06, 0x12, 0x34, 0x56]) }),
      "time-short": map({ 0: Buffer.from([0x01, 0x04, 0x14, 0x12, 0x34]) }),
      "without-time": map({ 1: new Tag(1, 1044057600) }),
      "time-as-array": map({ 0: [0x01, 0x04, 0x14, 0x12, 0x34, 0x56] }),
      "anchor-untagged": map({ 0: Buffer.from([0x01, 0x04, 0x14, 0x12, 0x34, 0x56]), 1: 1044057600 }),
      "not-a-map": pattern(6),
    },
  },

  // The Saturn's clock and the four bytes of memory beside it, as Mednafen
  // keeps them: 2001-04-14 12:34:56, a Saturday.
  "x.1sav.rtc.smpc": {
    schema: `${DIR}/x.1sav.rtc.smpc.cddl`,
    valid: {
      documented: map({ 0: Buffer.from([0x20, 0x01, 0x64, 0x14, 0x12, 0x34, 0x56]), 1: pattern(4) }),
      "with-anchor": map({
        0: Buffer.from([0x20, 0x01, 0x64, 0x14, 0x12, 0x34, 0x56]),
        1: pattern(4),
        2: new Tag(1, 1044057600),
      }),
      // Kronos keeps the memory alone and MiSTer neither, so a producer with
      // the time from elsewhere has the memory as null.
      "memory-unknown": map({ 0: Buffer.from([0x20, 0x01, 0x64, 0x14, 0x12, 0x34, 0x56]), 1: null }),
    },
    invalid: {
      // The chip holds the memory whether or not a source kept it.
      "without-memory": map({ 0: Buffer.from([0x20, 0x01, 0x64, 0x14, 0x12, 0x34, 0x56]) }),
      // The year is four digits, so the time is seven bytes.
      "two-digit-year": map({ 0: Buffer.from([0x01, 0x64, 0x14, 0x12, 0x34, 0x56]), 1: pattern(4) }),
      "memory-short": map({ 0: Buffer.from([0x20, 0x01, 0x64, 0x14, 0x12, 0x34, 0x56]), 1: pattern(3) }),
      "not-a-map": pattern(11),
    },
  },

  // The MVS board's clock in the order the chip shifts it out: second,
  // minute, hour, day, then month and weekday in one byte, then the year.
  // 2001-04-14 12:34:56, a Saturday.
  "x.1sav.rtc.upd4990a": {
    schema: `${DIR}/x.1sav.rtc.upd4990a.cddl`,
    valid: {
      documented: map({ 0: Buffer.from([0x56, 0x34, 0x12, 0x14, 0x46, 0x01]), 1: new Tag(1, 1044057600) }),
      "without-anchor": map({ 0: Buffer.from([0x56, 0x34, 0x12, 0x14, 0x46, 0x01]) }),
    },
    invalid: {
      "time-long": map({ 0: Buffer.from([0x56, 0x34, 0x12, 0x14, 0x46, 0x01, 0x20]) }),
      "without-time": map({}),
      "anchor-untagged": map({ 0: Buffer.from([0x56, 0x34, 0x12, 0x14, 0x46, 0x01]), 1: 1044057600 }),
      "not-a-map": pattern(6),
    },
  },

  // The Game Boy cartridge clock. A different chip, and one that counts rather
  // than dates, so none of the S-3511A's fields fit it. The four keys together
  // are what regenerating the save's footer takes.
  "x.1sav.rtc.mbc3": {
    schema: `${DIR}/x.1sav.rtc.mbc3.cddl`,
    valid: {
      // 12:30:59 on day 456, running. Day 456 needs the counter's ninth bit,
      // which is bit 0 of the high register: 456 is 0x1C8, so low 0xC8, high 1.
      documented: map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // As the EverDrive GB X7 keeps it, in a file of its own: both sets of
      // registers, no anchor and no footer. The running clock has gone on past
      // the copy the game last latched.
      everdrive: map({ 0: [17, 14, 22, 88, 0x00], 1: [25, 3, 0, 0, 0x00] }),
      // The same clock from an emulator that wrote an 8-byte timestamp. Same
      // reading, different footer bytes, which is what key 3 records.
      "wide-timestamp": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 8,
      }),
      // The latched copy lags the live registers until the game latches again,
      // so the two disagreeing is the ordinary case rather than an error.
      "latch-behind-live": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [12, 28, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 4,
      }),
      // Halted with the counter carried: bits 6 and 7 of the high register,
      // which is where a cartridge sits after running past 511 days unread.
      "halted-and-carried": map({
        0: [0, 0, 0, 0xff, 0xc0],
        1: [0, 0, 0, 0xff, 0xc0],
        2: new Tag(1, 1044057600),
        3: 4,
      }),
      // Gambatte-Speedrun keeps both copies and a timestamp in a file of its
      // own. There is no footer, so there is no width.
      "outside-a-footer": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
      }),
      // ares keeps the running registers and a timestamp, and no latched copy.
      "latched-unknown": map({ 0: [59, 30, 12, 0xc8, 0x01], 1: null, 2: new Tag(1, 1044057600) }),
      // A source that keeps no anchor. The registers still say what the chip
      // holds, and a consumer rebuilding it starts the clock when it rebuilds.
      "without-anchor": map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x01] }),
    },
    invalid: {
      // Five registers, exactly: seconds, minutes, hours, day low, day high.
      // Four is a reader that dropped the high byte and with it the halt flag.
      "four-registers": map({ 0: [59, 30, 12, 0xc8], 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      "six-registers": map({
        0: [59, 30, 12, 0xc8, 0x01, 0],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 4,
      }),
      // Both copies are required. The chip always has a latched copy, so a
      // producer that did not get it says so with null rather than by leaving
      // the key out.
      "without-live": map({ 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      "without-latched": map({ 0: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // The running registers are what the reading comes from, so they are
      // never unknown.
      "live-null": map({ 0: null, 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // The timestamp is tagged, as every chip key's anchor is. A bare integer
      // beside four registers could be anything.
      "timestamp-untagged": map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x01], 2: 1044057600, 3: 4 }),
      // 4 or 8, because those are the widths emulators actually write. A third
      // value would be a footer nobody can rebuild.
      "timestamp-width-six": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 6,
      }),
      // A source without a footer leaves the width out, since there is none.
      // Null would claim a footer whose width nobody kept.
      "timestamp-width-null": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: null,
      }),
      "registers-as-bytes": map({ 0: pattern(5), 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // Each register is one byte, in either copy.
      "register-too-wide": map({ 0: [59, 30, 12, 0x1c8, 0x01], 1: [59, 30, 12, 0xc8, 0x01] }),
      "latched-register-too-wide": map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x101] }),
      "not-a-map": "1044057600",
    },
  },

  // The Super Famicom's Sharp clock. Thirteen registers of four bits, the
  // last a weekday the chip works out for itself.
  "x.1sav.rtc.srtc": {
    schema: `${DIR}/x.1sav.rtc.srtc.cddl`,
    valid: {
      // 1996-12-20 18:30:05, a Friday: digits ones first, the month in binary,
      // and century 9 for 19xx.
      documented: map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 9, 9, 5], 1: new Tag(1, 1044057600) }),
      // Century 10 is 20xx. The chip spells both centuries, so the year needs
      // no guess.
      "twenty-first-century": map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 2, 10, 4], 1: new Tag(1, 1044057600) }),
      // MiSTer keeps no anchor, and the key still says what the chip holds.
      "without-anchor": map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 9, 9, 5] }),
    },
    invalid: {
      // A game writes twelve digits and reads back thirteen. The weekday is
      // the chip's, so a set of registers without it is a write, not a read.
      "twelve-registers": map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 9, 9] }),
      "fourteen-registers": map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 9, 9, 5, 0] }),
      "register-too-wide": map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 16, 6, 9, 9, 5] }),
      // One register per element. Packing two to a byte is how bsnes lays out
      // its file, and the key belongs to no one emulator's layout.
      "registers-as-bytes": map({ 0: pattern(13) }),
      "without-registers": map({ 1: new Tag(1, 1044057600) }),
      "anchor-untagged": map({ 0: [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 9, 9, 5], 1: 1044057600 }),
      "not-a-map": [5, 0, 0, 3, 8, 1, 0, 2, 12, 6, 9, 9, 5],
    },
  },

  // The Epson clock beside Tengai Makyou Zero's SPC7110. Sixteen registers,
  // with the flags in the bits the chip gives them.
  "x.1sav.rtc.rtc4513": {
    schema: `${DIR}/x.1sav.rtc.rtc4513.cddl`,
    valid: {
      // 1995-12-29 23:59:50 with the calendar on (D = 2), interrupts masked
      // (E = F) and 24-hour mode (F = 4), which is where MiSTer powers it up.
      documented: map({ 0: [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 15, 4], 1: new Tag(1, 1044057600) }),
      // 11:59 PM in 12-hour mode, after a battery failure: PM is bit 2 of the
      // hours tens, LOST is bit 3 of the seconds tens, and 24/12 is clear.
      "lost-and-12-hour": map({ 0: [0, 13, 9, 5, 1, 5, 9, 2, 2, 1, 5, 9, 5, 2, 15, 0] }),
      // With CAL/HW clear the date registers are RAM, and any nybble fits.
      "calendar-off": map({ 0: [0, 5, 9, 5, 3, 2, 15, 7, 15, 7, 15, 15, 5, 0, 15, 4] }),
    },
    invalid: {
      "fifteen-registers": map({ 0: [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 15] }),
      "seventeen-registers": map({ 0: [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 15, 4, 0] }),
      "register-too-wide": map({ 0: [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 16, 4] }),
      // Mesen2 and Snes9x write one register per byte and bsnes two. Either
      // as a byte string would be one emulator's file, not the chip.
      "registers-as-bytes": map({ 0: pattern(16) }),
      "without-registers": map({ 1: new Tag(1, 1044057600) }),
      // 24-hour mode is bit 2 of register F. A field beside it would be a
      // second spelling of one value.
      "hour24-as-its-own-key": map({ 0: [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 15, 4], 2: true }),
      "anchor-as-float": map({
        0: [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 15, 4],
        1: new Tag(1, new Float(1044057600.5)),
      }),
      "not-a-map": [0, 5, 9, 5, 3, 2, 9, 2, 2, 1, 5, 9, 5, 2, 15, 4],
    },
  },

  // Doubutsu no Mori's clock, read and written in eight-byte blocks over the
  // Joybus. Key n is block n.
  "x.1sav.rtc.joybus": {
    schema: `${DIR}/x.1sav.rtc.joybus.cddl`,
    valid: {
      // 2001-04-14 12:34:56, a Saturday, with both blocks write-protected and
      // the clock running. The hour carries bit 7, and century 1 is 20xx.
      documented: map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        1: Buffer.alloc(8),
        2: Buffer.from([0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01, 0x01]),
        3: new Tag(1, 1044057600),
      }),
      "without-anchor": map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        1: Buffer.alloc(8),
        2: Buffer.from([0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01, 0x01]),
      }),
    },
    invalid: {
      // Every block is eight bytes on the bus, whatever a game uses of it.
      "time-block-short": map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        1: Buffer.alloc(8),
        2: Buffer.from([0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01]),
      }),
      // The game ignores block 1, and the chip still holds it.
      "without-ram-block": map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        2: Buffer.from([0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01, 0x01]),
      }),
      // Block 3 reads zero, so there is nothing to carry.
      "block-3-carried": map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        1: Buffer.alloc(8),
        2: Buffer.from([0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01, 0x01]),
        4: Buffer.alloc(8),
      }),
      "time-as-array": map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        1: Buffer.alloc(8),
        2: [0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01, 0x01],
      }),
      "anchor-untagged": map({
        0: Buffer.from([0x03, 0, 0, 0, 0, 0, 0, 0]),
        1: Buffer.alloc(8),
        2: Buffer.from([0x56, 0x34, 0x92, 0x14, 0x06, 0x04, 0x01, 0x01]),
        3: 1044057600,
      }),
      "not-a-map": pattern(24),
    },
  },

  // The HuC-3's clock controller, as the 256-nybble window a game sees.
  // Emulators keep anything from the counters to all of it, and an address a
  // producer's source does not keep is null.
  "x.1sav.rtc.huc3": {
    schema: `${DIR}/x.1sav.rtc.huc3.cddl`,
    valid: {
      // Every address and the seconds, as MAME and Gambatte-Speedrun keep them.
      full: map({ 0: nybbles(256), 1: new Tag(1, 1044057600), 2: 37 }),
      // As SameBoy keeps it: the minute and day counters, the event time, and
      // an anchor whose seconds past the minute are the clock's.
      "counters-and-event": map({
        0: only(256, [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e]),
        1: new Tag(1, 1044057642),
        2: 42,
      }),
      // As MiSTer keeps it: the two counters, 16 bits of days, and the seconds.
      "counters-and-seconds": map({
        0: only(256, [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16]),
        1: new Tag(1, 1044057600),
        2: 59,
      }),
      // The key can say what little a producer has. It is `x.1sav.rtc` that
      // has to be left out when the counters are missing.
      "counters-unknown": map({ 0: only(256, [0x26, 0x27]), 2: null }),
    },
    invalid: {
      "window-short": map({ 0: nybbles(255), 2: 0 }),
      "window-long": map({ 0: nybbles(257), 2: 0 }),
      "nybble-too-wide": map({ 0: [16, ...nybbles(255)], 2: 0 }),
      // Two nybbles to a byte is mGBA's footer, not the window.
      "window-as-bytes": map({ 0: pattern(128), 2: 0 }),
      "without-window": map({ 1: new Tag(1, 1044057600), 2: 0 }),
      "anchor-untagged": map({ 0: nybbles(256), 1: 1044057600, 2: 0 }),
      // The clock always counts seconds, so a producer that did not get them
      // says so with null rather than by leaving the key out.
      "without-seconds": map({ 0: nybbles(256), 1: new Tag(1, 1044057600) }),
      // At 60 the minute counter has already moved on.
      "seconds-past-the-minute": map({ 0: nybbles(256), 1: new Tag(1, 1044057600), 2: 60 }),
      "not-a-map": nybbles(256),
    },
  },

  // The TAMA5's TC8521: four blocks of thirteen registers and the mode
  // register, with null where a producer's source does not keep one.
  "x.1sav.rtc.tc8521": {
    schema: `${DIR}/x.1sav.rtc.tc8521.cddl`,
    valid: {
      // Every block and the mode, as mGBA keeps them. Mode 8 is the clock
      // running with block 0 selected.
      full: map({ 0: [nybbles(13, 1), alarm, nybbles(13, 3), nybbles(13, 4)], 1: 8, 2: new Tag(1, 1044057600) }),
      // As ares keeps it: the time without its weekday, the 24-hour select and
      // the leap-year counter, and nothing of the alarm, the RAM or the mode.
      "time-and-settings": map({
        0: [
          [0, 3, 5, 4, 7, 1, null, 2, 2, 0, 1, 6, 9],
          [0, 0, null, null, null, null, null, null, null, 0, 1, 1, 0],
          Array(13).fill(null),
          Array(13).fill(null),
        ],
        1: null,
        2: new Tag(1, 1044057600),
      }),
    },
    invalid: {
      "three-blocks": map({ 0: [nybbles(13, 1), alarm, nybbles(13, 3)], 1: 8 }),
      // D, E and F are common to every block. The mode is key 1, and the test
      // and reset registers are write-only, so a block stops at C.
      "block-with-common-registers": map({
        0: [nybbles(16, 1), alarm, nybbles(13, 3), nybbles(13, 4)],
        1: 8,
      }),
      "register-too-wide": map({ 0: [[16, ...nybbles(12, 1)], alarm, nybbles(13, 3), nybbles(13, 4)], 1: 8 }),
      // The chip always has a mode register, so a producer that did not get it
      // says so with null rather than by leaving the key out.
      "without-mode": map({ 0: [nybbles(13, 1), alarm, nybbles(13, 3), nybbles(13, 4)] }),
      "mode-too-wide": map({ 0: [nybbles(13, 1), alarm, nybbles(13, 3), nybbles(13, 4)], 1: 16 }),
      "without-blocks": map({ 1: 8 }),
      "block-null": map({ 0: [nybbles(13, 1), null, nybbles(13, 3), nybbles(13, 4)], 1: 8 }),
      "not-a-map": [nybbles(13, 1), alarm, nybbles(13, 3), nybbles(13, 4)],
    },
  },

  // The TPP1 homebrew mapper's clock: week, weekday and hour, minutes,
  // seconds, live and latched, and the clock bits of MR4.
  "x.1sav.rtc.tpp1": {
    schema: `${DIR}/x.1sav.rtc.tpp1.cddl`,
    valid: {
      // Week 2, Wednesday at 14:30:15: RTCDH is weekday 3 in bits 5 to 7 and
      // hour 14 below it. MR4 4 is the clock running.
      documented: map({
        0: Buffer.from([2, (3 << 5) | 14, 30, 15]),
        1: Buffer.from([2, (3 << 5) | 14, 30, 15]),
        2: 4,
        3: new Tag(1, 1044057600),
      }),
      // SameBoy's save keeps the running registers and not the latched ones.
      "latched-unknown": map({
        0: Buffer.from([2, (3 << 5) | 14, 30, 15]),
        1: null,
        2: 4,
        3: new Tag(1, 1044057600),
      }),
      // Stopped, after the week counter overflowed.
      "stopped-and-overflowed": map({ 0: Buffer.from([0, 0, 0, 0]), 1: Buffer.from([0, 0, 0, 0]), 2: 8 }),
    },
    invalid: {
      // The rumble speed shares MR4 and is not the clock's.
      "rumble-bits-set": map({ 0: Buffer.from([2, (3 << 5) | 14, 30, 15]), 1: null, 2: 5 }),
      "registers-too-long": map({ 0: Buffer.from([2, (3 << 5) | 14, 30, 15, 0]), 1: null, 2: 4 }),
      "registers-as-array": map({ 0: [2, (3 << 5) | 14, 30, 15], 1: null, 2: 4 }),
      // The chip always has a latched copy, so a producer that did not get it
      // says so with null rather than by leaving the key out.
      "without-latched": map({ 0: Buffer.from([2, (3 << 5) | 14, 30, 15]), 2: 4 }),
      // Whether the clock runs is not derivable from the registers.
      "without-status": map({ 0: Buffer.from([2, (3 << 5) | 14, 30, 15]), 1: null }),
      // The running registers are what the reading comes from, so they are
      // never unknown.
      "live-null": map({ 0: null, 1: Buffer.from([2, (3 << 5) | 14, 30, 15]), 2: 4 }),
      "anchor-untagged": map({ 0: Buffer.from([2, (3 << 5) | 14, 30, 15]), 1: null, 2: 4, 3: 1044057600 }),
      "not-a-map": Buffer.from([2, (3 << 5) | 14, 30, 15]),
    },
  },

  // The cheat list mGBA keeps in its own states, as the sets its `.cheats`
  // text describes. Every key defaults to absence, so a set is whatever of
  // name, switch, directives and codes mGBA wrote for it.
  "x.1sav.cheats.mgba": {
    schema: `${DIR}/x.1sav.cheats.mgba.cddl`,
    valid: {
      // A GameShark set and a switched-off one after it, which starts from the
      // first set's code type because mGBA carries it over.
      "two-sets": [
        map({ 0: "Infinite money", 2: ["GSAv1"], 3: ["D8BAE4D9 4864DCE5", "A86CDBA5 19BA49B3"] }),
        map({ 0: "Walk through walls", 1: true, 3: ["509B0BE0 22C55B1E"] }),
      ],
      // A Game Boy set: no directives, since the Game Boy has none.
      "game-boy": [map({ 0: "Infinite health", 3: ["010FD2C1"] })],
      // A set the player named and has not filled yet.
      "named-without-codes": [map({ 0: "New cheat" })],
      // "# " and nothing after it, which mGBA writes for a set with no name.
      "empty-set": [new Map()],
    },
    invalid: {
      // An empty section is no section to mGBA, so the key is absent instead.
      "empty-list": [],
      // A name mGBA cannot tell from none is absent.
      "empty-name": [map({ 0: "", 3: ["010FD2C1"] })],
      // A set is on unless it says otherwise, and on is absence.
      "enabled-written-out": [map({ 0: "Infinite health", 1: false, 3: ["010FD2C1"] })],
      "empty-directives": [map({ 0: "Infinite money", 2: [], 3: ["D8BAE4D9 4864DCE5"] })],
      "empty-codes": [map({ 0: "New cheat", 3: [] })],
      "code-as-bytes": [map({ 3: [Buffer.from("010FD2C1")] })],
      "unknown-key": [map({ 0: "Infinite health", 4: "nope" })],
      // mGBA's text stays mGBA's. The key carries the sets it describes.
      "as-text": "# Infinite health\n010FD2C1\n",
    },
  },

  // One key, not two: the parser name and what it found are useless apart, so
  // nothing should be able to separate them. Key 0 is free-form and pointedly
  // not the format's slug grammar; key 1 is Forge's to shape as it likes.
  "com.1retro.forge": {
    schema: `${DIR}/com.1retro.forge.cddl`,
    valid: {
      documented: map({ 0: "ff7", 1: map({ 0: "Aeris", 1: 42, 2: 130500 }) }),
      // A parser that ran and found nothing worth recording still names itself.
      "id only": map({ 0: "alttp" }),
      "empty parsed": map({ 0: "alttp", 1: new Map() }),
      // Spellings a format slug would reject, which key 0 is not.
      "id with underscore": map({ 0: "pokemon_gold" }),
      "id with uppercase": map({ 0: "FF7" }),
      "id with spaces": map({ 0: "chrono trigger (jp)" }),
      "parsed with mixed key types": new Map([
        [0, "alttp"],
        [
          1,
          new Map([
            [0, "Link"],
            ["hearts", 12],
            [new Tag(1, 1044057600), "last save"],
          ]),
        ],
      ]),
    },
    invalid: {
      // The parser name is what makes the rest legible, so it is required.
      "no id": map({ 1: map({ 0: "Aeris" }) }),
      "id not text": map({ 0: 42 }),
      "parsed not a map": map({ 0: "alttp", 1: "Aeris" }),
      "not a map": "alttp",
    },
  },
};
