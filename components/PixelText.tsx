/* ============================================================
   PixelText — renders text in a 5x7 pixel font using CSS grid.
   Server component: no state, deterministic output.
   Add letters to FONT if you need more characters.
   ============================================================ */

const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  J: ["#####", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
};

type PixelTextProps = {
  text: string;
  /** pixel cell size, e.g. "clamp(8px, 2.6vw, 15px)" */
  cell?: string;
  color?: string;
  gap?: string;
  label?: string;
};

export default function PixelText({
  text,
  cell = "clamp(8px, 2.6vw, 15px)",
  color = "var(--cream)",
  gap = "0.9em",
  label,
}: PixelTextProps) {
  return (
    <div
      role="img"
      aria-label={label ?? text}
      style={{ display: "flex", gap, alignItems: "flex-start" }}
    >
      {Array.from(text).map((ch, i) => {
        const map = FONT[ch.toUpperCase()];
        if (!map) return null;
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(5, ${cell})`,
              gridTemplateRows: `repeat(7, ${cell})`,
            }}
          >
            {map.flatMap((row, y) =>
              Array.from(row).map((c, x) =>
                c === "#" ? (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      gridColumn: x + 1,
                      gridRow: y + 1,
                      background: color,
                    }}
                  />
                ) : null
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
