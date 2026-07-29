"use client";

import { useActionState } from "react";

import { saveTripFromPreview, type SaveTripState } from "@/app/preview/actions";

export function SaveTripButton({ previewQuery }: { previewQuery: string }) {
  const [state, action, pending] = useActionState<SaveTripState, FormData>(saveTripFromPreview, undefined);

  return (
    <form action={action} className="flex flex-col items-start gap-3 lg:items-end">
      <input type="hidden" name="previewQuery" value={previewQuery} />
      <button className="primary-button lg:min-w-60" disabled={pending} type="submit">
        {pending ? "Opslaan…" : "Maak account & bewaar"}
      </button>
      {state?.error ? (
        <p className="text-sm text-[#ff8a7a]" role="alert">{state.error}</p>
      ) : null}
    </form>
  );
}
