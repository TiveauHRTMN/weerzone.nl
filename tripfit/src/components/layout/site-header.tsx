import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { ArrowUpRightIcon } from "@/components/ui/icons";

export function SiteHeader() {
  return (
    <header className="relative z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-17 w-full max-w-[90rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <BrandMark />
        <nav aria-label="Hoofdnavigatie" className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/dominicaanse-republiek"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline transition-colors hover:text-ink sm:block"
          >
            Bestemming
          </Link>
          <Link href="/#open-trip" className="quiet-button !min-h-10 !px-3 sm:!px-4">
            <span className="hidden sm:inline">Open mijn reis</span>
            <span className="sm:hidden">Open reis</span>
            <ArrowUpRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
