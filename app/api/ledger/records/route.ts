import { NextResponse } from "next/server";

import { ledgerService } from "@/lib/services/ledgerService";

export const dynamic = "force-dynamic";

export async function GET() {
  const records = await ledgerService.listRecords();
  return NextResponse.json({ data: records });
}
