# Phase 6 — post-launch cleanup

For Claude Code, branch `main` (the redesign is live; work in small commits, push when each passes).

Two items. Both are engineering hygiene, no visual change permitted — acceptance for each includes pixel-identical rendering.

---

## 1. Trim the D3 payload

`assets/js/d3.v7.min.js` is the full 273KB bundle; the Atlas uses roughly five modules (geo, zoom, selection, transition, array). Phase 4 shipped the full bundle under an escape hatch because hand-assembling internals without a bundler breaks silently. The no-bundler path that does NOT have that problem:

- Each d3 module publishes a **standalone UMD build** (`dist/d3-*.min.js` on npm/unpkg) that attaches to the global `d3` object. Concatenating UMD builds in dependency order is safe — no internal surgery.
- The real module set is larger than five once transitive deps count: `d3-zoom` pulls dispatch, drag, ease, interpolate, timer, selection, transition; `d3-geo` pulls array. Expect ~10 modules, still a fraction of 273KB.
- Procedure: list every `d3.*` call in `atlas-map.js` first; map each to its module; fetch the UMD builds at the exact versions d3 v7 pins; concatenate in dependency order into `assets/js/d3-custom.min.js` with a header comment listing modules + versions; swap the script tag.
- **Verify by behavior, not loading:** world tier renders, cluster click zooms, pinch filter works, reset works, filters re-render discs. Any missing module fails at runtime, not load time.
- Escape hatch, again: if any module's UMD build is unavailable or the dependency order can't be established cleanly, keep the full bundle and say so. 273KB deferred on one page is a nit, not a bug.

Acceptance: Atlas fully functional (the behavior list above), new bundle size reported, `build && check` clean. One commit.

## 2. Unify `.site-header-meta`

Every page hand-writes its own header meta line — the convention drifted per page (flagged Phase 4 §4.2b-6, when the Atlas's said "20 entries" against a stat row saying 11/09/13).

- Audit first: grep every `.site-header-meta` instance, list the variants (content pattern, wording, position) in the report before changing anything.
- Then pick the majority convention and normalise all pages to it. If a page's meta line carries a count, it must be derivable from that page's own content (same principle as the Atlas stats); if it can't be, drop the count rather than hand-maintain it.
- Templates too: whatever the convention is, `templates/*.html` must emit it.

Acceptance: one convention site-wide, listed in the report page-by-page; no invented counts; templates match; `build && check` clean. One commit.

## Out of scope

The japan-guide page (already on the redesign — verified 12 Aug), any Atlas feature work, scoring the remaining 9 food posts, the Score sort chip.
