const path = require("path");
const {
  getPublicHtmlPages,
  readFile,
  toRepoRelative,
  resolveLocalReference,
  extractIds,
  findTags,
  getAttr,
  printIssuesAndExit
} = require("./site-utils");

const pages = getPublicHtmlPages();
const htmlCache = new Map();
const idCache = new Map();
const issues = [];

function getIds(filePath) {
  if (!idCache.has(filePath)) {
    const html = htmlCache.get(filePath) || readFile(filePath);
    htmlCache.set(filePath, html);
    idCache.set(filePath, extractIds(html));
  }
  return idCache.get(filePath);
}

for (const page of pages) {
  const html = readFile(page);
  htmlCache.set(page, html);

  const tags = [
    ...findTags(html, "a"),
    ...findTags(html, "link"),
    ...findTags(html, "script")
  ];

  for (const tag of tags) {
    const tagName = tag.match(/^<([a-z]+)/i)?.[1]?.toLowerCase();
    const attrName = tagName === "script" ? "src" : "href";
    const reference = getAttr(tag, attrName);
    if (!reference) continue;

    if (tagName === "link") {
      const rel = (getAttr(tag, "rel") || "").toLowerCase();
      if (!["stylesheet", "icon", "apple-touch-icon"].includes(rel)) {
        continue;
      }
    }

    const resolved = resolveLocalReference(page, reference);
    if (!resolved) continue;

    if (resolved.type === "self-anchor") {
      if (resolved.anchor && !getIds(page).has(resolved.anchor)) {
        issues.push(`${toRepoRelative(page)}: missing anchor #${resolved.anchor}`);
      }
      continue;
    }

    if (resolved.type === "missing") {
      issues.push(`${toRepoRelative(page)}: broken reference ${reference} -> ${toRepoRelative(path.normalize(resolved.filePath))}`);
      continue;
    }

    if (resolved.anchor) {
      const targetIds = getIds(resolved.filePath);
      if (!targetIds.has(resolved.anchor)) {
        issues.push(`${toRepoRelative(page)}: missing anchor ${reference}`);
      }
    }
  }
}

printIssuesAndExit(issues, "Local link check passed for HTML links, styles, scripts, and anchors.");
