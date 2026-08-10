# Phase 4 — the Atlas

For Claude Code, branch `redesign-2026`. Follow `design-handoff/AGENTS.md` for all values.
References: `Atlas.dc.html` (page shell), `map-atlas.html` (working map — read the JS, it is the implementation), `Mobile.dc.html` frame **M3** (Atlas at 390px).

Phase 3 shipped as `edd9d08`. This phase creates one new route and touches every page's nav.

Order: **1. homepage width fix → 2. nav site-wide → 3. Atlas page → 4. map → 5. filters → 6. mobile → 7. loose ends.** Sections 1 and 2 are mechanical; 3–6 are the phase. Stop for review after 2, after 4, and at the end.

---

## 0. Decisions taken this phase

| # | Question | Decision |
|---|---|---|
| 1 | Filter chips scope | **Both.** Chips filter the map's data layer *and* the country index below it. A chip that changes half the page reads as broken. §5. |
| 2 | Mobile map | **Keep the map.** It is the reason the page exists, and most traffic is mobile. Three touch fixes required — §6. |
| 3 | Homepage double-width bug | **Fold into this phase**, as its own first commit. One-line CSS fix in a sheet this phase already opens. §1. |
| 4 | Map delivery | **Vendored, not CDN, not an iframe.** §4.1. The README's "hydrated island / `client:visible`" note assumes a framework this repo doesn't have — it's vanilla JS on a static build. Ignore that line. |
| 5 | Saawaan 7.7 | **Now 7.2.** Rescored onto the six axes. §7.1. |
| 6 | Map content inventory | **Verify before use.** The prototype's `places` array is from Phase 0 and its sibling docs have been wrong twice this project. §3.4 / §9. |
| 7 | The recount (added 3 Aug, after §3–4 built) | True numbers are **11 / 09 / 13**, matching the homepage band. 13 countries, not 4 — which invalidates §3.3's 4-column grid and §5's 4-chip country axis as originally written. Both corrected below. |

**Docs to correct alongside this spec:** `README.md` §8 says the map is an iframe and names a CDN URL — both superseded here. Its "Responsive → the map needs larger touch targets (`r: 5` is far too small)" note is already satisfied in the prototype's `COMPACT` branch; don't re-derive it.

---

## 1. Homepage double-width fix

Pre-existing from Phase 2, found while building Phase 3. `.home-jakarta-table` (via `.latest`) sets `width: var(--container-width)`, and its `.section-heading` / `.collection-grid` children each set it *again*. `--container-width` is a fluid formula; nesting it inside itself resolves against the already-narrowed parent, so the children land at 1080px instead of 1120px — a stray 20px inset on each side, visible against every other homepage section.

Fix: remove `width: var(--container-width)` from the **children**, not the parent. Grep the sheet for other instances of the same nesting before you finish — this is a pattern bug, not a one-off. Phase 3's `.trip-feature-head`, `.trip-row` and `.trip-reading-flow` are already clean; don't touch them.

Verify the Jakarta heading and cards measure 1120px at 1440px viewport and align with `.home-hero` above them.

Commit this on its own, before section 2:

```
Fix nested container-width on homepage Jakarta table
```

---

## 2. Nav — insert the Atlas, site-wide

Phase 3 shipped a 3-item nav on the explicit promise that Atlas arrives when the page exists. It exists this phase.

```html
<nav class="nav-links" aria-label="Main navigation">
  <a href="../travel/index.html">Travel</a>
  <a href="../food/index.html">Food</a>
  <a href="../atlas/index.html">The Atlas</a>
  <a href="../work-with-nutnibbles/index.html">Work with me</a>
</nav>
```

- **All 40 pages**, depth-relative, same as Phase 3. Not 24 — that number is stale in every doc that predates Phase 3.
- Label is **"The Atlas"**, matching M3's menu and the footer.
- Order: Atlas sits third, before "Work with me". Work-with-me stays last on every surface.
- `aria-current="page"` on `atlas/index.html` itself; preserve it wherever it already is.
- **Footer too** — Phase 3's footer columns are Travel+Food / Japan guide / Work with me. The Atlas joins the first column: `Travel · Food · The Atlas`.
- `templates/` still untouched. That's Phase 5.

