/**
 * GET /api/city/[cityCode]/neighborhood
 *
 * Returns neighborhood-level drill-down data for a specific city.
 * Includes pricing by neighborhood, renewal projects, construction sites,
 * green buildings, bus stops, bank branches, contaminated sites, and housing plans.
 *
 * @param cityCode - Numeric CBS city code (path parameter).
 * @returns {@link CityNeighborhoodData} JSON, or 400/404/500 error.
 */

import { NextResponse } from "next/server";
import { getCityProfile } from "@/lib/data/aggregator";
import { getCityNeighborhoodData } from "@/lib/data/neighborhood-aggregator";
import { cityCodeSchema } from "@/lib/validation/schemas";

export const revalidate = 300; // 5 min

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cityCode: string }> }
) {
  try {
    const { cityCode } = await params;
    const parsed = cityCodeSchema.safeParse(cityCode);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid city code" }, { status: 400 });
    }

    const code = parsed.data;
    const city = await getCityProfile(code);
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const data = await getCityNeighborhoodData(city.cityName);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/city/neighborhood]", error);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
