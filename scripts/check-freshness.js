// The homepage "Latest" list, the index counts, and the Atlas stats are all
// hand-maintained restatements of facts that live somewhere else. Every one of
// them has already gone stale at least once: the Latest list sat four months
// behind while two new trips were published, and the entry counts have drifted
// twice. This script re-derives those facts from the pages themselves and
// blocks when a restatement disagrees with reality.
//
// It deliberately checks only things that have a single correct answer. It has
// no opinion about wording, ordering within a day, or which posts deserve to be
// featured — only that the "Latest" list really is the latest, and that a
// number claiming to count something counts it correctly.
const path = require("path");
const {
  ROOT,
  readFile,
  fileExists,
  getPublicHtmlPages,
  toRepoRelative,
  findTags,
  getAttr,
  printIssuesAndExit
} = require("./site-utils");

const issues = [];

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

// AGENTS.md fixes the date format: "9 May 2026", ranges as "18–29 Jan 2025"
// with an en dash, and ranges may cross a month or a year boundary. We want the
// END of a range, because that is when the thing being written about finished.
function parseEndDate(raw) {
  if (!raw) return null;
  const text = raw
    .replace(/&ndash;/g, "–")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  // Take the last date-looking fragment: for "18–29 Jan 2025" that is "29 Jan
  // 2025"; for "27 Dec 2021–8 Jan 2022" it is "8 Jan 2022".
  const re = /(\d{1,2})?\s*([A-Za-z]{3,9})\.?\s+(\d{4})/g;
  let m, last = null;
  while ((m = re.exec(text)) !== null) last = m;
  if (!last) return null;

  const month = MONTHS[last[2].slice(0, 3).toLowerCase()];
  if (!month) return null;
  const year = Number(last[3]);

  // A bare "Jul 2024" with no day sorts as the end of that month, which is the
  // most conservative reading for "is this the newest thing on the site".
  let day = last[1] ? Number(last[1]) : new Date(Date.UTC(year, month, 0)).getUTCDate();

  // "18–29 Jan 2025": the day belongs to the last fragment already. But
  // "26 Aug – 8 Sep 2026" and "27 Dec 2021–8 Jan 2022" both work because we
  // took the final fragment, which carries its own day.
  return { key: year * 10000 + month * 100 + day, text };
}

// The eyebrow is where AGENTS.md says the date lives, on every content page.
function eyebrowOf(html) {
  const m = html.match(/<p class="eyebrow"[^>]*>([\s\S]*?)<\/p>/);
  return m ? m[1].replace(/<[^>]+>/g, " ") : null;
}