Check the 4-item nav doesn't overflow at 375px — Phase 3 measured the 3-item nav at exactly viewport width in the stacked ≤520px header, so this is the tightest it has been. If it overflows, reduce the nav's `gap` at that breakpoint; do not shrink the font below 11.5px and do not truncate the label to "Atlas".

---

## 3. `atlas/index.html` — new route

New directory, new page. Reference `Atlas.dc.html`.

### 3.1 Route and head

- Path `atlas/index.html` → URL `/atlas/`, matching `travel/` and `food/`.
- Full `<head>` parity with the other hubs: title, meta description, canonical `https://nutsnibbles.cc/atlas/`, OG + Twitter tags, favicon block, fonts. `check:meta` enforces this.
- **Add it to the sitemap** — `check:sitemap` fails otherwise. Follow however `travel/index.html` is registered; don't hand-edit generated output.
- OG image: reuse the site default. There's no Atlas-specific social image and I'd rather ship none than a screenshot of an empty map.

### 3.2 Page structure

Header → `.hub-title` → filter chips → map → index by country → footer.

**`.hub-title`** (the shared component from Phase 3 §3.2, third use). Eyebrow "The Atlas", h1 "Every pin is a meal I can still describe." Deck: "Browse by place. Click a country to zoom into its cities." Right meta slot takes the three stat blocks — 52px Instrument Serif numerals over DM Mono labels, first numeral terracotta.

The stat values are **derived, not typed** — see §3.4. Confirmed as **11 food notes / 09 trips / 13 countries**, the same three the homepage band already shows. Same labels, same order, same numbers on both surfaces — if they ever disagree, one of them is lying.

The third number only holds up if the map pins all 13. It does; see §3.3 and §4.2.

### 3.3 Index by country

`repeat(4, 1fr)`, `gap: 32px`, wrapping — **ten blocks, not four columns.** The recount found 13 countries, 9 of them with written entries: Japan, Indonesia, Thailand, New Zealand, UK, Hong Kong, South Korea, Switzerland, France. Order them by written-entry count, descending.

The tenth block is **"Also on the route"** — Italy, Germany, Netherlands, Belgium, the four Europe Winter 2020 countries with nothing written. They are pinned on the map, so they must be accounted for in the index; without this block a JS-off reader sees 9 countries under a stat that says 13. Rows are `<span>`s at `opacity: .55` reading "Unwritten", the same treatment §3.3 already specifies, under a heading with no count. One block, four rows — cheaper than four near-empty columns and honest about why they're there.

Per block: a heading row (`border-bottom: 2px solid var(--ink)`, `padding-bottom: 12px`) with an Instrument Serif 32px country name and a DM Mono count, terracotta when the list is still growing; then rows — each a real `<a>`, flex `space-between` on baseline, `padding: 15px 0`, `border-bottom: 1px solid var(--rule)`, Newsreader 19px place name against DM Mono 10.5px uppercase metadata.

Unwritten entries render at `opacity: .55` with "In progress" / "Next trip" and are **not links** — a `<span>`, not an `<a href="#">`. `check:links` will catch a dead href; more to the point, a link that goes nowhere is a lie.

Every written row links to the real page. Verify each slug against the actual file before writing it.

### 3.4 One data source

The map's pins, the country index, and the three stat numbers are the same data. Define it **once** — a single `places` array in the map's JS module, with the index list and stats rendered from it, or a small JSON the page and map both read. Do not hand-type the country index in HTML and separately hand-type the pins in JS; they will drift within one content update.

