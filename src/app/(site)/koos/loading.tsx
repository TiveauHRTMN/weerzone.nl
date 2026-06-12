export default function KoosLoading() {
  return (
    <main className="min-h-screen bg-sky-400/60 px-4 py-14">
      <div className="mx-auto max-w-[680px] space-y-4">
        <div className="h-48 animate-pulse rounded-3xl border border-white/70 bg-white/90 shadow-xl" />
        <div className="h-40 animate-pulse rounded-3xl border border-white/70 bg-white/90 shadow-xl" />
      </div>
    </main>
  );
}
