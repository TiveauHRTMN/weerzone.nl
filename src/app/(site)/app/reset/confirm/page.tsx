import { Suspense } from "react";
import ResetConfirmClient from "./ResetConfirmClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Nieuw wachtwoord instellen",
  robots: { index: false, follow: false },
};

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ResetConfirmClient />
    </Suspense>
  );
}
