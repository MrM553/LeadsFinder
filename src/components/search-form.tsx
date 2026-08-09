"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CONFIRMATION_THRESHOLD, DEV_DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/search-limits";

interface SearchProgress {
  id: number;
  status: string;
  resultsFound: number;
  resultsProcessed: number;
  resultsFailed: number;
  industry: string;
  location: string;
}

export function SearchForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState(DEV_DEFAULT_LIMIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSearchId, setActiveSearchId] = useState<number | null>(null);
  const [areaExpanded, setAreaExpanded] = useState(false);

  const needsConfirmation = limit > CONFIRMATION_THRESHOLD;

  const { data: progress } = useQuery<SearchProgress>({
    queryKey: ["search-progress", activeSearchId],
    queryFn: async () => {
      const res = await fetch(`/api/search/${activeSearchId}`);
      if (!res.ok) throw new Error("Failed to load search progress.");
      return res.json();
    },
    enabled: activeSearchId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000;
      const done = data.resultsFound === 0 || data.resultsProcessed >= data.resultsFound;
      if (done) {
        router.refresh();
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        return false;
      }
      return 1000;
    },
  });

  async function runSearch(allowLarge: boolean) {
    setSubmitting(true);
    setError(null);
    setActiveSearchId(null);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, location, limit, allowLarge }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      search?: { id: number };
      areaExpanded?: boolean;
    };
    setSubmitting(false);

    if (!res.ok) {
      setError(body.error ?? "Search failed.");
      return;
    }

    setAreaExpanded(Boolean(body.areaExpanded));
    if (body.search) setActiveSearchId(body.search.id);
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsConfirmation) {
      const ok = window.confirm(
        `You're about to search for ${limit} leads (above the ${CONFIRMATION_THRESHOLD}-result dev default). ` +
          `This will make more requests to the free discovery/analysis services. Continue?`
      );
      if (!ok) return;
      void runSearch(true);
      return;
    }
    void runSearch(false);
  }

  const isProcessing = progress && progress.resultsProcessed < progress.resultsFound;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find leads</CardTitle>
        <CardDescription>Search for German businesses by industry and location.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="Dachdecker"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Rosenheim"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limit">Results</Label>
            <Input
              id="limit"
              type="number"
              min={1}
              max={MAX_LIMIT}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-24"
            />
          </div>
          <Button type="submit" disabled={submitting || Boolean(isProcessing)}>
            {submitting ? "Searching…" : "Search"}
          </Button>
        </form>
        {needsConfirmation && (
          <p className="mt-2 text-sm text-muted-foreground">
            Above {CONFIRMATION_THRESHOLD} results you&apos;ll be asked to confirm before this runs.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {progress && (
          <p className="mt-2 text-sm text-muted-foreground">
            {isProcessing
              ? `Found ${progress.resultsFound} leads — analyzing ${progress.resultsProcessed}/${progress.resultsFound}…`
              : progress.resultsFound === 0
                ? "No leads found for this search, even after widening the search area. This industry/location combination may just not be well-covered in OpenStreetMap."
                : `Done — analyzed ${progress.resultsProcessed}/${progress.resultsFound} lead${progress.resultsFound === 1 ? "" : "s"}` +
                  (progress.resultsFailed > 0 ? ` (${progress.resultsFailed} failed)` : "") +
                  "."}
            {areaExpanded && progress.resultsFound > 0 && (
              <span> The initial area had no results, so this widened the search radius automatically.</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
