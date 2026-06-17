# NutNibbles

NutNibbles is a static personal food and travel blog built with plain HTML and CSS. The site keeps a dark green and cream editorial feel, a personal journal voice, and a lightweight file structure that is easy to maintain without a framework.

## Core Structure

- `index.html` - homepage
- `travel/` - travel hub, trip hubs, and city chapter pages
- `food/` - food hub and individual food review pages
- `assets/images/` - local site images
- `assets/icons/` - favicon and UI icon assets
- `styles.css` - shared site styling
- `templates/` - starting templates for new travel and food pages
- `checklists/` - publishing and planning checklists
- `scripts/` - static build and validation scripts
- `dist/` - generated build output for deployment

## Main Contributor Rules

The main editorial and contributor rulebook lives in [`AGENTS.md`](./AGENTS.md).

Read that first before changing:

- published travel pages
- food reviews
- metadata
- image usage
- sitemap entries
- internal links

## Build And Check Commands

From the repo root:

- `npm run build` - rebuild the static site into `dist/`
- `npm run check:meta` - check page metadata
- `npm run check:sitemap` - check `sitemap.xml` coverage
- `npm run check:links` - check local internal links, anchors, scripts, and styles
- `npm run check:images` - check referenced HTML and social images exist
- `npm run check` - run the full validation pass
- `npm run preview` - serve `dist/` locally on port `4173`

## Build Output And Deployment

Source files are edited in the repo root.

Deployment output is generated into `dist/` by `scripts/build-static.js`.

Production is currently served through an external publisher behind Cloudflare. The exact publisher is not proven by this repo alone.

The GitHub Pages workflow in `.github/workflows/pages.yml` is now manual-only and is kept as a fallback/reference workflow. It no longer runs automatically on push because it is not the active production deploy path.

The local quality gate before publishing remains:

- `npm run build`
- `npm run check`

Publishing currently happens by pushing to `origin/main`, after which the external publisher updates the live site.

The manual GitHub Pages fallback workflow still targets `dist/`, including:

- `.nojekyll`
- `robots.txt`
- `sitemap.xml`
- `favicon.ico`
- `assets/`
- `travel/`
- `food/`

Do not edit `dist/` manually.

## Templates And Checklists

Templates:

- [`templates/travel-trip.html`](./templates/travel-trip.html)
- [`templates/travel-city.html`](./templates/travel-city.html)
- [`templates/food-post.html`](./templates/food-post.html)

Checklists:

- [`checklists/new-post.md`](./checklists/new-post.md)
- [`checklists/content-inventory-template.md`](./checklists/content-inventory-template.md)

## How To Add A New Travel Page

1. Choose the right template:
   - trip hub -> `templates/travel-trip.html`
   - city chapter -> `templates/travel-city.html`
2. Add local images under the right trip folder in `assets/images/`
3. Create the new page under `travel/{trip-slug}/` or `travel/{trip-slug}/{city-slug}/`
4. Add metadata, canonicals, Open Graph, and Twitter tags
5. Link the page from the appropriate travel hub or trip hub
6. Add related food links if relevant
7. Add the page to `sitemap.xml`
8. Run `npm run build` and `npm run check`
9. Review on both desktop and mobile widths

## How To Add A New Food Post

1. Start from `templates/food-post.html`
2. Place the page under `food/{food-slug}/index.html`
3. Add local images under the relevant place/trip image folder
4. Add a clear verdict, context, and honest personal notes
5. Link back to the relevant city or travel page
6. Add the post to `food/index.html` if it should be discoverable there
7. Add the page to `sitemap.xml`
8. Run `npm run build` and `npm run check`
9. Review mobile readability before publishing

## Future Hook Recommendation

There are no active custom Git hooks yet.

If we want another safety layer later, the safest next step would be:

- `pre-commit` -> run `npm run check:meta` and `npm run check:images`
- `pre-push` -> run `npm run build` and `npm run check`

For now, the repo keeps this as a documented workflow instead of enforcing it automatically.
