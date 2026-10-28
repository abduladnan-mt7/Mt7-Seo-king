# About / team page brief (trust: real people, verifiable facts)

`[G]` "Of these aspects, trust is most important"; fabricated creator profiles (AI headshots, false credentials) are deceptive (Creating helpful content, 2026-10-05). `[CLAIM]` Recovered sites added a fuller About page and own photos (Haynes, 2026-02). `[G]` Organization markup here helps Google disambiguate the entity; `sameAs` ties it to profiles.

## Gate
- [ ] Every person shown is real, consents to being named, and has a verifiable public footprint (LinkedIn, GitHub, publications) you can link.
- [ ] Every fact (founding year, registration, location, team size, clients) is true and current; a fact you can't publish (e.g. a registered address you keep private) is simply omitted, never replaced with a vaguer invention.
- [ ] No stock or AI-generated faces. If no photos exist, use monograms and say the team is remote/small.

## Fill-in
- Legal name: ...  Trading name (identical everywhere): ...  Founded: ...  Where you operate: ...
- URL: /about  Title: "About <Brand>: who we are and how we work"  Meta description: ...  h1: ...

## Skeleton
1. **What the company is, in two sentences** - the entity statement engines will quote: name, what it does, where it is based, since when.
2. **People:** name, role, what they actually do here, prior relevant work, link to LinkedIn/GitHub, a real photo (or monogram). Founder first.
3. **How we work:** engagement model, where meetings happen, tools, ownership of deliverables.
4. **Proof:** links to case studies, profiles with real reviews (GBP, Clutch, G2, etc.), press mentions, open-source, talks - only real ones.
5. **Company facts:** founding date, legal form, registration jurisdiction (only what you are willing to show), locations, contact routes.
6. **Policies that build trust:** privacy, legal, how disputes are handled - linked.
7. **CTA.**

## Technical
- Organization JSON-LD on this page or the home page (not conflicting copies): `name`, `alternateName`, `url`, `logo`, `sameAs` (every real profile), `contactPoint`, `foundingDate`; `legalName` / `taxID` only if you choose to publish them (`assets/schema/organization.md`).
- Person JSON-LD for principals is optional; ProfilePage is a listed feature for individual author pages `[G]`.
- Real photos: `[G]` originals > AI > stock as a preference.

## Do not
- Pad the team with contractors who never worked with you, invented advisors, or "offices" that are virtual addresses `[G]`.
- Claim "award-winning", "best", "#1" without a linkable third-party source.
