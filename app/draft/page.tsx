import type { Metadata } from "next";
import Link from "next/link";
import DraftApp from "@/components/DraftApp";

export const metadata: Metadata = {
  title: "Draft Hub — JAJ Hub",
  description: "A draft-night command centre for private leagues.",
};

export default function DraftPage() {
  return (
    <main className="page-head draft-page">
      <div className="container">
        <p className="section-eyebrow">Draft night</p>
        <h1 className="section-title">Draft Hub</h1>
        <p className="muted" style={{ marginBottom: 30, maxWidth: 620 }}>
          A single-screen draft-night command centre. Set up your league,
          load a player pool, and run the whole draft from one display.
        </p>
        <DraftApp />
        <p style={{ marginTop: 40 }}>
          <Link href="/" className="btn">← Back to JAJ Hub</Link>
        </p>
      </div>
    </main>
  );
}
