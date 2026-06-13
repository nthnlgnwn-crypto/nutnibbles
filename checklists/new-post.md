# New NutNibbles Post Checklist

Use this before publishing any new NutNibbles page.

## Content

- [ ] The page keeps the personal journal voice.
- [ ] The page has a clear place/date/context eyebrow.
- [ ] The opening paragraph explains why this moment belongs on the site.
- [ ] Food posts include a `Worth it?` verdict.
- [ ] Travel pages include useful sections or day/chapter jump links when long.
- [ ] Captions add context instead of only repeating what is visible.
- [ ] No trip, place, price, or recommendation is invented without support.

## Route And Links

- [ ] Route uses the current pattern and does not rename existing slugs.
- [ ] Food post links back to the relevant city/travel page when applicable.
- [ ] Travel/city page links to related food posts when applicable.
- [ ] Multi-city pages include previous/next city navigation where relevant.
- [ ] New public page is linked from the appropriate hub page.
- [ ] New public page is added to `sitemap.xml`.

## Metadata

- [ ] Page has a title ending with `| NutNibbles`.
- [ ] Meta description is specific and human.
- [ ] Canonical URL uses `https://nutsnibbles.cc` with a trailing slash.
- [ ] Open Graph tags are complete.
- [ ] Twitter card tags are complete.
- [ ] Social image path is absolute and points to a local committed image.
- [ ] Favicon links are present.

## Images

- [ ] Images are local unless clearly marked as external references.
- [ ] Filenames are lowercase/kebab-style when adding new files.
- [ ] Every visible image has useful alt text.
- [ ] Non-hero images use `loading="lazy"` and `decoding="async"`.
- [ ] File sizes and dimensions are reasonable for web use.
- [ ] EXIF/GPS metadata is stripped or intentionally accepted.

## Checks

- [ ] Run `npm run build`.
- [ ] Check local links, assets, and anchors.
- [ ] Preview the page on mobile width.
- [ ] Preview the page on desktop width.
- [ ] Confirm `git status` only contains intended files.
- [ ] Do not commit unless the user explicitly asks.
