/**
 * lib/schema.mjs - JSON-LD parsing and Google rich-result eligibility checks for diagnose.mjs.
 * Node 18+, no dependencies.
 *
 * - every <script type="application/ld+json"> block is parsed; failures are reported per block
 * - types are split into top-level (including @graph members) and nested; a nested
 *   parentOrganization / subOrganization / publisher / brand / author node is a related entity,
 *   never "a duplicate Organization"
 * - required properties are checked ONLY for features Google still documents in its search
 *   gallery, and only on nodes Google reads as the feature (top level, @graph, mainEntity,
 *   breadcrumb); @id references are resolved before anything is called missing
 * - FAQPage / HowTo are reported as "no rich result" information, never as missing
 */

const LOCAL_BUSINESS = new Set(['localbusiness', 'restaurant', 'store', 'autorepair', 'autodealer', 'dentist', 'medicalclinic', 'physician', 'hotel', 'lodgingbusiness', 'motel', 'hostel', 'bedandbreakfast', 'professionalservice', 'legalservice', 'attorney', 'notary', 'accountingservice', 'financialservice', 'insuranceagency', 'realestateagent', 'homeandconstructionbusiness', 'plumber', 'electrician', 'hvacbusiness', 'roofingcontractor', 'generalcontractor', 'housepainter', 'locksmith', 'movingcompany', 'beautysalon', 'hairsalon', 'nailsalon', 'dayspa', 'healthandbeautybusiness', 'exercisegym', 'healthclub', 'sportsactivitylocation', 'foodestablishment', 'cafeorcoffeeshop', 'bakery', 'barorpub', 'fastfoodrestaurant', 'icecreamshop', 'winery', 'brewery', 'pharmacy', 'optician', 'childcare', 'travelagency', 'drycleaningorlaundry', 'emergencyservice', 'employmentagency', 'entertainmentbusiness', 'governmentoffice', 'library', 'animalshelter', 'veterinarycare', 'medicalbusiness', 'automotivebusiness', 'carwash', 'gasstation', 'autobodyshop', 'tireshop', 'clothingstore', 'electronicsstore', 'furniturestore', 'gardenstore', 'grocerystore', 'hardwarestore', 'jewelrystore', 'shoestore', 'sportinggoodsstore', 'toystore', 'bookstore', 'bikestore', 'petstore', 'convenincestore', 'departmentstore', 'florist', 'homegoodsstore', 'mobilephonestore', 'musicstore', 'officeequipmentstore', 'outletstore', 'pawnshop', 'liquorstore', 'computerstore', 'touristinformationcenter', 'selfstorage', 'shoppingcenter', 'tattooparlor', 'internetcafe', 'recyclingcenter', 'radiostation', 'televisionstation']);
const EVENT = new Set(['event', 'musicevent', 'sportsevent', 'theaterevent', 'businessevent', 'comedyevent', 'danceevent', 'educationevent', 'exhibitionevent', 'festival', 'foodevent', 'literaryevent', 'saleevent', 'screeningevent', 'socialevent', 'visualartsevent', 'childrensevent', 'deliveryevent', 'hackathon', 'publicationevent', 'courseinstance']);
const SOFTWARE = new Set(['softwareapplication', 'mobileapplication', 'webapplication', 'videogame']);
const PRODUCT = new Set(['product', 'individualproduct', 'productmodel', 'somproducts', 'someproducts', 'productgroup']);
const ORG_LIKE = new Set(['organization', 'corporation', 'ngo', 'educationalorganization', 'onlinebusiness', 'onlinestore', ...LOCAL_BUSINESS]);
const RETIRED = { faqpage: 'FAQ rich results were retired for all sites on 2026-05-07', howto: 'HowTo rich results were retired in 2023', specialannouncement: 'Special announcement results were retired', quiz: 'Practice problem results were retired in 2026-01', claimreview: 'ClaimReview (fact check) results are being phased out' };
// Properties whose nested nodes describe a different, related entity.
const RELATED = new Set(['parentorganization', 'suborganization', 'publisher', 'brand', 'author', 'creator', 'provider', 'manufacturer', 'seller', 'founder', 'member', 'memberof', 'affiliation', 'worksfor', 'sponsor', 'organizer', 'performer', 'itemreviewed', 'offers', 'review', 'aggregaterating', 'isPartof', 'ispartof', 'about', 'mentions', 'sameas', 'copyrightholder', 'sourceorganization', 'department', 'contactpoint', 'location', 'address', 'hiringorganization', 'image', 'logo', 'potentialaction', 'mainentityofpage', 'itemlistelement', 'item', 'acceptedanswer', 'suggestedanswer', 'hasPart', 'haspart']);
// Properties through which Google reads a nested node as the page's own feature.
const FEATURE_PATHS = new Set(['mainentity', 'breadcrumb']);

