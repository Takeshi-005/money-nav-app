import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth/require-admin";
import { AdminDisclosuresPage } from "@/views/admin-disclosures";

export const metadata: Metadata = {
  title: "適時開示記事の取り込み",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireAdmin("/admin/disclosures");
  return <AdminDisclosuresPage />;
}
