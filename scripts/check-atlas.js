// The Atlas has one canonical data source (assets/data/atlas-places.json) but
// two renderings of it: the JS map, and the static country index that serves
// JS-off/keyboard users (see AGENTS.md Accessibility). This script is the
// drift check between them — it does not re-derive the index's prose, just
// verifies every linked row resolves to a real file and that the two known
// counts (linked places vs. rendered rows) agree.
const path = require("path");
const {
  ROOT,
  readFile,
  fileExists,
  resolveLocalReference,
  findTags,
  getAttr,
  printIssuesAndExit
} = require("./site-utils");

const issues = [];

const dataPath = path.join(ROOT, "assets/data/atlas-places.json");
const atlasPagePath = path.join(ROOT, "atlas/index.html");

if (!fileExists(dataPath)) {
  printIssuesAndExit([`assets/data/atlas-places.json: missing`], "");
  return;
}
if (!fileExists(atlasPagePath)) {
  printIssuesAndExit([`atlas/index.html: missing`], "");
  return;
}

const data = JSON.parse(readFile(dataPath));
const atlasHtml = readFile(atlasPagePath);

// Every place with a non-null href must resolve to a real file. JSON hrefs
// are written root-relative (e.g. "travel/…/index.html"), so resolve them
// against the repo root's own index.html rather than the Atlas page.
const rootIndexPath = path.join(ROOT, "index.html");
const linkedPlaces = data.places.filter((p) => p.href);
for (const place of linkedPlaces) {
  const resolved = resolveLocalReference(rootIndexPath, place.href);
  if (resolved?.type !== "file") {
    issues.push(`atlas-places.json: ${place.id} href does not resolve: ${place.href}`);
  }
}

// Every rendered index row must resolve to a real file too.
const rowTags = findTags(atlasHtml, "a").filter((tag) => /class="atlas-index-row"/.test(tag));
for (const tag of rowTags) {
  const href = getAttr(tag, "href");
  const resolved = resolveLocalReference(atlasPagePath, href);
  if (resolved?.type !== "file") {
    issues.push(`atlas/index.html: index row links to missing file ${href}`);
  }
}

// The static index is a hand-written rendering of the same linked places.
// A plain count match would have missed the original Fuji-san drift (a real
// pin with no href isn't in linkedPlaces at all, so the totals still lined
// up) — compare by the actual href, in both directions, instead (§4.2c #5).
// atlas/index.html hrefs are "../travel/…", relative to atlas/; strip that
// prefix to compare against the JSON's root-relative form.
const rowHrefs = new Set(
  rowTags.map((tag) => getAttr(tag, "href").replace(/^\.\.\//, ""))
);
const linkedHrefs = new Set(linkedPlaces.map((p) => p.href));
for (const href of linkedHrefs) {
  if (!rowHrefs.has(href)) {
    issues.push(`atlas-places.json: ${href} is a linked place but has no matching row in atlas/index.html.`);
  }
}
for (const href of rowHrefs) {
  if (!linkedHrefs.has(href)) {
    issues.push(`atlas/index.html: a row links to ${href}, which isn't any place's href in atlas-places.json.`);
  }
}

// A non-"soon" place represents real, written content and should always
// link somewhere — this is the rule Fuji-san's href:null silently broke.
// "soon" places are the one legitimate case for no href.
const unlinkedRealPlaces = data.places.filter((p) => p.kind !== "soon" && !p.href);
for (const place of unlinkedRealPlaces) {
  issues.push(
    `atlas-places.json: ${place.id} is kind:"${place.kind}" (real content) but has no href — give it a page or anchor, or mark it "soon" if it isn't written yet.`
  );
}

// countryOrder and the countries stat should agree.
if (data.countryOrder.length !== data.stats.countries) {
  issues.push(
    `atlas-places.json: countryOrder has ${data.countryOrder.length} entries but stats.countries says ${data.stats.countries}.`
  );
}

// The three stat numbers must match what's rendered on the Atlas hub-title.
const statChecks = [
  { key: "foodNotes", label: "Food notes" },
  { key: "trips", label: "Trips" },
  { key: "countries", label: "Countries" }
];
for (const { key, label } of statChecks) {
  const expected = String(data.stats[key]).padStart(2, "0");
  const pattern = new RegExp(
    `<p class="atlas-band-number">${expected}</p>\\s*<p class="atlas-band-label">${label}</p>`
  );
  if (!pattern.test(atlasHtml)) {
    issues.push(`atlas/index.html: hub-title stat for "${label}" does not match atlas-places.json (${data.stats[key]}).`);
  }
}

printIssuesAndExit(issues, "Atlas data source is in sync with the static index and hub-title stats.");
