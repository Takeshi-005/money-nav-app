import Link from "next/link"
import { cn } from "@/shared/lib/utils"
import { serializeJsonLd } from "@/shared/lib/json-ld";

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${process.env.NEXT_PUBLIC_APP_URL}${item.href}` }),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />

      <nav aria-label="パンくずリスト" className={cn("py-3", className)}>
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-(--text-secondary) hover:text-foreground transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}

              {index < items.length - 1 && (
                <svg
                  className="w-4 h-4 text-(--text-tertiary)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
