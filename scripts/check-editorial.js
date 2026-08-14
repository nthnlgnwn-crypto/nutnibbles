// The other check:* scripts verify the site holds together (metadata present,
// links resolve, sitemap complete, Atlas self-consistent). This one verifies
// the site is trustworthy: a score means the same number everywhere it
// appears, a review says who paid, a site-wide count is real. All checks
// here are objectively decidable from what's already on the page — nothing
// is typed in by hand and nothing is looked up externally, same principle
// as the Atlas stats check.
const path = require("path");
const {
  ROOT,
  readFile,
  getPublicHtmlPages,
  toRepoRelative,
  resolveLocalReference,
  isExternalUrl,
  findTags,
  getAttr
} = require("./site-utils");

const FIXED_AXES = [
  "First Bite",
  "Crave Factor",
  "Room Mood",
  "Host Energy",
  "Worth the Wallet",
  "Return Ticket"
];

const DISCLOSURE_PATTERNS = [
  /\bpaid\b/i,
  /\bcomped\b/i,
  /\bhosted\b/i,
  /\binvited\b/i,
  /\bcomplimentary\b/i,
  /\bfull price\b/i,
  /\bgifted\b/i
];

// A keyword hit only proves *some* hedging language exists somewhere on the
// page — it cannot tell whether the review is actually honest about it.
const WEAK_SPOT_HINTS = [
  "weak", "wobbl", "didn't", "did not", "wasn't", "was not", "however",
  "downside", "disappoint", "fell short", "let down", "flaw", "wouldn't",
  "least favorite", "least favourite", "not my favorite", "not my favourite",
  "hesitat", "too fishy", "too salty", "too sweet", "too heavy", "weren't"
];

const MONTH_NAMES = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty"
];

const findings = [];

function flag(severity, fileRel, message) {
  findings.push({ severity, file: fileRel, message });
}

function hasAttr(tag, name) {
  return new RegExp(`\\b${name}=`, "i").test(tag);
}

function textOf(html) {
  return html.replace(/<[^>]+>/g, " ");
}

function wordToNumber(word) {
  const index = NUMBER_WORDS.indexOf(word.toLowerCase());
  return index === -1 ? null : index;
}

// ---- Signature Meter ----------------------------------------------------

function extractMeterAxes(html) {
  const rows = [...html.matchAll(
    /<div class="review-meter-label"><span>([^<]*)<\/span><strong>([\d.]+)\s*\/\s*10<\/strong><\/div>/g
  )];
  return rows.map((m) => ({ label: m[1].trim(), score: parseFloat(m[2]) }));
}

function extractOverallScore(html) {
  const m = html.match(
    /<p class="food-review-score" aria-label="Overall score ([\d.]+) out of 10">([\d.]+)<span>\/10<\/span><\/p>/
  );
  if (!m) return null;
  return { ariaValue: parseFloat(m[1]), textValue: parseFloat(m[2]) };
}

