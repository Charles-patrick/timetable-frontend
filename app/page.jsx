import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-board text-chalk">
      {/* Signature element: a ruled grid reminiscent of a physical
          timetable sheet, with period markers down the side — grounded
          in the actual subject instead of a generic gradient hero. */}
      <section className="relative overflow-hidden border-b border-rule-dark h-screen">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(246,243,233,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(246,243,233,0.08) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-6 py-24 sm:py-32">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-amber">
            <span className="h-px w-8 bg-amber" />
            Registrar's Office · Online Timetabling
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.1] sm:text-6xl">
            Every class, its own
            <br />
            <span className="italic text-amber">conflict-free</span> slot.
          </h1>

          <p className="max-w-xl text-lg text-chalk/80">
            Courses, lecturers, and venues go in. A clash-free timetable comes
            out generated automatically, published instantly, searchable by
            anyone.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/login"
              className="rounded-sm bg-amber px-6 py-3 font-sans text-sm font-medium text-board-dark transition hover:bg-chalk"
            >
              Staff Login
            </Link>
            <Link
              href="/timetable/100"
              className="rounded-sm border border-chalk/30 px-6 py-3 font-sans text-sm font-medium text-chalk transition hover:border-chalk"
            >
              View timetable
            </Link>
          </div>
        </div>
      </section>

      {/* Period-style markers — an honest use of numbering, since a real
          timetable's periods are an actual ordered sequence. */}
      {/* <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-px overflow-hidden rounded-sm border border-rule-dark bg-rule-dark sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Set up your data",
              body: "Courses, lecturers, venues, and time slots — entered once per session.",
            },
            {
              n: "02",
              title: "Generate",
              body: "The system places every course into a slot with no lecturer, venue, or level clash.",
            },
            {
              n: "03",
              title: "Publish",
              body: "Lecturers and students see the result instantly, filterable by level and semester.",
            },
          ].map((step) => (
            <div key={step.n} className="bg-board p-8">
              <div className="font-display text-3xl text-amber">{step.n}</div>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-chalk/70">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-rule-dark px-6 py-8 text-center text-xs text-chalk/50">
        Online Timetable Generating System
      </footer> */}
    </main>
  );
}
