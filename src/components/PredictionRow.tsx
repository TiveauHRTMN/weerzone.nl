"use client";

import { useState } from "react";
import { submitPredictionsAction } from "@/app/wkpoule/actions";
import { AlertCircle, Check, Clock, Loader2, Lock, Save } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface PredictionRowProps {
  groupId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffLabel?: string;
  initialHome?: number;
  initialAway?: number;
  locked?: boolean;
  lockLabel?: string;
}

function normalizeInitial(value?: number) {
  return typeof value === "number" ? value.toString() : "";
}

function parseScore(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) return null;
  return parsed;
}

export default function PredictionRow({
  groupId,
  matchId,
  homeTeam,
  awayTeam,
  kickoffLabel,
  initialHome,
  initialAway,
  locked = false,
  lockLabel,
}: PredictionRowProps) {
  const [home, setHome] = useState(normalizeInitial(initialHome));
  const [away, setAway] = useState(normalizeInitial(initialAway));
  const [savedHome, setSavedHome] = useState(normalizeInitial(initialHome));
  const [savedAway, setSavedAway] = useState(normalizeInitial(initialAway));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const isComplete = home.trim() !== "" && away.trim() !== "";
  const isDirty = home !== savedHome || away !== savedAway;
  const hasSavedPrediction = savedHome !== "" && savedAway !== "";
  const canSave = !locked && isComplete && isDirty && status !== "saving";

  const handleScoreChange = (side: "home" | "away", value: string) => {
    const setter = side === "home" ? setHome : setAway;
    setter(value);
    setStatus("idle");
    setError("");
  };

  const handleSave = async () => {
    if (locked || status === "saving") return;

    const parsedHome = parseScore(home);
    const parsedAway = parseScore(away);

    if (parsedHome === null || parsedAway === null) {
      setStatus("error");
      setError("Gebruik hele scores van 0 t/m 30.");
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const result = await submitPredictionsAction(groupId, matchId, parsedHome, parsedAway);
      if (!result.ok) {
        setStatus("error");
        setError(result.error || "Opslaan mislukt.");
        return;
      }

      const normalizedHome = parsedHome.toString();
      const normalizedAway = parsedAway.toString();
      setHome(normalizedHome);
      setAway(normalizedAway);
      setSavedHome(normalizedHome);
      setSavedAway(normalizedAway);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      setError("Opslaan mislukt.");
    }
  };

  const statusLabel = locked
    ? lockLabel || "Gesloten"
    : status === "saving"
      ? "Opslaan"
      : status === "saved"
        ? "Opgeslagen"
        : status === "error"
          ? "Niet opgeslagen"
          : isDirty
            ? "Nog opslaan"
            : hasSavedPrediction
              ? "Opgeslagen"
              : "Nog leeg";

  return (
    <motion.div
      whileHover={{ y: locked ? 0 : -2 }}
      className={`relative overflow-hidden rounded-[22px] border p-3 transition sm:p-4 ${
        locked
          ? "border-red-400/20 bg-red-500/[0.07]"
          : "border-white/10 bg-white/[0.055] hover:border-blue-300/25"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,#ef4444_0%,#2563eb_50%,#16a34a_100%)] opacity-80" />

      <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 sm:text-sm">
          <Clock className="h-4 w-4 text-sky-300" />
          {kickoffLabel || "Aftrap"}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${statusLabel}-${locked}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
              locked
                ? "border-red-400/20 bg-red-500/10 text-red-200"
                : status === "error"
                  ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
                  : isDirty
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                    : "border-green-400/20 bg-green-500/10 text-green-200"
            }`}
          >
            {locked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : status === "saving" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status === "error" ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : !isDirty && hasSavedPrediction ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {statusLabel}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 md:gap-5">
        <div className="min-w-0 text-right">
          <div className="truncate text-sm font-black text-white sm:text-base md:text-lg" title={homeTeam}>
            {homeTeam}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-400">Thuis</div>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-3">
          <input
            type="number"
            min={0}
            max={30}
            value={home}
            onChange={(event) => handleScoreChange("home", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSave();
            }}
            disabled={locked}
            aria-label={`Doelpunten ${homeTeam}`}
            className="wk-score-input h-12 w-12 rounded-2xl border border-white/10 bg-[#070a14] text-center text-xl font-black text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/40 focus:ring-4 focus:ring-blue-300/10 disabled:cursor-not-allowed disabled:opacity-55 sm:h-14 sm:w-14 sm:text-2xl"
            placeholder="-"
          />
          <span className="w-2 text-center text-lg font-black text-slate-500 sm:w-3 sm:text-xl">-</span>
          <input
            type="number"
            min={0}
            max={30}
            value={away}
            onChange={(event) => handleScoreChange("away", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSave();
            }}
            disabled={locked}
            aria-label={`Doelpunten ${awayTeam}`}
            className="wk-score-input h-12 w-12 rounded-2xl border border-white/10 bg-[#070a14] text-center text-xl font-black text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/40 focus:ring-4 focus:ring-blue-300/10 disabled:cursor-not-allowed disabled:opacity-55 sm:h-14 sm:w-14 sm:text-2xl"
            placeholder="-"
          />
        </div>

        <div className="min-w-0 text-left">
          <div className="truncate text-sm font-black text-white sm:text-base md:text-lg" title={awayTeam}>
            {awayTeam}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-400">Uit</div>
        </div>
      </div>

      <div className="relative mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`min-h-5 text-sm font-medium ${status === "error" ? "text-rose-200" : "text-slate-400"}`}>
          {status === "error" ? error : isDirty ? "Wijziging staat klaar." : " "}
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Sla voorspelling ${homeTeam} tegen ${awayTeam} op`}
          title={locked ? "Deze speeldag is gesloten" : "Voorspelling opslaan"}
        >
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Opslaan
        </button>
      </div>
    </motion.div>
  );
}

