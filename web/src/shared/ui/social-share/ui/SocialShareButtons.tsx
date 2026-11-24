"use client";

import { startTransition, useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Typography } from "@/shared/ui/typography";

interface SocialShareButtonsProps {
  url: string;
  text: string;
  className?: string;
}

const PLATFORMS = [
  {
    name: "X",
    buildHref: (url: string, text: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    hoverClass: "hover:bg-black hover:text-white",
  },
  {
    name: "LINE",
    buildHref: (url: string) =>
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 10.304C24 4.596 18.624.119 12 .119S0 4.596 0 10.304c0 5.036 4.468 9.252 10.502 10.059.41.088.966.27 1.107.617.127.316.083.809.04 1.126l-.18 1.073c-.054.316-.252 1.239 1.085.675 1.338-.563 7.22-4.254 9.852-7.282C23.978 14.502 24 12.48 24 10.304" />
      </svg>
    ),
    hoverClass: "hover:bg-[#06C755] hover:text-white",
  },
  {
    name: "はてブ",
    buildHref: (url: string) =>
      `https://b.hatena.ne.jp/entry?url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zm-3.705 14.47c-.78 0-1.41.63-1.41 1.41s.63 1.414 1.41 1.414 1.41-.634 1.41-1.414-.63-1.41-1.41-1.41zm.255-11.34h-2.37v8.82h2.37V3.13zm-7.305 8.12c1.17-.39 1.95-1.52 1.95-2.82 0-1.17-.39-2.07-1.17-2.69-.78-.63-1.83-.92-3.19-.92H3.81v11.1h3.56c1.44 0 2.55-.33 3.35-1 .8-.67 1.2-1.58 1.2-2.75 0-.94-.3-1.71-.9-2.28-.28-.25-.58-.43-.93-.55l-.12-.09zm-2.77-4.27c.46 0 .84.12 1.12.36.27.24.41.58.41 1.02s-.15.78-.44 1.02c-.29.24-.67.36-1.13.36H5.62V7.01l1.32-.03zm.15 8.64H5.62v-2.88h1.48c.52 0 .92.14 1.2.43.28.29.42.68.42 1.17 0 .42-.11.75-.34 1-.23.25-.55.37-.96.37l-.03-.09z" />
      </svg>
    ),
    hoverClass: "hover:bg-[#00A4DE] hover:text-white",
  },
] as const;

export function SocialShareButtons({
  url,
  text,
  className,
}: SocialShareButtonsProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setCanNativeShare(!!navigator.share);
    });
  }, []);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: text, url });
    } catch {
      // User cancelled or API unavailable
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Typography variant="S" as="span" className="text-(--text-tertiary)">
        共有
      </Typography>
      {PLATFORMS.map((platform) => (
        <a
          key={platform.name}
          href={platform.buildHref(url, text)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${platform.name}でシェア`}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            "bg-surface-secondary text-(--text-secondary)",
            "transition-colors duration-200",
            platform.hoverClass,
          )}
        >
          {platform.icon}
        </a>
      ))}
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          aria-label="他のアプリでシェア"
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            "bg-surface-secondary text-(--text-secondary)",
            "hover:bg-surface-tertiary transition-colors duration-200",
          )}
        >
          <Share2 size={16} />
        </button>
      )}
    </div>
  );
}
