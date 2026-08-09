import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/get-session";
import { NavHeader } from "@/components/nav-header";
import { LeadsTable } from "@/components/leads-table";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
        <LeadsTable />
      </main>
    </div>
  );
}
