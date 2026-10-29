/**
 * lib/hreflang.mjs - validate hreflang values the way Google documents them:
 * a language in ISO 639-1, optionally a script (ISO 15924) and/or a region in ISO 3166-1 alpha-2,
 * or "x-default". Source: https://developers.google.com/search/docs/specialty/international/localized-versions
 * Node 18+, no dependencies.
 */

const ISO639_1 = new Set(('aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu ' +
  'fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky ' +
  'la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd ' +
  'se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu').split(' '));

// Withdrawn ISO 639-1 codes still seen in the wild.
const DEPRECATED = { iw: 'he', in: 'id', ji: 'yi', jw: 'jv', mo: 'ro' };

const ISO3166 = new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH ' +
  'CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU ' +
  'GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF ' +
  'MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS ' +
  'RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG ' +
  'VI VN VU WF WS YE YT ZA ZM ZW').split(' '));

const REGION_HINT = { UK: 'GB', EN: '(a language, not a region)', EU: '(not a country code)', LA: 'is Laos, not Latin America' };

/** Returns null when valid, else a short reason. */
export function hreflangProblem(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'empty value';
  if (raw.toLowerCase() === 'x-default') return null;
  if (raw.includes('_')) return `uses "_" instead of "-" (write ${raw.replace(/_/g, '-')})`;
  const parts = raw.split('-');
  const lang = parts[0].toLowerCase();
  if (!/^[a-z]+$/.test(lang)) return 'language part is not letters';
  if (lang.length !== 2) return lang.length === 3 ? `"${lang}" is a 3-letter code; Google documents ISO 639-1 (2 letters)` : 'language must be an ISO 639-1 code';
  if (DEPRECATED[lang]) return `"${lang}" is a withdrawn code (now "${DEPRECATED[lang]}")`;
  if (!ISO639_1.has(lang)) {
    if (ISO3166.has(lang.toUpperCase())) return `"${lang}" is a country code, not a language (a region alone is not valid)`;
    return `"${lang}" is not an ISO 639-1 language code`;
  }
  let rest = parts.slice(1);
  if (rest.length && /^[A-Za-z]{4}$/.test(rest[0])) rest = rest.slice(1); // script subtag, e.g. zh-Hant
  if (rest.length > 1) return 'too many subtags (language[-script][-region])';
  if (rest.length === 1) {
    const region = rest[0].toUpperCase();
    if (/^\d{3}$/.test(region)) return `region "${region}" is a UN M.49 number; Google documents ISO 3166-1 alpha-2`;
    if (!ISO3166.has(region)) return `region "${rest[0]}" is not ISO 3166-1 alpha-2${REGION_HINT[region] ? ` (${REGION_HINT[region]})` : ''}`;
  }
  return null;
}
