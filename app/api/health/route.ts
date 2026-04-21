import { NextResponse } from "next/server";
import { getProviderStatus } from "@/lib/provider-status";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "zylo",
    timestamp: new Date().toISOString(),
    providers: getProviderStatus()
  });
}
