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
      // Whole seconds only, for the reason `created_at` gives: tag 1 admits a
      // float, and allowing it would give one instant two encodings.
      "reading-as-float": map({ 0: new Tag(1, new Float(1044057600.5)) }),
      // The reading is tagged. A bare integer could be anything.
      "reading-untagged": map({ 0: 1044057600 }),
      "accuracy-negative": map({ 0: new Tag(1, 1044057600), 1: -1 }),
      // Naming the originating clock was key 1 and is not carried any more:
      // the chip key beside this one says which clock, and `source` says who
      // read it.
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
      // A VMU entry has a creation time and no modify time; GameCube is the
      // other way around. Each format carries the one it keeps, and a GameCube
      // clock has no zone, so the one-element form is the common case rather
      // than a degraded one.
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
        0: "GFZE",
        1: "01",
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
      "without-offsets": map({ 0: "GFZE", 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
    },
    invalid: {
      // Every fixed field of the entry is present in the 64 bytes, so none of
      // them is optional here. Only the two addresses can be absent.
      "without-game-code": map({ 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
      "without-permissions": map({ 0: "GFZE", 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 7: 0 }),
      // The identifiers are fixed-width on the card, so a value that is not
      // that width did not come off one.
      "game-code-too-short": map({ 0: "GFZ", 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
      "maker-code-too-long": map({ 0: "GFZE", 1: "012", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
      // Bytes rather than text, because a Shift-JIS name does not round-trip
      // through `path`, which is UTF-8 by construction.
      "filename-as-text": map({ 0: "GFZE", 1: "01", 2: "f-zero", 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
      "filename-empty": map({ 0: "GFZE", 1: "01", 2: Buffer.alloc(0), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
      "filename-too-long": map({ 0: "GFZE", 1: "01", 2: pattern(33), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0 }),
      // The packed fields are as wide as the entry makes them: one byte for
      // the flags and permissions, two for the icon format and speed.
      "permissions-too-wide": map({ 0: "GFZE", 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 256, 7: 0 }),
      "icon-format-too-wide": map({ 0: "GFZE", 1: "01", 2: pattern(12), 3: 0, 4: 65536, 5: 0, 6: 4, 7: 0 }),
      // The fields a writer owns are not carried: `modtime` is normalized into
      // `x.1sav.dirent`, and the block fields are regenerated and derived.
      "modtime-as-a-key": map({ 0: "GFZE", 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0, 10: 1044057600 }),
      "block-count-as-a-key": map({ 0: "GFZE", 1: "01", 2: pattern(12), 3: 0, 4: 0, 5: 0, 6: 4, 7: 0, 11: 3 }),
      "not-a-map": pattern(64),
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
      "hold-negative": map({ 0: [[pattern(64), -1]] }),
      "frame-with-third-element": map({ 0: [[pattern(64), 250, 1]] }),
      "banner-as-text": map({ 0: [[pattern(64)]], 1: "banner.png" }),
      "unknown-key": map({ 0: [[pattern(64)]], 2: "nope" }),
      "not-a-map": pattern(64),
    },
  },

  // The GBA cartridge clock, spec-owned for the same reason: the S-3511A's
  // latched bytes are written the same way by everyone who keeps them.
  "x.1sav.rtc.s3511a": {
    schema: `${DIR}/x.1sav.rtc.s3511a.cddl`,
    valid: {
      // Control 0x40 is bit 6 set, which is 24-hour mode. There is no separate
      // flag to agree with, which is the point of carrying the raw register.
      documented: map({ 0: pattern(7), 1: 0x40 }),
      "12-hour-mode": map({ 0: pattern(7), 1: 0x00 }),
      // A WonderSwan cartridge with its alarm register as ares keeps it, here
      // at the chip's power-on value. The chip reads the register back as all
      // ones, so only a producer that saw the write holds it.
      "with-alarm": map({ 0: pattern(7), 1: 0x40, 2: new Tag(1, 1044057600), 3: Buffer.from([0x00, 0x80]) }),
      // A game that may have set an alarm, from a source that does not keep
      // it. Absent would say the game never sets one.
      "alarm-unknown": map({ 0: pattern(7), 1: 0x40, 3: null }),
    },
    invalid: {
      // The S-3511A latches seven BCD bytes: year, month, day, weekday, hour,
      // minute, second. Any other length is a different chip.
      "components-too-long": map({ 0: pattern(8), 1: 0x40 }),
      "components-too-short": map({ 0: pattern(6), 1: 0x40 }),
      // Neither key is derivable from the other, so neither is optional.
      "without-components": map({ 1: 0x40 }),
      "without-control": map({ 0: pattern(7) }),
      // 24-hour mode lives in bit 6 of the control register. A field beside it
      // would be a second spelling of one value, and the two could disagree.
      "hour24-as-its-own-key": map({ 0: pattern(7), 1: 0x40, 2: true }),
      // The latched bytes are a byte string, not seven numbers: what a
      // consumer writes back has to be what it read.
      "components-as-array": map({ 0: [0, 1, 2, 3, 4, 5, 6], 1: 0x40 }),
      "control-negative": map({ 0: pattern(7), 1: -1 }),
      // The alarm is the two bytes a game writes, not a number assembled from
      // them in an order a producer chose.
      "alarm-as-integer": map({ 0: pattern(7), 1: 0x40, 3: 0x8000 }),
      "alarm-too-long": map({ 0: pattern(7), 1: 0x40, 3: pattern(3) }),
      "not-a-map": "40",
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
      // Both copies are required. They hold different values, and a producer
      // that writes one has already read the other.
      "without-live": map({ 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      "without-latched": map({ 0: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
      // The timestamp is tagged, for the reason `x.1sav.rtc` gives: a bare
      // integer beside four registers could be anything.
      "timestamp-untagged": map({ 0: [59, 30, 12, 0xc8, 0x01], 1: [59, 30, 12, 0xc8, 0x01], 2: 1044057600, 3: 4 }),
      // 4 or 8, because those are the widths emulators actually write. A third
      // value would be a footer nobody can rebuild.
      "timestamp-width-six": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
        3: 6,
      }),
      // Without the width the footer cannot be regenerated byte for byte,
      // which is the whole reason this key can hold a decoded clock.
      "without-timestamp-width": map({
        0: [59, 30, 12, 0xc8, 0x01],
        1: [59, 30, 12, 0xc8, 0x01],
        2: new Tag(1, 1044057600),
      }),
      "registers-as-bytes": map({ 0: pattern(5), 1: [59, 30, 12, 0xc8, 0x01], 2: new Tag(1, 1044057600), 3: 4 }),
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
      // Every address, as mGBA, gambatte and MAME keep it.
      full: map({ 0: nybbles(256), 1: new Tag(1, 1044057600) }),
      // As SameBoy keeps it: the minute and day counters and the event time.
      "counters-and-event": map({
        0: only(256, [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d]),
      }),
      // The key can say what little a producer has. It is `x.1sav.rtc` that
      // has to be left out when the counters are missing.
      "counters-unknown": map({ 0: only(256, [0x26, 0x27]) }),
    },
    invalid: {
      "window-short": map({ 0: nybbles(255) }),
      "window-long": map({ 0: nybbles(257) }),
      "nybble-too-wide": map({ 0: [16, ...nybbles(255)] }),
      // Two nybbles to a byte is mGBA's footer, not the window.
      "window-as-bytes": map({ 0: pattern(128) }),
      "without-window": map({ 1: new Tag(1, 1044057600) }),
      "anchor-untagged": map({ 0: nybbles(256), 1: 1044057600 }),
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
