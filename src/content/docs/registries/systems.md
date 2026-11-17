---
title: System Slugs
description: The canonical slug for every known gaming system.
---

A system slug is the canonical short name of a gaming system. The
[Universal Saves Format](/specifications/bundle/#0-header-map) carries it in the `system` header field, and other specs
use the same names wherever a system is identified.

A slug follows the [slug grammar](/specifications/common-types/slug/) every vocabulary in these specifications shares:
lowercase ASCII, single hyphens between runs, at most 64 bytes. Each system has exactly one slug. The **Also seen as**
column records names other tools use for the same system (directory names, core names, database labels); they help a
producer map its input to the right slug, and are never emitted.

A slug names **one system, not a family**. Successive generations get their own slug even where their media are
compatible, so `psx` and `ps2` are separate despite a PS2 reading PS1 cards. Emulators support a system rather than a
family, and file-format compatibility is not system identity. Converting a PS2 card for a PS1 emulator is meaningless.
Keeping the slugs apart is what lets a tool decline it by ordinary matching instead of a special case. Where two systems
genuinely are interchangeable for some purpose, that is a policy the tool holds, not a fact the slug carries.

A revision that has software of its own is a system of its own: `dsi`, `new-3ds`, `amiga-aga`, `coco-3` and `msx2-plus`
each run games the model before them cannot. A save names the system its game was made for, so a Game Boy game played on
a Game Boy Color is a `gb` save, and a DS game played on a DSi an `nds` one. A model that runs the same games as another
is that system: an XEGS is an `atari-800`, a C16 a `commodore-plus-4`, an FM Towns Marty an `fm-towns`, and a Super Game
Boy a `gb`.

The list covers every system a save, a state or a card can come from: consoles and handhelds, add-ons with media of
their own such as the Satellaview, home computers with games of their own, and software platforms that games are made
for, such as ScummVM, the Z-machine and PICO-8. It leaves out general-purpose operating systems, calculators, devices
that play a single game, and groupings such as plug-and-play TV games, which are many systems under one name.

A new slug puts a hyphen between words, and puts its maker's name first where the bare name is a model number or names
something else, as `casio-pv-1000` and `watara-supervision` do. Some older slugs, such as `pcengine` and `mastersystem`,
were registered before that and keep their spelling.

Arcade is the exception that rule cannot absorb, and `mame` is the slug for it. An arcade board's identity is its
romset, and nothing above that level is worth naming. A CPS2 board, a System 16 and an MVS cabinet share no medium, no
save layout and no consumer that would treat them alike. So a slug per board family would carry information nobody
matches on. The slug says the bytes came off an arcade machine catalogued by MAME, and which machine lives in
[`game_id`](/specifications/bundle/#game-hints-map) under `org.mamedev`. `neogeo` stays separate from it because a
cabinet and an AES take the same memory card, which is a medium a consumer really does treat alike.

The list is **non-normative** and first-come; to add a system, open a PR with a row in alphabetical order.

| Slug                       | System                       | Also seen as                                                                                                    |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `3do`                      | 3DO                          | `threedo`, `panasonic`                                                                                          |
| `3ds`                      | Nintendo 3DS                 | `n3ds`                                                                                                          |
| `acorn-archimedes`         | Acorn Archimedes             | `archimedes`, `archie`, `arch`                                                                                  |
| `acorn-atom`               | Acorn Atom                   | `atom`, `acornatom`                                                                                             |
| `acorn-electron`           | Acorn Electron               | `electron`, `acornelectron`                                                                                     |
| `adventure-vision`         | Adventure Vision             | `advision`, `adventurevision`, `avision`                                                                        |
| `ags`                      | Adventure Game Studio        |                                                                                                                 |
| `amiga`                    | Amiga                        | `amiga500`, `amiga600`, `commodore_amiga`, `minimig`, `acd`                                                     |
| `amiga-aga`                | Amiga AGA                    | `amiga1200`, `amiga4000`, `aga`                                                                                 |
| `amiga-cd32`               | Amiga CD32                   | `amigacd32`, `cd32`, `amigacd`                                                                                  |
| `amstrad-cpc`              | Amstrad CPC                  | `amstradcpc`, `cpc`, `amstrad`                                                                                  |
| `amstrad-gx4000`           | GX4000                       | `gx4000`                                                                                                        |
| `apf-m1000`                | APF M-1000                   | `apfm1000`                                                                                                      |
| `apogee-bk-01`             | Apogee BK-01                 |                                                                                                                 |
| `apple-ii`                 | Apple II                     | `apple2`, `apple_ii`                                                                                            |
| `apple-iigs`               | Apple IIGS                   | `apple2gs`                                                                                                      |
| `arcadia-2001`             | Arcadia 2001                 | `arcadia`                                                                                                       |
| `arduboy`                  | Arduboy                      |                                                                                                                 |
| `astrocade`                | Bally Astrocade              | `astrocde`                                                                                                      |
| `atari-2600`               | Atari 2600                   | `2600`, `atari2600`, `atari_2600`, `a26`                                                                        |
| `atari-5200`               | Atari 5200                   | `5200`, `atari5200`, `atari_5200`, `a52`, `fiftytwohundred`                                                     |
| `atari-7800`               | Atari 7800                   | `7800`, `atari7800`, `atari_7800`, `seventyeighthundred`                                                        |
| `atari-800`                | Atari 8-bit computers        | `atari800`, `atarixe`, `xegs`, `atari8bit`, `eighthundred`                                                      |
| `atari-falcon`             | Atari Falcon                 | `falcon`                                                                                                        |
| `atari-jaguar`             | Atari Jaguar                 | `jaguar`, `atarijaguar`, `atari_jaguar`                                                                         |
| `atari-jaguar-cd`          | Atari Jaguar CD              | `atarijaguarcd`, `jaguarcd`, `ajcd`                                                                             |
| `atari-lynx`               | Atari Lynx                   | `lynx`, `atarilynx`, `atari_lynx`                                                                               |
| `atari-st`                 | Atari ST                     | `atarist`, `atari_st`                                                                                           |
| `bandai-super-vision-8000` | Super Vision 8000            | `sv8000`, `supervision8000`, `super_vision_8000`                                                                |
| `bbc-bridge-companion`     | BBC Bridge Companion         | `bbcbridgecompanion`                                                                                            |
| `bbc-micro`                | BBC Micro                    | `bbcmicro`                                                                                                      |
| `c128`                     | Commodore 128                | `commodore_c128`                                                                                                |
| `c64`                      | Commodore 64                 | `commodore64`, `commodore_c64`                                                                                  |
| `c64-dtv`                  | C64 Direct-to-TV             | `c64dtv`, `x64dtv`                                                                                              |
| `camputers-lynx`           | Camputers Lynx               | `camplynx`, `lynx48`                                                                                            |
| `casio-loopy`              | Loopy                        | `loopy`                                                                                                         |
| `casio-pv-1000`            | PV-1000                      | `pv1000`, `casio_pv-1000`                                                                                       |
| `casio-pv-2000`            | PV-2000                      | `pv2000`, `casio_pv-2000`                                                                                       |
| `cassette-vision`          | Cassette Vision              | `cassettevision`, `epochcv`                                                                                     |
| `cd-i`                     | Philips CD-i                 | `cdimono1`, `cdi`                                                                                               |
| `cdtv`                     | CDTV                         | `amigacdtv`                                                                                                     |
| `channel-f`                | Channel F                    | `channelf`, `channel_f`, `fairchild`, `chf`                                                                     |
| `chip-8`                   | CHIP-8                       | `chip_8`, `chip8`                                                                                               |
| `coco`                     | TRS-80 Color Computer        | `coco2`                                                                                                         |
| `coco-3`                   | TRS-80 Color Computer 3      | `coco3`                                                                                                         |
| `coleco-adam`              | Coleco Adam                  | `adam`, `colecoadam`                                                                                            |
| `colecovision`             | ColecoVision                 | `coleco`, `cv`                                                                                                  |
| `colour-genie`             | Colour Genie                 | `cgenie`, `eg2000`                                                                                              |
| `commander-x16`            | Commander X16                | `commander_x16`, `commanderx16`                                                                                 |
| `commodore-pet`            | Commodore PET                | `pet`, `commodore_pet`, `pet2001`, `xpet`                                                                       |
| `commodore-plus-4`         | Commodore Plus/4             | `plus4`, `cplus4`, `commodore_plus4`, `c16`, `xplus4`                                                           |
| `creativision`             | CreatiVision                 | `crvision`                                                                                                      |
| `dos`                      | MS-DOS                       | `pc`, `pcxt`, `ao486`, `pcjr`, `tandy1000`                                                                      |
| `dragon-32`                | Dragon 32                    | `dragon32`, `dragon64`, `tanodragon`                                                                            |
| `dreamcast`                | Dreamcast                    | `dc`                                                                                                            |
| `dsi`                      | Nintendo DSi                 | `nintendodsi`                                                                                                   |
| `easyrpg`                  | RPG Maker 2000 and 2003      |                                                                                                                 |
| `elektronika-bk`           | Elektronika BK               | `bk`, `ebk`, `bk0011m`                                                                                          |
| `enterprise-128`           | Enterprise 128               | `enterprise`, `ep128`                                                                                           |
| `fds`                      | Famicom Disk System          | `famicomdisk`                                                                                                   |
| `flash`                    | Adobe Flash                  |                                                                                                                 |
| `fm-7`                     | FM-7                         | `fm7`                                                                                                           |
| `fm-towns`                 | FM Towns                     | `fmtowns`, `fm_towns`, `fmt`, `marty`                                                                           |
| `galaksija`                | Galaksija                    |                                                                                                                 |
| `gamate`                   | Gamate                       |                                                                                                                 |
| `game-and-watch`           | Game & Watch                 | `gameandwatch`, `gw`, `gamenwatch`, `gnw`                                                                       |
| `game-com`                 | Game.com                     | `gamecom`                                                                                                       |
| `game-king`                | GameKing                     | `gameking`                                                                                                      |
| `game-pocket-computer`     | Game Pocket Computer         | `gamepock`                                                                                                      |
| `gametank`                 | GameTank                     |                                                                                                                 |
| `game-wave`                | Game Wave                    | `gamewave`                                                                                                      |
| `gb`                       | Game Boy                     | `gameboy`, `sgb`                                                                                                |
| `gba`                      | Game Boy Advance             | `gameboyadvance`, `game_boy_advance`                                                                            |
| `gbc`                      | Game Boy Color               | `gameboycolor`                                                                                                  |
| `gc`                       | GameCube                     | `gamecube`, `ngc`                                                                                               |
| `genesis`                  | Sega Genesis                 | `megadrive`, `md`, `mega_drive`, `megadrivejp`                                                                  |
| `gizmondo`                 | Gizmondo                     |                                                                                                                 |
| `gp2x`                     | GP2X                         |                                                                                                                 |
| `gp32`                     | GP32                         |                                                                                                                 |
| `hartung-game-master`      | Game Master                  | `gmaster`                                                                                                       |
| `hitachi-basic-master`     | Hitachi Basic Master         |                                                                                                                 |
| `homelab`                  | Homelab                      |                                                                                                                 |
| `hyperscan`                | HyperScan                    | `hs`                                                                                                            |
| `intellivision`            | Intellivision                | `intv`                                                                                                          |
| `interact`                 | Interact Home Computer       |                                                                                                                 |
| `interton-vc-4000`         | VC 4000                      | `vc4000`                                                                                                        |
| `iq151`                    | IQ 151                       |                                                                                                                 |
| `ique-player`              | iQue Player                  | `ique`, `bbplayer`                                                                                              |
| `j2me`                     | Java ME                      | `java`                                                                                                          |
| `jupiter-ace`              | Jupiter Ace                  |                                                                                                                 |
| `laser-310`                | Laser 310                    | `laser310`, `laser`                                                                                             |
| `leapster`                 | Leapster                     |                                                                                                                 |
| `lowres-nx`                | LowRes NX                    | `lowresnx`                                                                                                      |
| `lutro`                    | Lutro                        |                                                                                                                 |
| `mame`                     | Arcade                       | `arcade`, `fbneo`, `fba`, `cps1`, `cps2`, `cps3`, `naomi`, `naomi2`, `atomiswave`, `model2`, `model3`, `daphne` |
| `mastersystem`             | Master System                | `sms`, `master_system`, `mark3`, `ms`                                                                           |
| `mattel-aquarius`          | Mattel Aquarius              | `aquarius`                                                                                                      |
| `mc-10`                    | TRS-80 MC-10                 | `mc10`                                                                                                          |
| `mega-duck`                | Mega Duck                    | `megaduck`, `mega_duck`                                                                                         |
| `mega-ld`                  | LaserActive Mega-LD          |                                                                                                                 |
| `memotech-mtx`             | Memotech MTX                 |                                                                                                                 |
| `microw8`                  | MicroW8                      | `uw8`                                                                                                           |
| `msx`                      | MSX                          | `msx1`                                                                                                          |
| `msx2`                     | MSX2                         |                                                                                                                 |
| `msx2-plus`                | MSX2+                        | `msx2plus`, `msx2p`                                                                                             |
| `msx-turbo-r`              | MSX turbo R                  | `msxturbor`                                                                                                     |
| `mugen`                    | M.U.G.E.N                    |                                                                                                                 |
| `my-vision`                | My Vision                    | `myvision`                                                                                                      |
| `n64`                      | Nintendo 64                  | `nintendo_64`                                                                                                   |
| `n64dd`                    | Nintendo 64DD                | `64dd`                                                                                                          |
| `national-jr-100`          | National JR-100              |                                                                                                                 |
| `nds`                      | Nintendo DS                  |                                                                                                                 |
| `neogeo`                   | Neo Geo                      | `ng`                                                                                                            |
| `neogeo-cd`                | Neo Geo CD                   | `neocd`, `neogeocd`, `neo_geo_cd`, `ngcd`, `neogeocdjp`                                                         |
| `nes`                      | NES                          | `famicom`, `fc`, `dendy`                                                                                        |
| `new-3ds`                  | New Nintendo 3DS             | `new3ds`                                                                                                        |
| `n-gage`                   | N-Gage                       | `ngage`                                                                                                         |
| `ngp`                      | Neo Geo Pocket               | `neogeopocket`                                                                                                  |
| `ngpc`                     | Neo Geo Pocket Color         | `neogeopocketcolor`                                                                                             |
| `nuon`                     | Nuon                         |                                                                                                                 |
| `odyssey2`                 | Odyssey²                     | `videopac`, `odyssey`                                                                                           |
| `ondra`                    | Ondra                        |                                                                                                                 |
| `openbor`                  | OpenBOR                      |                                                                                                                 |
| `orao`                     | Orao                         |                                                                                                                 |
| `oric`                     | Oric                         | `oricatmos`                                                                                                     |
| `pc-6001`                  | PC-6001                      | `pc60`, `pc6001`                                                                                                |
| `pc-8001`                  | PC-8001                      | `pc80`, `pc8001`                                                                                                |
| `pc-88`                    | PC-8801                      | `pc88`, `pc_88`, `pc8801`, `pceightyeight`                                                                      |
| `pc-98`                    | PC-9801                      | `pc98`, `np2pi`, `pc_98`, `pcninetyeight`                                                                       |
| `pcengine`                 | PC Engine / TurboGrafx-16    | `pce`, `tg16`, `turbografx16`, `pc_engine`, `tgfx16`                                                            |
| `pcenginecd`               | PC Engine CD / TurboGrafx-CD | `pcecd`, `tg-cd`, `tgcd`, `tgfx16-cd`                                                                           |
| `pc-engine-ld`             | LaserActive LD-ROM²          |                                                                                                                 |
| `pcfx`                     | PC-FX                        | `pc_fx`, `pc-fx`                                                                                                |
| `p-ece`                    | P/ECE                        | `piece`                                                                                                         |
| `philips-p2000`            | Philips P2000                |                                                                                                                 |
| `pico-8`                   | PICO-8                       | `pico8`, `p8`                                                                                                   |
| `pippin`                   | Pippin                       |                                                                                                                 |
| `playdate`                 | Playdate                     |                                                                                                                 |
| `playdia`                  | Playdia                      | `qis`                                                                                                           |
| `pmd-85`                   | PMD 85                       |                                                                                                                 |
| `pocket-challenge-v2`      | Pocket Challenge V2          | `pocketchallengev2`, `pc2`, `pcv2`                                                                              |
| `pocketstation`            | PocketStation                |                                                                                                                 |
| `pokemon-mini`             | Pokémon Mini                 | `pokemini`, `pokemon_mini`, `pokemonmini`, `poke`                                                               |
| `ps2`                      | PlayStation 2                | `playstation2`                                                                                                  |
| `ps3`                      | PlayStation 3                | `playstation3`                                                                                                  |
| `ps4`                      | PlayStation 4                | `playstation4`                                                                                                  |
| `ps5`                      | PlayStation 5                | `playstation5`                                                                                                  |
| `psp`                      | PlayStation Portable         | `playstation_portable`                                                                                          |
| `psvita`                   | PlayStation Vita             | `vita`, `psv`, `playstation_vita`                                                                               |
| `psx`                      | PlayStation                  | `playstation`, `ps1`                                                                                            |
| `puzzlescript`             | PuzzleScript                 |                                                                                                                 |
| `pyxel`                    | Pyxel                        |                                                                                                                 |
| `rca-studio-ii`            | RCA Studio II                | `studio-ii`                                                                                                     |
| `rx-78`                    | Gundam RX-78                 | `rx78`                                                                                                          |
| `sam-coupe`                | SAM Coupé                    | `samcoupe`, `sam_coupe`                                                                                         |
| `satellaview`              | Satellaview                  | `bs-memory`, `bsx`, `bs-x`                                                                                      |
| `saturn`                   | Sega Saturn                  | `sega_saturn`, `ss`, `saturnjp`                                                                                 |
| `sc-3000`                  | Sega SC-3000                 | `sc3000`                                                                                                        |
| `scummvm`                  | ScummVM                      |                                                                                                                 |
| `sega-32x`                 | Sega 32X                     | `32x`, `sega32x`, `s32x`, `thirtytwox`, `sega32xjp`, `sega32xna`                                                |
| `sega-ai`                  | Sega AI Computer             |                                                                                                                 |
| `sega-beena`               | Advanced Pico Beena          | `beena`                                                                                                         |
| `sega-cd`                  | Sega CD                      | `segacd`, `scd`, `megacd`, `mcd`, `megacdjp`                                                                    |
| `sega-gg`                  | Game Gear                    | `gamegear`, `gg`                                                                                                |
| `sega-pico`                | Sega Pico                    | `pico`                                                                                                          |
| `sg-1000`                  | SG-1000                      | `sg1000`, `segasgone`                                                                                           |
| `sharp-mz-2000`            | MZ-2000                      | `mz2000`                                                                                                        |
| `sharp-mz-2500`            | MZ-2500                      | `mz2500`, `sharpmz2500`                                                                                         |
| `sharp-mz-700`             | MZ-700                       | `mz700`                                                                                                         |
| `sharp-mz-800`             | MZ-800                       | `mz800`                                                                                                         |
| `sharp-mz-80k`             | MZ-80K                       | `mz80k`                                                                                                         |
| `sharp-x1`                 | Sharp X1                     | `x1`, `sharp_x1`, `sharpx1`, `xone`                                                                             |
| `sinclair-ql`              | Sinclair QL                  |                                                                                                                 |
| `snes`                     | Super Nintendo               | `sfc`, `super_nes`, `snesna`                                                                                    |
| `socrates`                 | VTech Socrates               |                                                                                                                 |
| `solarus`                  | Solarus                      |                                                                                                                 |
| `sony-smc-777`             | Sony SMC-777                 |                                                                                                                 |
| `sord-m5`                  | Sord M5                      |                                                                                                                 |
| `specialist`               | Specialist                   |                                                                                                                 |
| `spectravideo`             | Spectravideo SV-318          | `svi328`                                                                                                        |
| `sufami-turbo`             | SuFami Turbo                 | `sufami`                                                                                                        |
| `super-acan`               | Super A'Can                  | `supracan`, `superacan`                                                                                         |
| `super-cassette-vision`    | Super Cassette Vision        | `scv`, `super_cassette_vision`                                                                                  |
| `supergrafx`               | SuperGrafx                   | `sgx`, `sgfx`                                                                                                   |
| `switch`                   | Nintendo Switch              | `nsw`, `ns`                                                                                                     |
| `switch-2`                 | Nintendo Switch 2            | `switch2`                                                                                                       |
| `tandy-vis`                | Tandy VIS                    | `vis`                                                                                                           |
| `tatung-einstein`          | Tatung Einstein              |                                                                                                                 |
| `thomson-mo`               | Thomson MO                   |                                                                                                                 |
| `thomson-to`               | Thomson TO                   | `to8`                                                                                                           |
| `ti-99-4a`                 | TI-99/4A                     | `ti99`, `ti994a`, `ti-99_4a`                                                                                    |
| `tic-80`                   | TIC-80                       | `tic80`, `tic`                                                                                                  |
| `tomy-tutor`               | Tomy Tutor                   | `tutor`, `tomytutor`                                                                                            |
| `trs-80`                   | TRS-80                       | `trs80`                                                                                                         |
| `tsconf`                   | TS-Conf                      |                                                                                                                 |
| `tv-boy`                   | TV Boy                       | `ctvboy`                                                                                                        |
| `uknc`                     | UKNC                         |                                                                                                                 |
| `uxn`                      | Uxn                          | `varvara`                                                                                                       |
| `uzebox`                   | Uzebox                       |                                                                                                                 |
| `vector-06c`               | Vector-06C                   |                                                                                                                 |
| `vectrex`                  | Vectrex                      |                                                                                                                 |
| `v-flash`                  | V.Flash                      | `vflash`                                                                                                        |
| `vic-20`                   | VIC-20                       | `vic20`, `c20`, `commodore_vic20`, `xvic`                                                                       |
| `videobrain`               | VideoBrain                   |                                                                                                                 |
| `videopac-plus`            | Videopac+                    | `videopacplus`                                                                                                  |
| `videoton-tvc`             | Videoton TVC                 | `tvc`                                                                                                           |
| `vircon32`                 | Vircon32                     |                                                                                                                 |
| `virtualboy`               | Virtual Boy                  | `vb`, `virtual_boy`                                                                                             |
| `visual-memory`            | Visual Memory Unit           | `vmu`, `vemulator`, `vms`                                                                                       |
| `v-smile`                  | V.Smile                      | `vsmile`                                                                                                        |
| `wasm-4`                   | WASM-4                       | `wasm4`                                                                                                         |
| `watara-supervision`       | Supervision                  | `supervision`, `sv`                                                                                             |
| `wii`                      | Wii                          |                                                                                                                 |
| `wii-u`                    | Wii U                        | `wiiu`                                                                                                          |
| `wonderswan`               | WonderSwan                   | `ws`, `wswan`                                                                                                   |
| `wonderswan-color`         | WonderSwan Color             | `wsc`, `wonderswancolor`, `wswanc`                                                                              |
| `x68000`                   | X68000                       | `sharp_x68000`, `x68k`                                                                                          |
| `xbox`                     | Xbox                         |                                                                                                                 |
| `xbox-360`                 | Xbox 360                     | `xbox360`, `xbox_360`                                                                                           |
| `xbox-one`                 | Xbox One                     | `xboxone`                                                                                                       |
| `xbox-series`              | Xbox Series X and S          | `xboxseries`                                                                                                    |
| `zeebo`                    | Zeebo                        |                                                                                                                 |
| `z-machine`                | Z-machine                    | `zmachine`                                                                                                      |
| `zx81`                     | ZX81                         | `zxeightyone`                                                                                                   |
| `zx-spectrum`              | ZX Spectrum                  | `zxspectrum`, `zx_spectrum`, `spectrum`, `zxs`, `zx-spectrum-128`, `spec`                                       |
| `zx-spectrum-next`         | ZX Spectrum Next             | `zxnext`                                                                                                        |
