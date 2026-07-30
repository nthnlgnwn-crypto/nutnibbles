# NutNibbles — source repository

repo: nthnlgnwn-crypto/nutnibbles
branch: main

Live site: https://nutsnibbles.cc
Stack: plain static HTML + one shared `styles.css`, no framework. Templates in `templates/`, node validation scripts in `scripts/`, build copies source into `dist/`. Deployed by pushing to `origin/main`, served through Cloudflare.

## Last sync

date: 2026-07-30T06:19:04Z

### Updated in this project

- Audited `styles.css` (72KB) to plan the redesign as a stylesheet replacement rather than a rebuild.
- Confirmed the class vocabulary transfers: the redesign needs no HTML change on most of the 24 pages.
- Found the blocker: the sheet is dark-first, with hundreds of `rgba(244,235,221,.0x)` translucent-cream surfaces that cannot survive a token swap onto paper.
- Rewrote `AGENTS.md` with the new design system, a fixed six-axis Signature Meter, mobile rules, and accessibility.

## Previous sync

date: 2026-07-30T05:51:06Z

- Read the real content inventory: 9 trip hubs and 11 food posts.
- Confirmed the Signature Meter is a real shipped component; captured its axes and scores.
- Corrected the Travel and Food index designs; removed invented entries and scores.

## Screen map

| Project screen | Repo source |
|---|---|
| `Home.dc.html` | `index.html` |
| `Travel-Index.dc.html` | `travel/index.html` |
| `Food-Index.dc.html` | `food/index.html` |
| `Trip-Japan-2025.dc.html` | `travel/japan-2025/index.html` |
| `Chapter-Tokyo.dc.html` | `travel/japan-2025/tokyo/index.html` |
| `Food-Kindling.dc.html` | `food/kindling-jakarta-birthday-dinner/index.html` |
| `Work-With-Me.dc.html` | `work-with-nutnibbles/index.html` |
| `Atlas.dc.html`, `map-atlas.html` | new — replaces the static `assets/images/world-map.png` pin overlay in `travel/index.html` |
| (not yet designed) | `japan-guide/index.html` |

## Content inventory (as read 2026-07-30)

### Trips — 9

| Trip | Dates | Slug |
|---|---|---|
| Europe Winter 2020 | 31 Dec 2019 – 12 Jan 2020 | `travel/europe-winter-2020/` |
| Europe Winter 2021/22 Alpine | 27 Dec 2021 – 8 Jan 2022 | `travel/europe-winter-2021-22/` |
| South Korea Winter | 8–19 Dec 2022 | `travel/korea-2022/` |
| Hong Kong | 14–16 Jul 2023 | `travel/hong-kong-2023/` |
| UK & Scotland Autumn | 7–22 Nov 2023 | `travel/uk-scotland-2023/` |
| New Zealand Winter Road Trip | 19–28 Jul 2024 | `travel/new-zealand-2024/` |
| Japan Winter Family Trip | 18–29 Jan 2025 | `travel/japan-2025/` |
| Bangkok | May–Jun 2025 (two visits) | `travel/bangkok-2025/` |
| Malang & Bromo Wedding Weekend | 1–3 May 2026 | `travel/malang-bromo-2026/` |

### Food posts — 11

| Post | Place / context | Score | Slug |
|---|---|---|---|
| August Jakarta Dinner | Jakarta, date night, 3rd visit | — | `food/august-jakarta-dinner/` |
| Kindling Birthday Dinner | Jakarta, 9 May 2026 | 6-axis meter, no overall | `food/kindling-jakarta-birthday-dinner/` |
| Saawaan Bangkok | Bangkok, 17 Jan 2026 | 7.7 / 10 | `food/saawaan-bangkok-jan-2026/` |
| Arrival Night Ramen Alley | Sapporo, 22:30 arrival | — | `food/sapporo-ramen-alley/` |
| Fresh Salmon & King Crab Lunch | Sapporo | — | `food/sapporo-seafood-lunch/` |
| 7-Eleven Hotel Dinner | Sapporo, after Mt. Moiwa | — | `food/sapporo-711-dinner/` |
| Lunch Near Hokkaido Jingu | Sapporo, shrine day | — | `food/hokkaido-jingu-lunch/` |
| Shiroi Koibito Soft Serve | Sapporo, sweet stop | — | `food/shiroi-koibito-soft-serve/` |
| Ryunosu Late Lunch | Osaka, yakiniku nr Shinsaibashi | — | `food/osaka-ryunosu-lunch/` |
| CoCo Curry Shin Umeda | Osaka, after Osaka Castle | — | `food/osaka-coco-curry-shin-umeda/` |
| Gyukatsu Motomura Late Lunch | Tokyo, 26 Jan 2025 | — | `food/tokyo-gyukatsu-motomura/` |

