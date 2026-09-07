// The Atlas map places every label by a hand-tuned base offset
// (assets/js/atlas-geometry.js) plus a greedy nudge pass that runs on top
// of it. Nothing about that is visible to a build-time check by reading
// HTML — a label collision only shows up on a screenshot, which is exactly
// how this went unnoticed: Japan's own hand-tuned table had a live,
// undetected collision at mobile width until someone looked. This script
// re-runs the exact same projection + nudge math the map runs (shared, not
// duplicated, so the two can't drift apart) at both tiers and both review
// breakpoints, and blocks if any two labels still overlap afterward.
const path = require("path");
const { ROOT, readFile, printIssuesAndExit } = require("./site-utils");
const geo = require("../assets/js/atlas-geometry");

// Measured from the live page at the two widths AGENTS.md names as the
// standard review breakpoints (375px and 1440px) — these are the actual
// .atlas-wrap content-box dimensions, not the viewport width itself.
// Re-measure and update if the map frame's height, gutters, or border
// ever change.
const BREAKPOINTS = [
  { name: "desktop (1440px)", W: 1118, H: 618, compact: false, discR: 15, dotR: 5 },
  { name: "mobile (375px)", W: 333, H: 518, compact: true, discR: 11, dotR: 10 }
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
  reportOverlaps(
    geo.nudgeClear(clusterBoxes, geo.NUDGE_STEP_CLUSTER, geo.NUDGE_MAX_STEPS),
    `${bp.name}, world tier`
  );

  // ---- city tier: one label per place, per country zoomed in ----
  for (const name of countryOrder) {
    const members = projected.filter((p) => p.country === name);
    if (members.length < 2) continue; // nothing to collide with

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
        const anchorEnd = d.lon < 20;
        const xOff = anchorEnd ? -(bp.dotR + 8) : bp.dotR + 8;
        const text = d.kind === "soon" ? `${d.name} · soon` : d.name;
        const w = geo.labelWidth(text, "city");
        const off = geo.labelVerticalOffsets("city");
        const textX = screenX + xOff;
        const y = screenY + dy;
        return {
          key: d.id,
          dy,
          rect: {
            left: anchorEnd ? textX - w : textX,
            right: anchorEnd ? textX : textX + w,
            top: y + off.top,
            bottom: y + off.bottom
          }
        };
      });
    reportOverlaps(
      geo.nudgeClear(cityBoxes, geo.NUDGE_STEP_CITY, geo.NUDGE_MAX_STEPS),
      `${bp.name}, ${name} city tier`
    );
  }
}

printIssuesAndExit(issues, "Atlas map labels: no overlaps at either tier, at either breakpoint.");
