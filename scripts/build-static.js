const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const siteEntries = [
  "index.html",
  "styles.css",
  "assets",
  "travel",
  "food",
  ".nojekyll",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml"
];

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

fs.rmSync(output, { recursive: true, force: true });

for (const entry of siteEntries) {
  const from = path.join(root, entry);
  const to = path.join(output, entry);

  if (!fs.existsSync(from)) continue;

  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    copyDirectory(from, to);
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

console.log(`Static site copied to ${path.relative(root, output)}`);
