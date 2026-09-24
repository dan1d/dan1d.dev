interface ProgressRuleProps {
  total: number;
  active: number;
}

/** A thin fixed rule on the left showing position within a scroll sequence. */
export default function ProgressRule({ total, active }: ProgressRuleProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed top-1/2 left-4 z-10 hidden -translate-y-1/2 flex-col gap-2 md:flex"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: 16,
            background: i === active ? "var(--dk-safelight)" : "var(--dk-muted)",
            opacity: i === active ? 1 : 0.4,
            transition: "opacity var(--dk-develop) ease-out",
          }}
        />
      ))}
    </div>
  );
}
