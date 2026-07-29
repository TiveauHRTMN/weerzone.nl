import Link from "next/link";

import { ChevronDownIcon } from "@/components/ui/icons";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  inverse = false,
}: {
  items: BreadcrumbItem[];
  inverse?: boolean;
}) {
  return (
    <nav aria-label="Broodkruimelpad">
      <ol
        className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold ${
          inverse ? "text-white/60" : "text-muted"
        }`}
      >
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronDownIcon
                aria-hidden="true"
                className={`size-3 -rotate-90 ${
                  inverse ? "text-white/30" : "text-line"
                }`}
              />
            ) : null}
            {item.href ? (
              <Link
                className={`rounded-sm ${inverse ? "hover:text-white" : "hover:text-ink"}`}
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className={inverse ? "text-white" : "text-ink"}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
