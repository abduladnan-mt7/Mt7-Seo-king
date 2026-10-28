# Third-party notices

Mt7 SEO King adapts material from two MIT-licensed projects. Apart from the Google update ledger, which is reproduced with additions, nothing was copied verbatim. What was taken is listed below, and each adapted file says so in its header or its first paragraph.

## claude-seo (https://github.com/AgriciDaniel/claude-seo), v2.5.0

- `skills/mt7-seo-king/data/google-updates.json`: the dated Google update ledger (`updates[]`, `unverified[]`, schema notes). It is reproduced with these additions: optional `end` / `rollout_days` fields taken from each entry's own notes, and a `data_anomalies[]` list re-checked on Google's Data anomalies page on 2026-10-29.
- `skills/mt7-seo-king/scripts/google-updates.mjs`: an independent Node port of `scripts/seo_updates.py` (its listing, filters, staleness warning and unverified view), with an added `--around` drop-correlation mode.
- Ideas re-implemented from scratch rather than copied: sitemap discovery through robots.txt, templated-metadata detection, drift baselines, live backlink verification.

MIT License

Copyright (c) 2026 agricidaniel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## marketingskills (https://github.com/coreyhaines31/marketingskills), v2.11.17

Structure and topic lists were adapted, rewritten, and re-sourced to Google's documentation or tagged as reasoning:
- `references/site-architecture.md` (from `site-architecture`)
- `references/programmatic-seo.md` (pattern list and data ladder, from `programmatic-seo`)
- `references/international-seo.md` (topic list, from `seo-audit/references/international-seo.md`)
- The comparison-format and evidence-discipline sections of `assets/templates/comparison-page.md` (from `competitors`)
- The retrieved/cited/mentioned/recommended ladder in `references/ai-search-visibility.md` and the fan-out tip in `assets/ai-visibility-measurement.md` (from `ai-seo`)
- The free-tool scorecard in `references/category-playbooks.md` (from `free-tools`)

MIT License

Copyright (c) 2025 Corey Haines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
