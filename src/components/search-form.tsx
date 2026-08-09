"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CONFIRMATION_THRESHOLD, DEV_DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/search-limits";

interface SearchResult {
  leadCount: number;
  industryMatched: boolean;
}

export function SearchForm() {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState(DEV_DEFAULT_LIMIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  const needsConfirmation = limit > CONFIRMATION_THRESHOLD;

  async function runSearch(allowLarge: boolean) {
    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, location, limit, allowLarge }),
    });

    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(body.error ?? "Search failed.");
      return;
    }

    setResult({ leadCount: body.leadCount, industryMatched: body.industryMatched });
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Searching…" : "Search"}
          </Button>
        </form>
        {needsConfirmation && (
          <p className="mt-2 text-sm text-muted-foreground">
            Above {CONFIRMATION_THRESHOLD} results you&apos;ll be asked to confirm before this runs.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {result && (
          <p className="mt-2 text-sm text-muted-foreground">
            Found {result.leadCount} lead{result.leadCount === 1 ? "" : "s"}
            {!result.industryMatched && " (industry term wasn't in our tag map — used a broader name search)"}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
