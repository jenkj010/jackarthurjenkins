import Link from "next/link";
import Hero from "@/components/Hero";

/* ============================================================
   Homepage — the launchpad. To add a new app later:
   1. create app/<name>/page.tsx
   2. add a card to APPS below (and a Nav link if you like)
   ============================================================ */

const APPS = [
  {
    title: "Draft Hub",
    description: "A reusable 8-bit draft-night command centre for private leagues.",
    status: "Active build",
    cta: "Open Draft Hub",
    href: "/draft",
    live: true,
    tone: "nfl",
  },
  {
    title: "Tools",
    description: "Small utilities and practical digital helpers.",
    status: "Placeholder",
    cta: "Open Tools",
    href: "/tools",
    tone: "amber",
  },
  {
    title: "Experiments",
    description: "Web builds, interface tests and creative ideas.",
    status: "Placeholder",
    cta: "Open Experiments",
    href: "/experiments",
    tone: "violet",
  },
  {
    title: "Next Build",
    description: "Reserved space for the next build.",
    status: "Empty slot",
    cta: "Add later",
    tone: "slate",
  },
];

export default function Home() {
  return (
    <main>
      <Hero />
      <section className="section" aria-label="Launchpad">
        <div className="container">
          <p className="section-eyebrow">Launchpad</p>
          <h2 className="section-title">Apps</h2>
          <div className="grid-tools">
            {APPS.map((m) =>
              m.href ? (
                <Link key={m.title} href={m.href} className={`card floppy-card floppy-${m.tone}`}>
                  <span className="floppy-shutter" aria-hidden="true" />
                  <span className="floppy-label">
                    <h3 className="card-title">{m.title}</h3>
                    <p className="card-desc">{m.description}</p>
                  </span>
                  <span className={`card-status${m.live ? "" : " dim"}`}>{m.status}</span>
                  <span className="card-cta">{m.cta}</span>
                </Link>
              ) : (
                <article key={m.title} className={`card floppy-card floppy-${m.tone} empty-slot`}>
                  <span className="floppy-shutter" aria-hidden="true" />
                  <span className="floppy-label">
                    <h3 className="card-title">{m.title}</h3>
                    <p className="card-desc">{m.description}</p>
                  </span>
                  <span className="card-status dim">{m.status}</span>
                  <span className="card-cta dim-cta">{m.cta}</span>
                </article>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
