/**
 * Quiz History View - Skeleton
 * ローディング時のスケルトン表示
 */

import { Header } from "@/widgets/header";
import { SiteFooter } from "@/widgets/site-footer";

export function QuizHistorySkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-surface-secondary" />
          <div className="h-64 rounded-3xl bg-surface-secondary" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
