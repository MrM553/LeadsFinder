import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/auth/get-session";
import { getLeadById } from "@/server/db/leads";
import { NavHeader } from "@/components/nav-header";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { ScoreBadge } from "@/components/score-badge";
import { NotesPanel } from "@/components/notes-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function BoolBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value === null) return <Badge variant="outline">{label}: unknown</Badge>;
  return (
    <Badge
      variant="outline"
      className={value ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400" : "border-red-600/30 text-red-700 dark:text-red-400"}
    >
      {label}: {value ? "yes" : "no"}
    </Badge>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) notFound();

  const lead = await getLeadById(leadId);
  if (!lead) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4">
        <div>
          <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
            ← Back to leads
          </Link>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{lead.companyName}</h1>
            <p className="text-sm text-muted-foreground">
              {lead.industry} · {lead.city ?? "unknown city"}
              {lead.region ? `, ${lead.region}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={lead.overallScore} />
            <LeadStatusSelect leadId={lead.id} status={lead.status} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field
                label="Website"
                value={
                  lead.websiteUrl ? (
                    <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                      {lead.websiteUrl}
                    </a>
                  ) : null
                }
              />
              <Field label="Phone" value={lead.phone} />
              <Field label="Email" value={lead.email} />
              <Field label="Country" value={lead.country} />
              <Field
                label="Source"
                value={
                  lead.sourceUrl ? (
                    <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                      OpenStreetMap
                    </a>
                  ) : null
                }
              />
              <Field label="Date found" value={lead.dateFound.toLocaleString("de-DE")} />
              <Field label="Last checked" value={lead.lastChecked?.toLocaleString("de-DE") ?? "Not yet analyzed"} />
              <Field label="Website status" value={lead.websiteStatus} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Website signals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <BoolBadge value={lead.httpsStatus} label="HTTPS" />
            <BoolBadge value={lead.mobileIndicator} label="Mobile-friendly" />
            <BoolBadge value={lead.contactFormDetected} label="Contact form" />
            <BoolBadge value={lead.ctaDetected} label="CTA" />
            <BoolBadge value={lead.phoneDetected} label="Phone detected" />
            <BoolBadge value={lead.emailDetected} label="Email detected" />
            <BoolBadge value={lead.hasTitle} label="Page title" />
            <BoolBadge value={lead.hasMetaDescription} label="Meta description" />
            {lead.responseTimeMs !== null && <Badge variant="outline">Response time: {lead.responseTimeMs}ms</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Score breakdown — {lead.overallScore ?? "—"}/100 (technical {lead.technicalScore ?? "—"}, performance{" "}
              {lead.performanceScore ?? "—"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lead.scoreReasons && lead.scoreReasons.length > 0 ? (
              <ul className="flex flex-col gap-1 text-sm">
                {lead.scoreReasons.map((reason, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{reason.label}</span>
                    <span className={reason.points > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
                      {reason.points > 0 ? `+${reason.points}` : "0"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not scored yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <NotesPanel leadId={lead.id} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
