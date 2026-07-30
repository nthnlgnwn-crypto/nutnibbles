# Handoff: NutNibbles.cc Redesign

## Overview

Complete redesign of **nutsnibbles.cc**, a personal travel and food diary. The site publishes two content types: **travel chapters** (long-form diary entries from 1–3 trips a year, grouped under a trip hub) and **food reviews** (Jakarta restaurant reviews published every few weeks, plus shorter food notes attached to trips).

The redesign replaces a uniform card-grid layout with a print-editorial system: a warm paper palette, high-contrast serif display type, and deliberate rhythm changes between sections (index lists → full-bleed photography → reading columns → data tables). It also introduces two structural features the old site lacked: the **Signature Meter** (a six-axis scoring system for food reviews) and **The Atlas** (an interactive map that indexes every entry by place).

**Target audience:** strangers who find the site via search while planning a trip or a dinner, and restaurants/hotels evaluating a collaboration.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior. They are **not production code to copy directly.**

They are authored in a bespoke component format (`.dc.html`) that will not run outside its authoring environment. Do not try to make these files run. Read them as specifications: the markup shows structure and hierarchy, the inline `style` attributes give exact values, and the logic blocks show intended state behavior.

**The task is to recreate these designs in a real codebase.** No production codebase exists yet for this project, so you should choose the framework. My recommendation, and the reasoning:

**Astro** is the right choice here.
- The site is 95% static content — it should ship as static HTML for speed and SEO, which is how strangers find it.
- Content is authored by a non-developer publishing every few weeks. Astro's content collections let each review live as a Markdown file with frontmatter, so the author never touches layout code.
- The one interactive piece (the Atlas map) can be a single hydrated island; everything else stays zero-JS.
- Deploys to Cloudflare Pages from a Git repo with no configuration, which is the author's intended host.

Eleventy is an acceptable alternative if you prefer it. Do not reach for Next.js — there is no server-side need here and it adds weight for no benefit.

## Fidelity

**High-fidelity.** Colors, typography, spacing, and copy are final. Recreate the UI faithfully. All measurements in this document are exact values taken from the design files.

Two deliberate exceptions, called out where they appear:
- The London and Edinburgh chapter cards on the travel index are placeholder gradients — no photography exists for them yet.
- Photography is currently hot-linked from the live site (`https://nutsnibbles.cc/assets/images/...`). These must be migrated to local assets. See **Assets**.

---

## Design Tokens

### Colors

| Token | Hex | Use |
|---|---|---|
| Paper | `#FAF5EC` | Primary page background |
| Paper sunken | `#F3ECDD` | Alternating section background, callout fills, card backs |
| Rule | `#E3DACA` | Hairline borders, table rules, dividers |
| Rule strong | `#C9BFAB` | Secondary button borders, filter chip borders |
| Ink | `#191713` | Primary text, headings, dark section backgrounds |
| Ink deep | `#12100E` | Footer background, dark-page background |
| Ink raised | `#1A1714` | Raised rows on dark backgrounds |
| Body | `#463F36` | Long-form body copy |
| Body dim | `#514B41` | Intro/deck paragraphs |
| Body dimmer | `#5A5348` | Card descriptions, secondary prose |
| Muted | `#6E6558` | Table labels, uppercase metadata |
| Muted light | `#7A7264` | Photo captions |
| Muted lighter | `#8A8271` | Monospace metadata, dates |
| Muted lightest | `#A39880` | Small-caps eyebrow labels, index numbers |
| Terracotta | `#B0451C` | Primary accent — links, eyebrows, active states, scores |
| Amber | `#E0A03A` | Accent on dark backgrounds only (Work With Me page) |
| Amber pale | `#E9B98F` | Eyebrow labels over photography |
| Cream on dark | `#F2EDE4` | Text on the dark Work With Me page |
| Cream dim | `#CFC6B6` | Footer body text |
| Cream dimmer | `#B7AF9F` | Dark-page body copy |
| Cream dimmest | `#9C9385` | Footer italic tagline |
| Highlight | `#E9C79A` | `::selection` background |
| Placeholder | `#C9BFAB` | "Planned, not yet written" map pins |

Two background colors per page maximum: paper (`#FAF5EC`) and paper sunken (`#F3ECDD`), plus ink (`#191713`) for full-bleed emphasis bands.

### Typography

Three families, loaded from Google Fonts:

| Family | Weights | Role |
|---|---|---|
| **Instrument Serif** | 400, 400 italic | Display — all headings, scores, large numerals |
| **Newsreader** | 300–600, 300–500 italic | Reading — body copy, captions, card descriptions, pull quotes |
| **Karla** | 300–800 | UI — nav, buttons, uppercase labels, wordmark |
| **DM Mono** | 300, 400, 500 | Metadata — dates, coordinates, eyebrow labels, counts |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Karla:ital,wght@0,300..800;1,300..800&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

**Type scale — Instrument Serif (display), all weight 400:**

| Use | Size | Line-height | Letter-spacing |
|---|---|---|---|
| Homepage h1 | 84px | 0.97 | −0.015em |
| Chapter hero h1 | 92px | 0.95 | −0.02em |
| Index page h1 | 74–76px | 0.99 | −0.015em |
| Review h1 | 76px | 0.99 | −0.015em |
| Full-bleed band h2 | 62px | 1.01 | — |
| Pull quote | 46px | 1.22 | — |
| Section h2 | 40–52px | 1.02–1.1 | — |
| Article h2 | 46px | 1.06 | — |
| Card h3 | 26–31px | 1.1 | — |
| Index row title | 28px | 1.14 | — |
| Large numeral | 38–64px | 0.9–1 | — |

**Newsreader (reading):**

| Use | Size | Line-height | Weight |
|---|---|---|---|
| Article lede | 23–24px | 1.55 | 400 |
| Hero deck | 19.5–21px | 1.6–1.62 | 400 |
| Body paragraph | 19.5px | 1.75 | 400 |
| Card description | 16px | 1.6 | 400 |
| Caption | 15–16px | — | 400 italic |
| Table cell | 17.5px | 1.5–1.55 | 400 |

