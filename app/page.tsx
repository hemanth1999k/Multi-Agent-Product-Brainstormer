import Workspace from '@/components/Workspace';

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 animate-breathe rounded-full bg-glow shadow-glow" />
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
            Stitch
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-100 sm:text-4xl">
          Watch a product team think.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
          Drop in a product idea. The Research agent synthesizes the opportunity, then hands off to
          the PRD agent — live, reasoning out loud.
        </p>
      </header>

      <Workspace />
    </main>
  );
}
