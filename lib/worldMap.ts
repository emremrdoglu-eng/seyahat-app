import type { Place } from "./places";

// ISO 3166-1 alpha-2 -> ISO 3166-1 numeric code, used to match our
// country_code values against world-atlas's TopoJSON feature ids.
export const ALPHA2_TO_ISO_NUMERIC: Record<string, string> = {
  AD: "020",
  AE: "784",
  AF: "004",
  AG: "028",
  AL: "008",
  AM: "051",
  AO: "024",
  AR: "032",
  AT: "040",
  AU: "036",
  AZ: "031",
  BA: "070",
  BB: "052",
  BD: "050",
  BE: "056",
  BF: "854",
  BG: "100",
  BH: "048",
  BI: "108",
  BJ: "204",
  BN: "096",
  BO: "068",
  BR: "076",
  BS: "044",
  BT: "064",
  BW: "072",
  BY: "112",
  BZ: "084",
  CA: "124",
  CD: "180",
  CG: "178",
  CH: "756",
  CI: "384",
  CM: "120",
  CN: "156",
  CO: "170",
  CR: "188",
  CU: "192",
  CV: "132",
  CY: "196",
  CZ: "203",
  DE: "276",
  DJ: "262",
  DK: "208",
  DM: "212",
  DO: "214",
  DZ: "012",
  EC: "218",
  EE: "233",
  EG: "818",
  ER: "232",
  ES: "724",
  ET: "231",
  FI: "246",
  FJ: "242",
  FO: "234",
  FR: "250",
  GA: "266",
  GB: "826",
  GD: "308",
  GE: "268",
  GG: "831",
  GH: "288",
  GL: "304",
  GM: "270",
  GN: "324",
  GQ: "226",
  GR: "300",
  GT: "320",
  GW: "624",
  GY: "328",
  HK: "344",
  HN: "340",
  HR: "191",
  HT: "332",
  HU: "348",
  ID: "360",
  IE: "372",
  IL: "376",
  IM: "833",
  IN: "356",
  IQ: "368",
  IR: "364",
  IS: "352",
  IT: "380",
  JE: "832",
  JM: "388",
  JO: "400",
  JP: "392",
  KE: "404",
  KG: "417",
  KH: "116",
  KI: "296",
  KM: "174",
  KN: "659",
  KP: "408",
  KR: "410",
  KW: "414",
  KZ: "398",
  LA: "418",
  LB: "422",
  LC: "662",
  LI: "438",
  LK: "144",
  LR: "430",
  LS: "426",
  LT: "440",
  LU: "442",
  LV: "428",
  LY: "434",
  MA: "504",
  MC: "492",
  MD: "498",
  ME: "499",
  MG: "450",
  MH: "584",
  MK: "807",
  ML: "466",
  MM: "104",
  MN: "496",
  MO: "446",
  MR: "478",
  MT: "470",
  MU: "480",
  MV: "462",
  MW: "454",
  MX: "484",
  MY: "458",
  MZ: "508",
  NA: "516",
  NC: "540",
  NE: "562",
  NG: "566",
  NI: "558",
  NL: "528",
  NO: "578",
  NP: "524",
  NR: "520",
  NZ: "554",
  OM: "512",
  PA: "591",
  PE: "604",
  PF: "258",
  PG: "598",
  PH: "608",
  PK: "586",
  PL: "616",
  PR: "630",
  PS: "275",
  PT: "620",
  PW: "585",
  PY: "600",
  QA: "634",
  RO: "642",
  RS: "688",
  RU: "643",
  RW: "646",
  SA: "682",
  SB: "090",
  SC: "690",
  SD: "729",
  SE: "752",
  SG: "702",
  SI: "705",
  SK: "703",
  SL: "694",
  SM: "674",
  SN: "686",
  SO: "706",
  SR: "740",
  SS: "728",
  ST: "678",
  SV: "222",
  SY: "760",
  SZ: "748",
  TD: "148",
  TG: "768",
  TH: "764",
  TJ: "762",
  TL: "626",
  TM: "795",
  TN: "788",
  TO: "776",
  TR: "792",
  TT: "780",
  TV: "798",
  TW: "158",
  TZ: "834",
  UA: "804",
  UG: "800",
  US: "840",
  UY: "858",
  UZ: "860",
  VA: "336",
  VC: "670",
  VE: "862",
  VN: "704",
  VU: "548",
  WS: "882",
  XK: "983",
  YE: "887",
  ZA: "710",
  ZM: "894",
  ZW: "716",
};

export const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = Object.fromEntries(
  Object.entries(ALPHA2_TO_ISO_NUMERIC).map(([alpha2, numeric]) => [
    numeric,
    alpha2,
  ])
);

// A few features in world-atlas's TopoJSON have no numeric id (disputed
// territories); matched by name instead where we have a code for them.
export const UNLINKED_FEATURE_NAME_TO_ALPHA2: Record<string, string> = {
  Kosovo: "XK",
};

export type CityPin = {
  name: string;
  countryCode: string | null;
  lat: number;
  lon: number;
};

export type MapData = {
  visitedCountryCodes: Set<string>;
  cityPins: CityPin[];
  uniqueCityCount: number;
};

export function deriveMapData(places: Place[]): MapData {
  const visitedCountryCodes = new Set<string>();
  const cityNames = new Set<string>();
  const pinsByKey = new Map<string, CityPin>();

  for (const place of places) {
    if (place.country_code) visitedCountryCodes.add(place.country_code);
    cityNames.add(
      `${place.city_name.trim().toLocaleLowerCase("tr")}|${place.country_code ?? ""}`
    );

    if (place.latitude !== null && place.longitude !== null) {
      const key = `${place.latitude},${place.longitude}`;
      if (!pinsByKey.has(key)) {
        pinsByKey.set(key, {
          name: place.city_name,
          countryCode: place.country_code,
          lat: place.latitude,
          lon: place.longitude,
        });
      }
    }
  }

  return {
    visitedCountryCodes,
    cityPins: Array.from(pinsByKey.values()),
    uniqueCityCount: cityNames.size,
  };
}
