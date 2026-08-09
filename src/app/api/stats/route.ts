import { NextResponse } from "next/server";
import { requireApiSession } from "@/server/auth/api-guard";
import { getDashboardStats } from "@/server/db/queries";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) return response;

  return NextResponse.json(getDashboardStats());
}
