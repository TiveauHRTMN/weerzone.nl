export default function VandaagLoading() {
  return (
    <main className="min-h-screen bg-sky-400/60">
      <div className="relative z-10 mx-auto max-w-[640px] space-y-4 px-4 py-9 sm:px-6 sm:py-14">
        <div className="h-48 animate-pulse rounded-3xl border border-white/70 bg-white/90 shadow-xl" />
        <div className="h-40 animate-pulse rounded-3xl border border-white/70 bg-white/90 shadow-xl" />
        <div className="h-32 animate-pulse rounded-3xl border border-white/70 bg-white/90 shadow-xl" />
      </div>
    </main>
  );
}
