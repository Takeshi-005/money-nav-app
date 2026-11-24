import { createAdminClient } from "@/shared/api/supabase/admin";
import { fetchPageAuditList } from "@/shared/api/seo/page-audit";
import { AdminSeoAuditPageClient } from "./AdminSeoAuditPageClient";

export async function AdminSeoAuditPage() {
  const supabase = createAdminClient();
  const initialRows = await fetchPageAuditList(supabase);
  return <AdminSeoAuditPageClient initialRows={initialRows} />;
}
