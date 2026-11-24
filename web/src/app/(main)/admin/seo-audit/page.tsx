import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth/require-admin";
import { AdminSeoAuditPage } from "@/views/admin-seo-audit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO監査ダッシュボード",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireAdmin("/admin/seo-audit");
  return <AdminSeoAuditPage />;
}
