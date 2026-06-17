const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_BASE_URL = "https://nutsnibbles.cc";
const PUBLIC_HTML_ROOTS = [
  path.join(ROOT, "index.html"),
  path.join(ROOT, "travel"),
  path.join(ROOT, "food")
];

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function walk(directory, matcher, results = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matcher, results);
    } else if (matcher(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function getPublicHtmlPages() {
  const pages = [];

  for (const entry of PUBLIC_HTML_ROOTS) {
    if (!fileExists(entry)) continue;

    const stat = fs.statSync(entry);
    if (stat.isFile() && entry.endsWith(".html")) {
      pages.push(entry);
      continue;
    }

    if (stat.isDirectory()) {
      pages.push(...walk(entry, (fullPath) => fullPath.endsWith(".html")));
    }
  }

  return pages.sort();
}

function toRepoRelative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function toSitePath(filePath) {
  const rel = toRepoRelative(filePath);
  if (rel === "index.html") return "/";
  return `/${rel.replace(/index\.html$/, "")}`;
}

function toCanonicalUrl(filePath) {
  return `${SITE_BASE_URL}${toSitePath(filePath)}`;
}

function isExternalUrl(value) {
  return /^(https?:|mailto:|tel:|data:|javascript:)/i.test(value);
}

function stripHash(value) {
  return value.split("#")[0];
}

function getHash(value) {
  return value.includes("#") ? value.split("#").slice(1).join("#") : "";
}

function resolveLocalReference(fromFile, target) {
  if (!target || isExternalUrl(target)) return null;

  const cleanTarget = target.trim();
  if (!cleanTarget || cleanTarget === "#") {
    return { type: "self-anchor", filePath: fromFile, anchor: "" };
  }

  if (cleanTarget.startsWith("#")) {
    return { type: "self-anchor", filePath: fromFile, anchor: cleanTarget.slice(1) };
  }

  const hash = getHash(cleanTarget);
  const withoutHash = stripHash(cleanTarget);

  let absolutePath;
  if (withoutHash.startsWith("/")) {
    absolutePath = path.join(ROOT, withoutHash);
  } else {
    absolutePath = path.resolve(path.dirname(fromFile), withoutHash);
  }

  const candidatePaths = [];

  if (!path.extname(absolutePath)) {
    candidatePaths.push(path.join(absolutePath, "index.html"));
  }
  candidatePaths.push(absolutePath);

  for (const candidate of candidatePaths) {
    if (fileExists(candidate)) {
      return { type: "file", filePath: candidate, anchor: hash };
    }
  }

  return { type: "missing", filePath: candidatePaths[0], anchor: hash };
}

function extractIds(html) {
  const ids = new Set();
  const regex = /\sid=(["'])(.*?)\1/g;
  let match;
  while ((match = regex.exec(html))) {
    ids.add(match[2]);
  }
  return ids;
}

function findTags(html, tagName) {
  const regex = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(regex) || [];
}

function getAttr(tag, attrName) {
  const regex = new RegExp(`${attrName}=(["'])(.*?)\\1`, "i");
  const match = tag.match(regex);
  return match ? match[2] : "";
}

function printIssuesAndExit(issues, successMessage) {
  if (issues.length) {
    console.error(`Found ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(successMessage);
}

module.exports = {
  ROOT,
  SITE_BASE_URL,
  readFile,
  fileExists,
  getPublicHtmlPages,
  toRepoRelative,
  toSitePath,
  toCanonicalUrl,
  isExternalUrl,
  stripHash,
  getHash,
  resolveLocalReference,
  extractIds,
  findTags,
  getAttr,
  printIssuesAndExit
};
