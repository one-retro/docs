// Bundle fixtures shared by the layout, schema and nesting tests.
//
// The valid ones are the arrangements the spec describes; the invalid ones are
// the arrangements it forbids. Both sets matter: a schema that accepts
// everything passes the positive tests just as happily as a correct one.

import { Float, Raw, Tag, encode, map, sha256 } from "./cbor.js";

const BUNDLE_TAG = 827539798;

// Payload bytes are patterned rather than zero-filled. A run of zeros would
// both hide an off-by-one that copied the wrong region and make byte offsets
// ambiguous to search for.
// A part's digest is tagged, so a generic CBOR reader can name it. Only
// sha256 is legal there, which is what keeps identity a single answer.
const digest = (bytes) => new Tag(18540, sha256(bytes));

const pattern = (length, seed = 1) => Buffer.from(Array.from({ length }, (_, i) => (i * 31 + seed) & 0xff));

const SAVE = Buffer.from("SAVE");
const BLOCK = pattern(8192);
const CARD = pattern(131072, 7);

// One entry per algorithm, ascending by tag number: sha256, sha1, crc32, md5.
const ROM_HASHES = [
  new Tag(18540, pattern(32, 41)),
  new Tag(18542, pattern(20, 43)),
  new Tag(46010, pattern(4, 47)),
  new Tag(46011, pattern(16, 53)),
];

export const bundle = (header, parts) => new Tag(BUNDLE_TAG, [header, parts]);

// Builds a part with the keys in the order the spec assigns them. `extra` goes
// on last so a fixture can add or override a key without rebuilding the map.
export function part({ id = 0, role, path, payload = SAVE, game, slot, dirent, kind, system, binding, extra } = {}) {
  // `role` and `path` both default to absence, so the helper only writes what
  // a part actually says.
  const p = new Map([[0, id]]);
  if (kind) p.set(1, kind); // absent means "save", which is never written out
  if (role) p.set(2, role);
  if (path) p.set(3, path);
  if (slot !== undefined) p.set(4, slot);
  if (dirent) p.set(5, dirent);
  p.set(9, digest(payload));
  if (game) p.set(11, game);
  if (system) p.set(12, system);
  if (binding) p.set(13, binding);
  p.set(-1, payload);
  if (extra) for (const [k, v] of extra) p.set(k, v);
  return p;
}

// One nested entry: a `bundle` part whose payload is `inner` encoded.
// `sha256` falls out of part() over those bytes, so the outer part's key 9
// is the inner bundle's content hash with nothing extra to keep in step, and
// the `system` index is read off the inner header rather than passed in, so a
// fixture cannot drift from what it wraps.
export const nested = (inner, options = {}) =>
  part({ system: inner.value[0].get(1), ...options, kind: "bundle", payload: encode(inner) });

// A save that is one file: the shape every card entry nests.
const oneFileSave = (system, game, payload) => bundle(map({ 0: "save", 1: system, 2: game }), [part({ payload })]);

const card = (system, format, capacity, entries) =>
  bundle(map({ 0: "card", 1: system, 4: map({ 0: format, 1: capacity }) }), entries);

// Three saves on one PS1 card, two of them for the same game. Final Fantasy VII
// writes one file per save slot, so its two entries carry byte-identical game
// maps and are told apart only by `path` and `slot`. That is the case the flat
// model got wrong, which is why it is the fixture the other tests run against.
const FF7 = map({ 3: "SCUS-94163", 4: "Final Fantasy VII" });
const MGS = map({ 3: "SLUS-00594", 4: "Metal Gear Solid" });

export const ps1Card = card("psx", "ps1-mc", 131072, [
  nested(oneFileSave("psx", FF7, BLOCK), {
    id: 0,
    role: "memcard-1",
    path: "BASCUS-94163FF7-S01",
    game: FF7,
    slot: 1,
    dirent: pattern(128, 1),
  }),
  nested(oneFileSave("psx", FF7, pattern(8192, 3)), {
    id: 1,
    role: "memcard-1",
    path: "BASCUS-94163FF7-S02",
    game: FF7,
    slot: 2,
    dirent: pattern(128, 2),
  }),
  nested(oneFileSave("psx", MGS, pattern(8192, 5)), {
    id: 2,
    role: "memcard-1",
    path: "BASLUS-00594",
    game: MGS,
    slot: 3,
    dirent: pattern(128, 3),
  }),
]);

// A PS2 save is a directory. Its files are the parts of one nested bundle, each
// with its own dirent; the directory's own dirent rides on the outer entry. The
// directory's slots 0 and 1 are `.` and `..`, so its files start at 2.
const FFX = map({ 3: "SLUS-20312", 4: "Final Fantasy X" });

const ffxSave = bundle(map({ 0: "save", 1: "ps2", 2: FFX }), [
  part({ id: 0, path: "icon.sys", payload: pattern(964), slot: 2, dirent: pattern(512, 4) }),
  part({ id: 1, path: "list.ico", payload: pattern(15168), slot: 3, dirent: pattern(512, 5) }),
  part({ id: 2, path: "BASLUS-20312", payload: pattern(40960), slot: 4, dirent: pattern(512, 6) }),
]);

export const ps2Card = card("ps2", "ps2-mc", 8388608, [
  nested(ffxSave, {
    id: 0,
    role: "memcard-1",
    path: "BASLUS-20312",
    game: FFX,
    slot: 3,
    dirent: pattern(512, 3),
  }),
]);

// Two non-PlayStation entries, for the collection fixture. A cartridge save has
// no card around it, so a collection can hold one directly beside a card.
const MK64 = map({ 3: "NUS-NKTE", 4: "Mario Kart 64" });
const POKEMON = map({ 3: "POKEMON RED", 4: "Pokemon Red" });

const gbSave = oneFileSave("gb", POKEMON, pattern(32768, 11));

// Games for the three card fixtures below. A Neo Geo save is addressed by its
// game's NGH number rather than by any name, so that is the serial here; a
// GameCube save is addressed by the game code its dirent carries.
const SONIC = map({ 4: "Sonic Adventure", 5: "dreamcast" });
const METAL_SLUG = map({ 3: "NGH-201", 4: "Metal Slug" });
const FZERO = map({ 3: "GFZE8P", 4: "F-Zero GX" });

// A Neo Geo card holding one save and an N64 pak holding one note, for the
// cases that change one thing about either.
const neogeoCard = (entry = {}, systemArea = pattern(64, 79)) =>
  bundle(map({ 0: "card", 1: "neogeo", 4: map({ 0: "neogeo-mc", 1: 2048, 2: systemArea }) }), [
    nested(oneFileSave("neogeo", METAL_SLUG, pattern(64, 83)), {
      id: 0,
      role: "neogeo-card",
      path: "0201-0",
      game: METAL_SLUG,
      slot: 0,
      dirent: Buffer.from([0x00, 0x02, 0x01, 0x05]),
      ...entry,
    }),
  ]);