**Karla (UI):** nav and buttons 12.5px / `letter-spacing: .12–.14em` / `text-transform: uppercase` / weight 600–700. Table labels 11.5px / `.12em` / uppercase / 700.

**DM Mono (metadata):** eyebrow 11px / `.2em` / uppercase. Dates and counts 10.5–11.5px / `.1–.18em`. Never above 13px.

### Spacing

Section padding: `56px` horizontal on every page (the global gutter). Vertical section rhythm: `44px` / `52px` / `56px` / `64px` / `72px`. Card interior padding: `20–22px` sides, `24–26px` bottom. Grid gaps: `16px` (photo grids), `18–20px` (chapter cards), `26px` (content cards), `44–64px` (major two-column splits).

Reading column max width: **720px**, centered. Never wider — this is the core readability constraint for chapters and reviews.

### Borders, radius, shadows

- **Border radius: 0 everywhere.** No rounded corners anywhere in this design. This is deliberate and central to the print-editorial character.
- Hairline: `1px solid #E3DACA`
- Emphasis rule (above section headings, table tops): `2px solid #191713`
- Callout: `border-left: 3px solid #B0451C` with `#F3ECDD` fill
- Active chapter card: `outline: 3px solid #B0451C; outline-offset: -3px`
- Shadows: only on the Atlas map info card — `0 14px 34px rgba(25,23,19,.12)`. Nowhere else.

### Wordmark

Set in Karla, not a serif. Two words in `font-weight: 800`, `font-size: 19px`, `letter-spacing: .17em`, uppercase, separated by a 5px terracotta dot with `7px` margin either side:

```
NUT • NIBBLES
```

On dark backgrounds the text becomes `#FAF5EC`; the dot stays `#B0451C` (or `#E0A03A` on the Work With Me page).

---

## Screens / Views

### 1. Home (`Home.dc.html`)

**Purpose:** orient a first-time visitor, surface the newest entries, and route to the two content types plus the Atlas.

**Layout, top to bottom:**

1. **Sticky header** — `padding: 20px 56px`, `border-bottom: 1px solid #E3DACA`, background `rgba(250,245,236,.94)` with `backdrop-filter: blur(8px)`, `z-index: 20`. Three-part flex: wordmark left, nav center, current month in DM Mono right. Nav items: Travel, Food, Atlas, Guides, Work with me.

2. **Hero** — two-column grid `1.08fr / .92fr`, `border-bottom: 1px solid #E3DACA`.
   - Left: `padding: 72px 56px 60px`, flex column, `justify-content: space-between`. Eyebrow ("Food & travel diary · Since 2023"), h1 at 84px with the word "before" in terracotta italic, deck paragraph at 19.5px `max-width: 46ch`, then two buttons with `margin-top: 48px`.
   - Right: linked image, `min-height: 580px`, `object-fit: cover`. Caption block absolutely positioned at bottom over `linear-gradient(transparent, rgba(20,18,14,.75))`, `padding: 24px 28px`, containing DM Mono coordinates + date and a Newsreader italic line.
   - Primary button: `#191713` fill, `#FAF5EC` text, `padding: 15px 26px`, 12.5px Karla 700 uppercase `.14em`. Hover → `#B0451C`.
   - Secondary button: transparent, `1px solid #C9BFAB`, `#191713` text. Hover → border `#B0451C`.

3. **Latest index** — heading row (`padding: 56px 56px 24px`) with h2 at 40px and a terracotta "All food notes →" link with `border-bottom: 1px solid #DCC7B4`. Then six rows, each a link with `grid-template-columns: 56px 1fr 180px 122px 96px`, `gap: 22px`, `align-items: center`, `padding: 22px 10px`, `border-top: 1px solid #E3DACA` (last row also `border-bottom`). Columns: zero-padded index number in DM Mono `#A39880`; title in Instrument Serif 28px; category in Karla 11.5px uppercase 600 `#6E6558`; date in DM Mono 11.5px `#8A8271`; thumbnail `96×64px` `object-fit: cover`. Row hover → `background: #F3ECDD`.

4. **Trip in focus** — full-bleed link, `height: 540px`, background `#191713`. Image at `opacity: .88` with an overlay of `linear-gradient(105deg, rgba(20,18,14,.78) 8%, rgba(20,18,14,.12) 64%)`. Content block absolutely positioned `left: 56px`, `width: 540px`, vertically centered: amber-pale eyebrow, h2 at 62px, deck at 18.5px `#E7DFD2`, then four city chips (`1px solid rgba(250,245,236,.4)`, `padding: 8px 13px`, DM Mono 11px uppercase).

5. **Jakarta table** — `background: #F3ECDD`, `padding: 60px 56px`. Header row: left stack (eyebrow + h2 at 46px), right paragraph `max-width: 34ch` at 17.5px. Then `grid-template-columns: repeat(3, 1fr)`, `gap: 26px`. Each card: `#FAF5EC` fill, `1px solid #E3DACA`, image `height: 210px`, then `padding: 22px 22px 26px` containing a baseline-aligned row (terracotta category left, verdict right, both DM Mono 10.5px uppercase), h3 at 29px, description at 16px. Hover → border `#B0451C`.

6. **Atlas band** — `padding: 46px 56px`, `border-top: 1px solid #E3DACA`, flex row `space-between`. Left: three stat blocks (`gap: 40px`), each a large Instrument Serif numeral (48px; first one terracotta) over a DM Mono 10.5px uppercase label. Right: right-aligned paragraph at 18.5px `max-width: 38ch` beside a terracotta button. **Conditional — controlled by the `showAtlasBand` flag.**

7. **Newsletter** — `background: #191713`, `padding: 56px`, grid `1fr / 420px`. Left: amber-pale eyebrow, h2 at 44px in `#FAF5EC`, subhead at 17.5px `#A79E90`. Right: stacked email input (transparent fill, `1px solid rgba(250,245,236,.3)`, DM Mono 13px) and a `#FAF5EC` submit button. **Conditional — controlled by the `showNewsletter` flag.**

