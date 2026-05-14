import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEERZONE - doorverwijzing",
  alternates: { canonical: "https://weerzone.nl" },
  robots: {
    index: false,
    follow: true,
  },
};

export default function HomepageRedirect() {
  permanentRedirect("/");
}
