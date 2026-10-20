---
title: Platforms
description: Known operating systems and firmwares that apps run on, and their canonical slugs.
---

A platform is the operating system or firmware an [app](/registries/apps/) runs on: a handheld firmware such as muOS, a
distribution built around emulation such as Batocera, or a general-purpose system such as Windows. The Universal Saves
Format carries it in a [`source`](/specifications/bundle/#source-map)'s `platform` field, beside the app in `app`,
because one app ships on many platforms and one platform ships many apps.

The slug is what a producer writes in `platform` when a save was produced on that platform. A platform listed here MUST
use its slug rather than a reverse-DNS name, even if it holds a domain, so that one platform has one spelling. A slug is
the name the platform already goes by, lowercased, with every run of other characters replaced by a single `-`. The
result conforms to the [slug grammar](/specifications/common-types/slug/) every vocabulary here shares.

A producer names the most specific platform it knows. A handheld running KNULLI is `knulli`, not `linux`, though KNULLI
is a Linux distribution; `linux` is for a desktop distribution that is not listed. A device whose firmware loads cores
itself, such as the Analogue Pocket, is an app rather than a platform and is listed in the
[Apps registry](/registries/apps/), so no name appears in both.

The list is **non-normative** and first-come; to add a platform, open a PR with a row, alphabetical by slug.

| Slug       | Platform |
| ---------- | -------- |
| `android`  | Android  |
| `arkos`    | ArkOS    |
| `batocera` | Batocera |
| `ios`      | iOS      |
| `knulli`   | KNULLI   |
| `lakka`    | Lakka    |
| `linux`    | Linux    |
| `macos`    | macOS    |
| `minui`    | MinUI    |
| `muos`     | muOS     |
| `onion`    | Onion    |
| `rocknix`  | ROCKNIX  |
| `spruce`   | spruceOS |
| `windows`  | Windows  |
