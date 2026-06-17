# pre-publish-check

## When to use

Use this right before committing or pushing public NutNibbles site changes.

## Files to inspect

- all changed HTML pages
- `styles.css` if layout changed
- `sitemap.xml` if new pages were added
- relevant assets referenced by changed pages
- `checklists/new-post.md`

## Steps

1. Review `git status` and make sure only intended files changed.
2. Run:
   - `npm run build`
   - `npm run check`
3. Confirm `dist/` contains expected site output.
4. Manually inspect changed pages on:
   - desktop width
   - mobile width
5. Confirm:
   - metadata is complete
   - local links work
   - image paths work
   - sitemap includes new public pages
   - no accidental privacy issue appears in selected photos

## Expected output

- short publish readiness report
- any remaining risks called out clearly
- explicit statement on whether the change is safe to commit
