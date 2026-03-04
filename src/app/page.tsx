import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import ARExperience from "@/components/sections/ARExperience";
import GitHubSkyline from "@/components/sections/GitHubSkyline";
import Resume from "@/components/sections/Resume";

export default function Home() {
  return (
    <main className="bg-black">
      <Hero />
      <Projects />
      <GitHubSkyline />
      <Resume />
      <ARExperience />
      <footer className="border-t border-white/10 bg-black px-6 py-12 text-center text-sm text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} dan1d.dev — Built with Next.js,
          Three.js &amp; AR
        </p>
      </footer>
    </main>
  );
}
