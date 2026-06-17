const {
  SITE_BASE_URL,
  getPublicHtmlPages,
  readFile,
  toRepoRelative,
  resolveLocalReference,
  isExternalUrl,
  findTags,
  getAttr,
  printIssuesAndExit
} = require("./site-utils");

const issues = [];

function normalizeLocalImageReference(value) {
  if (!value) return "";
  return value.startsWith(`${SITE_BASE_URL}/`) ? value.replace(`${SITE_BASE_URL}`, "") : value;
}

for (const page of getPublicHtmlPages()) {
  const html = readFile(page);

  for (const tag of findTags(html, "img")) {
    const src = getAttr(tag, "src");
    if (!src) continue;
    if (isExternalUrl(src) && !src.startsWith(`${SITE_BASE_URL}/`)) continue;
    const resolved = resolveLocalReference(page, src);
    if (resolved?.type !== "file") {
      issues.push(`${toRepoRelative(page)}: missing image ${src}`);
    }
  }

  for (const tag of findTags(html, "meta")) {
    const property = getAttr(tag, "property");
    const name = getAttr(tag, "name");
    const isSocialImage = property === "og:image" || name === "twitter:image";
    if (!isSocialImage) continue;

    const content = normalizeLocalImageReference(getAttr(tag, "content"));
    if (!content.startsWith("/")) continue;

    const resolved = resolveLocalReference(page, content);
    if (resolved?.type !== "file") {
      issues.push(`${toRepoRelative(page)}: missing social image ${content}`);
    }
  }
}

printIssuesAndExit(issues, "Image reference check passed for page images and social preview images.");
