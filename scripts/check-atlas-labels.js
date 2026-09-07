// The Atlas map places every label by a hand-tuned base offset
// (assets/js/atlas-geometry.js) plus a greedy nudge pass that runs on top
// of it. Nothing about that is visible to a build-time check by reading
// HTML — a label collision only shows up on a screenshot, which is exactly
// how this went unnoticed: Japan's own hand-tuned table had a live,
// undetected collision at mobile width until someone looked. This script
// re-runs the exact same projection + nudge math the map runs (shared, not
// duplicated, so the two can't drift apart) at both tiers and both review
// breakpoints, and blocks if any two labels still overlap afterward, or if
// a label leaves the map frame or overlaps the zoom-control stack.
const path = require("path");
const { ROOT, readFile, printIssuesAndExit } = require("./site-utils");
const geo = require("../assets/js/atlas-geometry");

// Measured from the live page at the two widths AGENTS.md names as the
// standard review breakpoints (375px and 1440px) — these are the actual
// .atlas-wrap content-box dimensions and the .atlas-zoom control stack's
// bounds within it, not viewport values. Re-measure and update if the map
// frame's height, gutters, border, or the zoom control's size/position
// ever change.
const BREAKPOINTS = [
  {
    name: "desktop (1440px)", W: 1118, H: 618, compact: false, discR: 15, dotR: 5,
    zoomBox: { left: 20, top: 18, right: 54, bottom: 118 }
  },
  {
    name: "mobile (375px)", W: 333, H: 518, compact: true, discR: 11, dotR: 10,
    zoomBox: { left: 12, top: 12, right: 58, bottom: 148 }
  }
];

const data = JSON.parse(readFile(path.join(ROOT, "assets/data/atlas-places.json")));
const places = data.places;
const countryOrder = data.countryOrder;

const issues = [];

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function reportOverlaps(boxes, contextLabel) {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (geo.rectsOverlap(boxes[i].rect, boxes[j].rect)) {
        issues.push(
          `${contextLabel}: "${boxes[i].key}" and "${boxes[j].key}" labels still overlap after the nudge pass.`
        );
      }
    }
  }
}

function reportFrameViolations(key, rect, frameW, frameH, zoomBox, contextLabel) {
  const leavesFrame = rect.left < 0 || rect.right > frameW || rect.top < 0 || rect.bottom > frameH;
  const hitsControls = geo.rectsOverlap(rect, zoomBox);
  if (leavesFrame) {
    issues.push(`${contextLabel}: "${key}" label leaves the map frame.`);
  }
  if (hitsControls) {
    issues.push(`${contextLabel}: "${key}" label overlaps the zoom-control stack.`);
  }
}

