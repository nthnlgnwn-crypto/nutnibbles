# NutNibbles Contributor Guide

NutNibbles is a static HTML/CSS food and travel journal, hand-kept since 2023, covering trips back to 2019. Plain HTML, one shared `styles.css`, no framework. This file is the rulebook — read it before changing any published page.

## Non-negotiables

1. **No framework, no rebuild.** Plain HTML using `styles.css`. The site's speed and search performance come from being genuinely static.
2. **Never change existing routes or slugs.** Search traffic is the point of this site. A changed URL is a lost reader.
3. **Never hand-edit `dist/`.** Run `npm run build`.
4. **Local assets only.** No remote image URLs.
5. **`npm run build && npm run check` before every publish.** No exceptions.
6. **Every public page gets full metadata and a `sitemap.xml` entry.** See *Required metadata*.

## Voice

Write like a person keeping a journal who happens to be useful.

- First person, always: "I", "we", "my family".
- Warm, specific, lightly casual. Never travel-magazine.
- Include the details that make a memory real: the time, the weather, who was there, the order of the day, the standout bite, the honest downside.
- **Every review names something that didn't work.** If nothing did, say that explicitly and explain why you're confident.
- Never invent a fact, a price, a date, or a recommendation. If a detail is forgotten, write that it's forgotten — "the restaurant name is gone but the king crab wasn't" is better copy than a guess.
- Captions are opinions, not descriptions. "Eating ice cream below zero is stupid and I'd do it again" — not "Soft serve ice cream."

### Dates

Dates are load-bearing. Use the **real visit date**, sourced from a boarding pass, booking, or photo timestamp — never the publish date, never a rounded month when you know the day. Format: `9 May 2026`, ranges as `18–29 Jan 2025` with an en dash.

## Design system

The 2026 redesign replaced the dark green / cream editorial look with a warm print-editorial system. These are the only values in the palette. Do not introduce new colors.

### Colors

| Role | Hex |
|---|---|
| Paper (page background) | `#FAF5EC` |
| Paper sunken (alternating sections, callouts) | `#F3ECDD` |
| Rule (hairlines) | `#E3DACA` |
| Rule strong (secondary borders) | `#C9BFAB` |
| Ink (text, headings, dark bands) | `#191713` |
| Ink deep (footers, dark pages) | `#12100E` |
| Body copy | `#463F36` |
| Secondary prose | `#5A5348` |
| Metadata / labels | `#8A8271` |
| Eyebrow labels | `#A39880` |
| Captions | `#7A7264` |
| **Terracotta (the accent)** | `#B0451C` |
| Amber (dark backgrounds only) | `#E0A03A` |
| Amber pale (labels over photography) | `#E9B98F` |

Two backgrounds per page maximum, plus `#191713` for full-bleed emphasis bands. The Work With NutNibbles page is the single exception: it inverts to a dark ground with amber accent, because it's a pitch, not a diary entry.

### Type

| Family | Role |
|---|---|
| **Instrument Serif** (400) | Display — all headings, scores, large numerals |
| **Newsreader** (300–600) | Reading — body, captions, card copy, pull quotes |
| **Karla** (300–800) | UI — nav, buttons, uppercase labels, wordmark |
| **DM Mono** (300–500) | Metadata — dates, counts, eyebrows. Never above 13px |

Body copy is Newsreader 19.5px / 1.75. The reading column is **720px max, centered** — this is the core readability rule and it is not negotiable on article pages. Page h1 sits 74–92px; section h2 40–52px.

### Structure

- **Border radius is 0 everywhere.** No rounded corners. This is central to the character.
- Shadows: none, except the Atlas map info card.
- Page gutter: 56px desktop, 20px mobile.
- Hairline `1px solid #E3DACA`; emphasis rule `2px solid #191713`; callout `border-left: 3px solid #B0451C` on `#F3ECDD`.
- Wordmark is Karla 800, 19px, `letter-spacing: .17em`, uppercase, two words split by a 5px terracotta dot: `NUT • NIBBLES`.

### Rhythm

The old site's failure was that every section was a card grid. Vary the rhythm deliberately: an index list, then a full-bleed photograph, then a narrow reading column, then a data table. If two adjacent sections have the same shape, change one.

## The Signature Meter

The Signature Meter is the most valuable thing on this site — it's what separates these reviews from every other food blog. Treat it as a fixed instrument.

**The six axes are fixed. Do not add, rename, or drop them.**

| Axis | Measures |
|---|---|
| First Bite | The immediate impression |
| Crave Factor | Whether you'd want it again |
| Room Mood | Atmosphere and setting |
| Host Energy | Service and hospitality |
| Worth the Wallet | Value for what it cost |
| Return Ticket | Likelihood of going back |

Rules:

