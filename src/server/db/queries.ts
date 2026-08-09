import { and, asc, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { getDb } from "./get-db";
import { leads, searches } from "./schema";
import type { LeadStatus } from "@/types/lead";

export interface LeadListParams {
  search?: string;
  status?: LeadStatus;
  industry?: string;
  minScore?: number;
  sortBy?: "overallScore" | "dateFound" | "companyName";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

const SORT_COLUMNS = {
  overallScore: leads.overallScore,
  dateFound: leads.dateFound,
  companyName: leads.companyName,
} as const;

export async function listLeads(params: LeadListParams) {
  const db = await getDb();
  const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
  const page = Math.max(params.page ?? 1, 1);

  const conditions = [];
  if (params.search) {
    const term = `%${params.search}%`;
    conditions.push(or(like(leads.companyName, term), like(leads.city, term), like(leads.websiteUrl, term)));
  }
  if (params.status) conditions.push(eq(leads.status, params.status));
  if (params.industry) conditions.push(eq(leads.industry, params.industry));
  if (params.minScore !== undefined) conditions.push(gte(leads.overallScore, params.minScore));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = SORT_COLUMNS[params.sortBy ?? "overallScore"];
  const orderFn = params.sortDir === "asc" ? asc : desc;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(where)
      .get(),
  ]);

  return { rows, total: totalRow?.count ?? 0, page, pageSize };
}

export async function listDistinctIndustries(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.selectDistinct({ industry: leads.industry }).from(leads).all();
  return rows.map((r) => r.industry).sort();
}

export async function getDashboardStats() {
  const db = await getDb();
  const [totalRow, newRow, qualifiedRow, highScoreRow, recentSearches] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(leads).get(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "NEW"))
      .get(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "QUALIFIED"))
      .get(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(gte(leads.overallScore, 70))
      .get(),
    db.select().from(searches).orderBy(desc(searches.createdAt)).limit(5).all(),
  ]);

  return {
    total: totalRow?.count ?? 0,
    newCount: newRow?.count ?? 0,
    qualified: qualifiedRow?.count ?? 0,
    highScore: highScoreRow?.count ?? 0,
    recentSearches,
  };
}
