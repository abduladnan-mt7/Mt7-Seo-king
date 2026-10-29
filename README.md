# Mt7 SEO King

An SEO skill for Claude Code (and any agent that reads [Agent Skills](https://agentskills.io)) that tells you what actually moves rankings, and how sure it is.

Every recommendation carries an evidence tag. `[G]` means Google's own documentation, `[DATA]` a study or measured test with its sample size and date, and `[PROVEN]` independent practitioners agreeing. `[CLAIM]`, `[WARNED]` and `[INFERENCE]` are labelled as such, so you can tell a rule from a hunch. Where community advice contradicts Google, the skill follows Google and says so. Nothing paid is required: no API keys, and nothing to install beyond Node 18 for the scripts. If you use [OpenSEO](https://openseo.so), the skill can also draw on its live keyword, SERP and backlink data, and asks before any call that spends credits.

## What it does

- **Audits and diagnosis.** A phased workflow (diagnose → foundations → intent map → pages → local and reviews → links → AI search → measure). Every phase has a gate to pass before moving on.
- **Diagnose mode.** `diagnose.mjs` crawls a site the way a polite, non-rendering crawler does. It ranks what it finds from critical to info, and gives each finding its per-URL evidence, its Google source and a way to verify it. On crawler-test.com, a site built with known SEO faults, four runs found 160 of its 164 test issues.
- **Traffic drops.** A dated ledger of Google core, spam and policy updates, each entry citing a Google URL, plus Search Console's own logging errors. `--around <date>` shows what overlapped a drop before anyone blames "the algorithm".
- **Verify before you report.** Audit rules that stop the usual false positives: "your sitemap lists noindexed pages" (it gets checked first), "no schema" (on a JS-rendered page), "duplicate Organization" (a nested parent organization isn't one).
- **Pages that rank without becoming spam.** Templates for service, industry, city, case-study, comparison and how-to-choose pages, each with a legitimacy gate. A programmatic-SEO gate covers tools, conversions and comparisons built from one template. Each page type also has its "becomes a doorway page when..." line.
- **Links at no cost.** A vetted catalogue of free link and mention sources with their link attributes, outreach kits (lists, digital PR, journalist sources, broken-link outreach), and a "looks free, is spam" list.
- **AI search.** What Google says is required (nothing extra), how other engines choose sources, and how to measure visibility as a percentage of runs, never a "rank".
- **Ten site categories:** local services, agency, SaaS, e-commerce, publisher, free tools, apps, marketplaces, hospitality, healthcare.

## Scripts

All in `skills/mt7-seo-king/scripts/`. They need Node 18+ and nothing else, and they fetch raw HTML the way a non-rendering crawler does.

| Script | What it answers |
|---|---|
| `diagnose.mjs <site>` | What is wrong with this site, and what should be fixed first? Redirect chains and loops, links to errors, http/www/slash duplicates, soft 404s, sitemap URLs that are noindexed, redirected or blocked, broken canonicals, duplicate and thin content, hreflang errors, missing required JSON-LD properties, intermittent 5xx, mixed content and sitemap limits. Each finding has evidence, a source and a verify step; `--psi` adds PageSpeed data. No made-up score |
| `onpage-check.mjs <url>` | Is this page technically ready? Status, redirects, title, description, canonical, robots, H1, JSON-LD types, hreflang, alt text, word count with a JS-dependence flag, Open Graph, HTML size against Googlebot's 2 MB limit |
| `sitemap-audit.mjs <site>` | Is everything in the sitemap really indexable? Every URL fetched: non-200s, verified noindex, canonicals elsewhere, duplicate and templated titles/descriptions, orphans, intermittent 5xx (`--repeat 3`), bulk-stamped `lastmod`. `--save` / `--compare` show what changed between two runs |
| `link-check.mjs <your-domain> <page>...` | Did they really link to you, and does it count? Anchor, rel (nofollow/sponsored/ugc), and whether the linking page is noindexed, canonicalised away or blocked by robots.txt |
| `google-updates.mjs --around <date>` | Which Google updates and Search Console data anomalies overlap a traffic change? Also `--since`, `--kind`, `--unverified` |

`diagnose.mjs` obeys robots.txt and paces its requests. Run it on sites you own or audit for a client.

```bash
node skills/mt7-seo-king/scripts/diagnose.mjs https://example.com --repeat 2 --save diagnose.json
node skills/mt7-seo-king/scripts/sitemap-audit.mjs https://example.com --repeat 3 --save before.json
node skills/mt7-seo-king/scripts/google-updates.mjs --around 2026-08-16
```

## Install

**As a Claude Code plugin:**

```
/plugin marketplace add abduladnan-mt7/Mt7-Seo-king
/plugin install mt7-seo-king@mt7-seo-king
```

**As a plain skill:** copy the skill folder into your skills directory.

```bash
git clone https://github.com/abduladnan-mt7/Mt7-Seo-king
cp -r Mt7-Seo-king/skills/mt7-seo-king ~/.claude/skills/
```

Then ask in plain words, for example "why isn't my site showing up on Google?", "audit example.com", "our traffic dropped on 16 August", "plan city pages for my clinic", or "find free backlinks for a calculator site". The skill loads itself when the topic is SEO.

## Layout

```
skills/mt7-seo-king/
  SKILL.md            workflow, evidence rule, verify-before-report rules, report format
  references/         Google's statements, keywords, local, AI search, links, images,
                      category playbooks, site architecture, programmatic SEO, international
  assets/             checklists, page templates, JSON-LD templates, robots.txt, kits, CSVs
  data/               dated Google update ledger + Search Console anomalies
  scripts/            five Node scripts and their shared lib/
  examples/           a worked example (fictional agency)
```

## Keeping it honest

SEO facts go stale within months. The core research was verified on 2026-10-20, and additions and corrections on 2026-10-29. SKILL.md has a re-verification protocol, the update ledger warns when it is more than 30 days old, and anything the references can't support is tagged `[INFERENCE]`. Nobody can guarantee a #1 ranking, and this skill never claims to.

Corrections are welcome. Open an issue or a pull request with the primary source.

## Want it done for you?

The skill is free and works on its own. If you would rather have someone run the audit and make the fixes, Mt7, the team that built it, does this as a paid service: [mt7.io](https://mt7.io).

## Credits and license

MIT. See [LICENSE](LICENSE). The Google update ledger and the `google-updates.mjs` design come from [claude-seo](https://github.com/AgriciDaniel/claude-seo). Several reference structures are adapted from [marketingskills](https://github.com/coreyhaines31/marketingskills). Both are MIT-licensed. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) lists exactly what was taken.

Mt7 SEO King is an independent project. It is not affiliated with or endorsed by Google, Microsoft, Anthropic, Ahrefs or any other company or tool it mentions; their names are used only to refer to their products and documentation. The skill and scripts are provided as is, without warranty, under the MIT license.
