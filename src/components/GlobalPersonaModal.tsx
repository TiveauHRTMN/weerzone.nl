"use client";

import { useEffect, useState } from "react";
import PersonaModal from "./PersonaModal";

/**
 * Globaal gemonteerde PersonaModal die luistert naar het window-event
 * `wz:open-persona-modal`. Elke knop/component kan die dispatchen:
 *
 *   window.dispatchEvent(new CustomEvent("wz:open-persona-modal"))
 *
 * Zo hoeft geen enkele pagina zelf modal-state te beheren.
 */
export default function GlobalPersonaModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("wz:open-persona-modal", handler);
    return () => window.removeEventListener("wz:open-persona-modal", handler);
  }, []);

  return <PersonaModal open={open} onClose={() => setOpen(false)} />;
}
