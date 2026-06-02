import { schemaFAQ, schemaLd } from "@/lib/schema";
import type { GeoBlock } from "@/lib/geo-blocks";

interface Props {
  block: GeoBlock;
  /** Voor FAQPage @inLanguage */
  inLanguage?: string;
  /** Locale-aware kop voor de FAQ-sectie */
  faqHeading?: string;
}

/**
 * Server-component die de citation paragraph, "bijgewerkt"-badge en FAQ inject —
 * inclusief FAQPage JSON-LD. Niet-zware UI, mikt op AI-citatie en passage-level
 * extractie door Google AIO / ChatGPT / Perplexity.
 *
 * Plaats direct na de H1 op city pages.
 */
export default function CityGeoBlock({ block, inLanguage = "nl-NL", faqHeading }: Props) {
  const heading =
    faqHeading ??
    (inLanguage.startsWith("de")
      ? "Häufig gestellte Fragen"
      : inLanguage.startsWith("fr")
        ? "Questions fréquentes"
        : inLanguage.startsWith("es")
          ? "Preguntas frecuentes"
          : "Veelgestelde vragen");

  return (
    <section className="space-y-6 my-8">
      {/* Citation paragraph — 134-167 woorden, speakable, self-contained */}
      <div className="card p-6 sm:p-8">
        <p
          className="text-sm sm:text-base text-text-secondary leading-relaxed"
          data-speakable
        >
          {block.citation}
        </p>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {block.updatedLabel}
        </p>
      </div>

      {/* FAQ — gestructureerde Q&A's, zichtbare HTML + FAQPage JSON-LD */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-lg sm:text-xl font-black text-text-primary uppercase tracking-tighter mb-5">
          {heading}
        </h2>
        <dl className="space-y-5">
          {block.faq.map((item) => (
            <div key={item.q}>
              <dt className="text-sm sm:text-base font-bold text-text-primary mb-2">
                {item.q}
              </dt>
              <dd
                className="text-sm text-text-secondary leading-relaxed"
                data-speakable
              >
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <script {...schemaLd(schemaFAQ(block.faq, inLanguage))} />
    </section>
  );
}
