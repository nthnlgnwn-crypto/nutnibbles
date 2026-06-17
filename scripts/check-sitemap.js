const {
  SITE_BASE_URL,
  getPublicHtmlPages,
  readFile,
  toCanonicalUrl,
  printIssuesAndExit
} = require("./site-utils");

const sitemapPath = require("path").join(require("./site-utils").ROOT, "sitemap.xml");
const sitemapXml = readFile(sitemapPath);
const issues = [];

const urlMatches = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
const sitemapUrls = new Set(urlMatches);

for (const page of getPublicHtmlPages()) {
  const expectedUrl = toCanonicalUrl(page);
  if (!sitemapUrls.has(expectedUrl)) {
    issues.push(`sitemap.xml: missing ${expectedUrl}`);
  }
}

for (const url of sitemapUrls) {
  if (!url.startsWith(`${SITE_BASE_URL}/`)) {
    issues.push(`sitemap.xml: unexpected non-site URL ${url}`);
  }
}

printIssuesAndExit(issues, "Sitemap check passed for all public HTML pages.");
