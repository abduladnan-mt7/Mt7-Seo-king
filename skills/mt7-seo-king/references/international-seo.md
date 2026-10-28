# International and multilingual SEO

Only for sites that genuinely serve more than one language or country. A site in one language for one market needs none of this beyond a correct `<html lang>`. Tags as in SKILL.md. Added 2026-10-29; the topic list follows marketing-skills' `international-seo` reference (MIT, see THIRD_PARTY_NOTICES.md), re-sourced to Google's docs.

Sources `[G]`: [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites), [Localized versions of your pages (hreflang)](https://developers.google.com/search/docs/specialty/international/localized-versions), [Locale-adaptive pages](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages).

## 1. Decide whether you need it

- Build a locale version only when you can make it fully useful: translated, reviewed and locally correct (currency, units, examples, law). Google's scaled content abuse examples include "automated transformations like synonymizing, translating" of content that adds little value `[G]`; have every translation reviewed by a fluent human `[INFERENCE]`.
- One language serving several countries usually needs no hreflang. Add it only when the content genuinely differs per country (prices, availability, legal terms) `[INFERENCE]`.

## 2. URL structure `[G]`

| Option | Example | Note |
|---|---|---|
| Country-code domain | `example.de` | Strongest country signal; separate sites to build up `[G]` |
| Subdomain | `de.example.com` | Easy to host separately `[G]` |
| Subdirectory | `example.com/de/` | Shares the domain's signals; simplest to maintain `[G]`. The usual default `[INFERENCE]` |
| URL parameter | `?lang=de` | Not recommended by Google `[G]` |

Keep the language or country in the URL. Google does not use cookies or browser settings to pick a version `[G]`. Search Console's country-targeting setting was retired in 2022, so targeting comes from the URL structure, hreflang and content `[G]`.

## 3. Don't auto-redirect by IP or browser language `[G]`

Googlebot mostly crawls from US IP addresses and does not send `Accept-Language`, so an auto-redirect can hide every other version from it. Serve each locale at its own URL, link the versions to each other, and offer a visible language/country switcher or banner instead of a forced redirect `[G]`.

## 4. hreflang rules `[G]`

- Use one method: `<link rel="alternate" hreflang>` in the `<head>`, HTTP `Link` headers (for PDFs and other non-HTML), or the XML sitemap. If you use more than one, they must say the same thing `[G]` `[INFERENCE]` on the consistency.
- Each version lists **itself and every other version**. Annotations must be **reciprocal**: if page A names B but B doesn't name A, Google ignores the pair `[G]`.
- Codes: language in ISO 639-1 (`de`), optionally followed by region in ISO 3166-1 Alpha-2 (`de-AT`). A region alone is invalid. `en-UK` is a common mistake; the code is `en-GB` `[G]`.
- `x-default` names the fallback or language-picker page for users matching no listed locale `[G]`.
- Use fully-qualified URLs (`https://...`) `[G]`.
- Every URL in a hreflang set returns 200, is indexable and is its own canonical `[G]` `[INFERENCE]`. A hreflang pointing at a redirect, a noindexed page or a page canonicalised elsewhere is wasted.

## 5. Canonicals with locales `[G]`

- Each locale version is self-canonical. Never canonicalise a translation to the original language; that tells Google the translation is a duplicate to drop `[G]`.
- Canonical decides which URL is indexed; hreflang only swaps between indexed alternates. When the two disagree, canonical wins `[INFERENCE]` from `[G]`.

## 6. Language detection

- Google determines a page's language from its visible content. It does not use the `lang` attribute or the URL for this `[G]`. So translate the whole page (navigation, buttons, footer, alt text), not only the body `[G]`.
- Still set `<html lang>` correctly. Accessibility tools and other engines read it; Bing has historically pointed to `content-language` and `lang` for language and region `[CLAIM]`.
- Bing's use of hreflang is reported as weak; don't rely on it for Bing targeting `[CLAIM]`.

## 7. Checklist

- [ ] Each locale has its own URL; no IP- or language-based auto-redirect `[G]`
- [ ] hreflang self-reference, reciprocal links, valid codes, `x-default` `[G]`
- [ ] Every hreflang URL: 200, indexable, self-canonical `[G]`
- [ ] Whole page translated `[G]` and reviewed by a fluent human `[INFERENCE]`
- [ ] Local currency, units, dates and legal details correct per locale `[INFERENCE]`
- [ ] Locale sitemaps (or one sitemap with hreflang) submitted; Pages report checked per locale `[G]`
- [ ] Switcher links are crawlable `<a href>` links between equivalent pages, not to each locale's home page `[INFERENCE]`
