import { Suspense } from "react";
import ResetClient from "./ResetClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Wachtwoord vergeten",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetClient />
    </Suspense>
  );
}
