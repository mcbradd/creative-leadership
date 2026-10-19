# Publication and maintenance

The portfolio uses the existing `mcbradd/creative-leadership` GitHub Pages release path. GitHub CLI authentication was restored on October 18, 2026, and the prepared implementation commit was pushed successfully. See [RELEASE.md](RELEASE.md) for the verified deployment and browser evidence.

## Subsequent releases

Use the repository checkout that contains `portfolio-source/`. Do not overwrite another checkout's uncommitted work.

1. Check `git status` and fetch `origin/main`. Incorporate upstream changes while preserving unrelated work; never force-push this release path.
2. Use Node 22.22 or newer. Run `npm ci`, install Playwright Chromium if needed, and run `npm run gates` from the repository root. The portfolio dependency install, type check, production build, and asset validation run through `prebuild`.
3. Push validated changes to `main`. Wait for the exact commit's **Deploy to GitHub Pages** workflow to succeed. The existing workflow runs all parent-site and classroom checks before publication.
4. Confirm `https://mcbradd.github.io/creative-leadership/portfolio/release.json` reports the pushed SHA. Verify the public portfolio in external Chrome at desktop and phone sizes: navigation, project/gallery filters, image dialog and Escape/focus return, portrait selection, comparison modes, exact-prompt disclosure, and email copy.
5. Check every content route, the explicit portfolio `404.html`, sitemap, social image, and original leadership/classroom URLs. Unknown URLs use the parent Pages 404 policy. A nested `robots.txt` does not override the origin-wide policy.
6. Record actual results in RELEASE.md. A successful push or a localhost screenshot alone does not establish a verified release.

The only public contact address is **bradd.mcbrearty@gmail.com**, including visible text, email links, and copied values.

## Local production preview

From the repository root, run `npm run build` and `npm run preview -- --host 127.0.0.1 --port 4173`. Open `http://127.0.0.1:4173/creative-leadership/portfolio/`.

The generated `public/portfolio/` output is ignored by Git. Commit the source, prepared assets, and lockfiles; do not publish local captures, source downloads, credentials, or caches.
