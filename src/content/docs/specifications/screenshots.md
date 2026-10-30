---
title: Screenshots
description: The `screenshot` shape, which is one image of a game's screen, and the rules for any screenshot part.
---

A `screenshot` bundle is one image of what a game showed, tied to the game and to the emulator that took it. A
[state](/specifications/states/) carries the same kind of image as its own picture, in a `screenshot` part. This shape
is for one that travels on its own.

## Header

`shape` is `"screenshot"`.

| Key | Name          | Req? | Notes                                                        |
| --- | ------------- | ---- | ------------------------------------------------------------ |
| 0   | `shape`       | yes  | `"screenshot"`.                                              |
| 1   | `system`      | no   | The system the game runs on.                                 |
| 2   | `game`        | no   | The game on the screen.                                      |
| 3   | `source`      | no   | What took it: the app, and the core where one ran.           |
| 5   | `description` | no   | Free-form note.                                              |
| 6   | `bundled_at`  | no   | When the bundle was assembled, not when the image was taken. |
| 7   | `taken_at`    | no   | When the screenshot was taken.                               |

`card`, `taken_with` and `origin` are forbidden. The full definitions are in the
[header map](/specifications/bundle/#0-header-map).

## Parts

One part, of kind `screenshot`, and nothing else. Two images are two bundles, and a
[collection](/specifications/collections/) holds them together.

## The image

These rules hold for a `screenshot` part wherever it sits, in this shape or in a state.

- `content_type` is required, and is `image/png` or `image/jpeg`. A new type comes from a PR against this spec.
- A producer **SHOULD** keep a PNG or a JPEG as the emulator wrote it. Encoding a JPEG again as PNG cannot recover what
  the first encode dropped, and makes the file several times larger.
- A producer **MUST** encode any other image as PNG. That covers a raw framebuffer, such as the ones mGBA and
  DuckStation keep inside their state files.
- A consumer that rebuilds an emulator's file converts the image to whatever that file holds. Showing one needs no
  conversion, since any image library reads both types.

## The smallest valid screenshot

```text
827539798([
  { 0: "screenshot", 1: "snes" },
  [ { 0: 0, 1: "screenshot", 6: "image/png", 9: 18540(h'…32 bytes…'), -1: h'…the PNG…' } ]
])
```