8. **Footer** — `background: #12100E`, `color: #CFC6B6`, `padding: 48px 56px`, flex `space-between` `align-items: flex-end`. Left: wordmark + Newsreader italic tagline "Kept by hand since 2023." Right: three link columns, `gap: 48px`, each `flex-direction: column` `gap: 10px`, 12px uppercase `.12em`.

**Props (implement as build-time config or CMS toggles):**

| Prop | Type | Default | Effect |
|---|---|---|---|
| `showAtlasBand` | boolean | `true` | Shows/hides section 6 |
| `showNewsletter` | boolean | `true` | Shows/hides section 7 |

---

### 2. Travel index (`Travel-Index.dc.html`)

**Purpose:** the shelf of all trips. Few items, so it reads as a bookshelf rather than a filterable list.

**Layout:**

1. Header (sticky, Travel active with `border-bottom: 2px solid #B0451C; padding-bottom: 2px`), trip count right.
2. **Title block** — grid `1fr / 380px`, `padding: 56px 56px 40px`, `align-items: end`, `border-bottom: 1px solid #E3DACA`. Left: eyebrow, h1 at 74px `max-width: 22ch`, deck at 20px `max-width: 54ch`. Right: three metadata pairs in a `border-left: 1px solid #E3DACA` column with `padding-left: 28px`, `gap: 16px` — each a DM Mono 10px uppercase label over a Newsreader 17px value.
3. **One block per trip.** Each: a heading row with `border-bottom: 2px solid #191713`, `padding-bottom: 18px`, `margin-bottom: 26px` — left is eyebrow ("Trip 04 · 18–29 Jan 2025 · 12 days") over h2 at 52px; right is right-aligned stat numerals (38px) plus a CTA button. Below, a grid of chapter cards.
   - **Japan 2025:** `repeat(4, 1fr)`, `gap: 18px`, cards `height: 400px`. Each card is a link with an absolutely positioned image, an overlay `linear-gradient(transparent 32%, rgba(18,16,14,.9))`, and a bottom content block (`left/right: 20px`, `bottom: 20px`): DM Mono 22px amber-pale chapter number, Instrument Serif 31px city name, DM Mono 10px uppercase date + descriptor. Tokyo card carries `outline: 3px solid #B0451C; outline-offset: -3px` to mark it as the one with a full chapter written.
   - **UK 2023:** `1.4fr 1fr 1fr`, cards `height: 420px`. Highlands card uses photography; **London and Edinburgh use `linear-gradient(160deg, #2A2620, #12100E)` as a placeholder** — replace with real images when available. A DM Mono note below the grid states this.
   - **Bangkok 2026:** a single wide card, grid `1fr 1fr`, `1px solid #E3DACA` — image left (`height: 340px`), `#F3ECDD` text panel right with `padding: 36px 40px` explaining there's no chapter, only a review.
4. **Atlas band** — `background: #191713`, `padding: 56px`, flex `space-between`: amber-pale eyebrow + h2 at 44px, and a `#FAF5EC` button.
5. Footer.

---

### 3. Food index (`Food-Index.dc.html`)

**Purpose:** every food entry, filterable. This is the page that keeps a growing Jakarta review list usable.

**Layout:**

1. Header (Food active), total note count right.
2. **Title block** — same structure as the travel index: h1 at 74px, deck at 20px, and a right metadata column (highest scored / home base / disclosure).
3. **Controls bar** — `padding: 26px 56px`, `border-bottom: 1px solid #E3DACA`, **sticky at `top: 61px`** (directly below the 61px-tall header) with `background: rgba(250,245,236,.96)` and `backdrop-filter: blur(8px)`, `z-index: 15`. Flex `space-between`, wrapping. Left group: a DM Mono "Place" label followed by city chips. Right group: a "Sort" label followed by sort chips.
   - **Chip, inactive:** `1px solid #C9BFAB`, transparent fill, `#4A463C` text, `padding: 9px 16px`, Karla 11.5px 700 uppercase `.12em`, `cursor: pointer`.
   - **Chip, active:** `#191713` fill and border, `#FAF5EC` text.
4. **Result summary** — `padding: 26px 56px 0`, flex `space-between` on baseline: left is the live count ("12 notes across 5 cities" / "3 notes in Jakarta"), right is the active sort description. Both DM Mono 11px uppercase.
5. **Card grid** — `padding: 20px 56px 56px`, `repeat(3, 1fr)`, `gap: 26px`. Each card is a link, `1px solid #E3DACA`, `display: flex; flex-direction: column`. Image `height: 230px`. **If the entry has a Signature Meter score,** a badge sits at the image's bottom-right corner: `#191713` fill, `#FAF5EC` text, `padding: 9px 14px`, Instrument Serif 24px, `line-height: 1` — flush to the corner, no offset. Body: `padding: 22px 22px 24px`, flex column `gap: 9px`, `flex: 1`. Contains a baseline row (terracotta "City · Kind" left, `#A39880` date right, both DM Mono 10.5px, date `white-space: nowrap`), h3 at 29px, description at 16px, then a verdict line pushed to the bottom with `margin-top: auto; padding-top: 12px` in DM Mono 10px uppercase `#8A8271`. Hover → border `#B0451C`.
6. **Coming next band** — `background: #F3ECDD`, `padding: 48px 56px`, `border-top: 1px solid #E3DACA`, flex `space-between`: eyebrow + h2 at 38px + subhead, and a terracotta button.
7. Footer.

---

### 4. Trip hub (`Trip-Japan-2025.dc.html`)

**Purpose:** the container for one trip — route, chapters, and every meal from it.

**Layout:**

