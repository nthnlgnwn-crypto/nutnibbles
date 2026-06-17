# new-food-post

## When to use

Use this when adding a new food review, cafe note, restaurant write-up, or meal story.

## Files to inspect

- `AGENTS.md`
- `README.md`
- `templates/food-post.html`
- `checklists/new-post.md`
- `food/index.html`
- related travel page if the meal belongs to a trip

## Steps

1. Start from `templates/food-post.html`.
2. Confirm the route pattern `food/{food-slug}/index.html`.
3. Add local images under the appropriate place or trip folder.
4. Write with the NutNibbles voice:
   - personal but useful
   - clear verdict
   - specific standout dishes
   - honest downside if there is one
5. Link back to the relevant city or travel page.
6. Add the post to `food/index.html` if it belongs in the hub.
7. Add the page to `sitemap.xml`.
8. Run:
   - `npm run build`
   - `npm run check`
9. Review mobile spacing, image treatment, and scannability.

## Expected output

- one new food post
- related travel links updated if needed
- sitemap updated
- validation results clean or clearly reported
