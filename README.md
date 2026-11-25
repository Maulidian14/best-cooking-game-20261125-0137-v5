# Sizzle & Serve — the rush-hour kitchen

[![Sizzle & Serve](https://img.shields.io/badge/game-Sizzle%20%26%20Serve-orange)](https://make.fun/c/best-cooking-game-20261125-0137)
[![make.fun bounty](https://img.shields.io/badge/make.fun-best%20cooking%20game-blue)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Prize pool $250](https://img.shields.io/badge/prize%20pool-%24250-gold)](https://make.fun/c/best-cooking-game-20261125-0137)

A fast-paced 2D cooking game for the [make.fun "Make the best cooking game" bounty](https://make.fun/c/best-cooking-game-20261125-0137). One chef, one kitchen, one very busy shift: take tickets from the order board, grab ingredients in the pantry, chop veg on the board, grill patties and pasta on the stove, build the dish on the plating counter, and carry it to SERVE before the timer runs out. Three strikes and the shift is over — fast serves build your combo and your tip.

## How to play

- **WASD / arrow keys** — walk the chef. **Click** a station (or open floor) to walk there instead.
- **E / Space / click a station on arrival** — use it: pick up an ingredient, place it to chop or cook, add it to the plate, pick the plate up, serve it.
- **Q** — take the last item back off the plate. **P / Esc** — pause. **M** — mute.

## The kitchen

- **Order board** — up to 4 tickets at once, each with its own timer. Serve before it runs out.
- **Pantry** — 7 ingredients, endless supply: bun, patty, lettuce, tomato, cheese, pasta, sauce.
- **Chopping board** — lettuce and tomato become chopped in 1.6 s.
- **Stove** — 2 burners. Patties grill in 5 s, pasta in 6 s. Leave a finished cook too long and it burns.
- **Plating counter** — build the dish, up to 5 items, then carry the plate to the window.
- **Serve window** — a plate only scores when it matches a ticket exactly. Wrong plate: a strike.

## The dishes

| Dish | Needs | Pays |
| --- | --- | --- |
| Classic Burger | bun, grilled patty, chopped lettuce, chopped tomato | $12 |
| Cheese Burger | bun, grilled patty, cheese, chopped tomato | $14 |
| Garden Salad | chopped lettuce, chopped tomato, cheese | $9 |
| Pasta Marinara | cooked pasta, sauce | $11 |
| Deluxe Burger | bun, grilled patty, cheese, chopped lettuce, chopped tomato | $18 |

Pasta Marinara unlocks at level 2, Deluxe Burger at level 3. Every 4 serves raises the level: tickets arrive faster and their timers shrink. A serve pays the dish price plus a time bonus, multiplied by your combo (up to 2×).

## The details

- All art is drawn with canvas paths and all sound is synthesised with WebAudio — no image or audio files, no network requests, no libraries.
- The source is split into files with one clear job each: `config` (numbers, stations, recipes), `random` (seeded RNG), `input` (keyboard + mouse), `audio` (synth SFX + music loop), `particles` (steam, chop bits, floating scores), `world` (rules, orders, scoring), `render` (everything the eye sees), `shots` (the staged screenshot scenes), `main` (boot + game loop).
- Screenshots are real renders of the game's own code: `?shot=start|play|rush|end&seed=N` stages each scene by playing the real rules forward with a scripted autopilot.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