1. Header, "Trip 04" right.
2. **Title block** — grid `1fr / 380px`, `padding: 60px 56px 40px`, `border-bottom`. h1 at 84px `max-width: 20ch`; right column holds season / who / transport metadata.
3. **Route** — `padding: 48px 56px 8px`. A DM Mono eyebrow, then `repeat(4, 1fr)` with `border-top: 2px solid #191713`. Each cell: `border-right: 1px solid #E3DACA` (omitted on the last), DM Mono terracotta date range, Instrument Serif 30px city, Newsreader 16.5px descriptor. First cell has no left padding, last has no right padding — so the rule spans edge to edge.
4. **Chapters** — h2 at 40px, then `repeat(2, 1fr)`, `gap: 24px`, cards `height: 420px`. Same overlay-card pattern as the travel index at larger scale: DM Mono 24px number, Instrument Serif 38px title, Newsreader 17px description. Tokyo card carries the terracotta outline.
5. **Meals from this trip** — `background: #F3ECDD`, `padding: 52px 56px`. Header row (h2 at 40px + explanatory paragraph `max-width: 38ch`), then `repeat(4, 1fr)`, `gap: 20px`, wrapping to two rows for 8 items. Each card: `#FAF5EC` fill, `1px solid #E3DACA`, image `height: 170px`, `padding: 18px 20px 22px`, DM Mono 10px terracotta location label, Instrument Serif 25px name.
6. **Planning notes** — `padding: 56px 56px 0`, grid `1fr 1fr`, `gap: 56px`. Left: h2 at 40px plus two body paragraphs at 19.5px. Right: a `border-top: 2px solid #191713` table with a DM Mono header and four rows of `grid-template-columns: 160px 1fr`, `gap: 18px`, `padding: 13px 0`, `border-top: 1px solid #E3DACA`.
7. **Atlas band** — `background: #191713`, `padding: 56px`, flex, `margin-top: 56px`.
8. Footer.

---

### 5. Travel chapter (`Chapter-Tokyo.dc.html`)

**Purpose:** one city's diary entry. This is the template for all chapters and the most complex page in the system — it deliberately alternates between cinematic photography and a narrow reading column.

**Layout:**

1. **Cinematic hero** — `position: relative`, `height: 760px`, `background: #12100E`. Full-cover image, then an overlay of `linear-gradient(180deg, rgba(18,16,14,.72) 0%, rgba(18,16,14,.2) 38%, rgba(18,16,14,.94) 100%)`. The header renders *inside* the hero (`position: relative; z-index: 2`) with light-on-dark treatment: wordmark in `#FAF5EC` with an amber dot, nav in `#D8D0C2`. Content block at `left/right: 56px`, `bottom: 52px`:
   - Breadcrumb row: linked trip name in `#E9B98F`, a `40×1px` amber-pale divider at `opacity: .55`, then "Chapter 04 of 04 · Final city".
   - h1 at 92px, `max-width: 24ch`.
   - Below, a flex row `align-items: flex-end` `space-between` `gap: 60px`: deck paragraph at 20px `max-width: 58ch` `#DCD4C6`, and three metadata chips (`1px solid rgba(250,245,236,.4)`, `padding: 8px 12px`).

2. **Chapter nav** — sticky at `top: 0`, `border-bottom: 1px solid #E3DACA`, `padding: 0 56px`, `background: rgba(250,245,236,.95)` + blur, `z-index: 15`, `overflow: hidden`. A DM Mono "In this chapter" label (`padding: 18px 26px 18px 0`, `flex-shrink: 0`), then anchor links each with `padding: 18px 20px` and `border-left: 1px solid #E3DACA` (last also `border-right`), a `flex: 1` spacer, and a terracotta "See on the map →" link. Link hover → `background: #F3ECDD`. Anchors scroll to the section IDs below.

3. **At a glance** — `background: #F3ECDD`, `padding: 52px 56px`, `border-bottom`. DM Mono eyebrow, then `repeat(4, 1fr)`, `gap: 32px`. Each cell: `border-top: 2px solid #191713`, `padding-top: 16px`, a Karla 11.5px uppercase 700 terracotta label, and a Newsreader 17.5px value.

4. **Intro** — `padding: 64px 56px 0`, flex `justify-content: center`, inner `max-width: 720px`. A lede at 24px `#2E2A23`, then body paragraphs at 19.5px `line-height: 1.75` `#463F36`.

5. **Content sections**, each with an `id` matching the chapter nav. The pattern alternates deliberately:
   - **`#stay`** — centered 720px column (eyebrow, h2 at 46px, two paragraphs, then a **personal-take callout**: `border-left: 3px solid #B0451C`, `background: #F3ECDD`, `padding: 22px 26px`, an 11px uppercase terracotta label, and an 18.5px Newsreader paragraph). Then a **full-bleed figure** breaking out of the column: image `height: 520px`, with its `figcaption` constrained back to `max-width: 720px; margin: 0 auto` — captions align to the reading column even when the image is full width.
   - **`#gyukatsu`** — 720px column with a two-column `1fr 1fr` mini-table (`border-top: 2px solid #E3DACA` cells). Then a **two-up photo grid** (`1fr 1fr`, `gap: 16px`, images `height: 420px`, captions at 15.5px). Then a centered **linked food-note card** at 720px: `1px solid #E3DACA`, `background: #F3ECDD`, `padding: 24px 26px`, flex `space-between` — label + title left, a DM Mono `→` at 20px right.
   - **`#fuji`** — 720px column, then a **full-bleed pull quote**: `background: #191713`, `padding: 56px`, Instrument Serif italic 46px `line-height: 1.22`, `max-width: 24ch`, centered, `#FAF5EC`. Then a **three-up photo grid** (`repeat(3, 1fr)`, `gap: 16px`, images `height: 340px`, captions `padding: 12px 16px 0`).
   - **`#cats`** — breaks the pattern: a two-column `1fr 1fr` `gap: 48px` `align-items: center` split — text (with a callout) left, a single `height: 480px` figure right.
   - **`#shrine`** — 720px column, then an asymmetric `1.4fr 1fr` photo grid, images `height: 460px`.

6. **Prev/next** — `padding: 72px 56px 0`, grid `1fr 1fr`, `gap: 16px`. Two cards, `1px solid #E3DACA`, `padding: 28px 30px`, flex column `gap: 10px`. The right card is right-aligned (`align-items: flex-end; text-align: right`). DM Mono 10.5px uppercase direction label over an Instrument Serif 32px title. Hover → `background: #F3ECDD`.

7. Footer, `margin-top: 72px`.

---

### 6. Food review (`Food-Kindling.dc.html`)

**Purpose:** the review template. **The Signature Meter is the defining feature — see the dedicated section below.**

**Layout:**

