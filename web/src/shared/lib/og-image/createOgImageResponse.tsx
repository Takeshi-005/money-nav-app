import { ImageResponse } from "next/og";
import { BRAND } from "@/shared/config";

export const OG_SIZE = { width: 1200, height: 630 };

interface OgImageOptions {
  title: string;
  subtitle?: string;
  badge?: string;
  footer?: string;
}

let fontCache: ArrayBuffer | null = null;

async function loadNotoSansJPBold(): Promise<ArrayBuffer> {
  if (fontCache) {
    return fontCache;
  }

  const cssResponse = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    },
  );
  const css = await cssResponse.text();
  const match = css.match(/src: url\((.+?)\)/);
  const url = match?.[1];
  if (!url) {
    throw new Error("Could not extract Noto Sans JP font URL");
  }

  const fontResponse = await fetch(url);
  fontCache = await fontResponse.arrayBuffer();
  return fontCache;
}

export async function createOgImageResponse({
  title,
  subtitle,
  badge,
  footer,
}: OgImageOptions): Promise<ImageResponse> {
  const font = await loadNotoSansJPBold();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 64px",
        background: "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
        fontFamily: '"Noto Sans JP"',
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {badge && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 24px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.15)",
              fontSize: "22px",
              letterSpacing: "0.05em",
            }}
          >
            {badge}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 30 ? "42px" : "54px",
            fontWeight: 700,
            lineHeight: 1.35,
            maxWidth: "1000px",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              opacity: 0.85,
              maxWidth: "800px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.25)",
          paddingTop: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {BRAND.NAME}
        </div>
        {footer && (
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              opacity: 0.75,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "Noto Sans JP",
          data: font,
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  );
}
