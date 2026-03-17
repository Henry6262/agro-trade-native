/**
 * A thin glowing gold line that visually separates landing page sections.
 * Sits between section elements in page.tsx — no absolute positioning needed,
 * it renders as a normal 1 px flow element with a radial gold gradient + glow.
 */
export function SectionDivider() {
  return (
    <div
      className="relative w-full pointer-events-none select-none"
      style={{ height: 1, zIndex: 20 }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(232,200,112,0.06) 10%, rgba(232,200,112,0.45) 30%, rgba(232,200,112,0.72) 50%, rgba(232,200,112,0.45) 70%, rgba(232,200,112,0.06) 90%, transparent 100%)",
          boxShadow:
            "0 0 14px 3px rgba(232,200,112,0.18), 0 0 40px 8px rgba(232,200,112,0.07)",
        }}
      />
    </div>
  );
}