const n64Pak = (path) =>
  bundle(map({ 0: "card", 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
    nested(oneFileSave("n64", MK64, pattern(256, 41)), {
      id: 0,
      role: "controller-pak-1",
      path,
      game: MK64,
      slot: 1,
      dirent: pattern(32, 3),
    }),
  ]);

// An N64 cartridge save: the part holding the chip's memory has the role
// `cartridge` and names the chip in `x.1sav.n64`. The payload is the chip at
// its full size, so a fixture only passes `size` to break that.
const N64_CHIPS = {
  "eeprom-4k": 512,
  "eeprom-16k": 2048,
  "sram-256k": 32768,
  "sram-768k": 98304,
  "flash-1m": 131072,
  "sram-1m": 131072,
};
const n64Chip = (chip) => new Map([["x.1sav.n64", map({ 0: chip })]]);
const n64Cartridge = (game, chip, { size = N64_CHIPS[chip], seed = 21 } = {}) =>
  bundle(map({ 0: "save", 1: "n64", 2: game }), [
    part({ role: "cartridge", payload: pattern(size, seed), extra: chip ? n64Chip(chip) : undefined }),
  ]);

// A device of an N64 cartridge and the Controller Pak in port 1, which holds
// one Mario Kart 64 note. The cases built on it change only the cartridge.
const n64Device = (cartridge, outer = {}) =>
  bundle(map({ 0: "device", 1: "n64" }), [
    nested(cartridge, { id: 0, role: "cartridge", ...outer }),
    nested(
      bundle(map({ 0: "card", 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
        nested(oneFileSave("n64", MK64, pattern(256)), {
          id: 0,
          role: "controller-pak-1",
          path: "MARIOKART64",
          game: MK64,
          slot: 1,
          dirent: pattern(32, 1),
        }),
      ]),
      { id: 1, role: "controller-pak-1" },
    ),
  ]);

// A Controller Pak holding one note, whose own save part takes `noteExtra`.
const n64PakWithNote = (noteExtra) =>
  bundle(map({ 0: "card", 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
    nested(bundle(map({ 0: "save", 1: "n64", 2: MK64 }), [part({ payload: pattern(256), extra: noteExtra })]), {
      id: 0,
      role: "controller-pak-1",
      path: "MARIOKART64",
      slot: 1,
      dirent: pattern(32, 1),
    }),
  ]);
const SM64 = map({ 3: "NUS-NSME", 4: "Super Mario 64" });
const YOSHI = map({ 3: "NUS-NYSE", 4: "Yoshi's Story" });
const OOT = map({ 3: "NUS-CZLE", 4: "The Legend of Zelda: Ocarina of Time" });
const DEZAEMON = map({ 4: "Dezaemon 3D" });
const MAJORA = map({ 3: "NUS-NZSE", 4: "The Legend of Zelda: Majora's Mask" });

// Save states and screenshots. A state is one core's snapshot of a running
// game, so its header names that core and the ROM it was taken against, and its
// parts are the core's own data, the screenshot, and whatever else the
// emulator's container kept beside them.
const EMERALD = map({ 1: ROM_HASHES, 3: "AGB-BPEE-USA", 4: "Pokemon Emerald" });
const TAKEN_AT = new Tag(1, 1793000000);
const PNG = pattern(1024, 59);
const MGBA = map({ 4: "mgba" });

const statePart = (options = {}) => part({ kind: "state", payload: pattern(4096, 61), ...options });
const screenshot = (id, payload = PNG, type = "image/png") =>
  part({ id, kind: "screenshot", payload, extra: new Map([[6, type]]) });

const emeraldState = bundle(map({ 0: "state", 1: "gba", 2: EMERALD, 3: map({ 2: "mgba", 4: "mgba" }), 7: TAKEN_AT }), [
  statePart({ id: 0, slot: 1 }),
  screenshot(1),
]);
const emeraldScreenshot = bundle(map({ 0: "screenshot", 1: "gba", 2: EMERALD, 3: map({ 2: "mgba", 4: "mgba" }) }), [
  screenshot(0, pattern(1024, 103)),
]);

// A PS1 card of fifteen-slot Final Fantasy VII saves, cut to two. The header
// names the game, so an outer part carries a copy only where `copies` asks.
const cardOfOneGame = (copies = false) =>
  bundle(map({ 0: "card", 1: "psx", 2: FF7, 4: map({ 0: "ps1-mc", 1: 131072 }) }), [
    nested(oneFileSave("psx", FF7, BLOCK), {
      id: 0,
      role: "memcard-1",
      path: "BASCUS-94163FF7-S01",
      game: copies ? FF7 : undefined,
      slot: 1,
      dirent: pattern(128, 1),
    }),
    nested(oneFileSave("psx", FF7, pattern(8192, 3)), {
      id: 1,
      role: "memcard-1",
      path: "BASCUS-94163FF7-S03",
      game: copies ? FF7 : undefined,
      slot: 2,
      dirent: pattern(128, 2),
    }),
  ]);

// A Sega CD read whole: its internal backup RAM and its Backup RAM Cart, each a
// save, since no card format describes either.
const segaCdDevice = bundle(map({ 0: "device", 1: "sega-cd" }), [
  nested(bundle(map({ 0: "save", 1: "sega-cd" }), [part({ payload: pattern(8192, 11) })]), { id: 0, role: "internal" }),
  nested(bundle(map({ 0: "save", 1: "sega-cd" }), [part({ payload: pattern(32768, 13) })]), {
    id: 1,
    role: "ram-cart",
  }),
]);

// Small payloads for the cases a schema rejects. The reference tool prints
// every arm it tried, payload bytes and all, so a rejected bundle costs time in
// proportion to what it carries.
const smallStatePart = (options = {}) => part({ kind: "state", payload: pattern(16, 61), ...options });
const smallSave = (system = "psx", game = MGS) => oneFileSave(system, game, pattern(16, 5));
const smallCardEntry = nested(smallSave(), {
  id: 0,
  role: "memcard-1",
  path: "BASLUS-00594",
  slot: 1,
  dirent: pattern(128, 3),
});
const smallEntry = nested(smallSave("gb", POKEMON), { id: 0 });
const smallComponent = nested(bundle(map({ 0: "save", 1: "sega-cd" }), [part({ payload: pattern(16, 11) })]), {
  id: 0,
  role: "internal",
});

export const valid = {
  // An empty header and one bare save. The floor of what a bundle is.
  minimal: bundle(map({ 0: "save" }), [part()]),

  // A PS1 card holding three saves, two of them for one game, and a PS2 card
  // holding one save that is itself a directory of files. Between them they
  // cover both nesting shapes a card takes.
  "ps1-card": ps1Card,
  "ps2-card": ps2Card,

  // A PS2 card holding the console's network settings beside a game's save.
  // The settings are no game's, so they are not a save: the directory is one
  // `system` part with an empty payload, and each file in it another, after it.
  "card-system-entries": card("ps2", "ps2-mc", 8388608, [
    nested(ffxSave, { id: 0, role: "memcard-1", path: "BASLUS-20312", game: FFX, slot: 2, dirent: pattern(512, 3) }),
    part({
      id: 1,
      kind: "system",
      role: "memcard-1",
      path: "BWNETCNF",
      slot: 3,
      dirent: pattern(512, 7),
      payload: Buffer.alloc(0),
    }),
    part({
      id: 2,
      kind: "system",
      role: "memcard-1",
      path: "BWNETCNF/icon.sys",
      dirent: pattern(512, 8),
      payload: pattern(964, 9),
    }),
    part({
      id: 3,
      kind: "system",
      role: "memcard-1",
      path: "BWNETCNF/BWNETCNF",
      dirent: pattern(512, 10),
      payload: pattern(5120, 11),
    }),
  ]),

  // A card-image kept alongside the split saves, which the spec allows so a
  // producer can hold on to the deleted-save residue and free-block contents
  // that splitting drops.
  "card-image-beside-splits": card("psx", "ps1-mc", 131072, [
    nested(oneFileSave("psx", MGS, BLOCK), {
      id: 0,
      role: "memcard-1",
      path: "BASLUS-00594",
      game: MGS,
      slot: 1,
      dirent: pattern(128, 1),
    }),
    part({ id: 1, role: "memcard-1", payload: CARD, kind: "card-image" }),
  ]),

  // `system_area` carries the card-level bytes belonging to no save, so a
  // writer can rebuild the card's own identity without a whole card-image. On
  // an N64 pak those bytes are its 32-byte label.
  "card-system-area": bundle(map({ 0: "card", 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }), [
    nested(oneFileSave("n64", MK64, pattern(256)), {
      id: 0,
      role: "controller-pak-1",
      path: "MARIOKART64",
      game: MK64,
      slot: 1,
      dirent: pattern(32, 1),
    }),
  ]),

  // A card holding nothing but saves for one game, which is what Final Fantasy
  // VII does to a PS1 card: one block per save, fifteen slots, no room for
  // anything else. The header names the game, because here a single game
  // really does describe the whole card. The `-Sxx` in the name is the game's
  // own slot and the card's directory slot is a different number, so the two
  // entries below are deliberately not aligned. The outer parts carry no index
  // copy of the game: it would equal the header's, which absence already says.
  "card-of-one-game": cardOfOneGame(),

  // One console's storage read whole. A Sega CD carries internal backup RAM and
  // a Backup RAM Cart at once; neither is one game's save, and the pair is not
  // a collection, because both came off one system. No card format describes
  // the Sega CD's backup RAM, so each component is a save.
  device: segaCdDevice,

  // A collection: no system, no game, no card of its own, and entries that do
  // not agree on a system. This is how one file spans systems, and the PS1
  // entry is itself a card holding saves.
  collection: bundle(map({ 0: "collection" }), [
    nested(ps1Card, { id: 0, role: "memcard-1" }),
    nested(gbSave, { id: 1, role: "cartridge", game: POKEMON }),
  ]),

  // No depth is written down: a collection can hold a device, which holds a
  // card, which holds saves. Each nested bundle is a shape its holder allows,
  // so the chain ends on its own.
  "collection-of-devices": bundle(map({ 0: "collection" }), [
    nested(n64Device(n64Cartridge(MK64, "eeprom-4k")), { id: 0 }),
    nested(segaCdDevice, { id: 1 }),
  ]),

  // A console's own clock is on the device, since every game on it reads the
  // one clock and no save holds it. An MVS board's uPD4990A, as ares keeps it:
  // 2001-04-14 12:34:56, a Saturday, beside the board's backup RAM and the
  // card in its slot.
  "device-with-a-clock": bundle(
    map({
      0: "device",
      1: "neogeo",
      "x.1sav.rtc": map({ 0: new Tag(1, 987251696) }),
      "x.1sav.rtc.upd4990a": map({ 0: Buffer.from([0x56, 0x34, 0x12, 0x14, 0x46, 0x01]), 1: TAKEN_AT }),
    }),
    [
      nested(oneFileSave("neogeo", METAL_SLUG, pattern(256, 7)), { id: 0, role: "internal" }),
      nested(neogeoCard(), { id: 1, role: "neogeo-card" }),
    ],
  ),

  // A device's component names the system that reads it. A Game Boy cartridge
  // in an N64's Transfer Pak is a `gb` save in an `n64` device, in the socket
  // `transfer-pak-1`.
  "n64-device-with-transfer-pak": bundle(map({ 0: "device", 1: "n64" }), [
    nested(n64Cartridge(map({ 4: "Pokemon Stadium" }), "sram-256k"), { id: 0, role: "cartridge" }),
    nested(gbSave, { id: 1, role: "transfer-pak-1", game: POKEMON }),
  ]),

  // A kind nobody has to recognize. A consumer treats it as `aux` and hands it
  // back unchanged, which is what lets a producer name one out of a domain it
  // owns instead of registering anything.
  "third-party-kind": bundle(map({ 0: "save", 1: "gba" }), [
    part({ id: 0, payload: pattern(64), kind: "io.mgba.rewind" }),
  ]),

  // A save the console bound to itself. The bytes are valid and worth keeping,
  // and they will not restore to another console, which is the one thing a
  // consumer cannot work out from the payload.
  binding: bundle(map({ 0: "save", 1: "wii" }), [part({ payload: pattern(512), binding: "device" })]),

  // A save bound to a console and to an account at once, naming both. A
  // consumer compares each identifier byte for byte with its target's, and
  // offers the save to no other.
  "bound-to": bundle(map({ 0: "save", 1: "ps3" }), [
    part({
      payload: pattern(512, 3),
      binding: "device-account",
      extra: new Map([[14, map({ 0: pattern(16, 5), 1: pattern(8, 7) })]]),
    }),
  ]),

  // An N64 cartridge beside its Controller Pak is a device of two components,
  // each a nested bundle: the cartridge a save, the pak a card. A note is
  // always a save on a card, so the pak stays a card even where it holds only
  // this game's one note. The cartridge save's own part has the role
  // `cartridge` and carries `x.1sav.n64`, so the save means the same lifted out
  // of the device.
  "cartridge-and-pak": n64Device(n64Cartridge(MK64, "eeprom-4k")),

  // A producer that cannot tell a cartridge's chip gives its bytes no
  // `cartridge` part. A 131072-byte file is FlashRAM or 1 Mbit SRAM, so it
  // carries the file whole as `aux`, for a consumer that can tell.
  "n64-chip-unknown": bundle(map({ 0: "save", 1: "n64", 2: map({ 4: "Unknown" }) }), [
    part({ kind: "aux", path: "Unknown.sra", payload: pattern(131072, 25) }),
  ]),

  // An N64 state whose emulator keeps the in-game save beside the core's data.
  // That part is the cartridge's memory, so it has the role `cartridge` and
  // names its chip, as it would in a save of its own.
  "n64-state-with-in-game-save": bundle(
    map({ 0: "state", 1: "n64", 2: MK64, 3: map({ 2: "retroarch", 4: "mupen64plus-next" }) }),
    [
      statePart({ id: 0, slot: 1 }),
      part({ id: 1, role: "cartridge", payload: pattern(512, 21), extra: n64Chip("eeprom-4k") }),
    ],
  ),

  // Every identification hint at once, plus a populated metadata slot. A real
  // producer emits the hashes it has already computed rather than all four;
  // this is the upper bound, and the only save fixture with a clock reading.
  "fully-identified": bundle(
    map({
      0: "save",
      6: new Tag(1, 1712345678),
      1: "gba",
      2: map({
        0: map({ "com.1retro": 1234 }),
        1: ROM_HASHES,
        2: "pokemon_emerald.gba",
        3: "AGB-BPEE-USA",
        4: "Pokemon Emerald",
      }),
      5: "Right before the Elite Four",
      "x.1sav.rtc": map({ 0: new Tag(1, 1044057600), 1: 500 }),
    }),
    [part({ payload: pattern(131072, 23) })],
  ),

  // A save beside an `aux` part. The thumbnail is no save, so it names its
  // type and rides along for a consumer that wants it.
  "save-and-aux": bundle(map({ 0: "save", 1: "snes" }), [
    part({ id: 0, role: "cartridge", payload: pattern(32768, 29) }),
    part({
      id: 1,
      path: "thumb.png",
      payload: pattern(2048, 37),
      kind: "aux",
      extra: new Map([[6, "image/png"]]),
    }),
  ]),

  // An N64 Controller Pak permits two notes with the same game code and note
  // name, so `path` cannot tell them apart and the producer must carry `slot`.
  // This is the case the uniqueness rule exists for, on real hardware.
  "n64-pak-duplicate-note-names": bundle(
    map({ 0: "card", 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768, 2: pattern(32, 9) }) }),
    [
      nested(oneFileSave("n64", MK64, pattern(256, 31)), {
        id: 0,
        role: "controller-pak-1",
        path: "MARIOKART64",
        game: MK64,
        slot: 1,
        dirent: pattern(32, 1),
      }),
      nested(oneFileSave("n64", MK64, pattern(256, 37)), {
        id: 1,
        role: "controller-pak-1",
        path: "MARIOKART64",
        game: MK64,
        slot: 2,
        dirent: pattern(32, 2),
      }),
    ],
  ),

  // An N64 cartridge save for each chip. The part holding the chip's memory
  // carries `x.1sav.n64`, and its payload is that chip at its full size, from
  // a 4 Kbit EEPROM's 512 bytes to a FlashRAM's 128 KiB.
  "n64-cartridge-eeprom-4k": n64Cartridge(SM64, "eeprom-4k"),
  "n64-cartridge-eeprom-16k": n64Cartridge(YOSHI, "eeprom-16k"),
  "n64-cartridge-sram-256k": n64Cartridge(OOT, "sram-256k"),
  "n64-cartridge-sram-768k": n64Cartridge(DEZAEMON, "sram-768k"),
  "n64-cartridge-flash-1m": n64Cartridge(MAJORA, "flash-1m"),
  "n64-cartridge-sram-1m": n64Cartridge(map({ 4: "Homebrew" }), "sram-1m"),

  // The key's integer keys are the spec's, as in the format's own maps. One a
  // later version assigns is ignored and round-tripped, and the chip beside it
  // still fixes the payload's length.
  "n64-chip-with-a-later-key": bundle(map({ 0: "save", 1: "n64", 2: SM64 }), [
    part({
      role: "cartridge",
      payload: pattern(512, 21),
      extra: new Map([["x.1sav.n64", map({ 0: "eeprom-4k", 1: 5 })]]),
    }),
  ]),

  // A 64DD disk's save is its RAM area, in block order, and its length is
  // what tells a consumer the disk's type. A type 5 disk's area is its last
  // 204 blocks, 1942080 bytes, the smallest a disk has.
  "n64dd-disk": bundle(map({ 0: "save", 1: "n64dd" }), [part({ payload: pattern(1942080, 89) })]),

  // Saturn keeps a save's directory entry at the head of the save's own first
  // block rather than in a directory region, which changes where a reader finds
  // those 30 bytes and not whether they can be carried, so `dirent` holds them
  // like any other format's. What follows them is the block chain, and a writer
  // rewrites that in the payload instead.
  "saturn-backup": bundle(map({ 0: "card", 1: "saturn", 4: map({ 0: "saturn-bup", 1: 32768 }) }), [
    nested(oneFileSave("saturn", map({ 4: "Panzer Dragoon Saga" }), pattern(1024, 41)), {
      id: 0,
      path: "PANZER_SV",
      slot: 1,
      dirent: pattern(30, 41),
    }),
  ]),

  // A Dreamcast VMU. Blocks are 512 bytes, so each payload is a run of them,
  // and `capacity` is the whole 131072-byte data area even though only 200 of
  // the card's 256 blocks are ever handed to a save: what fits is capacity
  // minus what the format reserves, which is the writer's arithmetic and not a
  // field here. `system_area` is the card's own colour and icon, which belong
  // to no save on it. The first entry is a mini-game, which runs in place from
  // flash, so a writer puts it back at block 0 and keeps it contiguous; the
  // dirent's type byte is what says so, and this format never reads inside it.
  "vmu-card": bundle(map({ 0: "card", 1: "dreamcast", 4: map({ 0: "vmu", 1: 131072, 2: pattern(48, 67) }) }), [
    nested(oneFileSave("dreamcast", SONIC, pattern(15360, 71)), {
      id: 0,
      role: "memcard-1",
      path: "SONICADV__VM",
      game: SONIC,
      slot: 1,
      dirent: pattern(32, 71),
    }),
    nested(oneFileSave("dreamcast", SONIC, pattern(4096, 73)), {
      id: 1,
      role: "memcard-1",
      path: "SONICADV_INT",
      game: SONIC,
      slot: 2,
      dirent: pattern(32, 73),
    }),
  ]),

  // A Neo Geo memory card: the smallest card here, 2 KiB of 64-byte blocks
  // behind a 4-byte directory entry. The entry holds no name, only a
  // sub-number, the game's NGH number and the save's first block, so `path`
  // spells the first two: `0201-0` is Metal Slug's save 0. The blocks are
  // after the five the card reserves for itself. `system_area` is the card's
  // 64-byte header block, which carries the cardholder username and the
  // region of the console that formatted it, belonging to the card rather
  // than to anything saved on it.
  "neogeo-card": bundle(map({ 0: "card", 1: "neogeo", 4: map({ 0: "neogeo-mc", 1: 2048, 2: pattern(64, 79) }) }), [
    nested(oneFileSave("neogeo", METAL_SLUG, pattern(64, 83)), {
      id: 0,
      role: "neogeo-card",
      path: "0201-0",
      game: METAL_SLUG,
      slot: 0,
      dirent: Buffer.from([0x00, 0x02, 0x01, 0x05]),
    }),
    nested(oneFileSave("neogeo", METAL_SLUG, pattern(128, 89)), {
      id: 1,
      role: "neogeo-card",
      path: "0201-1",
      game: METAL_SLUG,
      slot: 1,
      dirent: Buffer.from([0x01, 0x02, 0x01, 0x06]),
    }),
  ]),

  // An N64 note can carry an extension beside its 16-byte name. `path` joins
  // the two with a dot, each decoded through the pak's own character table.
  "n64-note-with-extension": n64Pak("MARIOKART64.A"),

  // A GameCube Memory Card 59: 64 blocks of 8192 bytes, named for the 59 left
  // once the header, the directory and the block allocation table have taken
  // theirs, and `capacity` is all 64 of them. Taken from a real `.gci`, which
  // is a 64-byte dirent followed by the payload and nothing else: `GFZE` plus
  // `8P` for the serial, `f_zero.dat` for the path, and 32768 bytes of save,
  // which is the four blocks the dirent claims. That is the block count being
  // derivable rather than stored. The same dirent gives the save's first block
  // as 5, the first block a GameCube card has free, and this format drops that
  // number on the floor: it is true of the card it was read from and of no
  // other. F-Zero GX also signs its save against the destination card's flash
  // serial and refuses one that does not match, so a writer re-signs it on
  // arrival rather than copying the payload untouched.
  "gc-card": bundle(map({ 0: "card", 1: "gc", 4: map({ 0: "gc-mc", 1: 524288 }) }), [
    nested(oneFileSave("gc", FZERO, pattern(32768, 97)), {
      id: 0,
      role: "memcard-1",
      path: "f_zero.dat",
      game: FZERO,
      slot: 1,
      dirent: pattern(64, 97),
    }),
  ]),

  // A PS1 save spanning two blocks is one part of 16384 bytes. The card
  // allocated two blocks and they may not have been adjacent, which is not
  // recorded: block placement is the destination allocator's business.
  "ps1-multi-block-save": card("psx", "ps1-mc", 131072, [
    nested(oneFileSave("psx", map({ 3: "SLUS-00892", 4: "Final Fantasy VIII" }), pattern(16384, 43)), {
      id: 0,
      role: "memcard-1",
      path: "BASLUS-00892FF8-S01",
      slot: 1,
      dirent: pattern(128, 5),
    }),
  ]),

  // A Transfer Pak puts a Game Boy cartridge in an N64 controller, and Pokemon
  // Stadium writes that cartridge's SRAM. The save is `gb` because that is what
  // will load it; the N64 is provenance, which is what `source` is for.
  "transfer-pak": bundle(
    map({ 0: "save", 1: "gb", 2: POKEMON, 3: map({ 0: "console", 2: "x.example.stadium", 3: "1.0" }) }),
    [part({ role: "cartridge", payload: pattern(32768, 47) })],
  ),

  // A formatted card with nothing saved on it. The card is real and worth
  // carrying, and a `card_image` is the only part it can have, since there is
  // no save to nest.
  "empty-formatted-card": bundle(map({ 0: "card", 1: "psx", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [
    part({ role: "memcard-1", payload: CARD, kind: "card-image" }),
  ]),

  // A zero-length payload. A save slot a console formatted and never wrote to
  // is still a part, and sha256 over no bytes is perfectly well defined.
  "zero-byte-payload": bundle(map({ 0: "save", 1: "gb" }), [part({ payload: Buffer.alloc(0) })]),

  // An amiibo: a few hundred bytes on an NFC tag, signed against that tag's own
  // serial. No `system`, because several consoles read one and none of them
  // owns it, which is a case the optional header is there for. `binding` is
  // `medium` rather than `device`: any console can write it and the result
  // stays valid, but copying it to a second tag does not.
  "token-bound-save": bundle(map({ 0: "save", 2: map({ 4: "Super Smash Bros." }) }), [
    part({ payload: pattern(540, 61), binding: "medium" }),
  ]),

  // A numbered socket past anything the registry enumerates. Eight VMU slots
  // across four Dreamcast controllers, and the prefix is what a consumer
  // matches on, so a VMU read from `memcard-8` is understood without that role
  // being listed.
  "high-numbered-socket": bundle(map({ 0: "card", 1: "dreamcast", 4: map({ 0: "vmu", 1: 131072 }) }), [
    nested(oneFileSave("dreamcast", SONIC, pattern(512, 59)), {
      id: 0,
      role: "memcard-8",
      path: "SONICADV_INT",
      slot: 1,
      dirent: pattern(32, 59),
    }),
  ]),

  // Provenance at both levels: a cartridge reader assembled the bundle, and one
  // part came from an emulator instead, so it carries its own source. Note the
  // split inside one map: `device_kind` is a spec slug nobody may mint into,
  // while `app` beside it is the producer's own name, here reverse-DNS for the
  // reader and an Apps registry slug for the emulator. The reader runs no core;
  // the emulator names the one it ran in `core`, and the firmware it ran on in
  // `platform`.
  "source-provenance": bundle(
    map({ 0: "save", 1: "gb", 3: map({ 0: "cartridge-reader", 1: "a1b2c3", 2: "io.epilogue", 3: "1.0.3" }) }),
    [
      part({ id: 0, role: "cartridge", payload: pattern(32768, 13) }),
      part({
        id: 1,
        payload: pattern(512, 17),
        extra: new Map([
          [10, map({ 0: "emulator", 2: "retroarch", 3: "1.19.1", 4: "mgba", 5: "0.10.3", 6: "muos", 7: "2502.0" })],
        ]),
      }),
    ],
  ),

  // A MiSTer stamps a clock's anchor in local standard time counted as though it
  // were UTC, and says how far that is from UTC: Pacific time, eight hours west,
  // a negative integer on the wire.
  "source-utc-offset": bundle(
    map({ 0: "save", 1: "gbc", 3: map({ 0: "emulator", 2: "mister", 4: "gameboy-mister", 8: -28800 }) }),
    [part({ payload: pattern(32768, 19) })],
  ),

  // Catalog ids, keyed by resolver name. A producer aligned with several
  // catalogs records one entry each, and the id is whatever form that catalog
  // publishes: an integer for one, a string for the next.
  "game-ids": bundle(
    map({ 0: "save", 1: "psx", 2: map({ 0: map({ "com.1retro": 1234, "org.hasheous": "SLUS-00594" }) }) }),
    [part()],
  ),

  // Extension keys sit flat on the header and on a part alike, named by
  // reversing a domain the producer holds or by taking a reserved name in the
  // `x` tree when the value belongs to no one producer. Both kinds ride here.
  "part-extension-keys": bundle(
    map({
      0: "save",
      1: "gba",
      // A real GBA cartridge clock rather than a placeholder, in BCD: 2003-02-01,
      // a Saturday, 14:30:00. The value has to satisfy that key's own schema,
      // which is what the extension suite cross-checks.
      "x.1sav.rtc.s3511a": map({ 0: Buffer.from([0x03, 0x02, 0x01, 0x06, 0x94, 0x30, 0x00]), 1: 0x40 }),
    }),
    // The pair: what a parser found, and which parser found it. The map is
    // uninterpretable without the id beside it.
    [
      part({
        extra: new Map([["com.1retro.forge", map({ 0: "ff7", 1: map({ 0: "Aeris" }) })]]),
      }),
    ],
  ),

  // `game` takes extension keys too, for a clue none of its integer keys names.
  // A cartridge reader that read only the ROM header has a serial and a title
  // and no hash, and the header's revision byte beside them is what tells two
  // releases sharing that serial apart. A consumer that does not recognise the
  // key skips it when matching and hands it back unchanged.
  "game-extension-keys": bundle(
    map({ 0: "save", 1: "gba", 2: map({ 3: "AGB-AXVE-USA", 4: "Pokemon Ruby", "x.example.revision": 1 }) }),
    [part()],
  ),

  // A save state at its smallest: the core it loads into, and the core's own
  // data. A state with no game, no time and no screenshot still loads where it
  // was taken, so nothing else is required.
  "state-minimal": bundle(map({ 0: "state", 3: MGBA }), [statePart()]),

  // A RetroArch state in slot 3, with the screenshot RetroArch keeps beside it.
  // The state part is the RASTATE file's memory block, unwrapped and
  // decompressed. The achievement block is RetroArch's own and opaque, so it
  // rides as an `aux` part named for the block it came from.
  "state-retroarch": bundle(
    map({
      0: "state",
      1: "gba",
      2: EMERALD,
      3: map({ 2: "retroarch", 3: "1.21.0", 4: "mgba", 5: "0.10.5" }),
      7: TAKEN_AT,
      8: map({ 4: map({ mgba_gb_model: "Autodetect", mgba_use_bios: "ON" }) }),
    }),
    [
      statePart({ id: 0, slot: 3 }),
      screenshot(1),
      part({ id: 2, kind: "aux", path: "ACHV", payload: pattern(96, 67) }),
    ],
  ),

  // mGBA's own state file is a PNG: its image is the screenshot, and its chunks
  // carry the core's data and the in-game save beside it. Split, that is a state
  // part, a screenshot, and an ordinary save part, which a consumer can lift
  // into a save bundle of its own. The cartridge's clock stays inside the
  // core's data, and the two clock keys are a reading of it, which that lifted
  // save takes with it. The player's cheats ride on the state part, and stay
  // behind when the save is lifted.
  "state-with-in-game-save": bundle(
    map({
      0: "state",
      1: "gba",
      2: EMERALD,
      3: map({ 2: "mgba", 3: "0.10.5", 4: "mgba", 5: "0.10.5" }),
      7: TAKEN_AT,
      "x.1sav.rtc": map({ 0: new Tag(1, 1793284200) }),
      "x.1sav.rtc.s3511a": map({ 0: Buffer.from([0x26, 0x10, 0x29, 0x04, 0x94, 0x30, 0x00]), 1: 0x40, 2: TAKEN_AT }),
    }),
    [
      statePart({
        id: 0,
        slot: 1,
        extra: new Map([
          ["x.1sav.cheats.mgba", [map({ 0: "Infinite money", 2: ["GSAv1"], 3: ["D8BAE4D9 4864DCE5"] })]],
        ]),
      }),
      screenshot(1),
      part({ id: 2, payload: pattern(131072, 71) }),
    ],
  ),

  // The state an emulator writes on its own to resume from, as RetroArch's
  // `.state.auto` is. Neither it nor its screenshot has a slot, which is fine:
  // no two parts of one kind share an address, and these are two kinds.
  "state-auto": bundle(
    map({ 0: "state", 1: "snes", 3: map({ 2: "retroarch", 4: "snes9x" }), 7: TAKEN_AT, 9: "auto" }),
    [statePart(), screenshot(1)],
  ),

  // A state the emulator kept so a player can take back a save: what slot 2
  // held before it was overwritten. Without a slot, an undo state is the game
  // just before a load.
  "state-undo": bundle(map({ 0: "state", 1: "ps2", 3: map({ 2: "pcsx2", 4: "pcsx2" }), 9: "undo" }), [
    statePart({ slot: 2 }),
  ]),

  // Everything a state can record about what it was taken with: the host's
  // byte order and word size, the BIOS the machine booted, the machine's
  // language setting and the core's options.
  "state-taken-with": bundle(
    map({
      0: "state",
      1: "dreamcast",
      2: SONIC,
      3: map({ 2: "retroarch", 4: "flycast" }),
      7: TAKEN_AT,
      8: map({
        0: "little",
        1: 64,
        2: map({ "dc/dc_boot.bin": [new Tag(18542, pattern(20, 73))] }),
        3: "ja",
        4: map({ reicast_broadcast: "NTSC", reicast_region: "Japan" }),
      }),
    }),
    [statePart()],
  ),

  // A DuckStation state lifted out of its file. The version DuckStation stamps
  // in its own header goes in `format_version`, since the core's data no longer
  // carries it. The producer could not tell which BIOS the machine booted,
  // which null says; leaving the key out would say there was none.
  "state-duckstation": bundle(
    map({ 0: "state", 1: "psx", 3: map({ 2: "duckstation", 4: "duckstation" }), 8: map({ 2: null, 5: 72 }) }),
    [statePart(), screenshot(1, pattern(2048, 79))],
  ),

  // A screenshot on its own, linked to its game and the emulator that took it.
  // PPSSPP writes JPEG, and it stays JPEG: encoding it again could not get back
  // what the first encode dropped.
  screenshot: bundle(
    map({ 0: "screenshot", 1: "psp", 2: map({ 4: "Lumines" }), 3: map({ 2: "ppsspp", 4: "ppsspp" }), 7: TAKEN_AT }),
    [screenshot(0, pattern(4096, 83), "image/jpeg")],
  ),

  // One game's in-game save beside a state and a screenshot of it. Each stays a
  // bundle of its own, so the in-game save's content hash does not move every
  // time a state is taken, and a collection is what puts them in one file.
  "collection-of-one-game": bundle(map({ 0: "collection" }), [
    nested(oneFileSave("gba", EMERALD, pattern(131072, 71)), { id: 0, path: "Pokemon Emerald.sav", game: EMERALD }),
    nested(emeraldState, { id: 1, path: "Pokemon Emerald.ss1", game: EMERALD }),
    nested(emeraldScreenshot, { id: 2, path: "Pokemon Emerald-0.png", game: EMERALD }),
  ]),
};

export const invalid = {
  // `shape` says which document governs the bundle, so it is the one header key
  // that is never optional and never inferred.
  "header-without-shape": bundle(new Map(), [part()]),
  "shape-as-integer": bundle(map({ 0: 0 }), [part()]),

  // Each shape admits a different header. A card is a card because it carries
  // the `card` map, a save never carries one, and a collection has nothing of
  // its own to say.
  "card-without-card-map": bundle(map({ 0: "card", 1: "psx" }), [smallCardEntry]),
  "save-with-card-map": bundle(map({ 0: "save", 1: "psx", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [part()]),
  "collection-with-system": bundle(map({ 0: "collection", 1: "psx" }), [smallEntry]),
  "collection-with-game": bundle(map({ 0: "collection", 2: FF7 }), [smallEntry]),
  "collection-with-card-map": bundle(map({ 0: "collection", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [smallEntry]),

  // `system` is what tells a device from a collection, so it is required, and
  // the components hold saves for many games rather than for one.
  "device-without-system": bundle(map({ 0: "device" }), [smallComponent]),
  "device-with-game": bundle(map({ 0: "device", 1: "sega-cd", 2: FF7 }), [smallComponent]),
  "device-with-card-map": bundle(map({ 0: "device", 1: "sega-cd", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [
    smallComponent,
  ]),

  // `card` needs both format and capacity; neither is optional.
  "card-without-capacity": bundle(map({ 0: "card", 1: "psx", 4: map({ 0: "ps1-mc" }) }), [smallCardEntry]),

  // `dirent` is a byte string. Text would make it look parseable, which is the
  // one thing this spec promises it is not.
  "dirent-as-text": bundle(map({ 0: "save" }), [part({ extra: new Map([[5, "not bytes"]]) })]),

  // `kind` is text. An integer here would be a producer reaching for the old
  // tag numbers, which no longer mean anything.
  "kind-as-integer": bundle(map({ 0: "save" }), [part({ extra: new Map([[1, 46005]]) })]),

  // A bundle with nothing in it. Every other container in the format forbids
  // its own empty form, and a bundle holding no part carries no save.
  "empty-parts": bundle(map({ 0: "save" }), []),

  // A default written out, which would give one part several encodings. Each
  // of the three is written by leaving its key out.
  "path-spelled-empty": bundle(map({ 0: "save" }), [part({ extra: new Map([[3, ""]]) })]),
  "kind-spelled-save": bundle(map({ 0: "save" }), [part({ kind: "save" })]),
  "role-spelled-primary": bundle(map({ 0: "save" }), [part({ role: "primary" })]),

  // A slug has no `_`. A name that breaks the grammar is malformed rather than
  // a later version's, since nobody could have assigned it.
  "role-with-underscore": bundle(map({ 0: "save" }), [part({ role: "memcard_1" })]),
  "kind-with-underscore": bundle(map({ 0: "save" }), [part({ kind: "card_image" })]),

  // A slug separates runs with a single dash and carries none at either end,
  // so a doubled or dangling one is malformed rather than an odd name.
  "slug-with-doubled-dash": bundle(map({ 0: "save" }), [part({ role: "memcard--1" })]),
  "slug-with-trailing-dash": bundle(map({ 0: "save" }), [part({ role: "memcard-" })]),

  // A slug runs to 64 bytes at most. This one is 65.
  "slug-too-long": bundle(map({ 0: "save" }), [part({ role: `a${"-a".repeat(32)}` })]),

  // A slug is lowercase, separates its runs with `-` and holds no `_`, in every
  // field that takes one. A value written any other way is malformed rather
  // than a later version's: round-tripping applies to names this decoder has
  // not heard of, not to names that could not have been assigned.
  "role-with-uppercase": bundle(map({ 0: "save" }), [part({ role: "MemCard" })]),
  "system-slug-with-underscore": bundle(map({ 0: "save", 1: "ps_x" }), [part()]),
  "game-system-with-underscore": bundle(map({ 0: "save", 2: map({ 4: "Sonic Adventure", 5: "drea_mcast" }) }), [
    part(),
  ]),
  "game-system-as-integer": bundle(map({ 0: "save", 2: map({ 5: 1 }) }), [part()]),
  "card-format-with-underscore": bundle(map({ 0: "card", 1: "psx", 4: map({ 0: "ps1_mc", 1: 131072 }) }), [
    smallCardEntry,
  ]),

  // A card format is spec-owned, and a producer may not mint one. An unknown
  // format leaves a consumer unable to write the card back at all, so a
  // reverse-DNS name here is malformed rather than a private extension.
  "card-format-reverse-dns": bundle(map({ 0: "card", 1: "psx", 4: map({ 0: "io.mgba.card", 1: 131072 }) }), [
    smallCardEntry,
  ]),

  // A device kind is spec-owned too, so a minted one is malformed. `app` in the
  // same map names the producer itself and is minted freely, so the two fields
  // of that map pull in opposite directions.
  "device-kind-reverse-dns": bundle(
    map({ 0: "save", 1: "gb", 3: map({ 0: "io.epilogue.operator", 2: "io.epilogue" }) }),
    [part()],
  ),

  // A core's slug derives from the name RetroArch reports, and is not that
  // name. `mGBA` is the core's `library_name` verbatim, which fails the slug
  // arm on case and the reverse-DNS arm for having no dot, so it is malformed
  // rather than a core nobody has listed yet.
  "core-as-library-name": bundle(map({ 0: "save", 1: "gba", 3: map({ 2: "retroarch", 4: "mGBA" }) }), [part()]),

  // The same for a platform written the way it writes its own name. `muOS` is
  // a display name, not a slug, and has no dot to be a minted one.
  "platform-as-display-name": bundle(map({ 0: "save", 1: "gba", 3: map({ 2: "retroarch", 6: "muOS" }) }), [part()]),

  // An offset is the span real zones occupy, -12:00 through +14:00. A day east is
  // no zone at all, and one a consumer would move a clock by.
  "utc-offset-out-of-range": bundle(map({ 0: "save", 1: "gbc", 3: map({ 2: "mister", 8: 86400 }) }), [part()]),

  // Zero is UTC, and anchors on UTC are written by leaving the key out.
  "utc-offset-zero": bundle(map({ 0: "save", 1: "gbc", 3: map({ 2: "mister", 8: 0 }) }), [part()]),

  // A role takes a registry slug and never a minted name. A socket is hardware
  // and belongs to nobody, and a private name for one could not be matched
  // against a target by anything but its author, which is the whole job the
  // field does.
  "role-reverse-dns": bundle(map({ 0: "save" }), [part({ role: "io.mgba.cart-slot" })]),

  // A binding names a category everyone shares, so it is spec-owned too. A
  // private one would split the category instead of extending it, leaving a
  // consumer unable to tell a device binding from an account one.
  "binding-reverse-dns": bundle(map({ 0: "save" }), [part({ binding: "io.mgba.console" })]),

  // A dotted name is a producer's own and therefore has to be a well-formed
  // reverse-DNS name, which forbids `_` in a label. Failing both arms is the
  // point: this is neither a spec slug nor a name anybody could hold.
  "kind-dotted-but-not-reverse-dns": bundle(map({ 0: "save" }), [part({ kind: "io.mgba_rewind" })]),

  // `path` is capped so a consumer can size the head region. 512 is the limit,
  // in bytes rather than characters, since that is what a decoder can check.
  "path-too-long": bundle(map({ 0: "save" }), [part({ path: "a".repeat(513) })]),

  // A path is relative, `/` separates its segments, and no segment is empty,
  // `.` or `..`. Each of these is a second spelling of an address, or one
  // that climbs out of the container it names.
  "path-leading-slash": bundle(map({ 0: "save" }), [part({ path: "/data.bin" })]),
  "path-trailing-slash": bundle(map({ 0: "save" }), [part({ path: "title/" })]),
  "path-empty-segment": bundle(map({ 0: "save" }), [part({ path: "title//data.bin" })]),
  "path-dot-segment": bundle(map({ 0: "save" }), [part({ path: "title/./data.bin" })]),
  "path-dot-dot-segment": bundle(map({ 0: "save" }), [part({ path: "title/../data.bin" })]),

  // A resolver name is minted exactly as an extension key is, so a bare word
  // fails for the same reason: nothing says whose catalog this id is from.
  "resolver-name-not-reverse-dns": bundle(map({ 0: "save", 2: map({ 0: map({ hasheous: 1234 }) }) }), [part()]),

  // An extension key is a reverse-DNS name or it is nothing. Without that there
  // is no way to tell whose key this is, which is the one thing the namespace
  // buys. A bare word and an uppercase name are both unmintable, in `game` as
  // much as on the header or a part.
  "extension-key-not-reverse-dns": bundle(map({ 0: "save", parsed: 1 }), [part()]),
  "extension-key-uppercase": bundle(map({ 0: "save" }), [part({ extra: new Map([["IO.mgba.rtc", 1]]) })]),

  // A reverse-DNS name runs to 255 characters, as a domain does. This one has
  // 256, every label within its own limit.
  "extension-key-too-long": bundle(
    map({ 0: "save", [`io.${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`]: 1 }),
    [part()],
  ),
  "game-extension-key-not-reverse-dns": bundle(map({ 0: "save", 2: map({ 4: "Pokemon Ruby", revision: 1 }) }), [
    part(),
  ]),

  // Tag 1 admits a float and this format does not. Left open, one instant would
  // have two conforming encodings and the content hash would stop being a
  // function of what the bundle says.
  "bundled-at-as-float": bundle(map({ 0: "save", 6: new Tag(1, new Float(1712345678.5)) }), [part()]),

  // A state only loads into the core that took it, so its header has to say
  // which: a core, or the app where nothing runs one.
  "state-without-source": bundle(map({ 0: "state", 1: "gba" }), [smallStatePart()]),
  "state-source-without-core-or-app": bundle(map({ 0: "state", 1: "gba", 3: map({ 0: "emulator", 5: "0.10.5" }) }), [
    smallStatePart(),
  ]),

  // A state part and a screenshot part sit only in the shapes that hold them,
  // so a consumer restoring an in-game save never meets either.
  "state-part-in-a-save": bundle(map({ 0: "save", 1: "gba" }), [smallStatePart()]),
  "screenshot-part-in-a-save": bundle(map({ 0: "save", 1: "gba" }), [part({ id: 0 }), screenshot(1, pattern(16, 59))]),

  // A state part is the core's own data, which has no media type to name.
  "state-part-with-content-type": bundle(map({ 0: "state", 3: MGBA }), [
    smallStatePart({ extra: new Map([[6, "application/octet-stream"]]) }),
  ]),

  // A screenshot names its image type, and the type is one every consumer can
  // show. Anything else is encoded as PNG on the way in.
  "screenshot-without-content-type": bundle(map({ 0: "screenshot" }), [
    part({ kind: "screenshot", payload: pattern(16, 59) }),
  ]),
  "screenshot-as-webp": bundle(map({ 0: "screenshot" }), [screenshot(0, pattern(16, 59), "image/webp")]),

  // A screenshot bundle is one image. Two images are two bundles, which a
  // collection can hold together.
  "screenshot-with-two-images": bundle(map({ 0: "screenshot" }), [
    screenshot(0, pattern(16, 59)),
    screenshot(1, pattern(16, 89)),
  ]),
  "screenshot-holding-a-save": bundle(map({ 0: "screenshot" }), [part()]),

  // A `system` part is an entry on a card that belongs to no game, so it sits on
  // a card and nowhere else, says where on the card it goes, and names no game.
  "system-part-in-a-save": bundle(map({ 0: "save", 1: "ps2" }), [
    part({ id: 0 }),
    part({ id: 1, kind: "system", path: "BWNETCNF/BWNETCNF", payload: pattern(16, 103) }),
  ]),
  "system-part-without-path": card("ps2", "ps2-mc", 8388608, [part({ kind: "system", payload: pattern(16, 107) })]),
  "system-part-naming-a-game": card("ps2", "ps2-mc", 8388608, [
    part({ kind: "system", path: "BWNETCNF", game: FFX, payload: Buffer.alloc(0) }),
  ]),

  // `taken_at` is when a state or a screenshot was taken, which an in-game save
  // has no field for. `taken_with` and `origin` belong to a state alone.
  "taken-at-on-a-save": bundle(map({ 0: "save", 1: "gba", 7: TAKEN_AT }), [part()]),
  "taken-with-on-a-screenshot": bundle(map({ 0: "screenshot", 8: map({ 0: "little" }) }), [
    screenshot(0, pattern(16, 59)),
  ]),
  "origin-on-a-save": bundle(map({ 0: "save", 9: "auto" }), [part()]),

  // An origin names a category everyone shares, so like a binding it is
  // spec-owned, and a minted one is malformed.
  "origin-reverse-dns": bundle(map({ 0: "state", 3: MGBA, 9: "io.mgba.rewind" }), [smallStatePart()]),

  // Each `taken_with` entry takes only its own values, so that one setting has
  // one spelling. A byte order is little or big and a word size 32 or 64 bits.
  // A format version is a number, never the text a file writes it as. A
  // language tag is in BCP 47's own case, with the language in lower case.
  "byte-order-unknown": bundle(map({ 0: "state", 3: MGBA, 8: map({ 0: "middle" }) }), [smallStatePart()]),
  "word-size-16": bundle(map({ 0: "state", 3: MGBA, 8: map({ 1: 16 }) }), [smallStatePart()]),
  "format-version-as-text": bundle(map({ 0: "state", 3: MGBA, 8: map({ 5: "72" }) }), [smallStatePart()]),
  "language-not-canonical": bundle(map({ 0: "state", 3: MGBA, 8: map({ 3: "EN-us" }) }), [smallStatePart()]),

  // An optional map, text or byte string is absent rather than empty: an
  // empty one is a second spelling of absence.
  "empty-game": bundle(map({ 0: "save", 1: "gb", 2: new Map() }), [part()]),
  "empty-part-game": bundle(map({ 0: "save", 1: "gb" }), [part({ game: new Map() })]),
  "empty-source": bundle(map({ 0: "save", 1: "gb", 3: new Map() }), [part()]),
  "empty-taken-with": bundle(map({ 0: "state", 3: MGBA, 8: new Map() }), [smallStatePart()]),
  "empty-description": bundle(map({ 0: "save", 5: "" }), [part()]),
  "empty-serial": bundle(map({ 0: "save", 2: map({ 3: "", 4: "Pokemon Red" }) }), [part()]),
  "empty-dirent": bundle(map({ 0: "save" }), [part({ extra: new Map([[5, Buffer.alloc(0)]]) })]),

  // Empty maps, which absence already encodes.
  "empty-core-options": bundle(map({ 0: "state", 3: MGBA, 8: map({ 4: new Map() }) }), [smallStatePart()]),
  "empty-firmware": bundle(map({ 0: "state", 3: MGBA, 8: map({ 2: new Map() }) }), [smallStatePart()]),

  // A digest has to match the length its algorithm tag implies, and the tag has
  // to be one of the four the shared type defines. Neither is recoverable by
  // guessing, so both are malformed rather than skippable.
  "rom-hash-wrong-length": bundle(map({ 0: "save", 2: map({ 1: [new Tag(18540, pattern(20))] }) }), [part()]),
  "rom-hash-unknown-tag": bundle(map({ 0: "save", 2: map({ 1: [new Tag(9999, pattern(32))] }) }), [part()]),

  // Empty containers, which absence already encodes.
  "empty-rom-hashes": bundle(map({ 0: "save", 2: map({ 1: [] }) }), [part()]),
  "empty-game-id": bundle(map({ 0: "save", 2: map({ 0: new Map() }) }), [part()]),

  // A part's sha256 is exactly 32 bytes; the spec pins the algorithm, so a
  // shorter digest is a different algorithm smuggled in without its tag.
  "part-sha256-wrong-length": bundle(map({ 0: "save" }), [
    part({ extra: new Map([[9, new Tag(18540, pattern(16))]]) }),
  ]),

  // The tag is what lets a generic reader name the digest, so an untagged one
  // is not a hash value at all. A different algorithm's tag is rejected too:
  // this spec pins sha256 here so that identity has exactly one answer.
  "part-sha256-untagged": bundle(map({ 0: "save" }), [part({ extra: new Map([[9, pattern(32)]]) })]),
  "part-sha256-wrong-algorithm": bundle(map({ 0: "save" }), [
    part({ extra: new Map([[9, new Tag(18542, pattern(20))]]) }),
  ]),

  // A pre-renumber bundle, from when the payload sat in the unsigned range.
  // Key 11 is `game` now, and the payload is at -1, so this is rejected rather
  // than read as a game map.
  "payload-at-old-key-8": bundle(map({ 0: "save" }), [
    new Map([
      [0, 0],
      [8, SAVE.length],
      [9, digest(SAVE)],
      [11, SAVE],
    ]),
  ]),

  // A save holds no nested bundle: a component that is a card of its own makes
  // the bundle a device. A state holds none either: a state and an in-game save
  // in one file is a collection of two bundles.
  "save-holding-a-bundle-part": bundle(map({ 0: "save", 1: "n64", 2: MK64 }), [
    part({ id: 0, role: "cartridge", payload: pattern(512, 21), extra: n64Chip("eeprom-4k") }),
    nested(
      bundle(map({ 0: "card", 1: "n64", 4: map({ 0: "n64-cpak", 1: 32768 }) }), [
        nested(smallSave("n64", MK64), { id: 0, role: "controller-pak-1", path: "MARIOKART64", slot: 1 }),
      ]),
      { id: 1, role: "controller-pak-1" },
    ),
  ]),
  "state-holding-a-bundle-part": bundle(map({ 0: "state", 3: MGBA }), [
    smallStatePart(),
    nested(smallSave("gb", POKEMON), { id: 1 }),
  ]),

  // A card's own parts are its saves, each nested, and the entries beside them.
  // A bare save part on a card is a save flattened out of the bundle it
  // belongs in.
  "card-holding-a-bare-save": card("psx", "ps1-mc", 131072, [part({ role: "memcard-1", payload: pattern(16, 5) })]),

  // A device's component sits in a socket, and the role is the whole of what
  // tells two components apart, so it is required.
  "device-component-without-role": bundle(map({ 0: "device", 1: "sega-cd" }), [
    nested(bundle(map({ 0: "save", 1: "sega-cd" }), [part({ payload: pattern(16, 11) })]), { id: 0 }),
  ]),

  // A `bundle` part's media type is this format's by construction, so it names
  // none. It names no binding either: that belongs on the part inside holding
  // the bound bytes.
  "bundle-part-with-content-type": card("psx", "ps1-mc", 131072, [
    (() => {
      const p = nested(smallSave(), { id: 0, role: "memcard-1", path: "BASLUS-00594", slot: 1 });
      p.set(6, "application/vnd.1saves+cbor");
      return p;
    })(),
  ]),
  "bundle-part-with-binding": card("psx", "ps1-mc", 131072, [
    nested(smallSave(), { id: 0, role: "memcard-1", path: "BASLUS-00594", slot: 1, binding: "device" }),
  ]),

  // Part key 12 is an index copy of a nested bundle's `system`, so it sits on a
  // `bundle` part and nowhere else.
  "system-on-a-plain-part": bundle(map({ 0: "save", 1: "gb" }), [part({ system: "gb" })]),

  // A whole card belongs to no one game, so a `card-image` names none.
  "card-image-naming-a-game": bundle(map({ 0: "card", 1: "psx", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [
    part({ role: "memcard-1", payload: pattern(16, 7), kind: "card-image", game: FF7 }),
  ]),

  // `bound_to` comes only with `binding`, and holds only the identifiers its
  // value names: a console's for `device`, never an account's.
  "bound-to-without-binding": bundle(map({ 0: "save", 1: "wii" }), [
    part({ payload: pattern(16), extra: new Map([[14, map({ 0: pattern(4, 3) })]]) }),
  ]),
  "bound-to-naming-another-target": bundle(map({ 0: "save", 1: "wii" }), [
    part({ payload: pattern(16), binding: "device", extra: new Map([[14, map({ 1: pattern(8, 3) })]]) }),
  ]),

  // The file is one tagged item and nothing else. Trailing bytes, the
  // self-describe tag in front, or no bundle tag at all each make it something
  // other than a bundle.
  "trailing-byte": new Raw(Buffer.concat([encode(bundle(map({ 0: "save" }), [part()])), Buffer.from([0x00])])),
  "self-describe-tag": new Tag(55799, bundle(map({ 0: "save" }), [part()])),
  untagged: [map({ 0: "save" }), [part()]],
};

// ---------------------------------------------------------------------------
// Malformed by the *determinism* rules rather than the data model.
//
// RFC 8949 section 4.2 is what makes the content hash a function of what a
// bundle says, and a schema cannot see any of it: CDDL validates the decoded
// data, so every case below decodes to a structurally perfect bundle and would
// pass the schema. A decoder that accepts them computes a different content
// hash from every other decoder, which is the one thing the format cannot
// tolerate. Nothing else in this suite covers these, so they are hand-encoded.
//
// Each is the `minimal` bundle with exactly one encoding rule broken. The
// canonical bytes are:
//
//   da 31534156        tag 827539798
//   82                 array(2)
//   a1                 header: map(1)
//   00 64 73617665       0: "save"                 shape
//   81                 parts: array(1)
//   a3                 part: map(3)
//   00 00                 0: 0                      id
//   09 d9486c 5820 …      9: 18540(h'…32 bytes…')   sha256
//   20 44 53415645       -1: h'SAVE'                payload

const MINIMAL_HEAD = "da3153415682a100647361766581";
const PART_ID = "0000";
const PART_SHA = "09d9486c5820" + sha256(SAVE).toString("hex");
const PART_PAYLOAD = "204453415645";
const hex = (...parts) => new Raw(Buffer.from(parts.join(""), "hex"));

export const malformedDeterminism = {
  // 9f/ff is an indefinite-length array. Definite lengths everywhere is the
  // first thing 4.2 requires, and an encoder that streams without knowing its
  // length ahead of time produces this without meaning to.
  "indefinite-length-parts": hex("da3153415682a1006473617665", "9f", "a3", PART_ID, PART_SHA, PART_PAYLOAD, "ff"),
  "indefinite-length-part-map": hex(MINIMAL_HEAD, "bf", PART_ID, PART_SHA, PART_PAYLOAD, "ff"),

  // 18 00 encodes 0 in two bytes where 00 does it in one. Preferred
  // serialization means the shortest head that fits, and a library that always
  // writes a fixed width emits this.
  "non-preferred-key-head": hex(MINIMAL_HEAD, "a3", "1800", "00", PART_SHA, PART_PAYLOAD),
  "non-preferred-value-head": hex(MINIMAL_HEAD, "a3", "00", "1800", PART_SHA, PART_PAYLOAD),

  // Keys sort by the bytewise order of their encodings. Here 9 precedes 0,
  // which decodes to the same map and hashes differently.
  "map-keys-out-of-order": hex(MINIMAL_HEAD, "a3", PART_SHA, PART_ID, PART_PAYLOAD),

  // Two entries for key 0. A decoder that keeps the last one and a decoder
  // that keeps the first disagree about what the bundle says.
  "duplicate-map-key": hex(MINIMAL_HEAD, "a4", PART_ID, "0001", PART_SHA, PART_PAYLOAD),

  // A byte string has a definite length too. 5f/ff is the payload sent in two
  // chunks, which decodes to the same four bytes.
  "indefinite-length-payload": hex(MINIMAL_HEAD, "a3", PART_ID, PART_SHA, "20", "5f", "425341", "424645", "ff"),

  // A length is a head like any other, so it takes the shortest form that fits.
  // A streaming encoder that reserves four bytes for a length writes this.
  "non-preferred-length-head": hex(MINIMAL_HEAD, "a3", PART_ID, PART_SHA, "20", "5a00000004", "53415645"),

  // Parts sit in strictly ascending `id` order. This one holds id 1 then id 0,
  // which decodes to the same two parts and hashes differently. The parts sit
  // in different slots, so nothing else about them is wrong.
  "parts-out-of-order": bundle(map({ 0: "save" }), [
    part({ id: 1, slot: 2 }),
    part({ id: 0, slot: 1, payload: pattern(16, 3) }),
  ]),

  // Strictly ascending means no two parts share an `id`, so nothing says which
  // of the two an extension key names.
  "parts-share-an-id": bundle(map({ 0: "save" }), [
    part({ id: 0, slot: 1 }),
    part({ id: 0, slot: 2, payload: pattern(16, 3) }),
  ]),

  // Text is in NFC. "Pokémon" written with a combining acute (U+0065 U+0301)
  // rather than the precomposed é (U+00E9) is the same string to a reader and
  // a different one to a hash. Real catalogues carry both forms.
  "text-not-nfc": bundle(map({ 0: "save", 1: "gb", 2: map({ 4: "Pok\u0065\u0301mon Red" }) }), [part()]),

  // Hash values sort ascending by tag, so sha1 (18542) after sha256 (18540).
  // Reversed here.
  "rom-hashes-out-of-order": bundle(
    map({ 0: "save", 2: map({ 1: [new Tag(18542, pattern(20, 7)), new Tag(18540, pattern(32, 11))] }) }),
    [part()],
  ),

  // At most one entry per algorithm. Two sha256 digests name two different
  // files, and nothing says which one the bundle means.
  "rom-hashes-duplicate-algorithm": bundle(
    map({ 0: "save", 2: map({ 1: [new Tag(18540, pattern(32, 13)), new Tag(18540, pattern(32, 17))] }) }),
    [part()],
  ),

  // The ordering rule holds for every list of hash values, a firmware file's
  // in `taken_with` as much as `rom_hashes`.
  "firmware-hashes-out-of-order": bundle(
    map({
      0: "state",
      3: MGBA,
      8: map({ 2: map({ "gba_bios.bin": [new Tag(18542, pattern(20, 7)), new Tag(18540, pattern(32, 11))] }) }),
    }),
    [smallStatePart()],
  ),

  // The encoding rules hold at every depth. This card's save sets its part's
  // `id` in two bytes where one does, and the outer `sha256` is over those
  // bytes, so only the encoding is wrong.
  "nested-bundle-not-canonical": card("psx", "ps1-mc", 131072, [
    part({
      id: 0,
      role: "memcard-1",
      path: "BASLUS-00594",
      slot: 1,
      kind: "bundle",
      system: "psx",
      payload: Buffer.from("da3153415682a2006473617665016370737881a3" + "1800" + PART_SHA + PART_PAYLOAD, "hex"),
    }),
  ]),
};

// ---------------------------------------------------------------------------
// Malformed by rules that need a look inside a payload or an extension value,
// or a comparison across parts or maps.
//
// The schema checks what each map holds, but not what sits inside a nested
// bundle's bytes or under an extension key, and not a rule that compares one
// value with another. These are the cases an implementation has to catch on
// its own.

const innerSave = bundle(map({ 0: "save", 1: "psx", 2: MGS }), [part({ payload: pattern(16, 5) })]);

export const malformedStructure = {
  // A `bundle` part's payload has to decode as a bundle at all, and as a shape
  // its holder may hold. This one is a plain save's bytes.
  "bundle-part-payload-not-a-bundle": card("psx", "ps1-mc", 131072, [
    part({ id: 0, role: "memcard-1", path: "BASLUS-00594", kind: "bundle", payload: pattern(16, 5), system: "psx" }),
  ]),

  // A collection never holds another collection.
  "collection-in-a-collection": bundle(map({ 0: "collection" }), [
    nested(bundle(map({ 0: "collection" }), [smallEntry]), { id: 0 }),
  ]),

  // A card holds saves and nothing nested beyond them, and a device holds cards
  // and saves.
  "card-holding-a-card": card("psx", "ps1-mc", 131072, [
    nested(bundle(map({ 0: "card", 1: "psx", 4: map({ 0: "ps1-mc", 1: 131072 }) }), [smallCardEntry]), {
      id: 0,
      role: "memcard-1",
    }),
  ]),
  "device-holding-a-collection": bundle(map({ 0: "device", 1: "sega-cd" }), [
    smallComponent,
    nested(bundle(map({ 0: "collection" }), [smallEntry]), { id: 1, role: "ram-cart" }),
  ]),
  "device-holding-a-state": bundle(map({ 0: "device", 1: "gba" }), [
    nested(bundle(map({ 0: "state", 3: MGBA }), [smallStatePart()]), { id: 0, role: "cartridge" }),
  ]),

  // One bad part makes the whole bundle malformed, however deep it sits. The
  // card and its first save are fine; the second save writes out a default,
  // so the card is malformed too, and a decoder keeps neither save.
  "nested-save-spelling-out-a-default": card("psx", "ps1-mc", 131072, [
    smallCardEntry,
    nested(bundle(map({ 0: "save", 1: "psx", 2: FF7 }), [part({ role: "primary", payload: pattern(16, 3) })]), {
      id: 1,
      role: "memcard-1",
      path: "BASCUS-94163FF7-S01",
      slot: 2,
    }),
  ]),

  // A part's `sha256` is the digest of its payload. Here it names other bytes,
  // so a decoder handing the payload out would hand out something corrupt.
  "part-sha256-mismatch": bundle(map({ 0: "save", 1: "gb" }), [
    part({ extra: new Map([[9, new Tag(18540, sha256(Buffer.from("something else")))]]) }),
  ]),

  // The outer sha256 is the inner bundle's identity, which is what makes
  // extracting a save a byte copy. Here it names bytes the payload is not.
  "bundle-part-sha256-mismatch": card("psx", "ps1-mc", 131072, [
    (() => {
      const p = nested(innerSave, { id: 0, role: "memcard-1", path: "BASLUS-00594" });
      p.set(9, new Tag(18540, sha256(Buffer.from("something else"))));
      return p;
    })(),
  ]),

  // No two parts may agree on `role`, `path` and `slot` together, and with all
  // three defaulting to absence two bare parts collide on every one of them.
  // That is a bundle a consumer cannot name a part in, or match against a
  // target, so it cannot act on it at all.
  "parts-share-an-address": bundle(map({ 0: "save" }), [part({ id: 0 }), part({ id: 1, payload: pattern(16, 19) })]),

  // A device's components never share a role, whatever else tells them apart.
  // These two differ in `path`, which the ordinary addressing rule would allow.
  "device-components-share-a-role": bundle(map({ 0: "device", 1: "sega-cd" }), [
    smallComponent,
    nested(bundle(map({ 0: "save", 1: "sega-cd" }), [part({ payload: pattern(16, 13) })]), {
      id: 1,
      role: "internal",
      path: "second",
    }),
  ]),

  // A part's `game` that equals the header's is a default spelled out, since
  // a part with none takes the header's. On a card of one game, that makes an
  // index copy on each save's part a second spelling of the same card.
  "part-game-equal-to-header": bundle(map({ 0: "save", 1: "gb", 2: POKEMON }), [part({ game: POKEMON })]),
  "card-of-one-game-with-index-copies": cardOfOneGame(true),

  // Every part of one card names the same socket, or none does: a card sat in
  // one slot when it was read.
  "card-parts-disagree-on-role": card("psx", "ps1-mc", 131072, [
    smallCardEntry,
    nested(smallSave("psx", FF7), { id: 1, role: "memcard-2", path: "BASCUS-94163FF7-S01", slot: 2 }),
  ]),

  // A state bundle holds exactly one state part. Without one there is nothing
  // to load, and with two a consumer cannot tell which one the bundle is.
  "state-without-a-state-part": bundle(map({ 0: "state", 3: MGBA }), [screenshot(0, pattern(16, 59))]),
  "state-with-two-state-parts": bundle(map({ 0: "state", 3: MGBA }), [
    smallStatePart({ id: 0, slot: 1 }),
    smallStatePart({ id: 1, slot: 2, payload: pattern(16, 97) }),
  ]),

  // And at most one screenshot, since the screenshot is the state's picture.
  // A screenshot part takes no `role`, `path` or `slot`, so two of them also
  // share an address: a decoder may catch this by either rule.
  "state-with-two-screenshots": bundle(map({ 0: "state", 3: MGBA }), [
    smallStatePart(),
    screenshot(1, pattern(16, 59)),
    screenshot(2, pattern(16, 101)),
  ]),

  // A `system` file sits in a directory that has a `system` part of its own,
  // ahead of the file's, so a writer has made the directory before it reaches
  // the file. Here the directory is missing, and then it comes too late.
  "system-file-without-its-directory": card("ps2", "ps2-mc", 8388608, [
    part({ kind: "system", path: "BWNETCNF/icon.sys", dirent: pattern(512, 8), payload: pattern(16, 9) }),
  ]),
  "system-file-before-its-directory": card("ps2", "ps2-mc", 8388608, [
    part({ id: 0, kind: "system", path: "BWNETCNF/icon.sys", dirent: pattern(512, 8), payload: pattern(16, 9) }),
    part({ id: 1, kind: "system", path: "BWNETCNF", dirent: pattern(512, 7), payload: Buffer.alloc(0) }),
  ]),

  // A Neo Geo save's `path` is its NGH number in four lowercase hex digits, a
  // dash, then its sub-number in one more. Sub-number 10 is `a` and NGH 201 is
  // `0201`, so neither of these is how a producer spells them.
  "neogeo-path-uppercase": neogeoCard({ path: "0201-A", dirent: Buffer.from([0x0a, 0x02, 0x01, 0x05]) }),
  "neogeo-path-unpadded": neogeoCard({ path: "201-0" }),

  // A `dirent` is as long as its card's format makes it. A Neo Geo entry is
  // four bytes, and this one stops at three. A PS1 entry is 128 bytes, and
  // this one is 127.
  "dirent-wrong-length": neogeoCard({ dirent: Buffer.from([0x00, 0x02, 0x01]) }),
  "ps1-dirent-wrong-length": card("psx", "ps1-mc", 131072, [
    nested(smallSave(), { id: 0, role: "memcard-1", path: "BASLUS-00594", slot: 1, dirent: pattern(127, 3) }),
  ]),

  // A Neo Geo card's `system_area` is its whole 64-byte header block, which
  // carries the cardholder username and the card's region. The username alone
  // is 16 bytes and leaves the region behind.
  "neogeo-system-area-only-the-username": neogeoCard({}, pattern(16, 79)),

  // An N64 note's `path` is its name decoded through the pak's character
  // table, which has no lowercase letters. So this spelling cannot have come
  // from a note, and a producer leaves `path` out rather than invent one.
  "n64-path-outside-the-table": n64Pak("MarioKart64"),

  // A note's name is 16 bytes, so its spelling runs to 16 characters at most
  // before any extension. This one has 17 and no extension. Its extension is 4
  // bytes, so the next one has 5 after the dot.
  "n64-path-longer-than-a-note-name": n64Pak("MARIOKART64DELUXE"),
  "n64-path-extension-too-long": n64Pak("MARIOKART64.ABCDE"),

  // An N64 cartridge's chip fixes how long its payload is. A 16 Kbit EEPROM is
  // 2048 bytes, and this payload is the 512 of a 4 Kbit one, which is the
  // mix-up the key is there to prevent.
  "n64-cartridge-wrong-size": n64Cartridge(YOSHI, "eeprom-16k", { size: 512 }),

  // The chip names count kilobits, as the chips are sold. This one counts the
  // payload in KiB instead, so it is no chip the key's page lists, and a
  // consumer could not say how long the save should be.
  "n64-chip-undefined": n64Cartridge(OOT, "sram-32k", { size: 32768 }),

  // The value is a map whose key 0 names the chip. A bare name is not one.
  "n64-chip-not-a-map": bundle(map({ 0: "save", 1: "n64", 2: SM64 }), [
    part({ role: "cartridge", payload: pattern(512, 21), extra: new Map([["x.1sav.n64", "eeprom-4k"]]) }),
  ]),

  // The `cartridge` part of an N64 save says which chip it holds. Neither the
  // bytes nor their length can say it for the part.
  "n64-cartridge-without-its-chip": n64Cartridge(MK64, null, { size: 512 }),

  // The same inside a device and inside a state. The part has the role
  // `cartridge` in a bundle naming `n64`, so it is marked as a cartridge's
  // however deep it sits and whatever shape holds it.
  "n64-device-cartridge-without-its-chip": n64Device(n64Cartridge(MK64, null, { size: 512 })),
  "n64-state-cartridge-without-its-chip": bundle(
    map({ 0: "state", 1: "n64", 2: MK64, 3: map({ 2: "retroarch", 4: "mupen64plus-next" }) }),
    [smallStatePart({ id: 0, slot: 1 }), part({ id: 1, role: "cartridge", payload: pattern(512, 21) })],
  ),

  // The key goes on the part holding the chip's memory and nowhere else. A
  // header, the `bundle` part wrapping a device's cartridge save, a note's own
  // save, a `game` map and a Game Boy cartridge's part each hold something
  // other than an N64 chip.
  "n64-chip-on-the-header": bundle(map({ 0: "save", 1: "n64", 2: MK64, "x.1sav.n64": map({ 0: "eeprom-4k" }) }), [
    part({ role: "cartridge", payload: pattern(512, 21), extra: n64Chip("eeprom-4k") }),
  ]),
  "n64-chip-on-a-bundle-part": n64Device(n64Cartridge(MK64, "eeprom-4k"), { extra: n64Chip("eeprom-4k") }),
  "n64-chip-on-a-note": n64PakWithNote(n64Chip("eeprom-4k")),
  "n64-chip-in-a-game-map": bundle(
    map({ 0: "save", 1: "n64", 2: map({ 3: "NUS-NKTE", 4: "Mario Kart 64", "x.1sav.n64": map({ 0: "eeprom-4k" }) }) }),
    [part({ role: "cartridge", payload: pattern(512, 21), extra: n64Chip("eeprom-4k") })],
  ),
  "n64-chip-on-a-gb-cartridge": bundle(map({ 0: "save", 1: "gb", 2: POKEMON }), [
    part({ role: "cartridge", payload: pattern(512, 47), extra: n64Chip("eeprom-4k") }),
  ]),

  // A cartridge has one save chip, so a bundle naming `n64` holds one
  // `cartridge` part at most. These two differ only in `path`.
  "n64-two-cartridge-parts": bundle(map({ 0: "save", 1: "n64", 2: MK64 }), [
    part({ id: 0, role: "cartridge", path: "eeprom", payload: pattern(512, 21), extra: n64Chip("eeprom-4k") }),
    part({ id: 1, role: "cartridge", path: "sram", payload: pattern(32768, 23), extra: n64Chip("sram-256k") }),
  ]),

  // A Controller Pak is a card, and a note is a save on it. No part of a save
  // names a card's slot, so a note beside the cartridge's part is a save
  // flattened out of the card it belongs on.
  "n64-note-as-a-save-part": bundle(map({ 0: "save", 1: "n64", 2: MK64 }), [
    part({ id: 0, role: "cartridge", payload: pattern(512, 21), extra: n64Chip("eeprom-4k") }),
    part({ id: 1, role: "controller-pak-1", path: "MARIOKART64", slot: 1, payload: pattern(256) }),
  ]),

  // A 64DD disk's save holds its RAM area in one `save` part with no role, which
  // is how a decoder finds it. A role, or a second save part, leaves it unable
  // to tell which bytes are the area.
  "n64dd-disk-with-a-role": bundle(map({ 0: "save", 1: "n64dd" }), [
    part({ role: "cartridge", payload: pattern(1942080, 89) }),
  ]),
  "n64dd-disk-with-two-save-parts": bundle(map({ 0: "save", 1: "n64dd" }), [
    part({ id: 0, payload: pattern(1942080, 89) }),
    part({ id: 1, path: "extra", payload: pattern(16, 3) }),
  ]),

  // A 64DD disk's save is the whole of its RAM area, which no disk type makes
  // 32 KiB long. A save of part of the area cannot be told from a disk of
  // another type.
  "n64dd-disk-wrong-size": bundle(map({ 0: "save", 1: "n64dd" }), [part({ payload: pattern(32768, 89) })]),
};

// ---------------------------------------------------------------------------
// What a later version adds. A schema describes one version exactly, so each
// of these fails it. A decoder is looser on purpose: it accepts each, keeps it,
// and writes it back byte for byte, since the only thing an unfamiliar integer
// key or a new name in a list the spec owns can be is a later version's.

export const roundTrip = {
  // An integer key nobody has assigned yet, on a part and on the header.
  "part-unknown-integer-key": bundle(map({ 0: "save" }), [part({ extra: new Map([[15, "later"]]) })]),
  "header-unknown-integer-key": bundle(map({ 0: "save", 16: "later" }), [part()]),

  // A shape this version does not define. A decoder keeps the bundle, and
  // declines anything that depends on knowing what the shape means.
  "shape-unknown": bundle(map({ 0: "save-state" }), [part()]),

  // A card format this version does not list. A consumer keeps the card and
  // declines to write it, since it cannot rebuild what it cannot read.
  "card-format-unknown": bundle(map({ 0: "card", 1: "ps3", 4: map({ 0: "ps3-mc", 1: 131072 }) }), [
    nested(smallSave("ps3", map({ 4: "Unknown" })), { id: 0, path: "SAVE0" }),
  ]),

  // A new name in each of the other lists the spec owns. A kind the decoder does
  // not know is handled as `aux`; the rest are labels it carries.
  "kind-unknown": bundle(map({ 0: "save", 1: "gba" }), [
    part({ id: 0 }),
    part({ id: 1, kind: "thumbnail", payload: pattern(16, 3) }),
  ]),
  "binding-unknown": bundle(map({ 0: "save", 1: "wii" }), [part({ binding: "region" })]),
  "origin-unknown": bundle(map({ 0: "state", 3: MGBA, 9: "rewind" }), [smallStatePart()]),
  "device-kind-unknown": bundle(map({ 0: "save", 1: "gb", 3: map({ 0: "phone", 2: "io.example.app" }) }), [part()]),
};
