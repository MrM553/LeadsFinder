import { and, asc, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { db } from "./client";
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

export function listLeads(params: LeadListParams) {
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

  const rows = db
    .select()
    .from(leads)
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();

  const totalRow = db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(where)
    .get();

  return { rows, total: totalRow?.count ?? 0, page, pageSize };
}

export function listDistinctIndustries(): string[] {
  const rows = db.selectDistinct({ industry: leads.industry }).from(leads).all();
  return rows.map((r) => r.industry).sort();
}

export function getDashboardStats() {
  const total = db.select({ count: sql<number>`count(*)` }).from(leads).get()?.count ?? 0;
  const newCount =
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "NEW"))
      .get()?.count ?? 0;
  const qualified =
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.status, "QUALIFIED"))
      .get()?.count ?? 0;
  const highScore =
    db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(gte(leads.overallScore, 70))
      .get()?.count ?? 0;
  const recentSearches = db.select().from(searches).orderBy(desc(searches.createdAt)).limit(5).all();

  return { total, newCount, qualified, highScore, recentSearches };
}
