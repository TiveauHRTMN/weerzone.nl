import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-moss-dark text-white">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-12 lg:py-12">
        <div>
          <BrandMark inverse />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
            Caribbean Live Travel Intelligence. Eén levende reis, afgestemd op
            wat nú relevant is.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
          <Link className="hover:text-white" href="/dominicaanse-republiek">
            Dominicaanse Republiek
          </Link>
          <span>Privacy-first</span>
          <span>© {new Date().getFullYear()} TripFit</span>
        </div>
      </div>
    </footer>
  );
}
