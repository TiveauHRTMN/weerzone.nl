import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe WEERZONE pour toute question ou retour.",
  alternates: { canonical: "https://weerzone.nl/fr/contact" },
};

export default function ContactPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-text-primary mb-2">Contact</h1>
        <p className="text-text-secondary">Envoyez-nous un e-mail à info@weerzone.nl.</p>
      </div>
    </main>
  );
}