1. Header, "Food review · <date>" right.
2. **Title block** — grid `1fr / 400px`, `padding: 64px 56px 44px`, `align-items: end`, `border-bottom`. Left: terracotta eyebrow ("Food review · Jakarta · 9 May 2026"), h1 at 76px `max-width: 24ch`, deck at 21px `max-width: 58ch`. Right: `border-left` column with visited / format / paid metadata.
3. **Lead image** — full-bleed, `height: 600px`. Caption `padding: 14px 56px 0`, `max-width: 900px`.
4. **Signature Meter** — see below.
5. **At a glance** — `padding: 44px 56px 0`, `repeat(4, 1fr)`, `gap: 30px`. Cells with `border-top: 2px solid #191713`, `padding-top: 16px`: best for / best dishes / service note / value read.
6. **Body** — centered 720px column: lede at 23px, paragraphs at 19.5px, h2s at 40px.
7. **Course flow** — a `1fr 1fr` `gap: 16px` grid of four figures, images `height: 420px`. This is the review's photographic spine; caption each course honestly, including the weak one.
8. **Weak spot callout** — inside the 720px column, same callout pattern (`border-left: 3px solid #B0451C`, `#F3ECDD` fill). Every review should have one.
9. **Room set** — `repeat(3, 1fr)` `gap: 16px`, images `height: 340px`.
10. **Pull quote** — full-bleed `#191713`, `padding: 56px`, Instrument Serif italic 46px `max-width: 26ch` centered, with a DM Mono 10.5px uppercase attribution line below in `#9C9385`.
11. **Details table** — centered 720px, `border-top: 2px solid #191713`, DM Mono header, then rows of `grid-template-columns: 170px 1fr` `gap: 20px` `padding: 14px 0` `border-top: 1px solid #E3DACA`. Where / format / best for / tell them / **disclosure**. The disclosure row is mandatory on every review.
12. **Related** — `padding: 64px 56px 0`, h2 at 36px, `repeat(3, 1fr)` `gap: 20px`. Two review cards (image `height: 200px`, terracotta "City · date · score" label, h3 at 26px, description) plus one Atlas card that swaps the image for a `#F3ECDD` panel containing a 60px terracotta numeral.
13. Footer, `margin-top: 72px`.

---

### 7. Work With Me (`Work-With-Me.dc.html`)

**Purpose:** the collaboration pitch. **This page inverts the palette** — dark ground, amber accent — because it is a pitch, not a diary entry. It is the only page that does this.

Palette shifts: `body` background `#12100E`, text `#F2EDE4`, accent `#E0A03A` (amber, not terracotta), body copy `#B7AF9F`, raised surfaces `#1A1714`, hairlines `rgba(242,237,228,.12–.15)`. Links hover to `#E0A03A`. `::selection` becomes `background: #E0A03A; color: #12100E`. The footer inverts back to `#F2EDE4` ground with `#191713` text — a deliberate hard cut at the bottom of the page.

**Layout:**

1. Header — amber dot in the wordmark, nav in `#B7AF9F` with the active item amber, plus an "Enquire" button (`1px solid #E0A03A`, amber text) linking to `#enquire`.
2. **Hero** — grid `1fr / 460px`, `padding: 76px 56px 64px`, `align-items: end`. Left: amber eyebrow, h1 at 88px `max-width: 22ch` ("I write full reviews. Not captions."), deck at 21px `max-width: 56ch`. Right: `border-left: 1px solid rgba(242,237,228,.15)` column, `padding-left: 30px`, `gap: 22px` — three stat blocks with 44px Instrument Serif numerals (first amber) over DM Mono labels.
3. **Photo band** — `repeat(4, 1fr)`, `gap: 2px`, images `height: 260px`. The 2px gaps read as hairlines against the dark ground.
4. **What I can do** — h2 at 46px, then `repeat(3, 1fr)` with `gap: 2px` and `background: rgba(242,237,228,.14)` on the container so the gaps become dividing rules. Each cell is `#12100E` with `padding: 32px 30px 36px`: a DM Mono 24px amber numeral, h3 at 32px, body at 17.5px, and a DM Mono 10.5px uppercase terms line.
5. **Honesty policy** — grid `1fr 1fr` `gap: 56px` `align-items: center`. Left: amber eyebrow, h2 at 52px, body, and a link with `border-bottom: 1px solid #E0A03A`. Right: a five-row table using the same `gap: 2px` hairline technique, each row `#1A1714` with `padding: 22px 26px`, flex `space-between` on baseline — a Newsreader 18px statement left, a DM Mono 11px uppercase answer right (amber for yes-values, `#8E8676` for "Never").
6. **Pull quote** — `border-top`/`border-bottom` `1px solid rgba(242,237,228,.15)`, `padding: 52px 0`, Instrument Serif italic 52px `max-width: 28ch` centered.
7. **Enquiry form** (`id="enquire"`) — grid `1fr / 480px` `gap: 64px` `align-items: start`. Left: h2 at 52px, body at 19px `max-width: 46ch`, contact details in DM Mono 12.5px. Right: stacked fields — name, venue, then a `1fr 1fr` row of email + city, then a 5-row textarea, then an amber submit button with `#12100E` text. All inputs: transparent fill, `1px solid rgba(242,237,228,.28)`, `#F2EDE4` text, `padding: 16px 18px`, DM Mono 13px, `outline: none`.
8. Footer — inverted to `#F2EDE4`.

---

### 8. The Atlas (`Atlas.dc.html` + `map-atlas.html`)

**Purpose:** browse the whole journal by place.

`Atlas.dc.html` is the page shell; `map-atlas.html` is the map itself, embedded in an `<iframe>`. **In the real build, make the map a hydrated island component rather than an iframe** — an Astro component with `client:visible`, or your framework's equivalent. The iframe exists only because of the prototyping environment.

**Page layout:**

