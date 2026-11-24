import Link from "next/link";
import { notFound } from "next/navigation";
import { Typography } from "@/shared/ui/typography";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { DISCLOSURE_TYPE_LABELS } from "@/shared/api/gemini/disclosure-extraction";
import { DISCLOSURE_TYPE_GUIDE, splitByEnumMarkers } from "@/entities/disclosure";
import { NAVIGATION_BUILDERS, NAVIGATION_PATHS } from "@/shared/config";
import { formatDateJapanese, formatMonthDayJP } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import {
  buildBreadcrumbList,
  buildFaqPage,
  buildAuthor,
  buildPublisher,
  getBaseUrl,
} from "@/shared/lib/structured-data";
import {
  getGlossaryLinkForConcept,
  getImpactEventByDateTicker,
  getImpactStocksByDate,
} from "../lib";

const IMPACT_CONFIG = {
  positive: {
    icon: "📈",
    label: "好材料",
    textClass: "text-positive-600",
    badgeClass: "bg-positive-100 text-positive-700",
  },
  negative: {
    icon: "📉",
    label: "悪材料",
    textClass: "text-negative-600",
    badgeClass: "bg-negative-100 text-negative-700",
  },
  neutral: {
    icon: "➖",
    label: "中立",
    textClass: "text-(--text-secondary)",
    badgeClass: "bg-surface-tertiary text-(--text-secondary)",
  },
} as const;

const MAGNITUDE_LABEL = {
  large: "業績インパクト大",
  medium: "業績インパクト中",
  small: "業績インパクト小",
} as const;

const RELATED_LIMIT = 6;

interface Props {
  date: string;
  ticker: string;
}

