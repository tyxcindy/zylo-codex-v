import { NextRequest, NextResponse } from "next/server";

import { reverseLookupPlaceSummaryFree } from "@/lib/providers/nominatim";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Valid lat and lng are required." }, { status: 400 });
  }

  const focus = await reverseLookupPlaceSummaryFree(lat, lng);

  if (!focus) {
    return NextResponse.json({ focus: null }, { status: 200 });
  }

  return NextResponse.json({ focus }, { status: 200 });
}
