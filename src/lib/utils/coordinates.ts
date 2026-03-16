/**
 * Convert Israel Transverse Mercator (ITM) coordinates to WGS84 (lat/lng).
 * Uses a simplified affine approximation sufficient for map display.
 *
 * ITM is based on Transverse Mercator projection with:
 * - Central meridian: 35.2045° E
 * - False easting: 219529.584
 * - False northing: 626907.39
 * - Scale factor: 1.0000067
 */
export function itmToWgs84(
  easting: number,
  northing: number
): { lat: number; lng: number } | null {
  // Validate input ranges (ITM easting ~100k-300k, northing ~350k-800k)
  if (
    easting < 50000 || easting > 350000 ||
    northing < 300000 || northing > 850000
  ) {
    return null;
  }

  // GRS80 ellipsoid parameters
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const e2 = 2 * f - f * f;
  const e4 = e2 * e2;
  const e6 = e4 * e2;

  // ITM projection parameters
  const lon0 = (35 + 12 / 60 + 16.261 / 3600) * (Math.PI / 180); // 35.2045° in radians
  const k0 = 1.0000067;
  const falseE = 219529.584;
  const falseN = 626907.39;

  // Meridian arc coefficients
  const M0 =
    a *
    ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * (31 + 44 / 60 + 3.8170 / 3600) * (Math.PI / 180) -
      (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) *
        Math.sin(2 * (31 + 44 / 60 + 3.8170 / 3600) * (Math.PI / 180)) +
      (15 * e4 / 256 + 45 * e6 / 1024) *
        Math.sin(4 * (31 + 44 / 60 + 3.8170 / 3600) * (Math.PI / 180)) -
      (35 * e6 / 3072) *
        Math.sin(6 * (31 + 44 / 60 + 3.8170 / 3600) * (Math.PI / 180)));

  const x = easting - falseE;
  const M = M0 + (northing - falseN) / k0;

  const mu = M / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const e12 = e1 * e1;
  const e13 = e12 * e1;
  const e14 = e13 * e1;

  const phi1 =
    mu +
    (3 * e1 / 2 - 27 * e13 / 32) * Math.sin(2 * mu) +
    (21 * e12 / 16 - 55 * e14 / 32) * Math.sin(4 * mu) +
    (151 * e13 / 96) * Math.sin(6 * mu) +
    (1097 * e14 / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = sinPhi1 / cosPhi1;
  const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = (e2 / (1 - e2)) * cosPhi1 * cosPhi1;
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / (N1 * k0);
  const D2 = D * D;
  const D4 = D2 * D2;
  const D6 = D4 * D2;

  const lat =
    phi1 -
    ((N1 * tanPhi1) / R1) *
      (D2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * (e2 / (1 - e2))) * D4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * (e2 / (1 - e2)) - 3 * C1 * C1) * D6) / 720);

  const lng =
    lon0 +
    (D -
      ((1 + 2 * T1 + C1) * D2 * D) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * (e2 / (1 - e2)) + 24 * T1 * T1) * D4 * D) / 120) /
      cosPhi1;

  const latDeg = lat * (180 / Math.PI);
  const lngDeg = lng * (180 / Math.PI);

  // Sanity check for Israel bounds
  if (latDeg < 29 || latDeg > 34 || lngDeg < 34 || lngDeg > 36) {
    return null;
  }

  return { lat: latDeg, lng: lngDeg };
}
