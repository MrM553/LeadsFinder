import { NextResponse } from "next/server";
import { requireApiSession } from "@/server/auth/api-guard";
import { listDistinctIndustries } from "@/server/db/queries";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  return NextResponse.json(await listDistinctIndustries());
}
