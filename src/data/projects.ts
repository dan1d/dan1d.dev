export interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  github?: string;
  tags: string[];
  featured: boolean;
  modelUrl?: string; // GLB model for AR viewing
  image?: string;
}

export const projects: Project[] = [
  {
    id: "codeprism",
    title: "CodePrism",
    description:
      "Shared AI knowledge graph for engineering teams. Centralized repository that leverages AI to organize and connect engineering knowledge.",
    url: "https://codeprism.dev",
    tags: ["SaaS", "AI", "Knowledge Graph", "Engineering"],
    featured: true,
    image: "/projects/codeprism.png",
  },
];

export const openSourceProjects: Project[] = [
  {
    id: "dan1d-dev",
    title: "dan1d.dev",
    description:
      "This portfolio — an open-source 3D + AR portfolio built with Next.js, React Three Fiber, and WebXR.",
    url: "https://dan1d.dev",
    github: "https://github.com/dan1d/dan1d.dev",
    tags: ["Next.js", "Three.js", "AR", "WebXR", "Open Source"],
    featured: false,
  },
];

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export const socialLinks: SocialLink[] = [
  { name: "GitHub", url: "https://github.com/dan1d", icon: "github" },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/danieldominguezdiaz",
    icon: "linkedin",
  },
  { name: "Email", url: "mailto:danielfromarg@gmail.com", icon: "mail" },
  { name: "CodePrism", url: "https://codeprism.dev", icon: "code" },
];

export const siteConfig = {
  name: "Daniel Alejandro Dominguez Diaz",
  handle: "dan1d",
  title: "Senior Full-Stack Engineer",
  description:
    "Senior Full-Stack Engineer with 12+ years building scalable web & mobile apps. Ruby on Rails, React, AWS. Creator of CodePrism.",
  url: "https://dan1d.dev",
  resumeUrl: "/resume.pdf",
};

export const skills = [
  "Ruby on Rails",
  "React",
  "React Native",
  "Vue",
  "Angular",
  "Node.js",
  "TypeScript",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "REST APIs",
  "GraphQL",
  "Redis",
  "Python",
] as const;
