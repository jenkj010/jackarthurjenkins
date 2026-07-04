/* ============================================================
   Stars — quiet pixel starfield.
   Positions are derived from the index (deterministic), so this
   can stay a server component with no hydration mismatch.
   ============================================================ */

function pseudo(i: number, salt: number) {
  // simple deterministic hash → 0..1
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function Stars({ count = 18 }: { count?: number }) {
  return (
    <div className="stars" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const size = pseudo(i, 3) > 0.85 ? 5 : 3;
        return (
          <span
            key={i}
            className="star"
            style={{
              width: size,
              height: size,
              left: `${(pseudo(i, 1) * 96 + 2).toFixed(1)}%`,
              top: `${(pseudo(i, 2) * 90 + 2).toFixed(1)}%`,
              animationDuration: `${(2.5 + pseudo(i, 4) * 4).toFixed(1)}s`,
              animationDelay: `${(-pseudo(i, 5) * 6).toFixed(1)}s`,
            }}
          />
        );
      })}
    </div>
  );
}
