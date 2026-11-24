"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface NavDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
  align?: "left" | "right";
  triggerClassName?: string;
  panelClassName?: string;
}

export function NavDropdown({
  trigger,
  children,
  label,
  align = "right",
  triggerClassName,
  panelClassName,
}: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-nav-dropdown]")) {
        setIsOpen(false);
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
  }, [isOpen]);

  return (
    <div className="relative" data-nav-dropdown>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        className={cn(
          "flex items-center transition-all duration-200",
          triggerClassName,
        )}
      >
        {trigger}
      </button>

      <div
        ref={panelRef}
        role="menu"
        aria-label={label}
        className={cn(
          "absolute top-full mt-2 min-w-48 rounded-xl border-(--border-primary) bg-surface-elevated py-1 shadow-lg transition-all duration-200 ease-out z-50",
          align === "right" ? "right-0" : "left-0",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
          panelClassName,
        )}
        onClick={() => setIsOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}
