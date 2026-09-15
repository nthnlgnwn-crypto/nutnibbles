const fs = require("fs");
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

// Minimal, dependency-free dimension readers for the two raster formats this
// site commits (see AGENTS.md: JPEG photos, PNG icons). Just enough of each
// header to get width/height — not general-purpose image parsing.
function readJpegSofDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    // Markers with no payload (TEM, RST0-RST7) carry no length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    // SOFn markers (baseline/progressive/etc.), excluding DHT/JPG/DAC which
    // reuse the 0xC4/0xC8/0xCC codes in the same range.
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

// The SOF marker gives the raw encoded pixel grid, but a browser displays a
// JPEG rotated per its EXIF Orientation tag (values 5-8 swap width/height).
// AGENTS.md calls for stripping EXIF before committing, but that rule is
// newer than some already-published photos, so this has to be read rather
// than assumed away.
function readExifOrientation(buffer) {
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda) return 1; // Start of scan: no more metadata markers follow.
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isExifApp1 = marker === 0xe1 && buffer.subarray(offset + 4, offset + 8).equals(Buffer.from("Exif", "ascii"));
    if (isExifApp1) {
      const tiffStart = offset + 10;
      const littleEndian = buffer.toString("ascii", tiffStart, tiffStart + 2) === "II";
      const readUInt16 = (o) => (littleEndian ? buffer.readUInt16LE(o) : buffer.readUInt16BE(o));
      const readUInt32 = (o) => (littleEndian ? buffer.readUInt32LE(o) : buffer.readUInt32BE(o));
      const ifd0Offset = tiffStart + readUInt32(tiffStart + 4);
      const entryCount = readUInt16(ifd0Offset);
      for (let i = 0; i < entryCount; i++) {
        const entryOffset = ifd0Offset + 2 + i * 12;
        if (readUInt16(entryOffset) === 0x0112) {
          return readUInt16(entryOffset + 8);
        }
      }
      return 1;
    }
    offset += 2 + segmentLength;
  }
  return 1;
}

function getJpegDimensions(buffer) {
  const sof = readJpegSofDimensions(buffer);
  if (!sof) return null;
  const orientation = readExifOrientation(buffer);
  return orientation >= 5 && orientation <= 8 ? { width: sof.height, height: sof.width } : sof;
}

function getPngDimensions(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function getImageDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  return filePath.toLowerCase().endsWith(".png") ? getPngDimensions(buffer) : getJpegDimensions(buffer);
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
      continue;
    }

    const declaredWidth = parseInt(getAttr(tag, "width"), 10);
    const declaredHeight = parseInt(getAttr(tag, "height"), 10);
    if (Number.isNaN(declaredWidth) || Number.isNaN(declaredHeight)) continue;

    const actual = getImageDimensions(resolved.filePath);
    if (!actual) continue;
    if (actual.width === declaredWidth && actual.height === declaredHeight) continue;
    // A fixed-box thumbnail (index teasers, trip-row listings) legitimately
    // declares a box smaller than the source photo on both axes, to be
    // cropped in place with object-fit — that's not a CLS bug. It's only a
    // bug when a declared axis exceeds the real file, which is what happens
    // when width/height get transposed (the New Zealand case: 1600x1200
    // declared for a file that is actually 1200x1600).
    if (declaredWidth <= actual.width && declaredHeight <= actual.height) continue;
    issues.push(
      `${toRepoRelative(page)}: <img src="${src}"> declares ${declaredWidth}x${declaredHeight} but the file is ${actual.width}x${actual.height}`
    );
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
