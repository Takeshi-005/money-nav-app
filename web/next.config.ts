import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // === Docker standalone モード ===
  output: "standalone",

  // === 外部画像の許可 ===
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },      // Google
      { hostname: "avatars.githubusercontent.com" },  // GitHub
      { hostname: "graph.facebook.com" },             // Facebook
      { hostname: "pbs.twimg.com" },                  // Twitter/X
      { hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }, // Supabase Storage
    ],
  },

  // === セキュリティ ===
  poweredByHeader: false,  // X-Powered-By ヘッダーを非表示

  // === パフォーマンス ===
  compress: true,          // gzip圧縮を有効化
  reactStrictMode: true,   // React Strict Mode

  // === 本番最適化 ===
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // === SEO: 削除済みページの 301 リダイレクト ===
  async redirects() {
    return [
      { source: "/market-insights", destination: "/news-articles", permanent: true },
      { source: "/market-insights/:date", destination: "/news-articles/:date", permanent: true },
      { source: "/qa", destination: "/glossary", permanent: true },
      { source: "/qa/:slug", destination: "/glossary", permanent: true },
      { source: "/limit-moves", destination: "/tomorrow-impact", permanent: true },
      { source: "/limit-moves/:path*", destination: "/tomorrow-impact", permanent: true },
      { source: "/stock-insights", destination: "/tomorrow-impact", permanent: true },
      { source: "/stock-insights/:path*", destination: "/tomorrow-impact", permanent: true },
      { source: "/investor-guides/:typeCode", destination: "/diagnosis/result/:typeCode", permanent: true },
      // 用語集の重複統合（#17）: nikkei-average は nikkei-225 と同一「日経平均株価」
      { source: "/glossary/nikkei-average", destination: "/glossary/nikkei-225", permanent: true },
      // 漫画ストリップ削除: 初心者向け学習コンテンツとして最も近い /quiz へ
      { source: "/comic-strips", destination: "/quiz", permanent: true },
      { source: "/comic-strips/:path*", destination: "/quiz", permanent: true },
      // 週次レビュー削除: 学習進捗の振り返りとして最も近い公開ページ /roadmap へ
      // （/dashboard はログイン必須のため Googlebot がソフト404扱いするリスクがある）
      { source: "/weekly-review", destination: "/roadmap", permanent: true },
      { source: "/weekly-review/:path*", destination: "/roadmap", permanent: true },
    ];
  },

  // === セキュリティヘッダー ===
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
