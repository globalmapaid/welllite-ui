/**
 * ISO 3166-1 alpha-2 display names, used to label country codes in the UI.
 *
 * This is **display-only and non-authoritative**: the backend's geo validator
 * decides which codes are actually supported (it rejects the rest with
 * `CLIENT_UNSUPPORTED_COUNTRY`). There is no API to fetch the supported set yet,
 * so this list powers autocomplete suggestions and labels — an unknown but
 * well-formed code still renders (as its raw code) and is sent to the server.
 * WellLite operates primarily in Africa, so that region is covered in full.
 */
export const COUNTRY_NAMES: Record<string, string> = {
  // Africa
  DZ: 'Algeria',
  AO: 'Angola',
  BJ: 'Benin',
  BW: 'Botswana',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  CV: 'Cape Verde',
  CM: 'Cameroon',
  CF: 'Central African Republic',
  TD: 'Chad',
  KM: 'Comoros',
  CG: 'Congo',
  CD: 'DR Congo',
  CI: 'Côte d’Ivoire',
  DJ: 'Djibouti',
  EG: 'Egypt',
  GQ: 'Equatorial Guinea',
  ER: 'Eritrea',
  SZ: 'Eswatini',
  ET: 'Ethiopia',
  GA: 'Gabon',
  GM: 'Gambia',
  GH: 'Ghana',
  GN: 'Guinea',
  GW: 'Guinea-Bissau',
  KE: 'Kenya',
  LS: 'Lesotho',
  LR: 'Liberia',
  LY: 'Libya',
  MG: 'Madagascar',
  MW: 'Malawi',
  ML: 'Mali',
  MR: 'Mauritania',
  MU: 'Mauritius',
  MA: 'Morocco',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NE: 'Niger',
  NG: 'Nigeria',
  RW: 'Rwanda',
  ST: 'São Tomé and Príncipe',
  SN: 'Senegal',
  SC: 'Seychelles',
  SL: 'Sierra Leone',
  SO: 'Somalia',
  ZA: 'South Africa',
  SS: 'South Sudan',
  SD: 'Sudan',
  TZ: 'Tanzania',
  TG: 'Togo',
  TN: 'Tunisia',
  UG: 'Uganda',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
  // Middle East & nearby
  AF: 'Afghanistan',
  AE: 'United Arab Emirates',
  BH: 'Bahrain',
  IL: 'Israel',
  IQ: 'Iraq',
  IR: 'Iran',
  JO: 'Jordan',
  KW: 'Kuwait',
  LB: 'Lebanon',
  OM: 'Oman',
  PS: 'Palestine',
  QA: 'Qatar',
  SA: 'Saudi Arabia',
  SY: 'Syria',
  TR: 'Türkiye',
  YE: 'Yemen',
  // South & South-East Asia
  BD: 'Bangladesh',
  ID: 'Indonesia',
  IN: 'India',
  KH: 'Cambodia',
  LA: 'Laos',
  LK: 'Sri Lanka',
  MM: 'Myanmar',
  NP: 'Nepal',
  PH: 'Philippines',
  PK: 'Pakistan',
  TH: 'Thailand',
  VN: 'Vietnam',
  // Common others
  BR: 'Brazil',
  DE: 'Germany',
  ES: 'Spain',
  FR: 'France',
  GB: 'United Kingdom',
  IT: 'Italy',
  NL: 'Netherlands',
  PT: 'Portugal',
  US: 'United States',
}

/** All known codes, sorted by display name — for autocomplete suggestions. */
export const COUNTRY_OPTIONS: readonly string[] = Object.keys(COUNTRY_NAMES).sort(
  (a, b) => COUNTRY_NAMES[a].localeCompare(COUNTRY_NAMES[b]),
)

/** Label a code as "Ethiopia (ET)", or just the code if the name is unknown. */
export function countryLabel(code: string): string {
  const name = COUNTRY_NAMES[code]
  return name ? `${name} (${code})` : code
}

/**
 * Resolve free-text input to a normalised alpha-2 code, accepting a bare code
 * ("et"), a "Name (CODE)" suggestion, or an exact country name ("Ethiopia").
 * Returns null when it can't be resolved to a 2-letter code.
 */
export function resolveCountryInput(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  const paren = s.match(/\(([A-Za-z]{2})\)\s*$/)
  if (paren) return paren[1].toUpperCase()
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase()
  const byName = Object.entries(COUNTRY_NAMES).find(
    ([, name]) => name.toLowerCase() === s.toLowerCase(),
  )
  return byName ? byName[0] : null
}
