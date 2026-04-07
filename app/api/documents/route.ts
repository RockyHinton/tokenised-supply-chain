import { NextResponse } from "next/server";

import { documentService } from "@/lib/services/documentService";
import { handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const documents = await documentService.listDocuments();
  return NextResponse.json({ data: documents });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const document = await documentService.createDocument(body);
    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
