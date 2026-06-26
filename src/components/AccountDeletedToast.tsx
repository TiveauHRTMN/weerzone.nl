"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AccountDeletedToast() {
  const params = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("deleted") === "1") {
      setShow(true);
      // Param uit de URL halen zodat een refresh de toast niet herhaalt.
      const url = new URL(window.location.href);
      url.searchParams.delete("deleted");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
  }, [params]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[var(--ink-900)] px-5 py-3 text-sm font-bold text-white shadow-lg"
    >
      Je account is verwijderd. Jammer dat je gaat — tot ziens.
    </div>
  );
}
