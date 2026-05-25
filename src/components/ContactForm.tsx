"use client";

import { useState } from "react";

interface Props {
  locale?: "nl" | "de" | "fr" | "es";
}

type ContactTopic = "vraag" | "pers" | "technisch" | "anders";

const COPY = {
  nl: {
    receivedTag: "Ontvangen",
    receivedTitle: "Bericht ontvangen.",
    receivedBody:
      "We hebben je bericht binnen. Op werkdagen reageren we doorgaans binnen 24 uur op het opgegeven adres.",
    name: "Naam",
    namePh: "Je naam",
    email: "E-mailadres",
    emailPh: "voorbeeld@domein.nl",
    topic: "Type bericht",
    topicOptions: {
      vraag: "Vraag",
      pers: "Pers",
      technisch: "Technisch probleem",
      anders: "Anders",
    },
    subject: "Onderwerp",
    subjectPh: "Korte titel van je bericht",
    message: "Bericht",
    messagePh: "Schrijf hier je bericht",
    sending: "Bezig met versturen...",
    send: "Verstuur bericht",
    error:
      "Er ging iets mis. Probeer het opnieuw of mail rechtstreeks naar contact@weerzone.nl.",
  },
  de: {
    receivedTag: "Empfangen",
    receivedTitle: "Nachricht empfangen.",
    receivedBody:
      "Wir haben deine Nachricht erhalten. An Werktagen melden wir uns in der Regel innerhalb von 24 Stunden.",
    name: "Name",
    namePh: "Dein Name",
    email: "E-Mail",
    emailPh: "beispiel@domain.de",
    topic: "Art der Nachricht",
    topicOptions: {
      vraag: "Frage",
      pers: "Presse",
      technisch: "Technisches Problem",
      anders: "Sonstiges",
    },
    subject: "Betreff",
    subjectPh: "Kurzer Titel",
    message: "Nachricht",
    messagePh: "Schreib hier deine Nachricht",
    sending: "Wird gesendet...",
    send: "Nachricht senden",
    error:
      "Es ist etwas schiefgelaufen. Versuch es erneut oder mail direkt an contact@weerzone.nl.",
  },
  fr: {
    receivedTag: "Recu",
    receivedTitle: "Message recu.",
    receivedBody:
      "Nous avons bien recu votre message. En jours ouvrables, nous repondons en general sous 24 heures.",
    name: "Nom",
    namePh: "Votre nom",
    email: "E-mail",
    emailPh: "exemple@domaine.fr",
    topic: "Type de message",
    topicOptions: {
      vraag: "Question",
      pers: "Presse",
      technisch: "Probleme technique",
      anders: "Autre",
    },
    subject: "Sujet",
    subjectPh: "Titre court",
    message: "Message",
    messagePh: "Ecrivez ici votre message",
    sending: "Envoi en cours...",
    send: "Envoyer le message",
    error:
      "Une erreur s'est produite. Reessayez ou ecrivez directement a contact@weerzone.nl.",
  },
  es: {
    receivedTag: "Recibido",
    receivedTitle: "Mensaje recibido.",
    receivedBody:
      "Hemos recibido tu mensaje. En dias laborables normalmente respondemos en 24 horas.",
    name: "Nombre",
    namePh: "Tu nombre",
    email: "Correo",
    emailPh: "ejemplo@dominio.es",
    topic: "Tipo de mensaje",
    topicOptions: {
      vraag: "Pregunta",
      pers: "Prensa",
      technisch: "Problema tecnico",
      anders: "Otro",
    },
    subject: "Asunto",
    subjectPh: "Titulo corto",
    message: "Mensaje",
    messagePh: "Escribe aqui tu mensaje",
    sending: "Enviando...",
    send: "Enviar mensaje",
    error:
      "Algo ha fallado. Intentalo de nuevo o escribe directamente a contact@weerzone.nl.",
  },
} as const;

const TOPICS: readonly ContactTopic[] = [
  "vraag",
  "pers",
  "technisch",
  "anders",
];

export default function ContactForm({ locale = "nl" }: Props) {
  const t = COPY[locale];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("vraag");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          topicLabel: t.topicOptions[topic],
          subject,
          message,
          locale,
        }),
      });
      if (res.ok) {
        setStatus("ok");
        setName("");
        setEmail("");
        setTopic("vraag");
        setSubject("");
        setMessage("");
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  };

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-7 text-center backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">
          {t.receivedTag}
        </p>
        <p className="mt-2 text-2xl font-black text-white">{t.receivedTitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/80">{t.receivedBody}</p>
      </div>
    );
  }

  const fieldLabel = "text-[11px] font-black uppercase tracking-[0.18em] text-slate-500";
  const fieldInput =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>{t.name}</span>
          <input
            type="text"
            required
            placeholder={t.namePh}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldInput}
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>{t.email}</span>
          <input
            type="email"
            required
            placeholder={t.emailPh}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldInput}
            autoComplete="email"
          />
        </label>
      </div>

      <label className="block">
        <span className={fieldLabel}>{t.topic}</span>
        <select
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value as ContactTopic)}
          className={fieldInput}
        >
          {TOPICS.map((k) => (
            <option key={k} value={k}>
              {t.topicOptions[k]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={fieldLabel}>{t.subject}</span>
        <input
          type="text"
          required
          placeholder={t.subjectPh}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={fieldInput}
        />
      </label>

      <label className="block">
        <span className={fieldLabel}>{t.message}</span>
        <textarea
          required
          rows={5}
          placeholder={t.messagePh}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldInput} resize-none`}
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.send}
      </button>
      {status === "err" && (
        <p className="text-center text-sm font-medium text-rose-200">{t.error}</p>
      )}
    </form>
  );
}
