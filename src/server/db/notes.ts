import { eq, desc } from "drizzle-orm";
import { db } from "./client";
import { notes, type Note } from "./schema";

export function listNotesForLead(leadId: number): Note[] {
  return db.select().from(notes).where(eq(notes.leadId, leadId)).orderBy(desc(notes.createdAt)).all();
}

export function addNote(leadId: number, text: string): Note {
  return db.insert(notes).values({ leadId, text }).returning().get();
}
