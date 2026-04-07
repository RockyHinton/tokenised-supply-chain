import { NextResponse } from "next/server";

import { ledgerService } from "@/lib/services/ledgerService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ledgerRecordId: string }> }
) {
  const { ledgerRecordId } = await params;
  const record = await ledgerService.getRecordById(ledgerRecordId);

  if (!record) {
    return NextResponse.json({ error: "Ledger record not found." }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}
