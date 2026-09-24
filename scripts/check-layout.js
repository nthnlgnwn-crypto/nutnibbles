// The other checks read the HTML. This one renders it and looks.
//
// It exists because a whole class of defect is invisible to a parser: text that
// physically lands on top of other text. The Atlas country index shipped with a
// long date string ("Chapter · Dec 2019–Jan 2020") overflowing its grid column
// and sitting on top of the next country's name, and every text-level check on
// this repo passed while it did. A human spotted it in a screenshot. That is the
// failure mode this script is here to close.
//
// It needs a browser, so unlike the other checks it is NOT part of `npm run
// check` — that chain stays dependency-free and instant. CI installs Playwright
// and runs this separately. To run it locally:
//     npx playwright install --with-deps chromium
//     node scripts/check-layout.js
const path = require("path");
const { ROOT, getPublicHtmlPages, toRepoRelative, printIssuesAndExit } = require("./site-utils");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.log(
    "check:layout — skipped: Playwright is not installed.\n" +
      "  This check renders every page and looks for overlapping text, so it needs a browser.\n" +
      "  Install it with: npx playwright install --with-deps chromium"
  );
  process.exit(0);
}

// Every width where this site changes its mind about layout, plus the ones
// either side of each breakpoint. 861 and 1100 are here because that band is
// exactly where the four-up chapter grid used to burst its buttons.
const WIDTHS = [1440, 1280, 1100, 1024, 960, 900, 861, 768, 600, 375];

// .city-chapter-card scales its image to 1.01 and clips, so every card reports
// 1–4px of "overflow" that is entirely deliberate. Anything at or under this is
// that artifact, not a defect.
const CLIP_TOLERANCE = 6;

// Two boxes have to overlap by more than this in BOTH axes to count. Baseline
// alignment and letter-spacing produce a pixel or two of legitimate touching.
const OVERLAP_TOLERANCE = 2;

function probe({ clipTolerance, overlapTolerance }) {
  const out = { overflow: [], collide: [], pageScroll: 0 };
  out.pageScroll =
    document.documentElement.scrollWidth - document.documentElement.clientWidth;

  const visible = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
  };

  // 1. Text wider than the box that is supposed to contain it.
  for (const el of document.querySelectorAll("span,a,h1,h2,h3,h4,p,b,li,cite,dd,dt")) {
    if (!el.textContent.trim() || !visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.overflow === "visible") continue;
    const over = el.scrollWidth - el.clientWidth;
    if (over > clipTolerance) {
      out.overflow.push({
        cls: el.className || el.tagName,
        text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 60),
        over
      });
    }
  }

  // 2. Text from different parents physically on top of other text. Absolutely
  // positioned things (captions over photos, card overlays) are excluded —
  // stacking is the whole point of those.
  const leaves = [...document.querySelectorAll("span,b,cite,h1,h2,h3,h4,dd,dt")]
    .filter(
      (el) =>
        el.textContent.trim() &&
        !el.querySelector("span,b,cite,h1,h2,h3,h4") &&
        visible(el) &&
        !["absolute", "fixed", "sticky"].includes(getComputedStyle(el).position)
    )
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((o) => o.r.width > 0 && o.r.height > 0);

  for (let i = 0; i < leaves.length; i += 1) {
    for (let j = i + 1; j < leaves.length; j += 1) {
      const a = leaves[i];
      const b = leaves[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.el.parentElement === b.el.parentElement) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox > overlapTolerance && oy > overlapTolerance) {
        out.collide.push({
          a: a.el.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
          aCls: a.el.className || a.el.tagName,
          b: b.el.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
          bCls: b.el.className || b.el.tagName,
          ox: Math.round(ox),
          oy: Math.round(oy)
        });
      }
    }
  }
  return out;
}

(async () => {
  const issues = [];
  const pages = getPublicHtmlPages().map(toRepoRelative);
  const browser = await chromium.launch();

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
    for (const rel of pages) {
      const page = await ctx.newPage();
      await page.goto("file://" + path.join(ROOT, rel), { waitUntil: "load" });
      await page.waitForTimeout(200);
      const r = await page.evaluate(probe, {
        clipTolerance: CLIP_TOLERANCE,
        overlapTolerance: OVERLAP_TOLERANCE
      });

      for (const c of r.collide) {
        issues.push(
          `${rel} @ ${width}px: "${c.a}" (.${c.aCls}) is sitting on top of "${c.b}" (.${c.bCls}) — ${c.ox}x${c.oy}px of overlap.`
        );
      }
      for (const o of r.overflow) {
        issues.push(
          `${rel} @ ${width}px: .${o.cls} is clipping its own text by ${o.over}px — "${o.text}"`
        );
      }
      if (r.pageScroll > 0) {
        issues.push(
          `${rel} @ ${width}px: the page scrolls horizontally by ${r.pageScroll}px.`
        );
      }
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();
  printIssuesAndExit(
    issues,
    `Layout check passed: no overlapping text, no clipped text, and no horizontal scroll across ${pages.length} pages at ${WIDTHS.join("/")}px.`
  );
})();
