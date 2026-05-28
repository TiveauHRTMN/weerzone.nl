"use client";

import { useState } from "react";
import { Coffee, CreditCard, Heart, ArrowRight } from "lucide-react";

export default function SupportForm() {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<"revolut" | "phantom">("revolut");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount.replace(",", ".")) : amount;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isNaN(finalAmount) || finalAmount < 1) {
      alert("Vul een geldig bedrag in van minimaal €1");
      setLoading(false);
      return;
    }

    // You can replace these with your actual usernames
    const REVOLUT_USERNAME = "hrtmnofficial"; 
    const PHANTOM_ADDRESS = "DkXHDeAjgXWKFcqpG7ziJ4D9gWEW5ifxjNfq3A6kJg1K";

    // 3. Afhandelen
    if (method === "phantom") {
      navigator.clipboard.writeText(PHANTOM_ADDRESS).then(() => {
        setCopied(true);
        setLoading(false);
        setTimeout(() => setCopied(false), 3000);
      }).catch(err => {
        console.error("Clipboard failed", err);
        alert("Kopiëren mislukt. Het adres is: " + PHANTOM_ADDRESS);
        setLoading(false);
      });
    } else if (method === "revolut") {
      // Directe navigatie naar profiel (voorkomt foutmeldingen bij bedrag-formatting)
      window.location.href = `https://revolut.me/${REVOLUT_USERNAME}`;
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div className="w-full card bg-white border-white/40 shadow-2xl p-6 sm:p-10 rounded-3xl">
      <form onSubmit={handleCheckout} className="space-y-8">
        
        {/* BEDRAG */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">1. Kies je bijdrage</label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[3, 5, 10].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => { setAmount(val); setCustomAmount(""); }}
                className={`py-3 sm:py-4 rounded-xl font-black text-lg border-2 transition-all ${
                  amount === val && !customAmount 
                    ? "border-amber-500 bg-amber-50 text-amber-600 shadow-md" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                }`}
              >
                €{val}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">€</span>
            <input
              type="number"
              min="1"
              step="0.50"
              placeholder="Ander bedrag..."
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
              className="w-full pl-9 pr-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* GEGEVENS */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">2. Jouw gegevens (optioneel)</label>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Naam of alias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-800 outline-none"
            />
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-800 outline-none"
            />
            <textarea
              placeholder="Een leuk berichtje voor het team?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-800 outline-none resize-none"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* BETAALMETHODE */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">3. Betaalmethode</label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setMethod("revolut")}
              className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                method === "revolut" ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              }`}
            >
              Revolut
            </button>
            <button
              type="button"
              onClick={() => setMethod("phantom")}
              className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                method === "phantom" ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              }`}
            >
              Phantom
            </button>
          </div>
          {method === "revolut" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-slate-500 text-center">
                Geen Revolut-account? Geen probleem. Je kunt simpel betalen via <strong>Apple Pay, Google Pay</strong> of <strong>Card</strong>.
              </p>
            </div>
          )}
          {method === "phantom" && (
            <p className="text-xs font-medium text-slate-500 text-center mt-3">
              Kopieer straks het Solana (SOL) adres en doneer veilig via je Phantom wallet.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || finalAmount < 1 || copied}
          className={`w-full py-4 rounded-xl transition-all shadow-lg text-white font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            copied ? "bg-emerald-500 shadow-emerald-500/30" : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
          }`}
        >
          {loading ? (
            <span className="animate-pulse">Even geduld...</span>
          ) : copied ? (
            "Adres Gekopieerd! ✅"
          ) : method === "phantom" ? (
            <>Kopieer Solana Adres <Heart className="w-5 h-5 ml-1" /></>
          ) : (
            <>Doneer €{finalAmount.toFixed(2)} <Heart className="w-5 h-5 ml-1" /></>
          )}
        </button>
        {method !== "phantom" && (
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
              Veilig betalen via Revolut.me
            </p>
        )}
      </form>
    </div>
  );
}