1. Header, entry count right.
2. **Title block** — grid `1fr / 400px`, `padding: 52px 56px 32px`, `align-items: end`. Left: eyebrow, h1 at 76px, deck at 20px `max-width: 52ch`. Right: three stat blocks in a flex row, `gap: 32px`, `justify-content: flex-end` — 52px Instrument Serif numerals (first terracotta) over DM Mono labels. Current values: 19 places, 9 cities, 4 countries.
3. **Filter chips** — `padding: 0 56px 20px`, flex `gap: 10px`: a DM Mono "Filter" label then All / Travel chapters / Food notes / Japan / Indonesia / Thailand / UK. Same chip styling as the food index. *(Currently presentational in the prototype — wire these to the map's data layer.)*
4. **Map** — `padding: 0 56px 56px`, container `1px solid #E3DACA`, `height: 620px`, `background: #F4F1EA`. Below it, a DM Mono 10.5px `#A39880` help line: "Click a country to zoom into its cities · scroll or use +/− to zoom, drag to pan. Map data © Natural Earth."
5. **Index by country** — `repeat(4, 1fr)`, `gap: 32px`. One column per country (Japan, Indonesia, Thailand, UK). Each: a heading row with `border-bottom: 2px solid #191713` `padding-bottom: 12px` holding an Instrument Serif 32px country name and a DM Mono date/count (terracotta when the list is still growing), then rows — each a link, flex `space-between` on baseline, `padding: 15px 0`, `border-bottom: 1px solid #E3DACA`, with a Newsreader 19px place name and DM Mono 10.5px uppercase metadata. Unwritten entries render at `opacity: .55` with "In progress" / "Next trip".
6. Footer.

#### The map component

Built with **D3 v7** and **topojson-client v3**, geometry from **`world-atlas@2.0.2/countries-110m.json`** (Natural Earth, via CDN). Do not hand-draw geography — load real data.

**Projection:** `d3.geoMercator()`, fitted via `projection.fitExtent([[26, 40], [W - 26, H - 26]], box)` where `box` is a GeoJSON polygon spanning roughly `[-14, -14]` to `[152, 62]` — the bounding box containing the UK, Indonesia, Japan and Thailand.

**Two-tier zoom.** This is the key interaction, and it exists to stop the five Japanese cities from stacking into an unreadable clump:
- Below `k = 2.4`: **country clusters.** One `r: 15` filled disc per country, positioned at the mean lat/lon of its member places, showing the count of written entries in Instrument Serif 15px `#FAF5EC`, with the country name in DM Mono 11px below. Hover grows the disc to `r: 17` over 140ms. Click flies to that country's members and expands them.
- At or above `k = 2.4`: **individual city pins.** An `r: 14` translucent halo, an `r: 5` solid dot with a `1.5px #FAF5EC` stroke, and a DM Mono 10px uppercase label offset `±13px` — placed left of the pin when `lon < 20`, right otherwise, to keep European labels from colliding.

Crossfade the two layers with `opacity` and toggle `pointer-events` so only the visible tier is clickable.

**Pin colors:** travel `#191713`, food `#B0451C`, planned-but-unwritten `#C9BFAB`. Three-item legend, top right.

**Controls:** `d3.zoom()` with `scaleExtent([1, 14])` and a `translateExtent` of `[[-W*0.4, -H*0.4], [W*1.4, H*1.4]]`. `dblclick.zoom` is disabled. A `+` / `−` / reset button stack sits top-left (`32×32px` buttons, `#FAF5EC` fill, hover `#B0451C` with `#FAF5EC` text). The `#wrap` cursor is `grab`, switching to `grabbing` during drag. Programmatic zooms transition over 300ms (buttons), 600ms (reset), 700ms (fly-to-country).

**Info card** — absolutely positioned `left: 20px; bottom: 20px`, `width: 250px`, `#FAF5EC` fill, `1px solid #E3DACA`, `padding: 15px 18px 18px`, `box-shadow: 0 14px 34px rgba(25,23,19,.12)`. Contains a DM Mono 9px uppercase kind label ("Country" / "City"), an Instrument Serif 26px title, a Newsreader 11px subtitle, and a list of entries each prefixed with a terracotta `→`. Clicking a cluster shows the country summary; clicking a pin shows that city's entries. Defaults to the Japan cluster on load.

**Loading state:** a DM Mono "Loading map…" message centered in the container, removed once the topology resolves. Required — the geometry is a network fetch and the container would otherwise render empty.

**Label collision:** cluster labels use a per-country vertical offset (`Thailand: -26`, `Indonesia: 36`, `Japan: 34`, `UK: 34`) because Thailand and Indonesia sit close enough to overlap at the default zoom.

---

## Interactions & Behavior

**Navigation.** Every page shares the same header and footer. The current section gets `border-bottom: 2px solid #B0451C; padding-bottom: 2px` in the nav. Header is sticky on Home, Food index, Travel index, and Food review; on the chapter page the header sits inside the hero and the chapter nav is sticky instead.

**Hover states.**
- Index rows and prev/next cards → `background: #F3ECDD`
- Content cards → `border-color: #B0451C`
- Photo/chapter cards → `opacity: .93`
- Primary button → fill becomes `#B0451C`
- Secondary button → `border-color: #B0451C`
- Text links → `color: #B0451C` (`#E0A03A` on Work With Me)
- Map cluster → `r: 15 → 17`, 140ms; map pin → `r: 5 → 7.5`, 140ms

No transition durations are specified for CSS hovers in the prototype — use a consistent `120–160ms ease` across the build.

**Food index filtering.** Two independent controls, no URL state in the prototype — **add query-param state in the real build** (`?city=jakarta&sort=score`) so filtered views are linkable and survive a refresh.
- City filter: `All` shows everything; otherwise exact match on the entry's city.
- Sort: `recent` → descending by date; `score` → descending by score with unscored entries last, ties broken by date; `place` → alphabetical by city, then by date descending.
- The result summary updates live and pluralizes ("1 note" / "12 notes") and switches phrasing between "across 5 cities" and "in Jakarta".

**Chapter nav.** Anchor links to section IDs. Add `scroll-margin-top` to each section equal to the sticky nav height so headings don't hide beneath it. Consider a scroll-spy active state — not in the prototype, but the design supports it.

**Forms.** The newsletter and enquiry forms are visual only. Wire them to whatever you prefer (Cloudflare Pages Functions, Formspree, Buttondown). Both need real validation, a loading state, and success/error states — none of which are designed yet. Ask before inventing them.

**Responsive.** **Not designed.** Every layout here is desktop-only, with fixed multi-column grids and a 56px gutter. This is a significant gap — most search traffic to a food blog is mobile. My recommendation for the build:
- Collapse all two-column title blocks to a single column below ~900px; the right metadata column becomes a horizontal row or moves below the deck.
- Card grids: 3-up → 2-up → 1-up. The travel index's 4-up chapter row → 2-up → 1-up.
- Display type needs a fluid scale — an 84–92px h1 must land near 40–44px on a phone. Use `clamp()`.
- The index rows (`56px 1fr 180px 122px 96px`) can't survive narrow widths. Drop to a two-column layout: thumbnail plus a stacked title/metadata block.
- Reading column: keep 720px, but the 56px gutter should fall to ~20px.
- The chapter nav should become horizontally scrollable rather than wrapping.
- The map needs a taller aspect ratio and larger touch targets (the `r: 5` pins are far too small for touch — go to `r: 10` minimum, per the 44px hit-target rule).

Come back to me with mobile layouts before shipping if you'd rather I design them properly.

---

## State Management

The design is almost entirely static. Only two pieces need state:

**Food index** — `{ city: string, sort: 'recent' | 'score' | 'place' }`. Derive the filtered/sorted list, the count label, and the sort description from it. Should be reflected in the URL.

**Atlas map** — `{ transform: d3.ZoomTransform, selected: Country | City }`. The zoom transform drives which tier is visible (`k >= 2.4`) and repositions every pin on change. `selected` drives the info card. Consider reflecting the selected place in the URL hash so a city can be linked directly.

**Data fetching.** The map fetches `countries-110m.json` from a CDN at runtime. Prefer vendoring this into your assets and importing it at build time — it removes a runtime dependency and a network round-trip.

**Content model.** For an Astro content-collection setup, the shapes are:

```ts
// Food entry
{
  name: string
  city: string
  kind: 'Review' | 'Food note'
  date: Date
  score: number | null        // null for short notes; drives the badge and score sort
  signatureMeter: {           // present only on full reviews
    firstBite: number
    craveFactor: number
    roomMood: number
    hostEnergy: number
    worthTheWallet: number
    returnTicket: number
  } | null
  note: string                // one-line summary for cards
  verdict: string             // e.g. "Expensive but worth it · birthday dinner"
  tags: string[]
  heroImage: Image
  paid: boolean               // false ⇒ render a hosted-visit disclosure
  coords: [lat: number, lon: number]
}

// Trip
{
  name: string
  country: string
  startDate: Date
  endDate: Date
  tripNumber: number
  chapters: Chapter[]
  foodNotes: FoodEntry[]      // resolved by relation
}

// Chapter
{
  city: string
  chapterNumber: number
  dateRange: string
  heroImage: Image
  sections: { id, label, ... }[]
  coords: [lat: number, lon: number]
}
```

---

## The Signature Meter

This is the author's own scoring system and **the most important single component in the design.** It's what distinguishes these reviews from every other food blog, and it should be a first-class, reusable component — not markup pasted into each review.

**Six axes**, each scored 0–10 with one decimal:

| Axis | What it measures |
|---|---|
| First Bite | The immediate impression |
| Crave Factor | Whether you'd want it again |
| Room Mood | Atmosphere and setting |
| Host Energy | Service and hospitality |
| Worth the Wallet | Value for what it cost |
| Return Ticket | Likelihood of going back |

**Layout.** A bordered block, `background: #F3ECDD`, `border: 1px solid #E3DACA`, `margin: 56px 56px 0` — three horizontal bands separated by `1px solid #E3DACA`:

1. **Header** — `padding: 26px 32px`, flex `space-between` `align-items: center`. Left: DM Mono 11px uppercase `#7E7565` "NutNibbles Signature Meter" over a Newsreader 18px `#5A5348` descriptor line specific to the visit. Right: a baseline-aligned pair — the overall score in Instrument Serif 64px terracotta `line-height: .9`, and "/ 10 overall" in DM Mono 12px `#8A8271`.

2. **Bars** — `grid-template-columns: 1fr 1fr`, the left cell carrying `border-right: 1px solid #E3DACA`. Each cell `padding: 26px 32px`, flex column `gap: 20px`, holding three axes. Each axis: a baseline row with the label in Karla 11.5px uppercase 700 `.14em` `#4A463C` and the value in DM Mono 13px `#191713`, then `margin-bottom: 8px`, then a track — `height: 5px`, `background: #E3DACA`, containing a `height: 5px` fill of `background: #B0451C` whose width is `score × 10%`.

3. **Tags** — `padding: 22px 32px`, flex `gap: 10px`, wrapping. The first tag is the headline verdict, styled as a filled chip (`#191713` fill, `#FAF5EC` text); the rest are outlined (`1px solid #C9BFAB`, `#4A463C` text). All DM Mono 10.5px uppercase `.12em`, `padding: 7px 12px`.

**Overall score** is authored, not computed — it's a judgement, not a mean. (Kindling: axes 9.0 / 9.1 / 9.4 / 9.4 / 8.9 / 9.0, overall 9.1.)

Scores also surface in three other places, and all three must stay consistent with the review:
- Food index card badge (`#191713` fill, Instrument Serif 24px, flush to the image's bottom-right corner)
- Atlas country index rows ("9 May 2026 · 9.1")
- Related-review cards ("Jakarta · 18 Apr 2026 · 9.1")

Entries **without** a score (short trip food notes) simply omit the badge — never render a zero or an em dash.

---

## Content Rules

These are editorial decisions built into the design. Preserve them.

- **Every review carries a disclosure row.** Currently "Paid for in full. No invitation, no comped courses." Hosted visits must say so.
- **Every review has a weak-spot callout.** The honesty is the product; the template shouldn't allow a review without one.
- **Captions are first-person and specific**, never descriptive filler. "Eating ice cream below zero is stupid and I'd do it again" — not "Soft serve ice cream."
- **Dates are real and precise.** Trip date ranges come from boarding passes. Don't let the CMS default to a publish date where a visit date belongs.
- **Unwritten entries are shown, not hidden** — at `opacity: .55` with "In progress", and as grey `#C9BFAB` pins on the map. The diary admits its gaps.
- Photo captions sit below their image in Newsreader italic, `#7A7264`, and align to the reading column even under full-bleed images.

---

## Assets

### Photography

All photography is the author's own, currently **hot-linked from the live site** at `https://nutsnibbles.cc/assets/images/…`. **Migrate these into the repo** and serve them through your framework's image pipeline (Astro's `<Image>` or equivalent) — they need responsive `srcset`, modern formats, lazy loading below the fold, and explicit dimensions to prevent layout shift. They are currently full-size JPEGs served unoptimized.

Paths referenced in the designs:

```
japan-2025/tokyo/          fuji-san-lake-clouds.jpeg
                           fuji-san-snow-close.jpeg
                           fuji-san-red-pagoda-view.jpeg
                           oshino-hakkai-fuji-view.jpeg
                           meiji-jingu-sacred-tree-ema.jpeg
                           meiji-jingu-south-gate.jpeg
                           harajuku-omotesando-mirror-building.jpeg
                           shibuya-cat-lounge-mocha-feeding-circle.jpeg
                           cerulean-tokyu-hotel-gym.jpeg
                           gyukatsu-motomura-cutlet-set.jpeg
                           gyukatsu-motomura-beef-rice-egg.jpeg
                           gyukatsu-motomura-table-spread.jpeg
                           im-donut-display.jpeg
japan-2025/sapporo/        moerenuma-family-pyramid.jpeg
                           ramen-bowl.jpeg
                           sapporo-lunch-salmon-sashimi.jpeg
                           sapporo-711-dinner.jpeg
                           hokkaido-jingu-nearby-lunch.jpeg
                           shiroi-koibito-soft-serve.jpeg
japan-2025/osaka/          osaka-botanic-garden-tree-path.jpeg
                           ryunosu-yakiniku-meat.jpeg
                           coco-ichibanya-shin-umeda-curry.jpeg
uk-scotland-2023/glasgow-highlands/
                           highlands-moody-road.jpeg
jakarta/kindling-birthday/ crab-custard.jpeg
                           small-bites.jpeg
                           steak-course.jpeg
                           duck-course.jpeg
                           firefly-squid.jpeg
                           roast-duck-presentation.jpeg
                           birthday-dessert.jpeg
                           kindling-sign.jpeg
jakarta/august/            restaurant-interior.jpeg
                           teh-kotak.jpeg
saawaan-bangkok-jan-2026/  saawaan-opening-course.jpeg
```

**Missing:** no photography exists for the London or Edinburgh chapters. Their cards render as `linear-gradient(160deg, #2A2620, #12100E)` placeholders. Ask the author for these folders.

### Fonts

Instrument Serif, Newsreader, Karla, DM Mono — all Google Fonts, all open-licensed. Self-host them (`@fontsource` or similar) rather than hot-linking, for performance and privacy. Preload the two weights used above the fold: Instrument Serif 400 and Karla 800.

### Map data

`world-atlas@2.0.2` `countries-110m.json`, derived from Natural Earth (public domain). Attribution line is already in the design. Vendor it rather than fetching from CDN at runtime.

### Icons

None. There are no icons anywhere in this design — arrows are typographic (`→`, `←`), and the map controls use `+`, `−`, `○`. Don't add an icon library.

---

## Known Gaps

Flagging these honestly so they don't get discovered late:

1. **No mobile layouts.** The largest gap. See **Responsive** above.
2. **London and Edinburgh chapters** are unbuilt — no photography, no copy. The travel index shows them as placeholders.
3. **Only one chapter page exists** (Tokyo). It is the template for all others.
4. **Only one review page exists** (Kindling). Also a template. August and Saawaan appear in indexes and link to the Kindling page as a stand-in.
5. **Atlas filter chips are presentational** — they need wiring to the map's data layer.
6. **Forms are non-functional** and have no loading/success/error states designed.
7. **"Guides" appears in the homepage nav** but no guide pages exist. Either build them or remove the link.
8. **No 404, no search, no tag pages, no RSS.** An RSS feed is worth adding for a diary published on a cadence.
9. **Entry counts are hardcoded** (19 entries, 9 cities, 4 countries, "3 trips"). Derive these from the content collection.
10. **Accessibility not audited.** Notably: check contrast on `#A39880` and `#8A8271` metadata over `#FAF5EC` (both are likely below 4.5:1 at small sizes), give the map a keyboard-navigable alternative — the country index below it can serve as that, and make sure the sticky-header offsets don't hide anchor targets from keyboard users.

---

## Files

Design references in this bundle. All `.dc.html` files are prototypes in a bespoke component format — read them, don't run them.

| File | Contents |
|---|---|
| `Home.dc.html` | Homepage |
| `Travel-Index.dc.html` | All trips |
| `Food-Index.dc.html` | All food entries, with filter/sort logic |
| `Trip-Japan-2025.dc.html` | Trip hub template |
| `Chapter-Tokyo.dc.html` | Travel chapter template |
| `Food-Kindling.dc.html` | Food review template, incl. Signature Meter |
| `Work-With-Me.dc.html` | Collaboration page (inverted palette) |
| `Atlas.dc.html` | Atlas page shell |
| `map-atlas.html` | The D3 map — **plain HTML/JS, this one does run.** Read it as the reference implementation for the map component. |
| `NutNibbles Homepage Directions.dc.html` | The three original homepage explorations. Context only — direction "1a" was chosen and became `Home.dc.html`. |

In each `.dc.html`: markup sits between `<x-dc>` tags, and any logic sits in a `<script data-dc-script>` block as a `class Component` with a `renderVals()` method returning the values the template reads. `{{ name }}` are template holes; `<sc-for list>` and `<sc-if value>` are loop and conditional wrappers. Translate these to your framework's idioms.

## Questions for the designer

Rather than guessing, come back on these:
- Mobile layouts — should they be designed properly before build?
- Form success/error states
- Whether "Guides" is being built or dropped
- Scroll-spy behavior on the chapter nav
- Whether the Atlas filter chips should filter the map, the country index, or both
