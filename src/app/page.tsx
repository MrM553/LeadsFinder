import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/auth/get-session";
import { getDashboardStats } from "@/server/db/queries";
import { NavHeader } from "@/components/nav-header";
import { SearchForm } from "@/components/search-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = getDashboardStats();

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total leads" value={stats.total} />
          <StatCard label="New leads" value={stats.newCount} />
          <StatCard label="Qualified leads" value={stats.qualified} />
          <StatCard label="High-score leads (70+)" value={stats.highScore} />
        </div>

        <SearchForm />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent searches</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No searches yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.recentSearches.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span>
                      {s.industry} in {s.location}
                    </span>
                    <span className="text-muted-foreground">
                      {s.status} · {s.resultsFound} result{s.resultsFound === 1 ? "" : "s"} ·{" "}
                      {s.createdAt.toLocaleString("de-DE")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Link href="/leads" className="text-sm text-primary underline underline-offset-4">
          View all leads →
        </Link>
      </main>
    </div>
  );
}
