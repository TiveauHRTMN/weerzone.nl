import type { Metadata } from "next";

import { serverEnvironment } from "@/config/env";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import type { TripPreviewRequest } from "@/domain/trips/model";
import { encodeTripPreviewRequest, parseTripPreviewSearchParams } from "@/domain/trips/preview-request";
import { buildTripPreview } from "@/features/trip-preview/build-trip-preview";
import { PreviewInvalidState } from "@/features/trip-preview/preview-invalid-state";
import { TripPreviewView } from "@/features/trip-preview/trip-preview-view";

export const metadata: Metadata = {
  title: "Jouw persoonlijke reispreview",
  description: "Een anonieme, persoonlijke preview van je living trip.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
    },
  },
};

type PreviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  let request: TripPreviewRequest;

  try {
    request = parseTripPreviewSearchParams(await searchParams);
  } catch {
    return <PreviewInvalidState />;
  }

  if (request.countryId !== dominicanRepublicPack.country.id) {
    return <PreviewInvalidState />;
  }

  let preview: ReturnType<typeof buildTripPreview>;

  try {
    preview = buildTripPreview(request, {
      countryPack: dominicanRepublicPack,
    });
  } catch {
    // Query data is untrusted. Unknown pack identifiers are an invalid preview,
    // not an operational failure worth exposing through the error boundary.
    return <PreviewInvalidState />;
  }

  const saveEnabled = Boolean(
    serverEnvironment.supabase.url && serverEnvironment.supabase.anonymousKey,
  );

  return (
    <TripPreviewView
      preview={preview}
      save={{ enabled: saveEnabled, previewQuery: encodeTripPreviewRequest(request) }}
    />
  );
}
