import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/server/auth/api-guard";
import { getLeadById } from "@/server/db/leads";
import { listNotesForLead, addNote } from "@/server/db/notes";

const postSchema = z.object({ text: z.string().min(1).max(5000) });

function parseId(id: string): number | null {
  const leadId = Number(id);
  return Number.isInteger(leadId) ? leadId : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiSession();
  if (response) return response;

  const leadId = parseId((await params).id);
  if (leadId === null) return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });

  return NextResponse.json(listNotesForLead(leadId));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiSession();
  if (response) return response;

  const leadId = parseId((await params).id);
  if (leadId === null) return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });

  const existing = getLeadById(leadId);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  return NextResponse.json(addNote(leadId, parsed.data.text), { status: 201 });
}
