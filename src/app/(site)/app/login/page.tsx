import { Suspense } from "react";
import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inloggen" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
