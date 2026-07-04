import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tools — JAJ Hub" };

export default function ToolsPage() {
  return (
    <main className="page-head">
      <div className="container">
        <p className="section-eyebrow">Tools</p>
        <h1 className="section-title">
          Tools<span className="cursor" aria-hidden="true" />
        </h1>
        <p className="muted" style={{ marginBottom: 30 }}>
          Utilities will appear here soon.
        </p>
        <Link href="/" className="btn">← Back to Home</Link>
      </div>
    </main>
  );
}
