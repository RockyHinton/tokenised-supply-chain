import { NextResponse } from "next/server";

import { eventService } from "@/lib/services/eventService";
import { handleApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await eventService.listEvents();
  return NextResponse.json({ data: events });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await eventService.recordEvent(body);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
