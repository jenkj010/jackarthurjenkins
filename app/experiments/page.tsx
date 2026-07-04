import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Experiments — JAJ Hub" };

export default function ExperimentsPage() {
  return (
    <main className="page-head">
      <div className="container">
        <p className="section-eyebrow">Experiments</p>
        <h1 className="section-title">
          Experiments<span className="cursor" aria-hidden="true" />
        </h1>
        <p className="muted" style={{ marginBottom: 30 }}>
          Experimental builds will appear here soon.
        </p>
        <Link href="/" className="btn">← Back to Home</Link>
      </div>
    </main>
  );
}