- Score each axis 0–10 to one decimal.
- **The overall score is the mean of the six axes**, shown to one decimal. It is arithmetic, not a separate judgement — so a reader can check it.
- Scores are only meaningful if every review uses the same six axes. Historical reviews using other axis sets (Saawaan's Crave / Craft / Comfort / Comeback) must be rescored onto the six before any new review ships, or the whole scale is meaningless.
- The meter appears **only on full reviews**. Short food notes carry no meter and no score — never render a zero or a dash.
- Wherever a score appears elsewhere (index badge, Atlas row, related card), it must match the review exactly.
- Below the bars, tag chips: the headline verdict first as a filled chip, then outlined detail chips.

Markup: `.review-meter` › `.review-meter-row` › `.review-meter-track` › `.review-meter-fill` with `style="--score: NN"`.

## Content types

### Food post — `food/{slug}/index.html`

Start from `templates/food-post.html`.

Required, in order: eyebrow (`Food Review / {City} / {Date}`), personal headline, standfirst, hero image with an opinionated caption, **Signature Meter** (full reviews), At a Glance card (best for / best dishes / service note / value read), the body, a course-flow photo set, a **weak-spot callout**, a **`Worth it?` verdict**, and a **disclosure line**.

- Images live under the related trip/city folder, or a place folder like `assets/images/jakarta/kindling-birthday/`.
- **Disclosure is mandatory.** State plainly whether you paid. Hosted or comped visits must say so, in the review body, not a footnote.
- Link back to the relevant city chapter, and add the reverse link from that chapter.
- Add to `food/index.html` and `sitemap.xml`.

### Trip hub — `travel/{trip-slug}/index.html`

From `templates/travel-trip.html`. Route with real dates, chapter cards, meals from the trip, and honest planning notes (go when / best stay / what to skip / book early). Link every food post from the trip.

### City chapter — `travel/{trip-slug}/{city-slug}/index.html`

From `templates/travel-city.html`. Cinematic hero, sticky jump nav, At a Glance strip, then day-stamped sections in a 720px column alternating with photography. Previous/next chapter navigation. Keep anchor IDs stable forever — food posts link directly to them.

## Mobile

Most readers arrive on a phone from search. Mobile is not a review step; it is the primary case.

- Two-column blocks collapse to one below 900px.
- Card grids: 3-up → 2-up → 1-up.
- Display type uses `clamp()`. An 84px h1 lands near 40px on a phone.
- Index rows drop to thumbnail + stacked title/meta. The desktop 5-column grid cannot survive narrow widths.
- Chapter jump nav scrolls horizontally rather than wrapping.
- Gutter 56px → 20px. Reading column stays 720px.
- **Touch targets minimum 44px.** Map pins need `r: 10` or larger (use a transparent oversized hit circle over a smaller visible dot).
- Add a build-time tap-target check alongside the existing `npm run check:*` scripts. This rule was missed twice in review; a script catches it reliably and eyeballing does not.
- Add `scroll-margin-top` to anchor targets equal to the sticky header height.

## Images

- Alt text describes the actual scene, dish, or moment.
- `loading="lazy"` + `decoding="async"` everywhere except the above-the-fold hero, which is `loading="eager"`.
- Long edge ≈1600px, JPEG quality 78–82. Never commit a multi-megabyte photo.
- Strip EXIF/GPS before committing.
- Set explicit `width`/`height` to prevent layout shift.
- Never rename or move existing images.

## Accessibility

- Body text contrast ≥ 4.5:1. `#A39880` and `#8A8271` on paper are borderline — do not use them for anything a reader must read, only for supporting metadata.
- The Atlas map needs a keyboard-navigable equivalent; the country index below it serves that purpose and must stay in sync with the pins.
- Every interactive element reachable by keyboard, with a visible focus state.
- Decorative images take `alt=""`.

## Required metadata

Every public page:

- `<title>` ending `| NutNibbles`
- `<meta name="description">` — concrete and human, not keyword soup
- Canonical `https://nutsnibbles.cc/...` with trailing slash
- `og:type` (`website` for hubs, `article` for posts), `og:title`, `og:description`, `og:image` (absolute, local, committed), `og:url`
- `twitter:card` = `summary_large_image`, plus `twitter:title`, `twitter:description`, `twitter:image`
- Favicons: `/favicon.ico`, `/assets/icons/favicon-32.png`, `/assets/icons/apple-touch-icon.png`

## Mobile map

`map-atlas.html` branches at 520px: pins `r: 10` with `r: 24` transparent hit circles, country discs `r: 22` with 20px counts, controls 44×44, and the info card becomes a full-width bottom sheet rather than a floating box. Never let the card cover more than ~35% of the map height.

## Before you commit

1. Review the diff; confirm nothing unrelated changed.
2. `npm run build`
3. `npm run check` (meta, sitemap, links, images)
4. Open the page at 375px and 1440px.
5. Check the social preview renders.
6. Confirm dates against a real source.
7. Confirm the disclosure line is present on any review.

Do not commit unless asked.

## Known risks

- `sitemap.xml` is manual and easy to forget — `npm run check:sitemap` catches it, so run it.
- `.github/workflows/pages.yml` publishes the repo root while `scripts/build-static.js` generates `dist/`. Clarify deployment before changing either.
- The Tokyo page references remote hotel images. Don't add more remote dependencies.
- Historical reviews predate the fixed six-axis Meter and need rescoring.
- Entry counts are hardcoded in several hubs. When adding a post, grep for the old count.
