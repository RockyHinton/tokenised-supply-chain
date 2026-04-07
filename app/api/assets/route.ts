import { NextResponse } from "next/server";

import { assetService } from "@/lib/services/assetService";
import { handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const assets = await assetService.listAssets();
  return NextResponse.json({ data: assets });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await assetService.createAsset(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
