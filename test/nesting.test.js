// The nesting rules, checked by decoding a `bundle` part's payload back. The
// schema reaches inside one with `.cbor`, but what it checks is the decoded
// data; these tests look at the bytes themselves.
//
// These tests take care not to be circular. Asserting that the fixture's
// declared sha256 matches a hash of the fixture's own payload would only prove
// that the helper which built both used the same buffer twice. What is checked
// instead is that the bytes sitting in the encoded card, found by searching for
// them, decode as a bundle and hash to the value the outer part declares.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decode, encode, encodedKeyLayout, everyPart, map, sha256 } from "./cbor.js";
import { ps1Card, ps2Card, valid } from "./bundles.js";

const BUNDLE_TAG = 827539798;
const PAYLOAD = -1;
const SHA256 = 9;
const GAME = 11;
const SYSTEM = 12;

const nestedEntries = (fixture) => [...everyPart(fixture)].filter((e) => e.kind === "bundle" && e.bundle);

describe("nested bundles", () => {
  it("carries a payload that decodes as a saves-file", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { bundle: inner } of nestedEntries(fixture)) {
        assert.equal(inner.number, BUNDLE_TAG, `${name}: inner payload carries the bundle tag`);
        assert.equal(inner.value.length, 2, `${name}: inner bundle is a 2-element array`);
      }
    }
  });

  it("is extractable as a byte slice, and that slice is the save", () => {
    const bytes = encode(ps1Card);

    for (const { part: p } of nestedEntries(ps1Card)) {
      const payload = p.get(PAYLOAD);
      const at = bytes.indexOf(payload);
      assert.ok(at > 0, `save ${p.get(0)}'s bundle appears verbatim in the card`);

      const sliced = bytes.subarray(at, at + payload.length);
      assert.equal(decode(sliced).number, BUNDLE_TAG, "the slice is a bundle on its own");
      assert.ok(sha256(sliced).equals(p.get(SHA256).value), "and hashes to what the card says it does");
    }
  });

  it("re-encodes to the same bytes, so the hash is a content hash", () => {
    for (const { part: p, bundle: inner } of nestedEntries(ps2Card)) {
      assert.ok(encode(inner).equals(p.get(PAYLOAD)), "decode then encode is the identity");
    }
  });

  // No depth is written down. What a bundle may hold follows from its shape,
  // and nothing in that chain leads back to itself, so checking each nested
  // bundle against its holder is what bounds the depth.
  const HOLDS = {
    card: ["save"],
    device: ["card", "save"],
    collection: ["save", "state", "screenshot", "card", "device"],
  };

  it("nests only the shapes each holder allows", () => {
    const check = (name, fixture) => {
      const holder = fixture.value[0].get(0);
      for (const p of fixture.value[1]) {
        if (p.get(1) !== "bundle") continue;
        const inner = decode(p.get(PAYLOAD));
        const shape = inner.value[0].get(0);
        assert.ok((HOLDS[holder] ?? []).includes(shape), `${name}: a ${holder} holds a ${shape}`);
        check(name, inner);
      }
    };
    for (const [name, fixture] of Object.entries(valid)) check(name, fixture);
  });

  it("reaches past two levels where the shapes allow it", () => {
    const depths = [...everyPart(valid["collection-of-devices"])].map((e) => e.depth);
    assert.equal(Math.max(...depths), 3, "collection, device, card and save");
  });

  // The index copy is the one thing here that can rot silently: nothing breaks
  // at encode time if it disagrees with the header it claims to summarise.
  it("carries a `system` index matching the bundle it wraps", () => {
    for (const [name, fixture] of Object.entries(valid)) {
      for (const { part: p, bundle: inner } of nestedEntries(fixture)) {
        assert.equal(p.get(SYSTEM), inner.value[0].get(1), `${name}: entry ${p.get(0)}'s system index matches`);
      }
    }
  });

  // Entry 1's keys necessarily sit after entry 0's blob, since parts serialize
  // in order, so the property is per-entry rather than file-wide: each entry's
  // index data comes before its own payload. That is what lets a consumer list
  // a collection by reading part maps and skipping blobs rather than decoding
  // them.
  it("lets a collection be listed without decoding an entry", () => {
    for (const p of valid.collection.value[1]) {
      const { offsets } = encodedKeyLayout(p);
      for (const key of [GAME, SYSTEM]) {
        if (!p.has(key)) continue;
        assert.ok(offsets.get(key) < offsets.get(PAYLOAD), `entry ${p.get(0)}: key ${key} precedes its own payload`);
      }
    }
  });
});

// The bug the flat model had, pinned so it cannot come back: a card holds
// several saves for one game, and nothing in the game map tells them apart.
describe("several saves for one game", () => {
  const ff7 = nestedEntries(ps1Card).filter(({ part: p }) => p.get(GAME)?.get(3) === "SCUS-94163");

  it("keeps them as separate saves despite identical game maps", () => {
    assert.equal(ff7.length, 2);
    assert.ok(
      encode(ff7[0].part.get(GAME)).equals(encode(ff7[1].part.get(GAME))),
      "the game maps really are byte-identical, which is what broke the flat model",
    );
  });

  it("tells them apart by slot and path", () => {
    assert.notEqual(ff7[0].part.get(4), ff7[1].part.get(4));
    assert.notEqual(ff7[0].part.get(3), ff7[1].part.get(3));
  });

  it("gives each one its own content hash", () => {
    assert.ok(!ff7[0].part.get(SHA256).value.equals(ff7[1].part.get(SHA256).value));
  });
});
