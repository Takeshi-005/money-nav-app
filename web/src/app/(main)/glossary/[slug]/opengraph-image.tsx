import { findGlossaryTermBySlug } from "@/entities/glossary-term";
import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";

export const runtime = "nodejs";
export const alt = "投資用語辞典";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = await findGlossaryTermBySlug(slug);

  if (!term) {
    return createOgImageResponse({ title: "投資用語辞典" });
  }

  return createOgImageResponse({
    title: `${term.term}とは？`,
    badge: "投資用語辞典",
    subtitle: term.definition.slice(0, 100),
  });
}
