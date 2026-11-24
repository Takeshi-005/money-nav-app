"use client";

import Image from "next/image";

export interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "w-10 h-10", icon: "w-5 h-5" },
  md: { container: "w-16 h-16 md:w-20 md:h-20", icon: "w-8 h-8" },
  lg: { container: "w-24 h-24", icon: "w-12 h-12" },
};

const dimensionMap = {
  sm: 40,
  md: 80,
  lg: 96,
};

export function UserAvatar({
  photoURL,
  displayName,
  size = "md",
}: UserAvatarProps) {
  const { container, icon } = sizeMap[size];
  const dimension = dimensionMap[size];

  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={displayName || "ユーザーアバター"}
        width={dimension}
        height={dimension}
        className={`${container} rounded-2xl shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${container} rounded-2xl flex items-center justify-center bg-gradient-brand`}
    >
      <svg
        className={`${icon} `}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}
