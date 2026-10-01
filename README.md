# Ad Inspo Dashboard

A static dashboard for browsing the Ad Inspo Library (the SharePoint list on the Marketing site).

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

## Plan for hosting

1. Host on GitHub Pages.
2. A Power Automate flow copies the list into `data/ads.json` when an ad is submitted.
3. A build step embeds the data in the page and encrypts it with a shared passphrase, so the public site shows only a password prompt.
4. Insights are generated on a schedule and written to `data/insights.json`.

Pages on a free GitHub plan are public. The passphrase gate keeps casual visitors out but is not real sign-in, so keep confidential material out of the list.