function extractJsonLdRating(html) {
  const m = html.match(/"@type":\s*"Review"[\s\S]*?"ratingValue":\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

function extractFoodPreviewCards(html) {
  const blocks = html.match(/<a class="food-preview-card"[^>]*>[\s\S]*?<\/a>/g) || [];
  return blocks.map((block) => {
    const openTag = (block.match(/<a class="food-preview-card"[^>]*>/) || [""])[0];
    const badgeMatch = block.match(/<span class="food-preview-score">([\d.]+)<\/span>/);
    return {
      href: getAttr(openTag, "href"),
      dataScore: getAttr(openTag, "data-score"),
      hasDataScoreAttr: hasAttr(openTag, "data-score"),
      badgeScore: badgeMatch ? parseFloat(badgeMatch[1]) : null,
      hasBadge: !!badgeMatch
    };
  });
}

function checkMeterAndScoreConsistency(foodPostPages, foodIndexRel, foodIndexHtml) {
  const cards = extractFoodPreviewCards(foodIndexHtml);

  for (const page of foodPostPages) {
    const rel = toRepoRelative(page);
    const html = readFile(page);
    const slug = path.basename(path.dirname(page));
    const isFullReview = /class="review-meter"/.test(html);
    const card = cards.find((c) => c.href.replace(/^\.\.\//, "").startsWith(slug));
    const overall = extractOverallScore(html);

    if (!isFullReview) {
      if (overall) {
        flag("BLOCKER", rel, "short note has no Signature Meter but still renders an overall score");
      }
      if (extractJsonLdRating(html) !== null) {
        flag("BLOCKER", rel, "short note has no Signature Meter but its JSON-LD carries a ratingValue");
      }
      if (card) {
        if (card.dataScore !== "") {
          flag("BLOCKER", foodIndexRel, `card for "${slug}" carries data-score="${card.dataScore}" but the post has no meter — should be data-score=""`);
        }
        if (card.hasBadge) {
          flag("BLOCKER", foodIndexRel, `card for "${slug}" shows a .food-preview-score badge but the post has no meter`);
        }
      }
      continue;
    }

    const axes = extractMeterAxes(html);
    if (axes.length !== 6) {
      flag("BLOCKER", rel, `Signature Meter has ${axes.length} axis row(s), must be exactly 6`);
      continue;
    }
    const labels = axes.map((a) => a.label);
    const missing = FIXED_AXES.filter((a) => !labels.includes(a));
    const extra = labels.filter((a) => !FIXED_AXES.includes(a));
    if (missing.length || extra.length) {
      const parts = [];
      if (missing.length) parts.push(`missing ${missing.join(", ")}`);
      if (extra.length) parts.push(`unrecognized ${extra.join(", ")}`);
      flag("BLOCKER", rel, `Signature Meter axes don't match the fixed six (${parts.join("; ")})`);
      continue;
    }

    const mean = (axes.reduce((sum, a) => sum + a.score, 0) / 6).toFixed(1);

    if (!overall) {
      flag("BLOCKER", rel, `six axes average to ${mean} but the page never renders an overall score, so a reader can't check the arithmetic`);
    } else {
      if (overall.textValue.toFixed(1) !== overall.ariaValue.toFixed(1)) {
        flag("BLOCKER", rel, `.food-review-score text (${overall.textValue}) and its aria-label (${overall.ariaValue}) disagree`);
      }
      if (overall.textValue.toFixed(1) !== mean) {
        flag("BLOCKER", rel, `renders overall as ${overall.textValue} but the six axes average to ${mean}`);
      }

      if (!card) {
        flag("WARN", foodIndexRel, `no food-preview-card found for full review "${slug}" — can't verify its index score`);
      } else {
        const cardScore = card.dataScore === "" ? null : parseFloat(card.dataScore);
        if (cardScore === null || cardScore.toFixed(1) !== overall.textValue.toFixed(1)) {
          flag("BLOCKER", foodIndexRel, `card for "${slug}" has data-score="${card.dataScore}" but the review's overall is ${overall.textValue}`);
        }
        if (!card.hasBadge || card.badgeScore.toFixed(1) !== overall.textValue.toFixed(1)) {
          flag("BLOCKER", foodIndexRel, `card for "${slug}" ${card.hasBadge ? `shows badge ${card.badgeScore}` : "has no .food-preview-score badge"} but the review's overall is ${overall.textValue}`);
        }
      }

      const jsonLdRating = extractJsonLdRating(html);
      if (jsonLdRating === null) {
        flag("BLOCKER", rel, "full review has no JSON-LD ratingValue to verify");
      } else if (jsonLdRating.toFixed(1) !== overall.textValue.toFixed(1)) {
        flag("BLOCKER", rel, `JSON-LD ratingValue is ${jsonLdRating} but the review's overall is ${overall.textValue}`);
      }
    }
  }
}

// ---- Disclosure, verdict, weak spot --------------------------------------

function checkDisclosureAndVerdict(foodPostPages) {
  for (const page of foodPostPages) {
    const rel = toRepoRelative(page);
    const html = readFile(page);
    const isFullReview = /class="review-meter"/.test(html);
    const text = textOf(html);

    const hasDisclosure = DISCLOSURE_PATTERNS.some((re) => re.test(text));
    if (!hasDisclosure) {
      flag(
        isFullReview ? "BLOCKER" : "WARN",
        rel,
        "no statement of who paid found (looked for paid/comped/hosted/invited/complimentary/full price/gifted)"
      );
    }

    if (isFullReview) {
      if (!/Worth it\?/i.test(html)) {
        flag("BLOCKER", rel, "full review has no \"Worth it?\" verdict");
      }
      const lowerText = text.toLowerCase();
      const hasWeakSpot = WEAK_SPOT_HINTS.some((hint) => lowerText.includes(hint));
      if (!hasWeakSpot) {
        flag("WARN", rel, "no downside language detected via keyword match — this only checks for the absence of hedging words, not whether the review is actually honest about a weak spot");
      }
    }
  }
}

// ---- Dates ----------------------------------------------------------------

function checkDates(pages) {
  const hyphenRangeRe = new RegExp(`\\b\\d{1,2}-\\d{1,2}\\s+(?:${MONTH_NAMES})\\b`, "g");
  const numericDateRe = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;

  for (const page of pages) {
    const rel = toRepoRelative(page);
    const html = readFile(page);

    const hyphenMatches = html.match(hyphenRangeRe);
    if (hyphenMatches) {
      const unique = [...new Set(hyphenMatches)];
      flag("WARN", rel, `date range uses a hyphen where an en dash belongs: ${unique.join(", ")}`);
    }

    const numericMatches = html.match(numericDateRe);
    if (numericMatches) {
      const unique = [...new Set(numericMatches)];
      flag("WARN", rel, `numeric dd/mm/yy date format found, should be "9 May 2026" style: ${unique.join(", ")}`);
    }
  }
}

// ---- Images -----------------------------------------------------------

function checkImages(pages) {
  for (const page of pages) {
    const rel = toRepoRelative(page);
    const html = readFile(page);

    for (const tag of findTags(html, "img")) {
      const src = getAttr(tag, "src");
      if (!src) continue;

      if (isExternalUrl(src)) {
        flag("WARN", rel, `<img src="${src}"> is remote — local assets only per AGENTS.md (known exception: the two Tokyo hotel photos)`);
        continue;
      }

      if (!hasAttr(tag, "width") || !hasAttr(tag, "height")) {
        flag("WARN", rel, `<img src="${src}"> missing width/height, causes layout shift`);
      }
      if (!hasAttr(tag, "alt")) {
        flag("WARN", rel, `<img src="${src}"> missing alt attribute (empty alt="" is fine for decorative, but the attribute must be present)`);
      }
    }
  }
}

// ---- Placeholders -----------------------------------------------------

function checkPlaceholders(pages) {
  for (const page of pages) {
    const rel = toRepoRelative(page);
    const html = readFile(page);
    const matches = html.match(/\{\{[A-Z0-9_]+\}\}/g);
    if (matches) {
      const unique = [...new Set(matches)];
      flag("BLOCKER", rel, `unfilled template placeholder(s) left on a public page: ${unique.join(", ")}`);
    }
  }
}

// ---- Orphans ------------------------------------------------------------

function checkOrphans(pages) {
  const linked = new Set();
  for (const page of pages) {
    const html = readFile(page);
    for (const tag of findTags(html, "a")) {
      const href = getAttr(tag, "href");
      const resolved = resolveLocalReference(page, href);
      if (resolved && resolved.type === "file") {
        linked.add(resolved.filePath);
      }
    }
  }
  for (const page of pages) {
    if (toRepoRelative(page) === "index.html") continue;
    if (!linked.has(page)) {
      flag("WARN", toRepoRelative(page), "not linked from any other public page (orphan — unreachable by navigation)");
    }
  }
}

// ---- Counts: site-wide totals only. Never flag a scoped count -----------

function checkAtlasBandStats(html, fileRel, atlasData) {
  const statChecks = [
    { key: "foodNotes", label: "Food notes" },
    { key: "trips", label: "Trips" },
    { key: "countries", label: "Countries" }
  ];
  for (const { key, label } of statChecks) {
    const expected = String(atlasData.stats[key]).padStart(2, "0");
    const pattern = new RegExp(`<p class="atlas-band-number">${expected}</p>\\s*<p class="atlas-band-label">${label}</p>`);
    if (!pattern.test(html)) {
      flag("BLOCKER", fileRel, `atlas-band stat for "${label}" doesn't match atlas-places.json (expected ${atlasData.stats[key]})`);
    }
  }
}

function checkWordNumberHeading(html, fileRel, regex, label, actual) {
  const m = html.match(regex);
  if (!m) {
    flag("NOTE", fileRel, `couldn't find the "${label}" heading to verify its count`);
    return;
  }
  const word = m[1];
  const n = wordToNumber(word);
  if (n === null) {
    flag("NOTE", fileRel, `"${label}" heading uses "${word}", not a recognized number word — skipped`);
    return;
  }
  if (n !== actual) {
    flag("BLOCKER", fileRel, `"${label}" heading says "${word}" (${n}) but ${actual} entries actually exist`);
  }
}

function checkCounts(pagesByRel, atlasData) {
  const foodIndexRel = "food/index.html";
  const travelIndexRel = "travel/index.html";
  const homeRel = "index.html";
  const atlasRel = "atlas/index.html";

  const foodIndexHtml = pagesByRel[foodIndexRel];
  const travelIndexHtml = pagesByRel[travelIndexRel];
  const homeHtml = pagesByRel[homeRel];
  const atlasHtml = pagesByRel[atlasRel];
  if (!foodIndexHtml || !travelIndexHtml || !homeHtml || !atlasHtml) return;

  const actualFoodNotes = (foodIndexHtml.match(/class="food-preview-card"/g) || []).length;
  const actualPlaces = new Set(
    [...foodIndexHtml.matchAll(/data-place="([^"]*)"/g)].map((m) => m[1])
  ).size;
  const actualTrips = (travelIndexHtml.match(/class="trip-row"/g) || []).length;

  const foodCountMatch = foodIndexHtml.match(/(\d+) notes? across (\d+) places?/);
  if (!foodCountMatch) {
    flag("NOTE", foodIndexRel, "couldn't find the \"N notes across M places\" count line to verify");
  } else {
    const [, n, m] = foodCountMatch;
    if (parseInt(n, 10) !== actualFoodNotes) {
      flag("BLOCKER", foodIndexRel, `says "${n} notes" but ${actualFoodNotes} .food-preview-card entries actually exist`);
    }
    if (parseInt(m, 10) !== actualPlaces) {
      flag("BLOCKER", foodIndexRel, `says "across ${m} places" but ${actualPlaces} distinct data-place values actually exist`);
    }
  }

  const homeLinkMatch = homeHtml.match(/All (\d+) food notes/);
  if (!homeLinkMatch) {
    flag("NOTE", homeRel, "couldn't find the \"All N food notes\" link text to verify");
  } else if (parseInt(homeLinkMatch[1], 10) !== actualFoodNotes) {
    flag("BLOCKER", homeRel, `"All ${homeLinkMatch[1]} food notes" link but ${actualFoodNotes} food posts actually exist`);
  }

  // The homepage carries its own copy of the Atlas hub-title stats;
  // check-atlas.js only verifies the Atlas page's own copy.
  checkAtlasBandStats(homeHtml, homeRel, atlasData);

  const metaDescRe = /content="Every NutNibbles trip and food note, mapped by place: (\d+) food notes, (\d+) trips, (\d+) countries\./g;
  const metaMatches = [...atlasHtml.matchAll(metaDescRe)];
  if (metaMatches.length === 0) {
    flag("NOTE", atlasRel, "couldn't find the meta-description count pattern to verify");
  } else {
    for (const m of metaMatches) {
      const [, fn, tr, co] = m;
      if (parseInt(fn, 10) !== atlasData.stats.foodNotes) {
        flag("BLOCKER", atlasRel, `meta description says "${fn} food notes" but atlas-places.json stats.foodNotes is ${atlasData.stats.foodNotes}`);
      }
      if (parseInt(tr, 10) !== atlasData.stats.trips) {
        flag("BLOCKER", atlasRel, `meta description says "${tr} trips" but atlas-places.json stats.trips is ${atlasData.stats.trips}`);
      }
      if (parseInt(co, 10) !== atlasData.stats.countries) {
        flag("BLOCKER", atlasRel, `meta description says "${co} countries" but atlas-places.json stats.countries is ${atlasData.stats.countries}`);
      }
    }
  }

  checkWordNumberHeading(
    travelIndexHtml, travelIndexRel,
    /<h1>(\w+) trips, kept as chapters\.<\/h1>/i,
    "Nine trips, kept as chapters", actualTrips
  );
  checkWordNumberHeading(
    travelIndexHtml, travelIndexRel,
    /<h2>(\w+) trips and every meal, pinned on the Atlas\.<\/h2>/i,
    "Nine trips and every meal, pinned on the Atlas", actualTrips
  );
}

// ---- Run ------------------------------------------------------------------

const pages = getPublicHtmlPages();
const pagesByRel = {};
for (const page of pages) {
  pagesByRel[toRepoRelative(page)] = readFile(page);
}
const foodPostPages = pages.filter((p) => {
  const rel = toRepoRelative(p);
  return rel.startsWith("food/") && rel !== "food/index.html";
});
const atlasData = JSON.parse(readFile(path.join(ROOT, "assets/data/atlas-places.json")));

checkMeterAndScoreConsistency(foodPostPages, "food/index.html", pagesByRel["food/index.html"]);
checkDisclosureAndVerdict(foodPostPages);
checkDates(pages);
checkImages(pages);
checkPlaceholders(pages);
checkOrphans(pages);
checkCounts(pagesByRel, atlasData);

const severityOrder = { BLOCKER: 0, WARN: 1, NOTE: 2 };
findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

if (findings.length === 0) {
  console.log("Editorial check passed: no blockers, warnings, or notes.");
} else {
  const counts = { BLOCKER: 0, WARN: 0, NOTE: 0 };
  for (const f of findings) counts[f.severity]++;
  console.log(`Editorial check found ${counts.BLOCKER} blocker(s), ${counts.WARN} warning(s), ${counts.NOTE} note(s):\n`);
  for (const f of findings) {
    console.log(`[${f.severity}] ${f.file}: ${f.message}`);
  }
  if (counts.BLOCKER > 0) {
    process.exitCode = 1;
  }
}
