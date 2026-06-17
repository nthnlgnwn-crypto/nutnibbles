# editorial-upgrade

## When to use

Use this when improving page quality, layout rhythm, usefulness, or storytelling without rebuilding the site.

## Files to inspect

- `AGENTS.md`
- `README.md`
- `styles.css`
- representative hub pages
- representative travel pages
- representative food posts
- templates under `templates/`

## Steps

1. Audit the current page pattern before changing anything.
2. Identify the smallest reusable upgrade first:
   - hero rhythm
   - reading flow
   - scannability
   - photo treatment
   - related links
   - verdict or planning utility
3. Keep the dark green and cream editorial style.
4. Preserve the personal journal voice and avoid inventing facts.
5. Prefer improvements that can be reused through templates or shared CSS.
6. Run:
   - `npm run build`
   - `npm run check`
7. Review mobile and desktop before recommending commit.

## Expected output

- clear audit
- proposed improvements
- reusable implementation direction
- explicit note on what should not change
