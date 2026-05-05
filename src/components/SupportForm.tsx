"use client";

import { useState } from "react";
import { Coffee, CreditCard, Heart, ArrowRight } from "lucide-react";

export default function SupportForm() {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<"paypal" | "revolut">("paypal");
  const [loading, setLoading] = useState(false);

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
    const PAYPAL_USERNAME = "weerzone"; 
    const REVOLUT_USERNAME = "weerzone"; 

    // We pass the amount to the URL. The message/name can be sent to your own API later, 
    // but for now the user can just leave a note in PayPal/Revolut.
    setTimeout(() => {
      if (method === "paypal") {
        window.location.href = `https://paypal.me/${PAYPAL_USERNAME}/${finalAmount}EUR`;
      } else {
        window.location.href = `https://revolut.me/${REVOLUT_USERNAME}/${finalAmount}`;
      }
    }, 500);
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
                    ? "border-orange-500 bg-orange-50 text-orange-600 shadow-md" 
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
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-800 outline-none"
            />
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-800 outline-none"
            />
            <textarea
              placeholder="Een leuk berichtje voor het team?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-800 outline-none resize-none"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* BETAALMETHODE */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">3. Betaalmethode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod("paypal")}
              className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                method === "paypal" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              }`}
            >
              PayPal
            </button>
            <button
              type="button"
              onClick={() => setMethod("revolut")}
              className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                method === "revolut" ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              }`}
            >
              Revolut
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || finalAmount < 1}
          className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 text-white font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="animate-pulse">Doorsturen...</span>
          ) : (
            <>Doneer €{finalAmount.toFixed(2)} <Heart className="w-5 h-5 ml-1" /></>
          )}
        </button>
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          Veilig betalen via {method === "paypal" ? "PayPal.me" : "Revolut.me"}
        </p>
      </form>
    </div>
  );
}
