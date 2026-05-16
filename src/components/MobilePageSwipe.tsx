"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const SWIPE_ROUTES = [
  "/",
  "/mijnweer",
  "/waarschuwingen",
  "/prijzen",
  "/over",
  "/contact",
];

const SWIPE_THRESHOLD = 60;
const MAX_VERTICAL_DRIFT = 80;
const MAX_SWIPE_DURATION_MS = 900;
const MOBILE_MAX_WIDTH = 640;

export default function MobilePageSwipe() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`).matches) return;

    const currentIdx = SWIPE_ROUTES.indexOf(pathname);
    if (currentIdx === -1) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let activePointerId: number | null = null;

    function isInteractive(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return !!el.closest(
        'input, textarea, select, button, a, [role="button"], [role="slider"], [contenteditable="true"], [data-no-swipe]',
      );
    }

    function onPointerDown(e: PointerEvent) {
      // Alleen touch — muis/pen niet als swipe interpreteren
      if (e.pointerType !== "touch") return;
      if (isInteractive(e.target)) {
        activePointerId = null;
        return;
      }
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startT = Date.now();
    }

    function onPointerUp(e: PointerEvent) {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      activePointerId = null;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = Date.now() - startT;

      // Snelle, dominant-horizontale flick: page-swipe.
      // Trage of verticaal-gemixte beweging: laat de browser scrollen.
      if (dt > MAX_SWIPE_DURATION_MS) return;
      if (Math.abs(dy) > MAX_VERTICAL_DRIFT) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.6) return;

      if (dx < 0 && currentIdx < SWIPE_ROUTES.length - 1) {
        router.push(SWIPE_ROUTES[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        router.push(SWIPE_ROUTES[currentIdx - 1]);
      }
    }

    function onPointerCancel(e: PointerEvent) {
      if (e.pointerId === activePointerId) activePointerId = null;
    }

    // PointerEvents zijn cross-browser/cross-input robuuster dan TouchEvents
    // op Android Chrome. Allebei passive: true zodat we scroll niet kunnen
    // blokkeren. Op document (niet window) voor betere bubbling-coverage.
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", onPointerCancel, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [pathname, router]);

  return null;
}