// Fallback for older pages whose eyebrow predates the current format. Every
// page carries JSON-LD, and datePublished is machine-readable, so ordering
// still works — but the eyebrow is what a reader sees, so we still say so.
function jsonLdDate(html) {
  const m = html.match(/"datePublished"\s*:\s*"(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?"/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : 12;
  const day = m[3] ? Number(m[3]) : new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { key: year * 10000 + month * 100 + day, text: `datePublished ${m[0].split('"')[3]}` };
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function isContentPage(rel) {
  return (
    /^food\/[^/]+\/index\.html$/.test(rel) ||
    /^travel\/[^/]+\/index\.html$/.test(rel) ||
    /^travel\/[^/]+\/[^/]+\/index\.html$/.test(rel)
  );
}

// ---------------------------------------------------------------- gather
const pages = getPublicHtmlPages().map(toRepoRelative);
const content = [];
const inconsistentEyebrows = [];
for (const rel of pages) {
  if (!isContentPage(rel)) continue;
  const html = readFile(path.join(ROOT, rel));
  let date = parseEndDate(eyebrowOf(html));
  if (!date) {
    date = jsonLdDate(html);
    // Not a blocker: ordering still works off JSON-LD. But an eyebrow without a
    // year is a reader-facing inconsistency, and this is the only thing that
    // notices it.
    inconsistentEyebrows.push(rel);
  }
  if (!date) {
    issues.push(
      `${rel}: has neither a parseable date in its <p class="eyebrow"> nor a JSON-LD datePublished. One of the two is needed to order the homepage "Latest" list.`
    );
    continue;
  }
  content.push({ rel, date, isFood: rel.startsWith("food/") });
}
content.sort((a, b) => b.date.key - a.date.key);

// One entry per trip. A trip hub and its chapters all share a date range, so
// without this a single trip would take every slot in "Latest" and push the
// food posts off the homepage entirely. The hub represents the trip; the
// chapters are reachable from it.
function tripKey(rel) {
  const m = rel.match(/^travel\/([^/]+)\//);
  return m ? `trip:${m[1]}` : rel;
}
const seenTrip = new Set();
const feed = content.filter((c) => {
  const k = tripKey(c.rel);
  if (seenTrip.has(k)) return false;
  seenTrip.add(k);
  // When a trip does appear, it must be the hub, not one of its chapters.
  return !/^travel\/[^/]+\/[^/]+\/index\.html$/.test(c.rel);
});

// ------------------------------------------------- homepage "Latest" list
const homePath = path.join(ROOT, "index.html");
if (!fileExists(homePath)) {
  printIssuesAndExit([`index.html: missing`], "");
  return;
}
const home = readFile(homePath);

const latestRows = findTags(home, "a")
  .filter((tag) => /class="latest-index-row"/.test(tag))
  .map((tag) => getAttr(tag, "href"));

if (latestRows.length === 0) {
  issues.push(`index.html: no .latest-index-row entries found — has the Latest section been renamed?`);
} else {
  // Rule: the Latest list must be the N newest content pages, newest first.
  // Nothing published more recently may be missing from it.
  const expected = feed.slice(0, latestRows.length).map((c) => c.rel);
  const actual = latestRows.map((h) => h.replace(/^\.\//, ""));

  for (let i = 0; i < expected.length; i += 1) {
    if (actual[i] !== expected[i]) {
      const exp = feed[i];
      issues.push(
        `index.html: "Latest" row ${i + 1} is ${actual[i] || "(missing)"} but the ${ordinal(
          i + 1
        )}-newest page is ${exp.rel} (${exp.date.text.trim()}). The Latest list must be the newest content, newest first.`
      );
      break; // one clear message beats a cascade of knock-on mismatches
    }
  }

  // Say plainly what is newer than the list, which is the useful bit.
  const newest = feed[0];
  if (newest && !actual.includes(newest.rel)) {
    issues.push(
      `index.html: the newest page on the site, ${newest.rel} (${newest.date.text.trim()}), does not appear in "Latest" at all.`
    );
  }
}

// ------------------------------------------------------------ the counts
const foodCount = content.filter((c) => c.isFood).length;
const claimed = home.match(/All (\d+) food notes/);
if (!claimed) {
  issues.push(`index.html: could not find the "All N food notes" link to verify.`);
} else if (Number(claimed[1]) !== foodCount) {
  issues.push(
    `index.html: says "All ${claimed[1]} food notes" but there are ${foodCount} pages under food/.`
  );
}

// Atlas stats are the other hand-kept numbers. check-atlas.js already proves
// atlas/index.html agrees with atlas-places.json; here we prove the JSON agrees
// with the pages that actually exist, which is the half nothing covered.
const dataPath = path.join(ROOT, "assets/data/atlas-places.json");
if (fileExists(dataPath)) {
  const data = JSON.parse(readFile(dataPath));
  const tripHubs = pages.filter((r) => /^travel\/[^/]+\/index\.html$/.test(r)).length;
  if (data.stats.trips !== tripHubs) {
    issues.push(
      `atlas-places.json: stats.trips is ${data.stats.trips} but there are ${tripHubs} trip hubs under travel/.`
    );
  }
  if (data.stats.foodNotes !== foodCount) {
    issues.push(
      `atlas-places.json: stats.foodNotes is ${data.stats.foodNotes} but there are ${foodCount} pages under food/.`
    );
  }
  const countries = new Set(data.places.map((p) => p.country));
  if (countries.size !== data.stats.countries) {
    issues.push(
      `atlas-places.json: stats.countries is ${data.stats.countries} but the places list covers ${countries.size} distinct countries.`
    );
  }
}

// -------------------------------------------- travel index spelled-out count
// travel/index.html opens with a spelled-out number ("Ten trips, kept as
// chapters."). It has been wrong before and no check covered it.
const WORDS = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
  "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"];
const travelIndexPath = path.join(ROOT, "travel/index.html");
if (fileExists(travelIndexPath)) {
  const travelHtml = readFile(travelIndexPath);
  const hubs = pages.filter((r) => /^travel\/[^/]+\/index\.html$/.test(r)).length;
  const expectedWord = WORDS[hubs];
  // Only a sentence that opens with a spelled-out number is claiming a count.
  // "Longer trips are split into chapters" is prose, not a tally.
  const spelled = [...travelHtml.matchAll(/>([A-Z][a-z]+) trips\b/g)]
    .map((m) => m[1])
    .filter((w) => WORDS.includes(w));
  for (const word of new Set(spelled)) {
    if (expectedWord && word !== expectedWord) {
      issues.push(
        `travel/index.html: says "${word} trips" but there are ${hubs} trip hubs — expected "${expectedWord} trips".`
      );
    }
  }
  const rows = findTags(travelHtml, "a").filter((t) => /class="trip-row"/.test(t)).length;
  if (rows !== hubs) {
    issues.push(
      `travel/index.html: the trip shelf has ${rows} rows but there are ${hubs} trip hubs under travel/.`
    );
  }
}

if (inconsistentEyebrows.length) {
  console.log(
    `Note: ${inconsistentEyebrows.length} page(s) have an eyebrow with no year, so their date was read from JSON-LD instead. ` +
      `AGENTS.md wants the visit date visible to the reader:\n` +
      inconsistentEyebrows.map((r) => `  - ${r}`).join("\n")
  );
}

printIssuesAndExit(
  issues,
  `Freshness check passed: "Latest" leads with the newest content, and every hand-kept count matches what is actually published.`
);
