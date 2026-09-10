# Sky Patch release rules

- Every new commit must increment the semantic version in package.json and package-lock.json and add an entry at the top of CHANGELOG.md. Do not rewrite previously published commits.
- Use `npm run release -- patch "Change summary"` (minor for notable features, major for breaking changes). This updates both package files, CHANGELOG.md and the latest-release section of README.md. Use `python3 scripts/release.py sync` after editing the changelog wording.
- Describe fixes and maintenance too; do not make an unversioned follow-up commit. Combine changes into one reviewed commit where appropriate.
- Whenever notable user-facing features change, update landing/index.html in the same commit: benefits, feature text, FAQ and installation guidance as applicable. Capture fresh screenshots for new or materially changed visual features. Never present an old screenshot as depicting new controls.
- CHANGELOG.md is the source for the website changelog and GitHub README release summary. Do not edit generated site/ or dist/ files.
- Run appropriate tests and npm run build before committing; include the regenerated public/source/skypatch-source.tar.gz. Keep saved user data and survey caches compatible with PWA updates.
- After publishing, verify GitHub Pages deployment and the public release version. Tag the published commit as v<version>.
- Never use sed on this Mac.