const lc = (t) => String(t).toLowerCase().replace(/^https?:\/\/schema\.org\//, '');
const typesOf = (node) => (node && typeof node === 'object' && node['@type'] != null ? (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]).map(String) : []);

function stripWrappers(s) {
  return String(s).trim()
    .replace(/^<!--/, '').replace(/-->$/, '')
    .replace(/^\s*(\/\/\s*)?<!\[CDATA\[/, '').replace(/(\/\/\s*)?\]\]>\s*$/, '')
    .trim();
}

/** Parse and inspect the JSON-LD blocks of one page. */
export function analyseJsonLd(rawBlocks) {
  const out = { blocks: rawBlocks.length, errors: [], top: [], nested: [], issues: [], retired: [], selfServing: [], noContext: 0 };
  const nodes = [];
  const ids = new Map();
  rawBlocks.forEach((raw, i) => {
    const txt = stripWrappers(raw);
    if (!txt) { out.errors.push(`block ${i + 1}: empty script`); return; }
    let data;
    try { data = JSON.parse(txt); } catch (e) { out.errors.push(`block ${i + 1}: ${String(e.message).slice(0, 90)}`); return; }
    const containerCtx = data && !Array.isArray(data) && typeof data === 'object' ? data['@context'] : null;
    const topItems = Array.isArray(data) ? data : data && Array.isArray(data['@graph']) ? data['@graph'] : [data];
    const walk = (node, path, top, ctx) => {
      if (Array.isArray(node)) { node.forEach((n) => walk(n, path, top, ctx)); return; }
      if (!node || typeof node !== 'object') return;
      const types = typesOf(node);
      const keys = Object.keys(node);
      if (node['@id'] && keys.some((k) => k !== '@id' && k !== '@context')) ids.set(String(node['@id']), node);
      if (types.length) nodes.push({ node, types, top, path });
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('@') || !v || typeof v !== 'object') continue;
        walk(v, [...path, k], false, ctx);
      }
    };
    for (const it of topItems) {
      if (!it || typeof it !== 'object') continue;
      const ctx = it['@context'] ?? containerCtx;
      if (typesOf(it).length && !(ctx && /schema\.org/i.test(JSON.stringify(ctx)))) out.noContext++;
      walk(it, [], true, ctx);
    }
  });
  const uniq = (a) => [...new Set(a)];
  out.top = uniq(nodes.filter((n) => n.top).flatMap((n) => n.types));
  out.nested = uniq(nodes.filter((n) => !n.top).flatMap((n) => n.types)).filter((t) => !out.top.includes(t));
  out.nestedVia = uniq(nodes.filter((n) => !n.top).map((n) => `${n.types.join('/')} via ${n.path.slice(-1)[0]}`)).slice(0, 12);

  const resolve = (v) => (v && typeof v === 'object' && !Array.isArray(v) && v['@id'] && Object.keys(v).every((k) => k === '@id' || k === '@type') ? ids.get(String(v['@id'])) || v : v);
  const has = (node, prop) => {
    const v = resolve(node[prop]);
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  };
  const first = (node, prop) => { const v = resolve(node[prop]); return Array.isArray(v) ? resolve(v[0]) : v; };

  for (const { node, types, top, path } of nodes) {
    const tset = types.map(lc);
    for (const t of tset) if (RETIRED[t] && top) out.retired.push(`${types.join('/')}: ${RETIRED[t]}`);
    // Self-serving ratings: an organisation's own rating of itself is ineligible for stars.
    if (tset.some((t) => ORG_LIKE.has(t)) && (has(node, 'aggregateRating') || has(node, 'review'))) out.selfServing.push(types.join('/'));
    const asFeature = top || FEATURE_PATHS.has(lc(path[path.length - 1] || ''));
    if (!asFeature) continue;
    const missing = [];
    const need = (cond, label) => { if (!cond) missing.push(label); };
    if (tset.includes('breadcrumblist')) {
      const items = resolve(node.itemListElement);
      const list = Array.isArray(items) ? items.map(resolve) : items ? [resolve(items)] : [];
      need(list.length > 0, 'itemListElement');
      if (list.length === 1) missing.push('a second ListItem (Google needs at least two)');
      list.forEach((li, i) => {
        if (!li || typeof li !== 'object') return;
        const item = resolve(li.item);
        const name = li.name ?? (item && typeof item === 'object' ? item.name : undefined);
        if (li.position == null) missing.push(`itemListElement[${i}].position`);
        if (name == null || name === '') missing.push(`itemListElement[${i}].name`);
        if (i < list.length - 1 && (item == null || item === '')) missing.push(`itemListElement[${i}].item`);
      });
    } else if (tset.some((t) => PRODUCT.has(t))) {
      need(has(node, 'name'), 'name');
      need(has(node, 'review') || has(node, 'aggregateRating') || has(node, 'offers'), 'one of review / aggregateRating / offers');
      const offer = first(node, 'offers');
      if (offer && typeof offer === 'object' && lc(typesOf(offer)[0] || '').includes('aggregateoffer')) {
        need(offer.lowPrice != null && offer.lowPrice !== '', 'offers.lowPrice');
        need(Boolean(offer.priceCurrency), 'offers.priceCurrency');
      } else if (offer && typeof offer === 'object') {
        const ps = resolve(offer.priceSpecification);
        const price = offer.price ?? (ps && typeof ps === 'object' ? (Array.isArray(ps) ? ps[0]?.price : ps.price) : undefined);
        need(price != null && price !== '', 'offers.price (or priceSpecification.price)');
      }
    } else if (tset.some((t) => SOFTWARE.has(t))) {
      need(has(node, 'name'), 'name');
      const offer = first(node, 'offers');
      need(offer && typeof offer === 'object' && offer.price != null && offer.price !== '', 'offers.price');
      need(has(node, 'aggregateRating') || has(node, 'review'), 'aggregateRating or review');
    } else if (tset.some((t) => LOCAL_BUSINESS.has(t))) {
      need(has(node, 'name'), 'name');
      need(has(node, 'address'), 'address');
    } else if (tset.some((t) => EVENT.has(t))) {
      need(has(node, 'name'), 'name');
      need(has(node, 'startDate'), 'startDate');
      need(has(node, 'location'), 'location');
      const loc = first(node, 'location');
      if (loc && typeof loc === 'object' && typesOf(loc).some((x) => lc(x) === 'place') && !has(loc, 'address')) missing.push('location.address');
    } else if (tset.includes('recipe')) {
      need(has(node, 'name'), 'name');
      need(has(node, 'image'), 'image');
    } else if (tset.includes('videoobject')) {
      need(has(node, 'name'), 'name');
      need(has(node, 'thumbnailUrl'), 'thumbnailUrl');
      need(has(node, 'uploadDate'), 'uploadDate');
    } else if (tset.includes('jobposting')) {
      for (const p of ['title', 'description', 'datePosted', 'hiringOrganization']) need(has(node, p), p);
      const remote = /telecommute/i.test(JSON.stringify(node.jobLocationType || '')) && has(node, 'applicantLocationRequirements');
      need(has(node, 'jobLocation') || remote, 'jobLocation (or TELECOMMUTE + applicantLocationRequirements)');
    } else if (tset.includes('review') && top) {
      need(has(node, 'author'), 'author');
      need(has(node, 'itemReviewed'), 'itemReviewed');
      const ir = first(node, 'itemReviewed');
      if (ir && typeof ir === 'object' && !ir.name) missing.push('itemReviewed.name');
      const rr = first(node, 'reviewRating');
      need(rr && typeof rr === 'object' && rr.ratingValue != null, 'reviewRating.ratingValue');
    } else if (tset.includes('aggregaterating') && top) {
      need(has(node, 'itemReviewed'), 'itemReviewed');
      const ir2 = first(node, 'itemReviewed');
      if (ir2 && typeof ir2 === 'object' && !ir2.name) missing.push('itemReviewed.name');
      need(node.ratingValue != null, 'ratingValue');
      need(node.ratingCount != null || node.reviewCount != null, 'ratingCount or reviewCount');
    } else if (tset.includes('profilepage')) {
      need(has(node, 'mainEntity'), 'mainEntity');
      const me = first(node, 'mainEntity');
      if (me && typeof me === 'object' && !me.name && !me.alternateName) missing.push('mainEntity.name');
    } else if (tset.includes('discussionforumposting')) {
      need(has(node, 'author'), 'author');
      const au = first(node, 'author');
      if (au && typeof au === 'object' && !au.name) missing.push('author.name');
      need(has(node, 'datePublished'), 'datePublished');
      need(has(node, 'text') || has(node, 'image') || has(node, 'video'), 'text, image or video');
    } else if (tset.includes('qapage')) {
      need(has(node, 'mainEntity'), 'mainEntity');
      const q = first(node, 'mainEntity');
      if (q && typeof q === 'object') {
        need(Boolean(q.name), 'mainEntity.name');
        need(q.answerCount != null, 'mainEntity.answerCount');
        need(has(q, 'acceptedAnswer') || has(q, 'suggestedAnswer'), 'mainEntity.acceptedAnswer or suggestedAnswer');
      }
    }
    if (missing.length) out.issues.push({ type: types.join('/'), missing: [...new Set(missing)].slice(0, 6) });
  }
  out.retired = uniq(out.retired);
  out.selfServing = uniq(out.selfServing);
  return out;
}
