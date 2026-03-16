import { NextRequest, NextResponse } from "next/server";
import { searchRecords } from "@/lib/ckan/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get("resource_id");

  if (!resourceId) {
    return NextResponse.json({ error: "resource_id is required" }, { status: 400 });
  }

  try {
    const result = await searchRecords({
      resource_id: resourceId,
      q: searchParams.get("q") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
      filters: searchParams.get("filters") ? JSON.parse(searchParams.get("filters")!) : undefined,
      fields: searchParams.get("fields") ? searchParams.get("fields")!.split(",") : undefined,
      sort: searchParams.get("sort") ? searchParams.get("sort")!.split(",") : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
