import { Suspense } from "react";
import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account aanmaken" };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupClient />
    </Suspense>
  );
}
