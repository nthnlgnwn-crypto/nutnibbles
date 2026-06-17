const {
  getPublicHtmlPages,
  readFile,
  toRepoRelative,
  printIssuesAndExit
} = require("./site-utils");

const REQUIRED_PATTERNS = [
  { label: "title", regex: /<title>[\s\S]*?<\/title>/i },
  { label: "meta description", regex: /<meta\s+name=["']description["'][^>]*content=["'][^"']+["'][^>]*>/i },
  { label: "canonical link", regex: /<link\s+rel=["']canonical["'][^>]*href=["']https:\/\/nutsnibbles\.cc\/[^"']*["'][^>]*>/i },
  { label: "og:title", regex: /<meta\s+property=["']og:title["'][^>]*content=["'][^"']+["'][^>]*>/i },
  { label: "og:description", regex: /<meta\s+property=["']og:description["'][^>]*content=["'][^"']+["'][^>]*>/i },
  { label: "og:image", regex: /<meta\s+property=["']og:image["'][^>]*content=["']https:\/\/nutsnibbles\.cc\/[^"']+["'][^>]*>/i },
  { label: "twitter:card", regex: /<meta\s+name=["']twitter:card["'][^>]*content=["'][^"']+["'][^>]*>/i },
  { label: "twitter:title", regex: /<meta\s+name=["']twitter:title["'][^>]*content=["'][^"']+["'][^>]*>/i },
  { label: "twitter:description", regex: /<meta\s+name=["']twitter:description["'][^>]*content=["'][^"']+["'][^>]*>/i },
  { label: "twitter:image", regex: /<meta\s+name=["']twitter:image["'][^>]*content=["']https:\/\/nutsnibbles\.cc\/[^"']+["'][^>]*>/i }
];

const issues = [];

for (const page of getPublicHtmlPages()) {
  const html = readFile(page);
  const relativePath = toRepoRelative(page);

  for (const requirement of REQUIRED_PATTERNS) {
    if (!requirement.regex.test(html)) {
      issues.push(`${relativePath}: missing ${requirement.label}`);
    }
  }
}

printIssuesAndExit(issues, "Metadata check passed for all public HTML pages.");
