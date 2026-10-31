# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ForgeSmith tells a player which **Spell Smith** filter combination (edition, color, rarity, CMC) is cheapest, on average, for getting one specific card in [Forge](https://github.com/Card-Forge/forge) Adventure mode. The UI is localized (English default, pt-BR); never hardcode user-facing strings in components.

## Commands

```bash
npm run dev                          # Vite dev server
npm run build                        # tsc --noEmit + vite build (readable output)
npm run build:release                # build + obfuscate dist/assets (what the Docker image ships)
npx tsc --noEmit                     # type-check only; there is no linter and no test suite
npm run data -- <forge-checkout>     # regenerate public/data/smith.json from a Forge checkout

docker compose up -d --build                           # web on :8080 (FORGESMITH_PORT), updater
docker compose exec updater python updater.py --once   # force a data refresh now
docker compose logs -f updater
```

A Forge checkout only needs `forge-gui/res/{cardsfolder,editions,adventure/common}`. The README has the sparse-clone commands.

README screenshots (`docs/screenshots/`) come from the running Docker site, via headless Chrome: `--headless=new --lang=en-US --blink-settings=preferredColorScheme=0 --force-device-scale-factor=2 --window-size=1440,900 --virtual-time-budget=12000 --screenshot=<file> <url>` (card page: `1440,1600`, `#Jace%2C%20the%20Mind%20Sculptor`). Chrome does not exit after writing the file, so kill it, then `sips --resampleWidth 1800`.

## Architecture

There are three pieces, and they share one data contract, `smith.json`:

1. **`scripts/build_data.py`** rebuilds the Smith card pool from Forge's resource files, following what Forge does at runtime:
   - **Pool:** `RewardData.getAllCards` / `CardUtil.getFullCardPool`. Cards excluded by `config.json` (`restrictedCards`, `restrictedEditions`), conjured-only cards and `RemoveDeck:NonCommander` cards are dropped.
   - **Unique print:** the newest non-Special printing (Forge's `LATEST_ART_ALL_EDITIONS`). It sets the card's rarity when no edition filter is on.
   - **Smith edition list (`SpellSmithScene.loadEditions`):** excludes Reprint/Promo/Collector_Edition types and sets dated today or later. A set is listed only if it is the unique print of at least one pool card.
   - **Rarity inside an edition:** the card's first entry in that set (`CardEdition.getCardInSet(...).get(0)`).
   - **Mana parsing uses Forge's script syntax, not Scryfall's.** Hybrid is `GW`, mono-hybrid is `2R` (CMC 2), phyrexian is `BP`. Split cards (`AlternateMode:Split`) combine both halves' color and CMC; every other layout uses the front face.
   - **Output is compact:** `cards` are `[name, colorMask, cmc, rarity]`, with mask bits W=1 U=2 B=4 R=8 G=16 (0 = colorless). Each edition stores `cards` (card indexes) plus a parallel `rarities` string. Writes are atomic (`write()`), because nginx may be serving the file at that moment.

2. **`src/lib/smith.ts`** is a port of Forge's `forge-gui-mobile/.../scene/SpellSmithScene.java` (`filterResults`, `pullCard`, `declineSmithing`). Keep it in sync with that file.
   - **Price:** `int(125 × goldModifier × multipliers)`, computed with `Math.fround` to reproduce Java float math. The multipliers are edition ×4; colors ×min(n×2.5, 6), where colorless counts as one button; rarity C 1.5 / U 2.5 / R 4 / M 5.5; CMC ×2.5. Shards cost `int(price × 0.2)`.
   - **Decline** costs `int(price × 0.1)`. **Accept** costs the full price.
   - **Color filter is an exact match** on the color mask. Selecting only Red never returns a red/green card.
   - **Search space:** for each "context" (no edition, plus every edition containing the target), `countSubsets` counts the pool for all 8 color/rarity/CMC subsets in one pass.
   - **Cost metrics:** `expected = price + decline × (pool − 1)`, because pulls are uniform over the pool. `worstCase` is the 90th percentile of that geometric distribution.
   - **Sanity check after touching the math** (gold, modifier 1): Glorybringer → AKH + color, pool 40, price 1250, expected 6125, worst case 12500.

3. **UI (`src/App.tsx` + `src/components/`)**
   - **State and routing:** state lives in `App`. Routing is just the URL hash (`#<exact card name>`). With no card selected, `Home` renders: a Scryfall-style hero whose fanned featured cards are stacked left-to-right so every card name stays visible.
   - **External assets:** card images (`api.scryfall.com/cards/named`) and set/mana symbols (`svgs.scryfall.io`) load from Scryfall at runtime. Edition icons use each edition's `ScryfallCode`.
   - **i18n (`src/i18n/`, no library):** `en.ts` is the source of truth and defines the `Messages` type. Other dictionaries (`pt-BR.ts`) are typed against it, so a missing key fails `tsc`. Messages that involve numbers are functions (plurals live there) and take numbers already formatted by `useI18n().number`.
   - **Locale-aware helpers** (`delta`, `dateTime`, `colorNames`, `editionType`) come from `useI18n()`. `src/lib/format.ts` only holds locale-independent helpers.
   - **Locale resolution:** footer choice saved in `localStorage['forgesmith.locale']` → `navigator.languages` (exact tag, then base language, so `pt-PT` → `pt-BR`) → `en`. A new language is a new dictionary plus an entry in `LOCALES` (`src/i18n/index.tsx`).

## Deployment model

- **One multi-stage `Dockerfile`**, whose targets `compose` uses:
  - **`build`**: node, runs `build:release`.
  - **`web`**: nginx.
  - **`updater`**: python + git, non-root.
- **Updater (`scripts/updater.py`):**
  - Keeps a shallow, blobless, sparse Forge clone in the `forge-checkout` volume.
  - Runs once on start, then daily at `UPDATE_TIME_UTC`.
  - Rebuilds data even when the Forge commit hasn't changed, because sets become available by release date.
  - On failure, retries after `RETRY_MINUTES`.
- **nginx (`docker/nginx.conf`):**
  - Serves `/data/smith.json` with `try_files /live/smith.json /data/smith.json`. `live/` is the updater's volume, mounted read-only with `nocopy`. The fallback is the snapshot baked into the image from `public/data/smith.json`.
  - The data file and `index.html` are `no-cache`, and the client also fetches with `cache: 'no-cache'`. `/assets/` (hashed names) is immutable.
- **Obfuscation:**
  - `vite.config.ts` puts `node_modules` in a `vendor-*.js` chunk (Rolldown `codeSplitting.groups`).
  - `build:release` obfuscates everything in `dist/assets` **except** `vendor-*.js`, using `obfuscator.json`.
  - If you rename the vendor chunk, update the `--exclude` glob too, or React gets obfuscated: about 3.5× the size and slower.
  - `controlFlowFlattening` is kept low because `countSubsets` loops over every card on each selection.
