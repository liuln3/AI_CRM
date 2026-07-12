import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { seedIfEmpty } from "@/lib/seed";
import { getUserById } from "@/lib/queries";
import FloatingAgent from "@/components/FloatingAgent";
import Sidebar from "@/components/Sidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) redirect("/login");
  const user = getUserById(session.id);
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} userName={user.name} />
      <main className="flex-1 min-w-0">{children}</main>
      <FloatingAgent />
    </div>
  );
}
