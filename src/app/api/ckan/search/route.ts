import { NextRequest, NextResponse } from "next/server";
import { searchRecords } from "@/lib/ckan/client";
import { ckanSearchSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = ckanSearchSchema.safeParse({
    resource_id: searchParams.get("resource_id") ?? undefined,
    q: searchParams.get("q") || undefined,
    limit: searchParams.get("limit") || undefined,
    offset: searchParams.get("offset") || undefined,
    filters: searchParams.get("filters") || undefined,
    fields: searchParams.get("fields") || undefined,
    sort: searchParams.get("sort") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const result = await searchRecords({
      resource_id: parsed.data.resource_id,
      q: parsed.data.q,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      filters: parsed.data.filters,
      fields: parsed.data.fields,
      sort: parsed.data.sort,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/ckan/search]", error);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
