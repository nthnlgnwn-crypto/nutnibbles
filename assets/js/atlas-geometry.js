/*
 * Pure geometry shared between the Atlas map (assets/js/atlas-map.js,
 * browser) and its label-collision check (scripts/check-atlas-labels.js,
 * Node). No DOM, no d3, no dependencies — just the math, so the check can
 * never silently drift from what actually renders. If the map's projection
 * fit, zoom-to-cluster scale, or label geometry ever change, change them
 * here and both sides stay honest automatically.
 *
 * The Mercator formula below was verified bit-for-bit against the site's
 * live d3.geoMercator() output before being trusted (six reference points,
 * both hemispheres, both sides of the antimeridian-adjacent box). The
 * per-character label widths were measured with real SVG getBBox() against
 * the live self-hosted DM Mono, with the actual .lbl/.clbl classes applied
 * (uppercase transform + letter-spacing already baked into the measured
 * numbers, not modeled separately) — DM Mono is monospace, so a flat
 * per-character rate reproduces every real label on the site to within
 * 0.001px. Re-measure and update these constants if the map's fonts,
 * font-sizes, or letter-spacing ever change.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AtlasGeometry = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var BOX_LON = [-8, 178];
  var BOX_LAT = [-44, 60];
  var CITY_ZOOM = 2.4;

  // Manual overrides: the base position before the greedy nudge pass runs.
  // Hand-tuned so a well-understood layout doesn't get reshuffled by the
  // heuristic for no reason. The nudge pass runs on top of these, not
  // instead of them — before deleting an entry, confirm with
  // scripts/check-atlas-labels.js that nothing collides without it.
  var CITY_LBL_DY = { osaka: -10, kyoto: 22, tokyo: 10, "fuji-san": -24 };
  // Japan had no entry here: 34 is also this table's own fallback default,
  // so the old "Japan: 34" line never did anything, before or after this
  // fix — removed as the one entry provably dead regardless of automation.
  var LBL_DY = {
    Indonesia: 36, "New Zealand": -34, Thailand: 58,
    "Hong Kong": -34, "South Korea": -54, "United Kingdom": -40,
    Switzerland: -38, France: 48
  };

  // Measured constants — see file header.
  var LBL_CHAR_WIDTH = 7.921;    // .lbl  — 12px DM Mono, letter-spacing .06em
  var CLBL_CHAR_WIDTH = 8.75;    // .clbl — 12.5px DM Mono, letter-spacing .1em
  var LBL_TOP_OFFSET = -12, LBL_BOTTOM_OFFSET = 3.5;      // relative to the text's own y
  var CLBL_TOP_OFFSET = -12.5, CLBL_BOTTOM_OFFSET = 4;

  // Greedy nudge tuning, shared so the check simulates the exact same pass
  // the browser runs. Step is each tier's own label height plus a small gap.
  var NUDGE_STEP_CITY = 16;
  var NUDGE_STEP_CLUSTER = 17;
  var NUDGE_MAX_STEPS = 8;

  // At COMPACT width the world map lands in a shorter band than the frame
  // suggests, so cluster labels need proportionally more clearance — not
  // just a copy of the desktop spread.
  var LBL_DY_SCALE_COMPACT = 1.6;

  // The label's position before the nudge pass runs. Both the map and the
  // check call these, so the "what's the base offset" question only has
  // one answer.
  function cityBaseDy(id) {
    return CITY_LBL_DY[id] !== undefined ? CITY_LBL_DY[id] : 4;
  }
  function clusterBaseDy(name, compact) {
    var base = LBL_DY[name] !== undefined ? LBL_DY[name] : 34;
    return base * (compact ? LBL_DY_SCALE_COMPACT : 1);
  }

  function mercator(lon, lat, scale, tx, ty) {
    var lambda = (lon * Math.PI) / 180;
    var phi = (lat * Math.PI) / 180;
    return [
      scale * lambda + tx,
      ty - scale * Math.log(Math.tan(Math.PI / 4 + phi / 2))
    ];
  }

  // Replicates the by-hand fitExtent in atlas-map.js: same box, same
  // padding rule (including the COMPACT disc-margin padding), same fit.
  function fitProjection(W, H, compact, discR) {
    var pad = compact
      ? { left: discR + 20, top: discR + 20, right: discR + 20, bottom: discR + 20 }
      : { left: 26, top: 40, right: 26, bottom: 26 };
    var topLeft = mercator(BOX_LON[0], BOX_LAT[1], 1, 0, 0);
    var bottomRight = mercator(BOX_LON[1], BOX_LAT[0], 1, 0, 0);
    var boxW = bottomRight[0] - topLeft[0];
    var boxH = bottomRight[1] - topLeft[1];
    var availW = W - pad.left - pad.right;
    var availH = H - pad.top - pad.bottom;
    var scale = Math.min(availW / boxW, availH / boxH);
    var midX = (topLeft[0] + bottomRight[0]) / 2;
    var midY = (topLeft[1] + bottomRight[1]) / 2;
    var tx = (pad.left + W - pad.right) / 2 - scale * midX;
    var ty = (pad.top + H - pad.bottom) / 2 - scale * midY;
    return {
      scale: scale,
      tx: tx,
      ty: ty,
      project: function (lon, lat) {
        return mercator(lon, lat, scale, tx, ty);
      }
    };
  }

  // Replicates zoomTo()'s choice of kk exactly, given a cluster's own
  // members already projected to [px,py].
  function zoomToScale(W, H, points, targetK) {
    var xs = points.map(function (p) { return p.px; });
    var ys = points.map(function (p) { return p.py; });
    var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
    var spanX = Math.max.apply(null, xs) - Math.min.apply(null, xs);
    var spanY = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    var fit = Math.min((W - 220) / Math.max(spanX, 1), (H - 200) / Math.max(spanY, 1));
    var kk = Math.max(CITY_ZOOM + 0.4, Math.min(targetK, isFinite(fit) ? fit : targetK, 9));
    return { kk: kk, cx: cx, cy: cy };
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  // Greedy vertical declutter. `boxes` must already be in a fixed, explicit
  // order chosen by the caller (e.g. sorted by id) — this function never
  // reorders, so its output is deterministic only if its input is. Each
  // box needs {key, dy, rect:{left,right,top,bottom}}; returns a
  // same-shaped array, each nudged straight down (never up, never
  // sideways) just enough to clear every box already placed before it.
  function nudgeClear(boxes, stepPx, maxSteps) {
    var placed = [];
    return boxes.map(function (box) {
      var cur = {
        key: box.key,
        dy: box.dy,
        rect: {
          left: box.rect.left, right: box.rect.right,
          top: box.rect.top, bottom: box.rect.bottom
        }
      };
      var steps = 0;
      while (
        steps < maxSteps &&
        placed.some(function (p) { return rectsOverlap(p.rect, cur.rect); })
      ) {
        cur.dy += stepPx;
        cur.rect.top += stepPx;
        cur.rect.bottom += stepPx;
        steps++;
      }
      placed.push(cur);
      return cur;
    });
  }

  function labelWidth(text, tier) {
    var perChar = tier === "cluster" ? CLBL_CHAR_WIDTH : LBL_CHAR_WIDTH;
    return text.length * perChar;
  }

  function labelVerticalOffsets(tier) {
    return tier === "cluster"
      ? { top: CLBL_TOP_OFFSET, bottom: CLBL_BOTTOM_OFFSET }
      : { top: LBL_TOP_OFFSET, bottom: LBL_BOTTOM_OFFSET };
  }

  return {
    BOX_LON: BOX_LON,
    BOX_LAT: BOX_LAT,
    CITY_ZOOM: CITY_ZOOM,
    CITY_LBL_DY: CITY_LBL_DY,
    LBL_DY: LBL_DY,
    NUDGE_STEP_CITY: NUDGE_STEP_CITY,
    NUDGE_STEP_CLUSTER: NUDGE_STEP_CLUSTER,
    NUDGE_MAX_STEPS: NUDGE_MAX_STEPS,
    LBL_DY_SCALE_COMPACT: LBL_DY_SCALE_COMPACT,
    cityBaseDy: cityBaseDy,
    clusterBaseDy: clusterBaseDy,
    mercator: mercator,
    fitProjection: fitProjection,
    zoomToScale: zoomToScale,
    rectsOverlap: rectsOverlap,
    nudgeClear: nudgeClear,
    labelWidth: labelWidth,
    labelVerticalOffsets: labelVerticalOffsets
  };
});
