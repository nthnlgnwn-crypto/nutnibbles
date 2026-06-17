# audit-site

## When to use

Use this when reviewing the overall NutNibbles site before a larger upgrade, cleanup, or publishing cycle.

## Files to inspect

- `AGENTS.md`
- `README.md`
- `styles.css`
- `index.html`
- `travel/index.html`
- `food/index.html`
- representative trip hub, city page, and food post pages
- `sitemap.xml`

## Steps

1. Review current structure, routes, and content patterns.
2. Check consistency between templates and live pages.
3. Review metadata patterns and internal linking.
4. Review mobile readability and long-page scanning.
5. Run:
   - `npm run check`
   - `npm run build`
6. Report what is already strong, what feels inconsistent, and what should be improved first.

## Expected output

- concise site audit
- top gaps
- recommended implementation order
- likely files affected by the next phase
