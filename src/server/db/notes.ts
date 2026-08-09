import { eq, desc } from "drizzle-orm";
import { getDb } from "./get-db";
import { notes, type Note } from "./schema";

export async function listNotesForLead(leadId: number): Promise<Note[]> {
  const db = await getDb();
  return db.select().from(notes).where(eq(notes.leadId, leadId)).orderBy(desc(notes.createdAt)).all();
}

export async function addNote(leadId: number, text: string): Promise<Note> {
  const db = await getDb();
  return db.insert(notes).values({ leadId, text }).returning().get();
}
