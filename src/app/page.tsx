import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import ARExperience from "@/components/sections/ARExperience";
import GitHubSkyline from "@/components/sections/GitHubSkyline";
import MatrixResume from "@/components/sections/MatrixResume";
import BusinessCard from "@/components/sections/BusinessCard";

export default function Home() {
  return (
    <main className="bg-black">
      <Hero />
      <Projects />
      <GitHubSkyline />
      <MatrixResume />
      <BusinessCard />
      <ARExperience />
      <footer className="relative z-[2] border-t border-green-400/15 bg-black px-6 py-12 text-center font-mono">
        <p className="text-[11px] text-green-400/30 tracking-wider">
          &copy; {new Date().getFullYear()} dan1d.dev — Built with Next.js,
          Three.js &amp; WebXR
        </p>
      </footer>
    </main>
  );
}
