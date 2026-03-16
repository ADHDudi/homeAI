// City name normalization for joining across datasets
const CITY_ALIASES: Record<string, string> = {
  "תל אביב - יפו": "תל אביב-יפו",
  "תל-אביב-יפו": "תל אביב-יפו",
  "תל-אביב יפו": "תל אביב-יפו",
  "ירושלים": "ירושלים",
  "חיפה": "חיפה",
  "באר שבע": "באר שבע",
  "באר-שבע": "באר שבע",
  "ב\"ש": "באר שבע",
  "ת\"א": "תל אביב-יפו",
  "פ\"ת": "פתח תקווה",
  "פתח-תקווה": "פתח תקווה",
  "ר\"ג": "רמת גן",
  "רמת-גן": "רמת גן",
  "ב\"ב": "בני ברק",
  "בני-ברק": "בני ברק",
};

export function normalizeCityName(name: string): string {
  if (!name) return "";
  let normalized = name.trim().replace(/\s+/g, " ");
  // Check aliases
  if (CITY_ALIASES[normalized]) {
    normalized = CITY_ALIASES[normalized];
  }
  return normalized;
}

export function safeNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  // Handle comma-formatted numbers like "9,242.00"
  const str = String(val).replace(/,/g, "");
  const num = Number(str);
  return isNaN(num) ? fallback : num;
}

export function safeTrim(val: unknown): string {
  return String(val ?? "").trim();
}

export function groupByCity<T extends Record<string, unknown>>(
  records: T[],
  cityField: string
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const record of records) {
    const city = normalizeCityName(String(record[cityField] ?? ""));
    if (!city) continue;
    const existing = map.get(city) || [];
    existing.push(record);
    map.set(city, existing);
  }
  return map;
}
