import { CrossLinkSection as GenericCrossLinkSection } from "@/shared/ui/cross-link-section";

const CROSS_LINKS = [
  { href: "/quiz", label: "今日のクイズに挑戦", emoji: "📝" },
  { href: "/glossary", label: "記事に出てきた用語を調べる", emoji: "📖" },
] as const;

export function CrossLinkSection() {
  return <GenericCrossLinkSection links={[...CROSS_LINKS]} className="mt-6" />;
}
