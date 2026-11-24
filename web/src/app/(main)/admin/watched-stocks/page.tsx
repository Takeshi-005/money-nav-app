import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth/require-admin";
import { AdminWatchedStocksPage } from "@/views/admin-watched-stocks";

export const metadata: Metadata = {
  title: "注目銘柄管理",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireAdmin("/admin/watched-stocks");
  return <AdminWatchedStocksPage />;
}
