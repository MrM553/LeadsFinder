"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { NavHeader } from "@/components/nav-header";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { ScoreBadge } from "@/components/score-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";

interface ApiLead {
  id: number;
  companyName: string;
  industry: string;
  city: string | null;
  websiteUrl: string | null;
  sourceUrl: string | null;
  overallScore: number | null;
  status: LeadStatus;
  dateFound: string;
}

interface LeadsResponse {
  rows: ApiLead[];
  total: number;
  page: number;
  pageSize: number;
}

const ALL = "__all__";

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [sortBy, setSortBy] = useState<"overallScore" | "dateFound" | "companyName">("overallScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const { data: industries } = useQuery<string[]>({
    queryKey: ["industries"],
    queryFn: async () => {
      const res = await fetch("/api/industries");
      if (!res.ok) throw new Error("Failed to load industries.");
      return res.json();
    },
  });
  const [industry, setIndustry] = useState<string>(ALL);

  const { data, isLoading, isError } = useQuery<LeadsResponse>({
    queryKey: ["leads", { search, status, industry, sortBy, sortDir, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ sortBy, sortDir, page: String(page), pageSize: "25" });
      if (search) params.set("search", search);
      if (status !== ALL) params.set("status", status);
      if (industry !== ALL) params.set("industry", industry);
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load leads.");
      return res.json();
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="Search company, city, website…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              if (v === null) return;
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue>{status === ALL ? "All statuses" : status.replace("_", " ")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={industry}
            onValueChange={(v) => {
              if (v === null) return;
              setIndustry(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue>{industry === ALL ? "All industries" : industry}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All industries</SelectItem>
              {(industries ?? []).map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {sortBy === "overallScore" ? "Score" : sortBy === "dateFound" ? "Date found" : "Company name"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overallScore">Score</SelectItem>
              <SelectItem value="dateFound">Date found</SelectItem>
              <SelectItem value="companyName">Company name</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            {sortDir === "asc" ? "Ascending" : "Descending"}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date found</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-destructive">
                    Failed to load leads.
                  </TableCell>
                </TableRow>
              )}
              {data?.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No leads match these filters.
                  </TableCell>
                </TableRow>
              )}
              {data?.rows.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="font-medium underline-offset-4 hover:underline">
                      {lead.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>{lead.industry}</TableCell>
                  <TableCell>{lead.city ?? "—"}</TableCell>
                  <TableCell>
                    {lead.websiteUrl ? (
                      <a
                        href={lead.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Visit
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={lead.overallScore} />
                  </TableCell>
                  <TableCell>
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.dateFound).toLocaleDateString("de-DE")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data && data.total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.total} lead{data.total === 1 ? "" : "s"} · page {data.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
