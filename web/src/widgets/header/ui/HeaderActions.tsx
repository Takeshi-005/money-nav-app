"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/session";
import { ChevronDown, Refresh } from "@/shared/ui/icons";
import { Typography } from "@/shared/ui/typography";
import { MobileMenu } from "./MobileMenu";
import { NavDropdown } from "./NavDropdown";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import {
  PRIMARY_NAV_LINKS,
  SECONDARY_NAV_LINKS,
  NAVIGATION_PATHS,
} from "@/shared/config";

interface HeaderActionsProps {
  updatedAt?: string;
}

const navLinkClass =
  "hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-(--text-secondary) transition-all duration-200 hover:bg-surface-tertiary hover:text-foreground";

const menuItemClass =
  "flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground hover:bg-surface-tertiary transition-colors";

export function HeaderActions({ updatedAt }: HeaderActionsProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push(NAVIGATION_PATHS.ROOT);
      router.refresh();
    } catch (error) {
      logger.error("Logout error", {
        module: LOG_MODULES.COMPONENTS.HEADER,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <nav aria-label="メインナビゲーション" className="flex items-center gap-2">
      {updatedAt && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap bg-surface-tertiary text-(--text-secondary)">
          <Refresh size="sm" />
          <span>最終更新: {updatedAt}</span>
        </div>
      )}

      {PRIMARY_NAV_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={navLinkClass}>
          <span>{link.emoji}</span>
          {link.label}
        </Link>
      ))}

      <div className="hidden sm:block">
        <NavDropdown
          label="その他のメニュー"
          triggerClassName="gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-(--text-secondary) hover:bg-surface-tertiary hover:text-foreground"
          trigger={
            <>
              <span>もっと見る</span>
              <ChevronDown size="sm" />
            </>
          }
        >
          {SECONDARY_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              className={menuItemClass}
            >
              <span>{link.emoji}</span>
              {link.label}
            </Link>
          ))}
        </NavDropdown>
      </div>

      {user ? (
        <div className="hidden sm:block">
          <NavDropdown
            label="ユーザーメニュー"
            triggerClassName="gap-2 px-2 py-1 rounded-full hover:bg-surface-tertiary"
            trigger={
              user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="User Avatar"
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <span
                  aria-hidden
                  className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold"
                >
                  {user.displayName?.[0] ?? "U"}
                </span>
              )
            }
          >
            <Link
              href={NAVIGATION_PATHS.DASHBOARD}
              role="menuitem"
              className={menuItemClass}
            >
              <Typography variant="S">マイページ</Typography>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className={`${menuItemClass} w-full text-left cursor-pointer`}
            >
              <Typography variant="S" as="span">
                ログアウト
              </Typography>
            </button>
          </NavDropdown>
        </div>
      ) : (
        <Link
          href={NAVIGATION_PATHS.LOGIN}
          className="flex items-center gap-2 px-4 py-2 whitespace-nowrap"
        >
          <Typography variant="S">ログイン</Typography>
        </Link>
      )}

      <MobileMenu user={user} onSignOut={signOut} />
    </nav>
  );
}
