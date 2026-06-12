import Link from "next/link";

export default function WzFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-black text-slate-900">
          WEERZONE
        </Link>
        <nav className="flex flex-wrap gap-4">
          <Link href="/vandaag" className="hover:text-slate-900">
            Vandaag
          </Link>
          <Link href="/morgen" className="hover:text-slate-900">
            Morgen
          </Link>
          <Link href="/mijn-weerzone" className="hover:text-slate-900">
            Mijn Weerzone
          </Link>
          <Link href="/contact" className="hover:text-slate-900">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
