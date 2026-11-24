"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import type { AuthUser } from "@/entities/session";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { MAIN_NAV_LINKS, NAVIGATION_PATHS } from "@/shared/config";

interface MobileMenuProps {
  user: AuthUser | null;
  onSignOut: () => Promise<void>;
}

export function MobileMenu({ user, onSignOut }: MobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-mobile-menu]")) {
        setIsMenuOpen(false);
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Focus trap & Escキー
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !menuRef.current) {
        return;
      }

      const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await onSignOut();
      router.push(NAVIGATION_PATHS.ROOT);
      router.refresh();
    } catch (error) {
      logger.error("Logout error", {
        module: LOG_MODULES.COMPONENTS.MOBILE_MENU,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        ref={buttonRef}
        data-mobile-menu
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          "sm:hidden flex items-center justify-center w-10 h-10 rounded-lg text-(--text-secondary) transition-all duration-200",
          isMenuOpen ? "bg-surface-tertiary" : "bg-transparent",
        )}
        aria-label="メニューを開く"
        aria-expanded={isMenuOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-transform duration-200",
            isMenuOpen ? "rotate-90" : "rotate-0",
          )}
        >
          {isMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile Menu Dropdown */}
      <div
        ref={menuRef}
        data-mobile-menu
        className={cn(
          "absolute top-full left-0 right-0 sm:hidden border-t-(--border-primary) bg-surface-secondary shadow-lg transition-all duration-300 ease-in-out",
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex flex-col gap-1">
            {MAIN_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-foreground"
              >
                <span>{link.emoji}</span>
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href={NAVIGATION_PATHS.DASHBOARD}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-foreground"
                >
                  <span>👤</span>
                  マイページ
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left text-(--text-secondary)"
                >
                  <span>🚪</span>
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href={NAVIGATION_PATHS.LOGIN}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium bg-gradient-brand transition-colors"
              >
                <span>🔑</span>
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
