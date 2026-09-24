/** Shared empty state for photo pages with no public entries yet. */
export default function EmptyDarkroom() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <p
        className="text-lg"
        style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-muted)" }}
      >
        The darkroom is empty.
      </p>
    </main>
  );
}
