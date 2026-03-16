/**
 * GET /api/city/scores
 *
 * Returns all scored cities sorted by investment score (descending).
 * Response shape: `{ cities: CityScoreRow[], totalCities: number, updatedAt: string }`.
 * Revalidates every 5 minutes.
 */

import { NextResponse } from "next/server";
import { getAllCityProfiles } from "@/lib/data/aggregator";
import type { CityScoreRow } from "@/types/city";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const profiles = await getAllCityProfiles();

    const scores: CityScoreRow[] = profiles
      .map((p) => ({
        cityName: p.cityName,
        cityCode: p.cityCode,
        district: p.district,
        population: p.population,
        investmentScore: p.investmentScore,
        scoreBreakdown: p.scoreBreakdown,
        urbanRenewalProjects: p.urbanRenewalProjects,
        constructionSites: p.constructionSites,
        mechirLaMishtakenAvgPricePerMeter: p.mechirLaMishtakenAvgPricePerMeter,
      }))
      .sort((a, b) => b.investmentScore - a.investmentScore);

    return NextResponse.json({
      cities: scores,
      totalCities: scores.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/city/scores]", error);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
