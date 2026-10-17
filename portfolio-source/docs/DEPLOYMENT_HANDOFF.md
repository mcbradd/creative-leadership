# Publication handoff

The portfolio implementation is prepared for the existing `mcbradd/creative-leadership` GitHub Pages release path. Publication is currently blocked by authentication, not by a missing hosting configuration.

## Observed access failures

- The connected GitHub app can read the public repository, but `create_blob` returned HTTP 403: `Resource not accessible by integration`.
- `gh auth status` reports the stored `mcbradd` token invalid.
- Noninteractive SSH authentication returned `Permission denied (publickey)`.
- The browser reached GitHub two-factor authentication and requested a passkey interaction. No security protection was bypassed.

No remote branch was updated by these attempts. A local release commit and a binary-capable patch preserve the prepared change. The repository's existing deployment workflow is unchanged.

## Resume after authentication is restored

Use the prepared `release-host` checkout, or apply the release patch to a clean checkout of `mcbradd/creative-leadership`. Do not overwrite another checkout's uncommitted work.

1. Restore an ordinary write-enabled GitHub connection, or sign the GitHub CLI into the intended account. Do not paste credentials into the repository or into chat.
2. Fetch `origin/main` and compare it to the recorded parent. If it advanced, incorporate the new commits while preserving the portfolio addition and any unrelated work. Never force-push this release.
3. Run `npm ci`, install the repository's Playwright Chromium dependency if needed, and run `npm run gates` from the repository root. The portfolio build, type check, and asset validation now run through `prebuild`.
4. Push the reviewed commit to `main` through the existing release path. Wait for the specific GitHub Actions Pages run to succeed.
5. Confirm `https://mcbradd.github.io/creative-leadership/portfolio/release.json` reports that pushed SHA. Exercise the deployed portfolio in external Chrome at desktop and phone sizes: navigation, project/gallery filters, image dialog and Escape, portrait selection, comparison modes, exact-prompt disclosure, and email copy.
6. Check every content route, the explicit portfolio `404.html`, sitemap, social image, and original leadership/classroom URLs. Record the effective unknown-route and origin robots behavior.
7. Replace the blocked status in RELEASE.md with the actual SHA, workflow URL, timestamps, and live evidence. Only then treat the task as complete.

The current local production preview is served at `http://127.0.0.1:4173/creative-leadership/portfolio/`. Restart it with `npm run preview -- --host 127.0.0.1 --port 4173` from the prepared repository checkout if necessary. A localhost preview is not a public deployment.
