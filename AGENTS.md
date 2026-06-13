# NutNibbles Contributor Guide

NutNibbles is a live static HTML/CSS personal food and travel journal. Keep changes small, evidence-based, and consistent with the current site.

## Core Rules

- Do not rebuild from scratch or introduce a framework.
- Do not change existing routes or slugs unless explicitly requested.
- Preserve the dark green / cream editorial style and personal journal voice.
- Keep published pages as plain HTML using `styles.css`.
- Do not manually edit `dist/`; run the build script so `dist/` is regenerated from source.
- Prefer local assets under `assets/images/`. Avoid remote image URLs unless the page clearly labels them as external references.

## Content Voice

- Write like a personal journal with useful review notes.
- Use first person where natural: "I", "we", "my family".
- Keep the tone warm, honest, specific, and lightly casual.
- Mention small details that made the memory feel real: timing, weather, who was there, the order of the day, standout bites, and honest downsides.
- Avoid generic travel-magazine claims, invented facts, or unsupported recommendations.

## Food Post Requirements

Use `templates/food-post.html` as the starting point for new food pages.

- Route pattern: `food/{food-slug}/index.html`.
- Image folder should usually live under the related trip/city folder or a dedicated place folder, such as `assets/images/jakarta/kindling-birthday/`.
- Include an eyebrow with city, date, and meal context, for example `Tokyo / 26 Jan 2025 / Late Lunch`.
- Include a personal review section with:
  - what brought the meal into the day,
  - standout dishes or textures,
  - one honest critique if relevant,
  - a clear `Worth it?` verdict.
- Add a link back to the relevant city/travel page when the meal belongs to a trip.
- Add the post to `food/index.html` when it should be discoverable from the food hub.
- Add related links from the relevant city/travel page back to the food post when useful.
- Add the page to `sitemap.xml`.

## Travel And City Page Requirements

Use `templates/travel-trip.html` for a trip hub and `templates/travel-city.html` for a city chapter.

- Trip hub route pattern: `travel/{trip-slug}/index.html`.
- City chapter route pattern: `travel/{trip-slug}/{city-slug}/index.html`.
- Image folder pattern: `assets/images/{trip-slug}/{city-slug}/`.
- Keep travel pages chronological or chapter-based so long pages are easy to scan.
- Include jump navigation for long city pages.
- Include previous/next city navigation for multi-city trips.
- Link related food posts from city pages.
- Use selective captions where they improve the reading flow or explain why a photo matters.
- Keep desktop photo-led layouts, but make mobile reading compact and clear.

## Required Metadata

Every public page must include:

- `<title>` with the page title and `| NutNibbles`.
- `<meta name="description">` with a concrete, human description.
- Canonical URL using `https://nutsnibbles.cc` and a trailing slash.
- Open Graph tags:
  - `og:type` (`website` for hubs, `article` for story/detail pages),
  - `og:title`,
  - `og:description`,
  - `og:image` with an absolute `https://nutsnibbles.cc/assets/...` URL,
  - `og:url`.
- Twitter card tags:
  - `twitter:card` set to `summary_large_image`,
  - `twitter:title`,
  - `twitter:description`,
  - `twitter:image`.
- Favicon links:
  - `/favicon.ico`,
  - `/assets/icons/favicon-32.png`,
  - `/assets/icons/apple-touch-icon.png`.

Keep social preview images local and already committed to the repo.

## Image Handling

- Use useful alt text that describes the actual scene, dish, or travel moment.
- Use `loading="lazy"` and `decoding="async"` for non-hero images.
- Use `loading="eager"` only for above-the-fold hero/feature images when needed.
- Before committing new images, check:
  - image path and case-sensitive filename,
  - dimensions are reasonable for web use,
  - file size is not excessive,
  - EXIF/GPS metadata has been stripped or intentionally accepted.
- Practical target for large JPEG photos: max long edge around 1600px, quality around 78-82, unless a larger hero image is specifically needed.
- Do not rename or move existing images unless explicitly requested.

## Sitemap And Internal Links

- Add every new public page to `sitemap.xml`.
- Keep canonical and sitemap URLs aligned.
- Food posts tied to travel should link back to the relevant city section.
- City pages should link to related food posts.
- Multi-city trip pages should include previous/next city navigation.
- If adding anchors, keep IDs stable because food posts may link directly to them.

## Checks Before Commit

- Inspect the changed files and confirm there are no unrelated changes.
- Run `npm run build`.
- Check local links, image paths, and anchors. There is no dedicated script yet, so use an HTML/link checker or a small local script when needed.
- Manually review mobile readability for any new long page.
- Manually inspect social preview metadata for any new public page.
- Do not commit automatically unless the user asks for a commit.

## Known Risks To Watch

- `sitemap.xml` is manual and easy to forget.
- `.github/workflows/pages.yml` currently publishes the repository root, while `scripts/build-static.js` generates `dist/`. Keep deployment assumptions clear before changing build/deploy behavior.
- The Tokyo page includes official remote hotel reference images; avoid adding more remote dependencies unless intentional.
- Future photo uploads may contain EXIF/GPS metadata if not stripped.
