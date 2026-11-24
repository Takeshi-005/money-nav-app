import Link from "next/link"
import { Typography } from "@/shared/ui/typography"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Typography variant="title_L" className="mb-2">
        404
      </Typography>
      <Typography variant="L" className="text-(--text-secondary) mb-8">
        お探しのページは見つかりませんでした
      </Typography>
      <Link
        href="/"
        className="px-6 py-3 bg-gradient-brand text-white rounded-lg inline-block hover:opacity-90 transition-opacity"
      >
        トップページへ戻る
      </Link>
    </div>
  )
}