for (const bp of BREAKPOINTS) {
  const fit = geo.fitProjection(bp.W, bp.H, bp.compact, bp.discR);
  const projected = places.map((p) => {
    const [px, py] = fit.project(p.lon, p.lat);
    return Object.assign({}, p, { px, py });
  });

  // ---- world / cluster tier: one label per country ----
  const clusters = countryOrder
    .map((name) => {
      const members = projected.filter((p) => p.country === name);
      const live = members.filter((p) => p.kind !== "soon");
      if (live.length === 0) return null; // no world-tier disc for a "soon"-only country
      const [px, py] = fit.project(average(members.map((p) => p.lon)), average(members.map((p) => p.lat)));
      return { name, px, py };
    })
    .filter(Boolean);

  const clusterBoxes = clusters
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name)) // deterministic order, independent of JSON/DOM order
    .map((c) => {
      const dy = geo.clusterBaseDy(c.name, bp.compact);
      const w = geo.labelWidth(c.name, "cluster");
      const off = geo.labelVerticalOffsets("cluster");
      const y = c.py + dy;
      return {
        key: c.name,
        dy,
        rect: { left: c.px - w / 2, right: c.px + w / 2, top: y + off.top, bottom: y + off.bottom }
      };
    });
  const nudgedClusterBoxes = geo.nudgeClear(clusterBoxes, geo.NUDGE_STEP_CLUSTER, geo.NUDGE_MAX_STEPS);
  reportOverlaps(nudgedClusterBoxes, `${bp.name}, world tier`);
  for (const box of nudgedClusterBoxes) {
    const clamped = geo.clampToFrameAndControls(
      box.rect, bp.W, bp.H, bp.zoomBox, geo.CLAMP_PUSH_GAP, geo.NUDGE_MAX_STEPS
    );
    reportFrameViolations(box.key, clamped, bp.W, bp.H, bp.zoomBox, `${bp.name}, world tier`);
  }

  // ---- city tier: one label per place, per country zoomed in ----
  // Each place's final dy only ever accounts for its own country's other
  // members (matching atlas-map.js's one-time precompute) — it is not
  // recomputed per viewer, so this loop first settles every place's own dy,
  // then separately checks where that fixed dy lands under every other
  // country's zoom, since every place is visible as a bystander whenever
  // any country is zoomed into.
  const finalCityDy = new Map();
  for (const name of countryOrder) {
    const members = projected.filter((p) => p.country === name);
    if (members.length < 2) {
      members.forEach((m) => finalCityDy.set(m.id, geo.cityBaseDy(m.id)));
      continue;
    }

    const zoom = geo.zoomToScale(bp.W, bp.H, members, 5.5);
    const tx = bp.W / 2 - zoom.kk * zoom.cx;
    const ty = bp.H / 2 - zoom.kk * zoom.cy;

    const cityBoxes = members
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id)) // deterministic order, independent of JSON/DOM order
      .map((d) => {
        const screenX = tx + zoom.kk * d.px;
        const screenY = ty + zoom.kk * d.py;
        const dy = geo.cityBaseDy(d.id);
        return { key: d.id, dy, rect: geo.cityLabelRect(d, screenX, screenY, dy, bp.dotR, bp.W).rect };
      });
    const nudged = geo.nudgeClear(cityBoxes, geo.NUDGE_STEP_CITY, geo.NUDGE_MAX_STEPS);
    reportOverlaps(nudged, `${bp.name}, ${name} city tier`);
    nudged.forEach((b) => finalCityDy.set(b.key, b.dy));
  }

  // Only a country with a real (non-"soon") member ever gets a cluster disc,
  // chip, or deep-link entry — those are the only zoomTo() targets a real
  // user can reach, so "soon"-only countries are not tested as zoom targets.
  const reachableCountries = countryOrder.filter((name) =>
    places.some((p) => p.country === name && p.kind !== "soon")
  );

  for (const zoomCountry of reachableCountries) {
    const zoomMembers = projected.filter((p) => p.country === zoomCountry);
    const zoom = geo.zoomToScale(bp.W, bp.H, zoomMembers, 5.5);
    const tx = bp.W / 2 - zoom.kk * zoom.cx;
    const ty = bp.H / 2 - zoom.kk * zoom.cy;

    for (const d of projected) {
      const screenX = tx + zoom.kk * d.px;
      const screenY = ty + zoom.kk * d.py;
      // A pin whose dot isn't even visible in this view has no label a
      // viewer could see clipping — nothing to check.
      const dotVisible =
        screenX >= -bp.dotR && screenX <= bp.W + bp.dotR && screenY >= -bp.dotR && screenY <= bp.H + bp.dotR;
      if (!dotVisible) continue;

      const rect = geo.cityLabelRect(d, screenX, screenY, finalCityDy.get(d.id), bp.dotR, bp.W).rect;
      const clamped = geo.clampToFrameAndControls(
        rect, bp.W, bp.H, bp.zoomBox, geo.CLAMP_PUSH_GAP, geo.NUDGE_MAX_STEPS
      );
      reportFrameViolations(d.id, clamped, bp.W, bp.H, bp.zoomBox, `${bp.name}, zoomed into ${zoomCountry}`);
    }
  }
}

printIssuesAndExit(
  issues,
  "Atlas map labels: no overlaps, frame exits, or control collisions at either tier, at either breakpoint."
);
