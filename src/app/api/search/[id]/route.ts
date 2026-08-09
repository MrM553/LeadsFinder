import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/server/auth/api-guard";
import { getDb } from "@/server/db/get-db";
import { searches } from "@/server/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiSession();
  if (response) return response;

  const searchId = Number((await params).id);
  if (!Number.isInteger(searchId)) {
    return NextResponse.json({ error: "Invalid search id." }, { status: 400 });
  }

  const db = await getDb();
  const search = await db.select().from(searches).where(eq(searches.id, searchId)).get();
  if (!search) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(search);
}
