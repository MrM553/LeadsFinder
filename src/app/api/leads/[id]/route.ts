import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/server/auth/api-guard";
import { getLeadById, updateLeadStatus } from "@/server/db/leads";
import { LEAD_STATUSES } from "@/types/lead";
import { rateLimitOrResponse } from "@/server/rate-limit/api-rate-limit";

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});

function parseId(id: string): number | null {
  const leadId = Number(id);
  return Number.isInteger(leadId) ? leadId : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiSession();
  if (response) return response;

  const leadId = parseId((await params).id);
  if (leadId === null) return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });

  const lead = await getLeadById(leadId);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireApiSession();
  if (response) return response;

  const limited = rateLimitOrResponse(`mutate:${session.username}`, 60, 60_000);
  if (limited) return limited;

  const leadId = parseId((await params).id);
  if (leadId === null) return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const existing = await getLeadById(leadId);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(await updateLeadStatus(leadId, parsed.data.status));
}
