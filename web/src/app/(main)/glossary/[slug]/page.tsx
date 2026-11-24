import type { Metadata } from "next";
import {
  findGlossaryTermBySlug,
  findGlossaryTermSlugs,
  isGlossaryNoindexed,
} from "@/entities/glossary-term";
import { GlossaryDetailPage } from "@/views/glossary";
import { GlossaryStructuredData } from "@/views/glossary/ui/GlossaryStructuredData";
import { notFound } from "next/navigation";
import { BRAND } from "@/shared/config";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await findGlossaryTermSlugs();
  return slugs.map((term) => ({ slug: term.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = await findGlossaryTermBySlug(slug);

  if (!term) {
    return { title: "用語が見つかりません" };
  }

  const title = `${term.term}とは？初心者向けにわかりやすく解説`;
  const description = `${term.definition} ${term.explanation.slice(0, 100)}...`;

  return {
    title,
    description,
    keywords: [
      `${term.term} とは`,
      `${term.term} 意味`,
      `${term.term} わかりやすく`,
      "投資用語",
      "株式投資 基礎",
    ],
    openGraph: {
      title,
      description,
      type: "article",
      locale: "ja_JP",
      url: `/glossary/${slug}`,
      siteName: BRAND.NAME,
    },
    twitter: { card: "summary" },
    alternates: { canonical: `/glossary/${slug}` },
    robots: { index: !isGlossaryNoindexed(slug), follow: true },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const term = await findGlossaryTermBySlug(slug);

  if (!term) {
    notFound();
  }

  return (
    <>
      <GlossaryStructuredData term={term} />
      <GlossaryDetailPage term={term} />
    </>
  );
}
