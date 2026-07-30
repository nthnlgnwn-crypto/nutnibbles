# START HERE

This folder is the design specification for the NutNibbles 2026 redesign. It is not code to copy — the `.dc.html` files are design references that will not run outside their authoring tool. Read them for structure and exact values.

## Read in this order

1. `AGENTS.md` — the design system and the site's rules. This replaces the `AGENTS.md` currently in the repo root. Every colour, font, size and constraint lives here.
2. `README.md` — page-by-page specification for all eight screens.
3. `github.md` — the content inventory (9 trips, 11 food posts) and the `styles.css` audit, including what transfers and what blocks a token swap.

## The strategy

**This is a stylesheet replacement, not a rebuild.**

The repo's 24 pages share one `styles.css` and a good class vocabulary (`.magazine-hero`, `.editorial-section`, `.review-meter`, `.collection-card`, `.food-index-grid`, `.city-chapter-card`). Rewriting the stylesheet against those same class names restyles almost every page with no HTML edited and no routes changed.

Roughly 60% of the existing sheet survives untouched — layout, grids, spacing, the `:has()` column-count logic. About 40% gets rewritten: every colour literal, all border radii to 0, shadows removed, four new font families.

**The blocker to know about:** the current sheet is dark-first. Card surfaces, borders and muted text are translucent cream literals (`rgba(244, 235, 221, 0.08)` and similar), used hundreds of times and mostly not behind tokens. On the new paper background these render invisible. Changing the tokens alone produces a blank page. Every `rgba(244,235,221,*)` must become a solid token.

## Phase order

**Phase 1 — `styles.css`.** Do this first and completely. No HTML changes.
1. Replace the `:root` tokens with the palette in `AGENTS.md`.
2. Swap the font stacks: Instrument Serif (display), Newsreader (reading), Karla (UI), DM Mono (metadata). Self-host rather than hot-link.
3. Purge: every `border-radius` to 0, every `box-shadow` removed except the map info card.
4. Replace every `rgba(244,235,221,*)` surface, border and text colour with a solid token.
5. Rework components one at a time, checking each against `README.md`: header, footer, `.eyebrow`, buttons, `.collection-card`, `.editorial-section`, `.callout-card`, `.pull-quote`, `.glance-card`, `.review-meter`, `.food-index-grid`, `.city-chapter-card`.

Keep: `--content-max: 720px`, `scroll-padding-top`, and the `:has()` column matching on `.city-chapter-grid` — all three are already correct and better than a naive rewrite.

**Phase 2 — compare.** Open each of the 24 pages side by side against the old version. The bar is 98% match to the design. Note which pages miss it; do not rewrite on spec.

**Phase 3 — structural edits.** Only where markup genuinely differs from the design:
- `index.html` — numbered latest-entries index replaces the card grids. Most changed page.
- `travel/index.html` — trip list replaces the static map overlay.
- `food/index.html` — filter and sort controls are new markup.
- Any review missing the Meter's overall score element or tag chips.

**Phase 4 — the Atlas.** Replace the `world-map.png` pin overlay with a real map. `map-atlas.html` in this folder is a working reference implementation (D3 + topojson, Natural Earth geometry). Build it as one hydrated component; keep the rest of the page zero-JS. Do this last — it is isolated, and if it slips everything else still ships.

**Phase 5 — `templates/`.** Update all three so future posts inherit the new design.

**Phase 6 — mobile.** `Mobile.dc.html` specifies Home, the food review, and the Atlas at 390px. Work With Me, the trip hub and the two indexes are not drawn — derive them from the same patterns and the mobile rules in `AGENTS.md`.

## Non-negotiables

- No framework. Plain HTML and one stylesheet.
- Never change an existing route or slug.
- Never hand-edit `dist/`. Run `npm run build`.
- Keep every page's metadata, canonical, OG tags and anchor IDs intact — food posts link directly into chapter anchors.
- `npm run build && npm run check` before any commit.
- Work on a branch, never on `main`.

## Kickoff prompt

Paste this into Cursor once the folder is in the repo:

> Read `design-handoff/AGENTS.md`, `design-handoff/README.md` and `design-handoff/START-HERE.md`. We are redesigning this static site by replacing `styles.css` against the existing class names — not rebuilding pages, not adding a framework, not changing routes.
>
> Start with Phase 1 only: rewrite `styles.css` to the design system in `AGENTS.md`. Work through it in the five sub-steps listed in START-HERE. Do not touch any `.html` file yet. Show me the new `:root` token block and the header and footer rules first, and stop for review before continuing to the rest of the components.
