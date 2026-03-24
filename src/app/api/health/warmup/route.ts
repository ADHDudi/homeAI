import { NextResponse } from "next/server";
import { getAllCityProfiles } from "@/lib/data/aggregator";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const profiles = await getAllCityProfiles();
    const elapsed = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      cities: profiles.length,
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error("[warmup]", error);
    return NextResponse.json(
      { status: "error", elapsedMs: elapsed, message: "Warmup failed" },
      { status: 500 },
    );
  }
}
