import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/server/auth/api-guard";
import { listLeads } from "@/server/db/queries";
import { LEAD_STATUSES } from "@/types/lead";

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  industry: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  sortBy: z.enum(["overallScore", "dateFound", "companyName"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) return response;

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  return NextResponse.json(await listLeads(parsed.data));
}
