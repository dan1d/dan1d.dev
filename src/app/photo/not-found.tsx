import Link from "next/link";

export default function PhotoNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p
        className="text-xl"
        style={{ fontFamily: "var(--font-fraunces)", color: "var(--dk-fg)" }}
      >
        Nothing developed here.
      </p>
      <Link
        href="/photo"
        className="text-xs tracking-widest uppercase"
        style={{ color: "var(--dk-safelight)" }}
      >
        Back to the darkroom
      </Link>
    </main>
  );
}
