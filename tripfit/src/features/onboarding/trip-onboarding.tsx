"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  InfoIcon,
  MapPinIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { InterestId } from "@/domain/trips/interests";
import {
  encodeTripPreviewRequest,
  tripPreviewRequestSchema,
} from "@/domain/trips/preview-request";

export type OnboardingRegionOption = {
  id: string;
  slug: string;
  name: string;
  coverageLevel: "FLAGSHIP" | "STANDARD" | "BASIC";
  descriptor?: string;
};

export type OnboardingInterestOption = {
  value: InterestId;
  label: string;
};

type RouteStopDraft = {
  key: string;
  regionId: string;
  arrivalDate: string;
  departureDate: string;
};

type TripOnboardingProps = {
  country: {
    id: string;
    name: string;
  };
  regions: OnboardingRegionOption[];
  interests: OnboardingInterestOption[];
};

type FieldErrors = Record<string, string>;

const STEP_LABELS = ["Reis", "Gezelschap", "Interesses", "Route"] as const;

const COVERAGE_LABELS: Record<OnboardingRegionOption["coverageLevel"], string> = {
  FLAGSHIP: "TripFit flagship",
  STANDARD: "Ruime dekking",
  BASIC: "Basisdekking",
};

function isoDateToUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function differenceInDays(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.round((isoDateToUtc(end) - isoDateToUtc(start)) / 86_400_000);
}

function addDays(date: string, amount: number) {
  const next = new Date(isoDateToUtc(date) + amount * 86_400_000);
  return next.toISOString().slice(0, 10);
}

function createStop(
  index: number,
  regionId: string,
  arrivalDate: string,
  departureDate: string,
): RouteStopDraft {
  return {
    key: `stop-${index}-${regionId || "new"}-${arrivalDate || "date"}`,
    regionId,
    arrivalDate,
    departureDate,
  };
}

