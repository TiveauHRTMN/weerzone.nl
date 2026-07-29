export default function PreviewLoading() {
  return (
    <div className="mx-auto w-full max-w-[90rem] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="animate-pulse" aria-hidden="true">
        <div className="h-4 w-36 rounded-full bg-line" />
        <div className="mt-8 h-12 w-full max-w-2xl rounded-2xl bg-line/80" />
        <div className="mt-4 h-5 w-full max-w-xl rounded-full bg-line/60" />
        <div className="mt-10 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="h-72 rounded-[1.5rem] bg-line/65" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-72 rounded-[1.5rem] bg-line/60" />
            <div className="h-72 rounded-[1.5rem] bg-line/60" />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">
        Je persoonlijke reispreview wordt opgebouwd.
      </p>
    </div>
  );
}
