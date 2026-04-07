import { NextResponse } from "next/server";

import { ledgerService } from "@/lib/services/ledgerService";
import { handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await ledgerService.submitPayload(body);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
