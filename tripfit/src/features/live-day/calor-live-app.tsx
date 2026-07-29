"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import logoBlack from "@/components/brand/calor-logo-black.png";

import styles from "./calor-live-app.module.css";
import type { LiveDayData, LiveDayRecommendation } from "./live-day-data";

function FitTrace({
  recommendation,
  onSources,
}: {
  recommendation: LiveDayRecommendation;
  onSources: () => void;
}) {
  return (
    <div className={styles.fitTrace} aria-label="Waarom dit vandaag past">
      {recommendation.factors.slice(0, 4).map((factor, index) => (
        <button
          className={index === 0 ? styles.decisive : undefined}
          key={factor}
          onClick={onSources}
          title="Bekijk de gebruikte bronnen"
        >
          {factor}
        </button>
      ))}
    </div>
  );
}

function SourceDialog({
  recommendation,
  onClose,
}: {
  recommendation: LiveDayRecommendation;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <section
        aria-labelledby="source-title"
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.eyebrow}>Herkomst</p>
        <h2 id="source-title">{recommendation.title}</h2>
        {recommendation.sourceNotes.length > 0 ? (
          <ul>
            {recommendation.sourceNotes.map((source) => <li key={source}>{source}</li>)}
          </ul>
        ) : (
          <p>Calor gebruikt de gecontroleerde catalogusdata voor deze aanbeveling.</p>
        )}
        <button onClick={onClose}>Sluiten</button>
      </section>
    </div>
  );
}

export function CalorLiveApp({ data }: { data: LiveDayData }) {
  const [planBOpen, setPlanBOpen] = useState(false);
  const [sourceRecommendation, setSourceRecommendation] =
    useState<LiveDayRecommendation | null>(null);

  return (
    <main className={styles.root}>
      <header className={styles.brandBar}>
        <Link href={`/trips/${data.tripId}`} aria-label="Terug naar de reis">
          <Image src={logoBlack} alt="Calor" priority />
        </Link>
        <span>Live</span>
        <nav aria-label="Live navigatie">
          <Link aria-current="page" href={`/live?trip=${data.tripId}`}>Vandaag</Link>
          <Link href={`/trips/${data.tripId}`}>Reis</Link>
          <Link href={`/trips/${data.tripId}/album`}>Album</Link>
          <Link href="/account">Account</Link>
        </nav>
      </header>

      <article className={styles.edition}>
        <section className={styles.masthead}>
          <div className={styles.meta}>
            <p>Vandaag · dag {data.dayNumber} van {data.totalDays}</p>
            <span><i /> bijgewerkt {data.updatedLabel}</span>
          </div>
          <h1>{data.dateLabel}</h1>
          <p className={styles.sinceYesterday}>
            <strong>Sinds gisteren</strong> {data.sinceYesterday}
          </p>
        </section>

        {data.dataNotice && (
          <aside className={styles.dataNotice}>
            <strong>Datadekking</strong>
            <span>{data.dataNotice}</span>
          </aside>
        )}

        <section className={styles.livePanel}>
          <p className={styles.sunEyebrow}>Beste keuze vandaag</p>
          <h2>{data.best.title}</h2>
          <p className={styles.summary}>{data.best.summary}</p>
          <FitTrace
            recommendation={data.best}
            onSources={() => setSourceRecommendation(data.best)}
          />
          <div className={styles.panelActions}>
            <button onClick={() => setSourceRecommendation(data.best)}>Bekijk onderbouwing</button>
            <button
              aria-expanded={planBOpen}
              aria-controls="live-plan-b"
              onClick={() => setPlanBOpen((open) => !open)}
            >
              Plan B <span aria-hidden="true">{planBOpen ? "↑" : "↓"}</span>
            </button>
          </div>
          {planBOpen && (
            <div className={styles.planB} id="live-plan-b">
              <p className={styles.eyebrow}>Als omstandigheden omslaan</p>
              <h3>{data.planB.title}</h3>
              <p>{data.planB.summary}</p>
              <FitTrace
                recommendation={data.planB}
                onSources={() => setSourceRecommendation(data.planB)}
              />
            </div>
          )}
        </section>

        <section className={styles.alternatives} aria-labelledby="alternatives-title">
          <p className={styles.eyebrow}>Ook passend vandaag</p>
          <h2 id="alternatives-title">Alternatieven</h2>
          <div>
            {data.alternatives.map((alternative) => (
              <article key={alternative.id}>
                <h3>{alternative.title}</h3>
                <p>{alternative.summary}</p>
                <button onClick={() => setSourceRecommendation(alternative)}>
                  Waarom passend
                </button>
              </article>
            ))}
          </div>
        </section>

        {data.defer && (
          <section className={styles.defer}>
            <p className={styles.eyebrow}>Beter uitstellen</p>
            <h2>{data.defer.title}</h2>
            <p>{data.defer.summary}</p>
          </section>
        )}

        <section className={styles.pulse}>
          <p className={styles.sunEyebrow}>Country Pulse</p>
          <p>{data.countryPulse}</p>
        </section>

        <section className={styles.practical}>
          <p className={styles.eyebrow}>Praktisch vandaag</p>
          <h2>{data.tripTitle}</h2>
          <dl>
            {data.practical.map(({ label, value }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      {sourceRecommendation && (
        <SourceDialog
          recommendation={sourceRecommendation}
          onClose={() => setSourceRecommendation(null)}
        />
      )}
    </main>
  );
}