export async function DisclosureEventPage({ date, ticker }: Props) {
  const event = await getImpactEventByDateTicker(date, ticker);

  if (!event) {
    notFound();
  }

  const [glossaryLink, dateResult] = await Promise.all([
    getGlossaryLinkForConcept(event.key_concept),
    getImpactStocksByDate(date),
  ]);

  const related = dateResult.stocks
    .filter((stock) => stock.ticker_code !== ticker)
    .slice(0, RELATED_LIMIT);

  const typeLabel = DISCLOSURE_TYPE_LABELS[event.disclosure_type];
  const guide = DISCLOSURE_TYPE_GUIDE[event.disclosure_type];
  const config = IMPACT_CONFIG[event.impact];
  const dateLabel = formatDateJapanese(date);
  const baseUrl = getBaseUrl();
  const pagePath = NAVIGATION_BUILDERS.tomorrowImpactEventDetail(date, ticker);

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${event.company_name}（${ticker}）の${typeLabel}は${config.label}？`,
    description: event.reason,
    datePublished: `${date}T07:00:00+09:00`,
    inLanguage: "ja",
    url: `${baseUrl}${pagePath}`,
    mainEntityOfPage: `${baseUrl}${pagePath}`,
    author: buildAuthor(baseUrl),
    publisher: buildPublisher(baseUrl),
    about: { "@type": "Corporation", name: event.company_name },
  };

  const breadcrumbData = buildBreadcrumbList(
    [
      { name: "ホーム", path: "/" },
      { name: "明日の好悪材料分析", path: NAVIGATION_PATHS.TOMORROW_IMPACT },
      {
        name: `${formatMonthDayJP(date)}`,
        path: NAVIGATION_BUILDERS.tomorrowImpactDetail(date),
      },
      { name: `${event.company_name}の${typeLabel}` },
    ],
    baseUrl,
  );

  const faqData = buildFaqPage([
    { question: `${typeLabel}とは？`, answer: guide.whatIs },
    { question: `${typeLabel}はなぜ株価が動きやすい？`, answer: guide.whyMoves },
    { question: "初心者が見るべき着眼点は？", answer: guide.beginnerTip },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "明日の好悪材料分析", href: NAVIGATION_PATHS.TOMORROW_IMPACT },
          {
            label: `${formatMonthDayJP(date)}`,
            href: NAVIGATION_BUILDERS.tomorrowImpactDetail(date),
          },
          { label: `${event.company_name}の${typeLabel}` },
        ]}
        className="max-w-3xl mx-auto px-4 pt-4"
      />
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
            <Typography variant="title_S" as="h1">
              {event.company_name}（{ticker}）の{typeLabel}は{config.label}？
            </Typography>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
              {typeLabel}
            </span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                config.badgeClass,
              )}
            >
              {MAGNITUDE_LABEL[event.magnitude]}
            </span>
            <span className={cn("text-sm font-bold", config.textClass)}>
              {config.icon} {config.label}
            </span>
          </div>
          <Typography variant="S" className="text-(--text-secondary)">
            {dateLabel}発表の適時開示を、AIが翌営業日の相場材料として分類・解説しています。
          </Typography>
          <Typography variant="caution" className="text-(--text-tertiary)">
            ※ AIによる分析です。投資推奨ではありません。
          </Typography>
        </header>

        <section className="p-4 rounded-xl bg-surface-secondary border border-(--border-primary) space-y-2">
          <Typography variant="S_bold" as="h2" className="text-foreground">
            なぜ{config.label}と考えられるか
          </Typography>
          <Typography variant="S" className="text-(--text-secondary) leading-relaxed">
            {event.reason}
          </Typography>
        </section>

        {event.educational_note && (
          <section className="p-4 rounded-xl bg-brand-50 border border-brand-100 space-y-2">
            <Typography variant="S_bold" as="h2" className="text-brand-700">
              💡 詳しく解説
            </Typography>
            <div className="space-y-2">
              {splitByEnumMarkers(event.educational_note).map((part, i) => (
                <Typography
                  key={i}
                  variant="S"
                  className="text-brand-700 leading-relaxed"
                >
                  {part}
                </Typography>
              ))}
            </div>
          </section>
        )}

        {event.key_concept && (
          <section className="p-4 rounded-xl bg-accent-50 border border-accent-200 space-y-1">
            <Typography variant="caution" className="text-accent-700 font-medium">
              🎯 今日学べる概念
            </Typography>
            <Typography variant="S_bold" className="text-accent-900">
              {event.key_concept}
            </Typography>
            {glossaryLink && (
              <Link
                href={NAVIGATION_BUILDERS.glossaryDetail(glossaryLink.slug)}
                className="inline-block text-brand-600 hover:text-brand-700 text-sm font-medium pt-1"
              >
                「{glossaryLink.term}」の意味を用語集で見る →
              </Link>
            )}
          </section>
        )}

        <section className="p-4 rounded-xl bg-surface-secondary border border-(--border-primary) space-y-3">
          <Typography variant="S_bold" as="h2" className="text-foreground">
            {typeLabel}とは？初心者向けにやさしく解説
          </Typography>
          <div className="space-y-1">
            <Typography variant="caution" className="text-(--text-tertiary) font-medium">
              どんな開示？
            </Typography>
            <Typography variant="S" className="text-(--text-secondary) leading-relaxed">
              {guide.whatIs}
            </Typography>
          </div>
          <div className="space-y-1">
            <Typography variant="caution" className="text-(--text-tertiary) font-medium">
              なぜ株価が動きやすい？
            </Typography>
            <Typography variant="S" className="text-(--text-secondary) leading-relaxed">
              {guide.whyMoves}
            </Typography>
          </div>
          <div className="space-y-1">
            <Typography variant="caution" className="text-(--text-tertiary) font-medium">
              初心者の着眼点
            </Typography>
            <Typography variant="S" className="text-(--text-secondary) leading-relaxed">
              {guide.beginnerTip}
            </Typography>
          </div>
        </section>

        {related.length > 0 && (
          <section className="space-y-2">
            <Typography variant="S_bold" as="h2" className="text-(--text-secondary)">
              {formatMonthDayJP(date)}の他の開示
            </Typography>
            <ul className="space-y-1">
              {related.map((stock) => (
                <li key={stock.ticker_code}>
                  <Link
                    href={NAVIGATION_BUILDERS.tomorrowImpactEventDetail(
                      date,
                      stock.ticker_code,
                    )}
                    className="text-brand-600 hover:text-brand-700 text-sm"
                  >
                    {stock.company_name}（{stock.ticker_code}）の
                    {DISCLOSURE_TYPE_LABELS[stock.disclosure_type]} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href={NAVIGATION_BUILDERS.tomorrowImpactDetail(date)}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            ← {formatMonthDayJP(date)}の好悪材料一覧へ
          </Link>
          <Link
            href={NAVIGATION_PATHS.TOMORROW_IMPACT}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            最新の好悪材料分析を見る →
          </Link>
        </div>
      </main>
    </>
  );
}