Exception, and it matters: the index must survive JS being off. Two ways — render the index server-side at build time from the same source (preferred; there's already a build step), or ship the index as static HTML and have the build *verify* it matches the data source. Pick one and say which. If neither is workable in an afternoon, ship the static index and add a `check:atlas` script that fails the build on drift — that's the same guarantee by a cheaper route.

Stats: 19 places / 9 cities / 4 countries in the prototype — all three wrong. Recounted 3 Aug: **11 food notes / 09 trips / 13 countries**. The labels changed too, not just the numbers: "places" and "cities" were never things this site counts, and the homepage band already counts the right three. `check:atlas` asserts these three against the data source and against the hub-title.

---

## 4. The map

`map-atlas.html` is a working implementation. Port it; don't rewrite it. Read its JS in full first — the two-tier zoom, the label-collision offsets, and the `COMPACT` sizing branch all encode decisions that took iterations to land.

### 4.1 Delivery

- **No iframe.** It exists in the prototype only because that environment couldn't do modules.
- **Vendor the dependencies.** D3 v7 and topojson-client v3 go in `assets/js/`; `countries-110m.json` goes in `assets/data/`. No CDN at runtime — the site is a static build with no third-party requests, and a CDN outage shouldn't blank the page.
- Size check: full `d3.v7.min.js` is ~280KB and this page needs maybe a fifth of it. If you can produce a bundle of just `d3-geo`, `d3-zoom`, `d3-selection`, `d3-transition` and `d3-fetch` without adding a build toolchain, do — and report the delta. If it means introducing a bundler, don't; ship the full file and note it.
- Load the map JS **only on the Atlas page**, deferred. It must not touch the other 39 pages' payload.
- `countries-110m.json` is real geography from Natural Earth. Do not hand-draw or simplify it. Keep the attribution line.

### 4.2 Behavior — carry over exactly

Projection `d3.geoMercator()` via `fitExtent([[26,40],[W-26,H-26]], box)`, `box` spanning `[-14,-14]` to `[152,62]`.

Two-tier zoom at `CITY_ZOOM = 2.4`: below it, one filled disc per country at the mean lat/lon of its members with the written-entry count; at or above, individual city pins. Crossfade with `opacity` and toggle `pointer-events` so only the live tier takes clicks.

Colors `travel #191713` / `food #B0451C` / `soon #C9BFAB`, three-item legend top right. `d3.zoom()` with `scaleExtent([1,14])`, `dblclick.zoom` disabled, `+`/`−`/reset stack top-left. Transitions 300ms buttons, 600ms reset, 700ms fly-to. Cluster label offsets `Thailand -26, Indonesia 36, Japan 34, UK 34` — Thailand and Indonesia collide without them.

**A country with zero written entries gets no world-tier cluster disc.** Italy, Germany, Netherlands and Belgium exist as city-tier pins only; at world zoom they are absent. A disc reading `0` is not information, and four of them stacked inside continental Europe is the tightest label collision on the map — this removes it rather than nudging offsets around it. It also removes the `[].every(...)` vacuous-truth branch entirely instead of guarding it. Switzerland and France keep their discs; they have written entries.

Info card bottom-left, 250px, defaults to the Japan cluster on load.

**Loading state is required.** The geometry is a fetch; the container renders empty until it resolves. Keep the "Loading map…" line, and add a failure state the prototype doesn't have: if the fetch rejects, replace it with a short DM Mono line pointing at the country index below. A permanently-spinning map is worse than an honest one.

### 4.2b Fixes from the 3 Aug screenshot review

Reviewed at 1440 against `Atlas.dc.html`. Ordered by severity; the first three are the ones that keep it off the bar.

**1. The map doesn't read as a map at world tier.** The Natural Earth strokes are so light against `--paper-warm` that the continents are effectively invisible — screenshot 1 looks like pins floating on a blank field, and the city tier (screenshot 2) proves the geometry is fine, just under-inked. Raise the world-tier stroke weight/contrast until the coastlines are legible at 1440 without competing with the pins. This is the whole argument for replacing `world-map.png`; right now the replacement shows less geography than the PNG did.

**2. The left 40% of the frame is empty ocean.** All content sits right of centre — Europe lands at mid-frame and everything runs to the right edge, with dead Atlantic filling the rest. The `fitExtent` box is Phase 0 vintage and predates New Zealand at 174°E. Refit it to the real content bounds (roughly 8°W to 178°E) so the pins fill the frame, then re-check the Europe offsets, which will move.

**3. Loading and failure states ship live chrome.** Screenshots 3 and 4 both render the zoom stack and the three-item legend over an empty container. In the failure state that's dead `+`/`−` buttons and a legend for pins that will never arrive — it reads as a broken map rather than an honest one, which is the exact thing §4.2 asked for. Hide the controls and the legend until the geometry resolves, and leave them hidden on failure. Only the status line shows.

**4. The `0` disc.** Screenshot 1 has a cluster disc reading `0` stacked over the Europe pile, and the United Kingdom's disc — 4 written chapters — is buried underneath it. This is §4.2's zero-entry suppression, confirmed visually: with the four unwritten countries gone from the world tier, UK surfaces and the collision resolves itself.

**5. The deck contradicts the first tier.** It reads "Click a pin to see the chapter and every food note attached to it," but the first thing on screen is country clusters, and clicking one zooms rather than opening a chapter. Use §3.2's wording: "Browse by place. Click a country to zoom into its cities."

**6. `20 entries` in the header meta** is a fourth number on a page whose stat row says 11 / 09 / 13, and it isn't derived from `atlas-places.json`. Either drop it or make it read from the same source and say what it counts. Related: `.site-header-meta` is still per-page and ad hoc — logged in the backlog, don't solve it here.

**7. The reset button renders as a capital letter `O`.** Reads as a typo next to `+` and `−`. Use a reset glyph, and give all three `aria-label`s.

**8. City-tier labels collide around Kansai.** Screenshot 2 has Osaka, Tokyo and at least one more overlapping into unreadability. The world tier got collision offsets; the city tier needs the same treatment for the dense Japan cluster.

**9. Verify food-pin colour.** No terracotta pin is visible anywhere in screenshot 2, though Sapporo alone has five food notes. Either the `food #B0451C` branch isn't firing at city tier or the pins are too small to read the hue at `DOT_R`. Confirm which.

Good as shipped: header, nav and active state; `.hub-title` and the stat row; the info card at both tiers; the legend's three items; the loading and failure copy; and the city-tier geometry.

### 4.2c Fixes from the 4 Aug screenshot review (§5–7 pass)

World-tier ink and the `fitExtent` refit both landed — the map reads as a map now, and the degenerate-fit diagnosis is a good catch. Nine issues in this pass; the first four are blockers.

**1. The Food notes filter hides most of the food notes.** Screenshot 3 filters to Food notes and reports `3 PLACES ACROSS 2 COUNTRIES`, with Japan dimmed to `0`. But Japan carries 8 of the site's 11 food notes — Sapporo 5, Osaka 2, Tokyo 1, per its own index block. The filter is matching only standalone review pins (Saawaan, Kindling, August) and ignoring notes attached to chapter places. **A place matches `kind=food` if it has one or more food notes attached, whatever its own type.** Japan should be the largest result in that filter, not absent from it. The same bug inverts on `kind=travel`: a standalone review is not a chapter and must drop out. Cross-check against the stat row — the union of the two kind filters must account for all 11 notes and all 9 trips.

**2. Filtering puts the `0` discs back.** Screenshot 3 has `0` discs on Japan, Switzerland, France, UK, Hong Kong and New Zealand — exactly what §4.2's zero-entry rule removed at build time, reintroduced at runtime because the rule tests written entries rather than *currently matching* entries. Generalise it: **a cluster disc shows the count of entries matching the active filter, and no disc is ever drawn reading `0`.** A filtered-out country keeps its dimmed name label and loses its disc. One rule covers both the build-time and filtered cases.

**3. The info card is pre-selected and goes stale.** It shows Japan on first load with nothing clicked (screenshots 1 and 3) — the card is the response to a click, so before the first click it should be absent or hold the one-line prompt, not a country. Worse, under the Food notes filter it reads `Japan · 0 places · click to zoom in`: an invitation to zoom into an empty country. When the active filter empties the card's subject, clear the card. The §5 "stale card" fix caught the row list but not the count line or the call to action.

**4. City tier is over-zoomed.** Screenshot 2 zooms Japan to Sapporo alone — one pin, no Osaka, Kyoto or Tokyo, coastline strokes ballooned because `1.25px` doesn't scale down under the transform. City tier must **fit all of the country's cities in frame**, which is the whole point of the tier; the info card lists five places and the map shows one. Divide the stroke width by the zoom scale so it holds its apparent weight.

**5. Japan has five pins and four index rows.** The card lists Sapporo, Osaka, Kyoto, Fuji-san, Tokyo; the index block lists all but Fuji-san. `check:atlas` asserts linked places against static rows 1:1 and did not fire, so either Fuji-san is a pin with no row (the check has a hole) or it is a row the index drops (a render bug). Find out which, fix the underlying one, and make the check catch it.

**6. Mobile map height.** Screenshot 4's map measures roughly 180px tall against §6's 520px, and the pins are a single overlapping knot as a result — Switzerland, France, Thailand and Indonesia labels all collide. Confirm the computed height at 375 and fix if it isn't 520.

**7. Mobile chip rails cut off with no affordance.** Both rows clip mid-word at the right edge (`FOOD NOT`, `THAILAND`) with nothing indicating they scroll. Add the horizontal fade or partial-chip peek §6.4 assumes.

**8. The legend's `PLANNED` swatch has nothing to label at world tier** now that unwritten countries draw no disc. Keep it only if planned pins are visible at city tier; otherwise it is a key to nothing.

**9. Japan's index header reads `· 12`** where the card says 5 places and the block lists 4 rows. Three numbers for one country, all correct under different definitions. Label it or drop it.

Good as shipped: world-tier ink and coastline legibility, the refit frame, the deck copy, the `⟲` reset, the ten-block index with "Also on the route", the two chip rows at nine countries, and both loading and failure states.

### 4.3 Content

The prototype's `places` array is Phase 0 vintage. Two known-stale entries before you even start:

- **Bangkok / Saawaan** — score reads 7.7, is now **7.2** (§7.1).
- **Malang** — `kind: "soon"`, `items: ["Not written yet"]`. Phase 3's travel-index shelf has a Malang & Bromo entry with a real thumbnail. Check whether it's written; if it is, it's a live pin, not a `soon` one.

Verify all 11 against the real pages, the same way you did the food index's 11 in Phase 3 — that pass found 4 wrong dates. Report what differs. `items` copy should match each page's real content, not the prototype's paraphrase.

---

## 5. Filters — chips drive the map and the index

Same chip styling as the food index — reuse those rules. Two axes, and after the recount they no longer fit on one row. **Two rows, labelled:**

- **Row 1 — Kind.** All / Travel chapters / Food notes.
- **Row 2 — Country.** The **9 countries with written entries**, ordered by entry count, same order as the index blocks: Japan · Indonesia · Thailand · UK · South Korea · New Zealand · Hong Kong · Switzerland · France.

The original 4-chip list here was written when the count was 4. Shipping 4 of 13 as chips makes the other 5 look unfilterable; shipping all 13 puts four dead chips on the row. Nine is the set that has something behind it. The four unwritten countries are reachable on the map and in the "Also on the route" block, and neither needs a filter.

Row 2 wraps on desktop and becomes the horizontal rail at ≤560px (§6.4). Measure it at 1440 before accepting nine: if row 2 wraps to a second line, or the two rows together push the map below 620px from the top of the viewport, use the fallback — **row 2 shows the top five (Japan · Indonesia · Thailand · UK · South Korea) followed by a `More places` chip.** That chip is a `<button aria-expanded>` styled as an outlined chip, not a filled one; pressing it reveals the remaining four inline, in place, and swaps the label to `Fewer places`. It is not a dropdown and not a modal — the four chips appear on the same row and the row wraps. Disclosure state is UI only; it never enters the URL, and `?country=` deep-linking to a hidden chip expands the row on load so the pressed chip is visible.

They compose: "Food notes" + "Japan" is a valid state. "All" clears the kind axis only, not the country. If a combination is empty, say so in the result line rather than rendering a blank map.

**Effect on the map:** filtered-out pins and clusters drop to `opacity: .18` and lose `pointer-events` — they don't disappear. Geography with holes in it reads as broken rendering; dimmed pins read as a filter. Cluster counts update to the filtered count. Selecting a country chip also flies to that country, which is the same code path as clicking its cluster.

**Effect on the index:** filtered-out rows hide outright. A list is not a map; empty rows are just noise.

**State in the URL** — `?kind=` and `?country=`, same conventions Phase 3 established: `replaceState` only so back never traps, validation falls back to `all`, and controls hide under `.no-js` with everything visible. A no-JS visit gets the full country index and no map. That's a legitimate page, not a degraded one.

Result line below the chips, `aria-live="polite"`, pluralized: "19 places across 4 countries" / "2 places in Thailand".

---

## 6. Mobile

See **M3**. The prototype's `COMPACT` branch (≤520px) already sizes touch targets — `DOT_R` 10, `HIT_R` 24, `DISC_R` 22. Keep it. Three things it does *not* handle:

### 6.1 Scroll trapping — required

A full-width map that swallows one-finger vertical drag traps the reader mid-page with no way out. Standard embedded-map behavior, and non-negotiable:

- **One finger drags → the page scrolls.** The map ignores it.
- **Two fingers → pan and pinch-zoom the map.**
- The `+`/`−`/reset buttons still work with one finger; they're buttons.

`d3.zoom()` supports this via a `filter` that rejects single-touch drags, plus `touch-action: pan-y` on the container. Verify by scrolling *through* the map on a real touch target, not just a narrow viewport — a desktop browser at 375px does not reproduce this.

### 6.2 Tap replaces hover

The disc-grows-on-hover affordance doesn't exist on touch, and the desktop flow is hover-then-click. On touch, **one tap both selects the pin and opens the info card**. No two-step. Don't ship a hover state that requires a phantom first tap to trigger.

### 6.3 Controls at 44px

The `+`/`−`/reset stack is 32px, fine for a mouse, too small for a thumb. 44px at ≤520px, with the same fill and hover treatment.

### 6.4 Layout

Map container 520px tall (M3), full-bleed to the 20px gutter. Help line takes M3's wording: "Tap a country to zoom in · pinch to zoom, drag to pan." Country index → one column, rows at `min-height: 44px`. Chips become a horizontally scrollable rail, same as the food index's at ≤560px. Stat blocks → a row of three above the deck, per M3.

Sticky offsets use `--header-h` (84px, 112px ≤520px). Nothing new hardcodes a header height.

---

## 7. Loose ends

### 7.1 Saawaan 7.7 → 7.2

Rescored 1 Aug 2026 onto the six axes: First Bite 8, Crave Factor 7, Room Mood 7, Host Energy 8, Worth the Wallet 7, Return Ticket 6 → mean **7.2**.

Three places: `data-score` on its card in `food/index.html`, the score on the review page itself, and the map's `items` copy (§4.3). Grep for `7.7` before you finish — if a fourth exists, that's the argument for §3.4's single source.

The six axis values themselves aren't rendered anywhere yet; the review template is Phase 5. Just the overall.

### 7.2 Travel index — restore the Atlas button

Phase 3 §3.6 left a stand-in. Delete:

```html
<p class="atlas-band-pending">The map is being drawn. Next up.</p>
```

Restore:

```html
<a class="button" href="../atlas/index.html">Open the Atlas</a>
```

`--paper` fill, `--ink` text, hover → `--accent` fill / `--paper` text. Drop `.atlas-band-pending` from the sheet once nothing references it.

### 7.3 Homepage Atlas button

Currently points at `travel/index.html#atlas`. Repoint to `atlas/index.html`. The `#atlas` band on the travel index stays — it's a real section with a real button now, just no longer the destination for that link.

---

## 8. Score sort — not this phase

Phase 3 removed the food index's Score chip because only one of 11 entries had a Meter score. That's unchanged; `data-score` attributes are still in the HTML. Restoring the chip waits for the Meter to ship across the reviews, which is Phase 5. Don't restore it here.

---

## 9. Acceptance

- `npm run build && npm run check` clean, all four checks.
- Homepage Jakarta table measures 1120px and aligns with the sections above it.
- 4-item nav on all 40 pages, correct depth, no overflow at 375px, `aria-current` right on `/atlas/`.
- `/atlas/` passes `check:meta` and appears in the sitemap.
- Map renders real Natural Earth geography, no CDN request, both zoom tiers, working legend and controls.
- Loading state visible on a throttled connection; failure state reachable by blocking the JSON.
- Chips filter map *and* index, compose across the two axes, survive reload via `?kind=`/`?country=`, and back doesn't trap.
- JS off: full country index, no map, no controls, no empty gaps.
- Keyboard: chips reachable and toggleable, `aria-pressed` correct, result line announced. Map pins are not expected to be keyboard-navigable this phase — flag it as known.
- Touch: one-finger scroll passes through the map, two-finger pans, tap opens the info card in one action, controls are 44px.
- Atlas page at 1440 / 1024 / 860 / 560 / 375.
- Saawaan reads 7.2 everywhere; zero `7.7` left in the repo.
- Travel index has a working Atlas button; homepage button goes to `/atlas/`.
- No new `border-radius` beyond `.brand-dot` and the map's legend swatches; no new `box-shadow` beyond the info card's.

---

## 10. Known gaps, deliberately

- **Map pins aren't keyboard-accessible.** A proper fix is roving tabindex over the pins plus an SVG focus ring — real work, and the country index below is a complete keyboard-navigable equivalent of the same data. Revisit after Phase 5.
- **No Atlas-specific OG image.**
- **`world-map.png`** stays on disk, unreferenced, from Phase 3. Delete it in the Phase 6 cleanup once the real Atlas has shipped and nothing wants it back.
