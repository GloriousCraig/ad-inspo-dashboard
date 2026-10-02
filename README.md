# Ad Archive Dashboard

A static dashboard for browsing the Ad Archive (the SharePoint list on the Marketing site).

## Files

- `index.html` is the whole dashboard. No build step is needed to view it.
- `data/ads.json` holds the ads. It uses the same field names as the SharePoint list (`Title`, `SourceLink`, `AdFormat`, `Hook`, `ConceptTags`, `ExecutionTags`, `WhyItWorks`, `GloriousIdea`, `AlreadyRun`, `SubmittedByName`, `Created`). Tags may be arrays or the JSON strings the flow produces.
- `data/insights.json` holds Claude's written suggestions.
- The files in `data/` currently contain **sample data**. `meta.sample: true` shows a banner on the page. Set it to `false` or remove it when real data is in.

## Preview locally

```
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/

## Password-protected build

`build.mjs` embeds `data/*.json` into the page and encrypts it with StatiCrypt (AES-256). The result is `dist/index.html`, which shows only a passphrase prompt until the right passphrase is entered.

```
npm install
DASHBOARD_PASSPHRASE="a long passphrase" node build.mjs
```

- The passphrase must be at least 16 characters. The build refuses to run without it, so an unencrypted page is never produced.
- The encrypted file is public once deployed, so anyone can try passphrases offline. Use a long, random passphrase.
- `.github/workflows/deploy.yml` runs the build on every push to `main` and deploys `dist/` to GitHub Pages. It reads the passphrase from the repository secret `DASHBOARD_PASSPHRASE`.

### One-time GitHub setup

1. Settings, Secrets and variables, Actions: add a secret named `DASHBOARD_PASSPHRASE`.
2. Settings, Pages: set Source to **GitHub Actions**. Free Pages needs the repo to be public.
3. Run the workflow from the Actions tab, or push a change.

## Plan for hosting

1. Host on GitHub Pages (this repo is public, so it must never contain real data).
2. Real data lives in the **private** repo `GloriousCraig/ad-inspo-data` as `ads.json` (and optionally `insights.json`). It is refreshed on request by exporting the SharePoint list.
3. The workflow checks out the private repo with the read-only secret `DATA_REPO_TOKEN`, copies the data over the sample files, and runs the build. If the private repo has no `ads.json`, the build uses the sample data.
4. The build embeds the data in the page and encrypts it with the shared passphrase, so the public site shows only a password prompt.
5. The workflow also runs once a day, so a refresh of the private repo is picked up without a push here.

Pages on a free GitHub plan are public. The passphrase gate keeps casual visitors out but is not real sign-in, so keep confidential material out of the list. The `DATA_REPO_TOKEN` expires on the date chosen when it was created. After that the build will fail until a new token is saved.
