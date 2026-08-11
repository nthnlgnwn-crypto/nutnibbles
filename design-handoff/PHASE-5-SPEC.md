# Phase 5 — templates, the width sweep, and the Meter

For Claude Code, branch `redesign-2026`. Follow `design-handoff/AGENTS.md` for all values.

Phase 4 closed as `2f2670d` / `095d906` / `0a8afd7`. This phase touches no routes: it fixes the machinery that produces future pages (`templates/`), sweeps a known CSS pattern bug across the live pages, and ships the Meter template. Small phase, high leverage — every page authored after this is born correct or born broken.

Order: **1. C1 → 2. width sweep → 3. templates → 4. Meter → 5. touch verification.** Stop for review after 2 and after 4.

---

## 0. Decisions taken this phase

| # | Question | Decision |
|---|---|---|
| 1 | Template scope | **Full redesign parity, all three templates.** They still emit the pre-redesign header (deleted `.brand-mark` logo, 2-item nav), bespoke footers, and the C1 bug. A template that emits last year's markup is a bug factory. §3. |
| 2 | Score sort chip | **Stays off.** Only Kindling and Saawaan carry six-axis scores; the chip returns when the author has scored enough reviews. Author task, not this phase. §4.3. |
| 3 | Meter in the template | **In, not commented out.** The six axes are fixed and settled (1 Aug); a template without the Meter invites four-axis improvisation. Optional posts omit the block; the template shows the correct one. §4. |
| 4 | Width sweep risk | **Two-class specificity, per the §1 audit note.** The naive fix regresses at ≤520px where `.collection-grid` has an existing width override. §2. |
| 5 | Reference pages | The **live shipped pages are the design reference** for template markup — Saawaan's page for food-post, the Japan hub for travel-trip, the Tokyo chapter for travel-city. Copy their shipped patterns, don't re-derive from mocks. |

---

## 1. C1 — the template bug, first

`.notes-layout` › `.photo-grid` re-applies the container width at ≤860px. In `templates/travel-city.html` **and 7 live pages**. The template instance is the urgent one — it propagates into every chapter authored from here on.

Fix the CSS mechanism once in `styles.css` (children stop re-declaring `width: var(--container-width)`; the ≤860px block is where C1 manifests). Then verify the 7 live pages and the template against it. Commit on its own:

```
Fix nested container-width in notes-layout photo grids (C1)
```

## 2. The width sweep — A3 through A7

Same mechanism, five more class pairs, found in the Phase 4 §1 audit. Fix each by removing the width re-declaration from the **children**, keeping the parent's. Use two-class specificity where a ≤520px override already exists (the §1 fix's approach — read it first).

| # | Pattern | Scope |
|---|---|---|
| A3 | `.city-chapter-nav` › `.city-chapter-grid` (no `--chapters` modifier) | 7 trip hubs — bangkok, both europe-winters, hong-kong, korea, new-zealand, uk-scotland |
| A4/A5 | 7 nested instances stacked | `travel/europe-winter-2021-22/` alone — this hub diverges from every other hub's markup convention; normalise its markup to match the others rather than special-casing CSS for it |
| A6 | `.magazine-flow` › `.chapter-pager.editorial-pager` | 3 Japan chapters — kyoto, osaka, sapporo |
| A7 | `.trip-reading-flow` › `.trip-reading-flow-table` | `travel/index.html` — manifests as a 40px inset, not 1080-vs-1120 |

Acceptance: at 1440, every affected container measures 1120px and aligns with its page's other sections. At 375 and 520, no regression — screenshot the europe-winter-2021-22 hub and one Japan chapter at all three widths, before/after. One commit for the sweep.

## 3. Templates — redesign parity

All three of `templates/travel-city.html`, `templates/travel-trip.html`, `templates/food-post.html`. They are `{{PLACEHOLDER}}` scaffolds; keep every placeholder and the head/meta/canonical/sitemap conventions exactly. What changes is the shipped chrome:

- **Header**: wordmark + `.brand-dot` (no `.brand-mark` logo img), 4-item nav — Travel · Food · The Atlas · Work with me — depth-relative, `aria-current` per template's own section.
- **Footer**: the Phase 3 global footer (Travel+Food / Japan guide / Work with me columns + "Kept by hand since 2023.") replacing the bespoke two-line footers. Copy it from any shipped page at the right depth.
- **Hero**: whatever the shipped equivalents use — `travel-city` should match the Tokyo chapter's hero classes post-Phase-3 (including the `article-hero-spread` fix if that class appears), `food-post` should match Saawaan's.
- **travel-city**: C1-clean markup per §1. Its `related-links` food-note block stays — that's the pattern the Atlas's attached-notes model mirrors.
- Diff each template against its live reference page; anything the reference has that the template lacks (e.g. `data-*` hooks Phase 3/4 added, `back-to-top` on food-post) gets reconciled deliberately, and noted in the report either way.

## 4. The Meter — into the food template

### 4.1 The block

Add the Signature Meter to `templates/food-post.html`, between the review copy and the gallery, using the shipped component classes (`.review-meter`, `.review-meter-row`, `.review-meter-track`, `.review-meter-fill` with `style="--score: NN"`), Phase 1 geometry (5px track, no nut-pin marker).

**Six fixed axes, this order:** First Bite · Crave Factor · Room Mood · Host Energy · Worth the Wallet · Return Ticket. **Overall = mean of the six**, shown to one decimal. Placeholders: `{{AXIS_FIRST_BITE}}` etc., plus `{{OVERALL_SCORE}}` with an HTML comment stating it MUST equal the mean — readers check.

### 4.2 Verify the two live Meters

Kindling and Saawaan against the same rules: six axes in that order, overall = mean (Kindling shows none — add it, 9.1; Saawaan 7.2 confirmed in Phase 4). If either page's markup drifts from the template's block, converge them.

### 4.3 Explicitly out of scope

Scoring the other 9 posts (author only), and the Score sort chip on `food/index.html` (returns with the scores). Don't touch `data-score` attributes.

## 5. Touch verification — the Phase 4 carry

The Atlas's §6 touch behavior (single-touch drag rejection, `touch-action: pan-y`, tap-opens-card, 44px controls) was never verified on a real touch target — the iOS Simulator crashed. Retry the simulator; if it still won't run, use Chrome DevTools touch emulation *and say so* — it exercises the `d3.zoom().filter()` logic but not iOS quirks, and the report must state which level of verification was achieved. Also spot-check the ≤560px chip rails' scroll + fade on the food index and the Atlas.

---

## 6. Acceptance

- `npm run build && npm run check` clean.
- A page authored from each template (scratch build, not committed) renders indistinguishable from its live reference page's chrome at 1440 and 375.
- All A3–A7 + C1 containers at 1120px/1440, no mobile regression.
- Kindling shows 9.1 overall; Saawaan unchanged at 7.2.
- Report states the touch-verification level actually achieved.

Commits: C1 alone → sweep → templates + Meter (+ touch fixes if any). Stop before pushing; nothing merges to `main` this phase.
