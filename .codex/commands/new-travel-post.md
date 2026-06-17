# new-travel-post

## When to use

Use this when creating a new trip hub or city chapter for NutNibbles.

## Files to inspect

- `AGENTS.md`
- `README.md`
- `templates/travel-trip.html`
- `templates/travel-city.html`
- `checklists/new-post.md`
- `sitemap.xml`
- related existing trip pages for tone and layout reference

## Steps

1. Confirm whether the page is:
   - a trip hub
   - a city chapter
2. Start from the matching template.
3. Reuse the existing route/slugs structure style.
4. Add local images under `assets/images/{trip-slug}/...`.
5. Add metadata:
   - title
   - description
   - canonical
   - Open Graph
   - Twitter
6. Add internal links:
   - trip hub to city pages
   - city page to related food posts
   - previous/next city nav where relevant
7. Add sitemap entry.
8. Run:
   - `npm run build`
   - `npm run check`
9. Review both desktop and mobile reading flow.

## Expected output

- one new travel page or chapter
- updated links and sitemap
- clean validation results or a short issue list