export function TripOnboarding({
  country,
  regions,
  interests: interestOptions,
}: TripOnboardingProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [regionId, setRegionId] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<InterestId[]>([]);
  const [stops, setStops] = useState<RouteStopDraft[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === regionId),
    [regionId, regions],
  );

  const tripNights = differenceInDays(arrivalDate, departureDate);

  function validateStep(currentStep: number) {
    const nextErrors: FieldErrors = {};

    if (currentStep === 1) {
      if (!regionId) nextErrors.regionId = "Kies je eerste regio of verblijfplaats.";
      if (!arrivalDate) nextErrors.arrivalDate = "Kies je aankomstdatum.";
      if (!departureDate) nextErrors.departureDate = "Kies je vertrekdatum.";
      if (arrivalDate && departureDate && tripNights < 1) {
        nextErrors.departureDate = "Je vertrekdatum moet na je aankomstdatum liggen.";
      }
    }

    if (currentStep === 2) {
      if (adults < 1) nextErrors.adults = "Minimaal één volwassene is nodig.";
      childAges.forEach((age, index) => {
        if (!Number.isInteger(age) || age < 0 || age > 17) {
          nextErrors[`childAge-${index}`] = "Kies een leeftijd van 0 t/m 17 jaar.";
        }
      });
    }

    if (currentStep === 3 && selectedInterests.length === 0) {
      nextErrors.interests = "Kies minimaal één interesse voor een persoonlijke preview.";
    }

    if (currentStep === 4) {
      if (stops.length === 0) nextErrors.stops = "Voeg minimaal één stop toe.";
      stops.forEach((stop, index) => {
        if (!stop.regionId) {
          nextErrors[`stop-${index}-region`] = "Kies een regio.";
        }
        if (!stop.arrivalDate || !stop.departureDate) {
          nextErrors[`stop-${index}-dates`] = "Vul de data voor deze stop in.";
        } else if (differenceInDays(stop.arrivalDate, stop.departureDate) < 1) {
          nextErrors[`stop-${index}-dates`] = "Een stop duurt minimaal één nacht.";
        } else if (
          stop.arrivalDate < arrivalDate ||
          stop.departureDate > departureDate
        ) {
          nextErrors[`stop-${index}-dates`] = "Deze stop moet binnen je reisdata vallen.";
        }

        const previous = stops[index - 1];
        if (previous && stop.arrivalDate < previous.departureDate) {
          nextErrors[`stop-${index}-dates`] = "Stops mogen niet overlappen.";
        } else if (previous && stop.arrivalDate > previous.departureDate) {
          nextErrors[`stop-${index}-dates`] = "Laat opeenvolgende stops op elkaar aansluiten.";
        }
      });

      if (
        stops.length > 0 &&
        (stops[0].arrivalDate !== arrivalDate ||
          stops.at(-1)?.departureDate !== departureDate)
      ) {
        nextErrors.stops = "Laat je route aansluiten op de aankomst- en vertrekdatum.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function initializeRoute() {
    if (stops.length === 0) {
      setStops([createStop(0, regionId, arrivalDate, departureDate)]);
      return;
    }

    if (stops.length === 1) {
      setStops([
        {
          ...stops[0],
          regionId,
          arrivalDate,
          departureDate,
        },
      ]);
    }
  }

  function goToNextStep() {
    if (!validateStep(step)) return;
    if (step === 3) initializeRoute();
    setStep((current) => Math.min(current + 1, 4));
    setErrors({});
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 1));
    setErrors({});
  }

  function updateChildCount(nextCount: number) {
    setChildAges((current) => {
      if (nextCount <= current.length) return current.slice(0, nextCount);
      return [
        ...current,
        ...Array.from({ length: nextCount - current.length }, () => 7),
      ];
    });
  }

  function toggleInterest(value: InterestId) {
    setSelectedInterests((current) =>
      current.includes(value)
        ? current.filter((interest) => interest !== value)
        : [...current, value],
    );
    setErrors((current) => ({ ...current, interests: "" }));
  }

  function updateStop(index: number, patch: Partial<RouteStopDraft>) {
    setStops((current) =>
      current.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, ...patch } : stop,
      ),
    );
  }

  function addStop() {
    const lastStop = stops.at(-1);
    if (!lastStop) {
      setStops([createStop(0, regionId, arrivalDate, departureDate)]);
      return;
    }

    const availableRegion = regions.find(
      (region) => !stops.some((stop) => stop.regionId === region.id),
    );
    const lastDuration = differenceInDays(
      lastStop.arrivalDate,
      lastStop.departureDate,
    );
    if (lastDuration < 2) {
      setErrors({
        stops: "Voor een extra verblijfslocatie zijn minimaal twee nachten nodig.",
      });
      return;
    }

    const splitDate = addDays(
      lastStop.departureDate,
      -Math.max(1, Math.floor(lastDuration / 2)),
    );

    setStops((current) => [
      ...current.slice(0, -1),
      { ...lastStop, departureDate: splitDate },
      createStop(
        current.length,
        availableRegion?.id ?? "",
        splitDate,
        lastStop.departureDate,
      ),
    ]);
    setErrors({});
  }

  function removeStop(index: number) {
    setStops((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((_, stopIndex) => stopIndex !== index);

      if (index === 0) {
        next[0] = { ...next[0], arrivalDate };
      } else if (index >= current.length - 1) {
        next[next.length - 1] = { ...next[next.length - 1], departureDate };
      } else {
        next[index] = {
          ...next[index],
          arrivalDate: next[index - 1].departureDate,
        };
      }

      return next;
    });
    setErrors({});
  }

  function submitPreview() {
    if (!validateStep(4)) return;

    const parsedRequest = tripPreviewRequestSchema.safeParse({
      countryId: country.id,
      arrivalDate,
      departureDate,
      travelers: { adults, childAges },
      interests: selectedInterests,
      stops: stops.map((stop) => ({
        regionId: stop.regionId,
        arrivalDate: stop.arrivalDate,
        departureDate: stop.departureDate,
      })),
    });

    if (!parsedRequest.success) {
      setErrors({
        stops:
          parsedRequest.error.issues[0]?.message ??
          "Controleer je route en probeer het opnieuw.",
      });
      return;
    }

    const search = encodeTripPreviewRequest(parsedRequest.data);

    startTransition(() => {
      router.push(`/preview?${search.toString()}`);
    });
  }

  return (
    <section
      id="open-trip"
      className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-line/80 bg-paper shadow-[var(--shadow-soft)]"
      aria-labelledby="onboarding-title"
    >
      <div className="border-b border-line/75 bg-white/55 px-5 pb-5 pt-6 sm:px-7 sm:pt-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-clay">
              Open je living trip
            </p>
            <h2
              id="onboarding-title"
              className="mt-2 text-xl font-[760] tracking-[-0.035em] text-ink sm:text-2xl"
            >
              {STEP_LABELS[step - 1]}
            </h2>
          </div>
          <span className="rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-muted">
            {step} / 4
          </span>
        </div>

        <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Voortgang">
          {STEP_LABELS.map((label, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < step;
            const isCurrent = stepNumber === step;
            return (
              <li key={label} aria-current={isCurrent ? "step" : undefined}>
                <div
                  className={`h-1.5 overflow-hidden rounded-full ${
                    stepNumber <= step ? "bg-moss-dark" : "bg-line"
                  }`}
                />
                <span
                  className={`mt-2 hidden text-[0.68rem] font-semibold sm:block ${
                    isCurrent ? "text-ink" : "text-muted"
                  }`}
                >
                  {isComplete ? <span className="sr-only">Voltooid: </span> : null}
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 4) goToNextStep();
          else submitPreview();
        }}
      >
        <div className="min-h-[24rem] px-5 py-6 sm:px-7 sm:py-7">
          {step === 1 ? (
            <fieldset>
              <legend className="sr-only">Bestemming en reisdata</legend>
              <p className="mb-6 max-w-lg text-sm leading-6 text-muted">
                Begin met waar en wanneer. We tonen alleen informatie die bij
                deze reisperiode past.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="country">
                    Land
                  </label>
                  <select
                    id="country"
                    className="field-control"
                    value={country.id}
                    disabled
                    aria-describedby="country-note"
                  >
                    <option value={country.id}>{country.name}</option>
                  </select>
                  <p id="country-note" className="mt-2 text-xs leading-5 text-muted">
                    De Dominicaanse Republiek is het eerste volledige TripFit country pack.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="region">
                    Regio of verblijfplaats
                  </label>
                  <select
                    id="region"
                    className="field-control"
                    value={regionId}
                    onChange={(event) => {
                      setRegionId(event.target.value);
                      setErrors((current) => ({ ...current, regionId: "" }));
                    }}
                    aria-invalid={Boolean(errors.regionId)}
                    aria-describedby={errors.regionId ? "region-error" : "region-note"}
                  >
                    <option value="">Kies je eerste regio</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {errors.regionId ? (
                    <p id="region-error" className="field-error" role="alert">
                      {errors.regionId}
                    </p>
                  ) : (
                    <p id="region-note" className="mt-2 text-xs leading-5 text-muted">
                      {selectedRegion
                        ? `${COVERAGE_LABELS[selectedRegion.coverageLevel]}${
                            selectedRegion.descriptor
                              ? ` · ${selectedRegion.descriptor}`
                              : ""
                          }`
                        : "Je kunt in stap 4 meerdere regio’s toevoegen."}
                    </p>
                  )}
                </div>

                <div>
                  <label className="field-label" htmlFor="arrival-date">
                    Aankomstdatum
                  </label>
                  <div className="relative">
                    <CalendarIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                      id="arrival-date"
                      type="date"
                      className="field-control !pl-10"
                      value={arrivalDate}
                      max={departureDate || undefined}
                      onChange={(event) => {
                        setArrivalDate(event.target.value);
                        setErrors((current) => ({ ...current, arrivalDate: "" }));
                      }}
                      aria-invalid={Boolean(errors.arrivalDate)}
                      aria-describedby={errors.arrivalDate ? "arrival-error" : undefined}
                    />
                  </div>
                  {errors.arrivalDate ? (
                    <p id="arrival-error" className="field-error" role="alert">
                      {errors.arrivalDate}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="departure-date">
                    Vertrekdatum
                  </label>
                  <div className="relative">
                    <CalendarIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                      id="departure-date"
                      type="date"
                      className="field-control !pl-10"
                      value={departureDate}
                      min={arrivalDate || undefined}
                      onChange={(event) => {
                        setDepartureDate(event.target.value);
                        setErrors((current) => ({ ...current, departureDate: "" }));
                      }}
                      aria-invalid={Boolean(errors.departureDate)}
                      aria-describedby={errors.departureDate ? "departure-error" : undefined}
                    />
                  </div>
                  {errors.departureDate ? (
                    <p id="departure-error" className="field-error" role="alert">
                      {errors.departureDate}
                    </p>
                  ) : tripNights > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-moss">
                      {tripNights} {tripNights === 1 ? "nacht" : "nachten"}
                    </p>
                  ) : null}
                </div>
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset>
              <legend className="sr-only">Gezelschap</legend>
              <p className="mb-6 max-w-lg text-sm leading-6 text-muted">
                Leeftijd bepaalt onder meer tempo, veiligheid en familiegeschiktheid.
                We vragen geen namen.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="adult-count">
                    Volwassenen
                  </label>
                  <div className="relative">
                    <UsersIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <select
                      id="adult-count"
                      className="field-control !pl-10"
                      value={adults}
                      onChange={(event) => setAdults(Number(event.target.value))}
                      aria-invalid={Boolean(errors.adults)}
                    >
                      {Array.from({ length: 8 }, (_, index) => index + 1).map(
                        (count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  {errors.adults ? (
                    <p className="field-error" role="alert">
                      {errors.adults}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="child-count">
                    Kinderen
                  </label>
                  <select
                    id="child-count"
                    className="field-control"
                    value={childAges.length}
                    onChange={(event) => updateChildCount(Number(event.target.value))}
                  >
                    {Array.from({ length: 7 }, (_, index) => index).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {childAges.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-line bg-canvas/65 p-4 sm:p-5">
                  <p className="text-sm font-bold text-ink">Leeftijden kinderen</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {childAges.map((age, index) => (
                      <div key={index}>
                        <label className="field-label" htmlFor={`child-age-${index}`}>
                          Kind {index + 1}
                        </label>
                        <select
                          id={`child-age-${index}`}
                          className="field-control"
                          value={age}
                          onChange={(event) => {
                            const nextAge = Number(event.target.value);
                            setChildAges((current) =>
                              current.map((value, ageIndex) =>
                                ageIndex === index ? nextAge : value,
                              ),
                            );
                          }}
                          aria-invalid={Boolean(errors[`childAge-${index}`])}
                        >
                          {Array.from({ length: 18 }, (_, ageValue) => ageValue).map(
                            (ageValue) => (
                              <option key={ageValue} value={ageValue}>
                                {ageValue} {ageValue === 1 ? "jaar" : "jaar"}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex gap-3 rounded-2xl border border-moss/20 bg-moss-soft/65 p-4 text-sm leading-6 text-moss-dark">
                  <ShieldCheckIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <p>Gezelschapsdata blijft onderdeel van je privé-reisprofiel.</p>
                </div>
              )}
            </fieldset>
          ) : null}

          {step === 3 ? (
            <fieldset aria-describedby={errors.interests ? "interests-error" : undefined}>
              <legend className="sr-only">Interesses</legend>
              <p className="mb-5 max-w-lg text-sm leading-6 text-muted">
                Kies wat bij jullie past. TripFit gebruikt dit als voorkeur, niet
                als harde filter.
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {interestOptions.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.value);
                  return (
                    <label
                      key={interest.value}
                      className={`interest-option relative flex min-h-13 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
                        isSelected
                          ? "border-moss-dark bg-moss-dark text-white"
                          : "border-line-strong bg-white text-ink hover:border-moss"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => toggleInterest(interest.value)}
                      />
                      <span>{interest.label}</span>
                      <span
                        aria-hidden="true"
                        className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                          isSelected ? "border-white/40 bg-white/15" : "border-line"
                        }`}
                      >
                        {isSelected ? <CheckIcon className="size-3.5" /> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.interests ? (
                <p id="interests-error" className="field-error" role="alert">
                  {errors.interests}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {step === 4 ? (
            <fieldset>
              <legend className="sr-only">Verblijfslocaties en route</legend>
              <div className="mb-5 flex items-start justify-between gap-4">
                <p className="max-w-lg text-sm leading-6 text-muted">
                  Verdeel je reis over één of meer regio’s. Zo worden reistijd en
                  lokale kansen per stop relevant.
                </p>
                <span className="hidden shrink-0 rounded-full bg-sand px-3 py-1.5 text-xs font-bold text-moss-dark sm:block">
                  {tripNights} nachten
                </span>
              </div>

              <div className="space-y-3">
                {stops.map((stop, index) => (
                  <div
                    key={stop.key}
                    className="relative rounded-2xl border border-line bg-white p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink">
                        <span className="grid size-7 place-items-center rounded-full bg-moss-soft text-xs text-moss-dark">
                          {index + 1}
                        </span>
                        Stop {index + 1}
                      </p>
                      {stops.length > 1 ? (
                        <button
                          type="button"
                          className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
                          onClick={() => removeStop(index)}
                          aria-label={`Verwijder stop ${index + 1}`}
                        >
                          <CloseIcon className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="field-label" htmlFor={`stop-region-${index}`}>
                          Regio
                        </label>
                        <div className="relative">
                          <MapPinIcon
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                          />
                          <select
                            id={`stop-region-${index}`}
                            className="field-control !pl-10"
                            value={stop.regionId}
                            onChange={(event) =>
                              updateStop(index, { regionId: event.target.value })
                            }
                            aria-invalid={Boolean(errors[`stop-${index}-region`])}
                          >
                            <option value="">Kies een regio</option>
                            {regions.map((region) => (
                              <option key={region.id} value={region.id}>
                                {region.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors[`stop-${index}-region`] ? (
                          <p className="field-error" role="alert">
                            {errors[`stop-${index}-region`]}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label className="field-label" htmlFor={`stop-arrival-${index}`}>
                          Van
                        </label>
                        <input
                          id={`stop-arrival-${index}`}
                          type="date"
                          className="field-control"
                          value={stop.arrivalDate}
                          min={arrivalDate}
                          max={departureDate}
                          onChange={(event) =>
                            updateStop(index, { arrivalDate: event.target.value })
                          }
                          aria-invalid={Boolean(errors[`stop-${index}-dates`])}
                        />
                      </div>
                      <div>
                        <label
                          className="field-label"
                          htmlFor={`stop-departure-${index}`}
                        >
                          Tot
                        </label>
                        <input
                          id={`stop-departure-${index}`}
                          type="date"
                          className="field-control"
                          value={stop.departureDate}
                          min={arrivalDate}
                          max={departureDate}
                          onChange={(event) =>
                            updateStop(index, { departureDate: event.target.value })
                          }
                          aria-invalid={Boolean(errors[`stop-${index}-dates`])}
                        />
                      </div>
                    </div>
                    {errors[`stop-${index}-dates`] ? (
                      <p className="field-error" role="alert">
                        {errors[`stop-${index}-dates`]}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              {errors.stops ? (
                <p className="field-error" role="alert">
                  {errors.stops}
                </p>
              ) : null}

              <button
                type="button"
                className="secondary-button mt-4 w-full border-dashed"
                onClick={addStop}
                disabled={stops.length >= Math.min(regions.length, 5)}
              >
                <PlusIcon className="size-4" aria-hidden="true" />
                Voeg verblijfslocatie toe
              </button>

              <div className="mt-5 flex gap-3 rounded-2xl bg-sand/60 p-4 text-xs leading-5 text-muted">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-moss" aria-hidden="true" />
                <p>
                  Alleen regio en reisdata gaan mee naar de anonieme preview. Een
                  exact hoteladres is niet nodig.
                </p>
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line/75 bg-white/50 px-5 py-4 sm:px-7">
          {step > 1 ? (
            <button
              type="button"
              className="quiet-button !px-2 sm:!px-4"
              onClick={goToPreviousStep}
              disabled={isNavigating}
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Terug
            </button>
          ) : (
            <div className="hidden items-center gap-2 text-xs font-semibold text-muted sm:flex">
              <ShieldCheckIcon className="size-4 text-moss" aria-hidden="true" />
              Geen account nodig
            </div>
          )}

          <button
            type="submit"
            className="primary-button ml-auto min-w-36 sm:min-w-44"
            disabled={isNavigating}
          >
            {isNavigating
              ? "Reis wordt geopend…"
              : step === 4
                ? "Open mijn reis"
                : "Volgende"}
            {!isNavigating ? (
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            ) : (
              <span
                className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {isNavigating ? "Je persoonlijke reispreview wordt geladen." : ""}
        </p>
      </form>
    </section>
  );
}