### Other pages

`japan-guide/` (planning reference, not yet redesigned), `work-with-nutnibbles/`.

## Signature Meter — as actually shipped

Component classes: `.review-meter`, `.review-meter-row`, `.review-meter-track`, `.review-meter-fill` with `style="--score: NN"`.

**The axis set is inconsistent between reviews** — this is a real problem for a scoring system, since scores are only meaningful if they compare like with like:

- Kindling: First Bite 9.0 · Crave Factor 9.1 · Room Mood 9.4 · Host Energy 9.4 · Worth the Wallet 8.9 · Return Ticket 9.0 — **six axes, no overall score**
- Saawaan: Crave 7.0 · Craft 9.0 · Comfort 8.0 · Comeback 7.0 — **four axes, overall 7.7 / 10**

Needs a decision from the author on one fixed axis set, and whether the overall score is authored or derived.

## Constraints from AGENTS.md

- Do not rebuild from scratch or introduce a framework.
- Do not change existing routes or slugs unless explicitly requested.
- Keep published pages as plain HTML using `styles.css`.
- Preserve the dark green / cream editorial style and personal journal voice.
- Every public page needs title, description, canonical, OG, Twitter card, favicon set, and a `sitemap.xml` entry.
- Never hand-edit `dist/`; run `npm run build`.
- Local assets only; long edge ≈1600px, quality 78–82.
- `npm run build && npm run check` before publishing.

**Note:** the redesign changes the palette from dark green / cream to paper / terracotta, which contradicts the style rule above. That was the explicit ask ("feels dull, no longer relevant"), so `AGENTS.md` should be updated rather than treated as blocking.


## styles.css audit (2026-07-30)

72KB, ~2,800 lines. Token-based, well-organised, genuinely good class vocabulary.

**Transfers for free** — the class names and layout structure. `.site-header`, `.magazine-hero`, `.editorial-section`, `.collection-card`, `.review-meter`, `.food-index-grid`, `.city-chapter-card`, `.callout-card`, `.pull-quote`, `.glance-card` all map onto the redesign. `--content-max: 720px` already matches the redesign's reading column. `scroll-padding-top: 142px` already solves sticky-header anchor offset. The `:has()` column-count matching on `.city-chapter-grid` is smarter than what the redesign specifies — keep it.

**The blocker** — the sheet is built dark-first. Surfaces, borders and secondary text are translucent cream literals (`rgba(244,235,221,0.08)` for cards, `rgba(244,235,221,0.18)` for rules, `rgba(244,235,221,0.72)` for muted text), used hundreds of times and mostly NOT behind tokens. On a paper background these render invisible. A token swap alone will not work; every `rgba(244,235,221,*)` literal must become a solid token.

**Also needs global change**
- `border-radius`: `999px` pills, `8px` cards, `12px` panels → 0 throughout.
- `--sans: Inter` → Karla; `--serif: Georgia` → Instrument Serif; add Newsreader (reading) and DM Mono (metadata).
- Card surfaces use `linear-gradient(145deg, rgba(...)...)` — replace with flat `#F3ECDD`.
- Shadows are used liberally (`0 24px 70px rgba(0,0,0,.24)`); redesign has none except the map card.
- `.travel-card` / `.food-card` background-image collages and `--card-surface` gradients are dark-only devices.

**Two open questions for the author**
1. `index.html` has a `.home-hero-video` (`assets/images/home/nutnibbles-hero-poster.jpg` + video, `object-position: 68% center`). The redesign's homepage hero is a static split with the Fuji photograph. Keep the video, or drop it?
2. The current site IS responsive (breakpoints at 561px and 861px). The redesign is desktop-only so far — mobile must be designed before the new sheet ships, or existing mobile behaviour regresses.

**Verdict** — stylesheet replacement is the right strategy. It is a rewrite of the color/type/radius layer against the existing class names, not a token swap and not a rebuild. Est. 60% of the sheet's declarations survive untouched (layout, grids, spacing); ~40% (color, radius, shadow, type) get rewritten.
