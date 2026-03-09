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
    id: "cobroya",
    title: "CobroYa",
    description:
      "Open-source Mercado Pago payment platform with MCP server, OpenAI function calling, LangChain tools (Python), Telegram bot, WhatsApp Business API, and automation adapters for n8n, Zapier, Make, and Pipedream. Published on npm & PyPI with 212+ tests.",
    url: "https://cobroya.app",
    github: "https://github.com/dan1d/mercadopago-tool",
    tags: ["TypeScript", "Python", "MCP", "OpenAI", "LangChain", "Payments"],
    featured: true,
  },
  {
    id: "biobridge",
    title: "BioBridge",
    description:
      "Cardiac remote monitoring platform for clinicians and healthcare providers. Built health status/incident reporting, real-time device data ingestion, patient monitoring workflows, and clinician dashboards.",
    url: "https://biobridge.com",
    tags: ["Healthcare", "Rails", "React", "Vue", "Monitoring"],
    featured: true,
  },
  {
    id: "vulnsentry",
    title: "VulnSentry",
    description:
      "Ruby CVE auto-PR bot — Rails 8 app that detects vulnerabilities in Ruby bundled gems and prepares human-reviewable bump PRs. Conservative, fail-closed safety model with DeepSeek cross-checks.",
    url: "https://vulnsentry.com",
    github: "https://github.com/dan1d/vulnsentry",
    tags: ["Rails 8", "Security", "Automation", "Ruby"],
    featured: true,
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
    tags: ["Next.js", "Three.js", "AR", "WebXR"],
    featured: false,
  },
  {
    id: "py-bridge",
    title: "py_bridge",
    description:
      "Call Python functions from Elixir over stdin/stdout using JSON-RPC 2.0. Zero dependencies. Supervisor-friendly. Crash-resilient.",
    url: "https://github.com/dan1d/py_bridge",
    github: "https://github.com/dan1d/py_bridge",
    tags: ["Elixir", "Python", "JSON-RPC"],
    featured: false,
  },
  {
    id: "omniauth-clover",
    title: "omniauth-clover-oauth2",
    description:
      "OmniAuth strategy for Clover POS OAuth 2.0 with TokenClient for easy token refresh (OmniAuth 2.0+ compatible).",
    url: "https://github.com/dan1d/omniauth-clover-oauth2",
    github: "https://github.com/dan1d/omniauth-clover-oauth2",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "clover-sandbox",
    title: "clover_sandbox_simulator",
    description:
      "Ruby gem for simulating realistic restaurant POS operations in Clover sandbox environments. Generate orders, payments, and transactions for testing.",
    url: "https://github.com/dan1d/clover_sandbox_simulator",
    github: "https://github.com/dan1d/clover_sandbox_simulator",
    tags: ["Ruby", "Testing", "Clover API"],
    featured: false,
  },
  {
    id: "omniauth-freshbooks",
    title: "omniauth-freshbooks-oauth2",
    description:
      "OmniAuth OAuth2 strategy for FreshBooks with multi-business support, JSON token exchange, and single-use refresh token handling.",
    url: "https://github.com/dan1d/omniauth-freshbooks-oauth2-modern",
    github: "https://github.com/dan1d/omniauth-freshbooks-oauth2-modern",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "omniauth-quickbooks",
    title: "omniauth-quickbooks-oauth2",
    description:
      "OmniAuth strategy for QuickBooks Online OAuth 2.0 with TokenClient for easy token refresh (OmniAuth 2.0+ compatible).",
    url: "https://github.com/dan1d/omniauth-quickbooks-oauth2-modern",
    github: "https://github.com/dan1d/omniauth-quickbooks-oauth2-modern",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "omniauth-xero",
    title: "omniauth-xero-oauth2",
    description:
      "OmniAuth OAuth2 strategy for Xero with multi-tenant support, OpenID Connect, and token refresh (OmniAuth 2.0+ compatible).",
    url: "https://github.com/dan1d/omniauth-xero-oauth2-modern",
    github: "https://github.com/dan1d/omniauth-xero-oauth2-modern",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
];

export interface RailsContribution {
  id: string;
  title: string;
  url: string;
  description: string;
}

export const railsContributions: RailsContribution[] = [
  {
    id: "rails-pr-56616",
    title: "Raise UnknownPrimaryKey for destroy_async without PK",
    url: "https://github.com/rails/rails/pull/56616",
    description:
      "Early guard in has_many/has_one dependent: :destroy_async to raise clear error when associated model lacks a primary key.",
  },
  {
    id: "rails-pr-56614",
    title: "Raise UnknownPrimaryKey for writes without primary key",
    url: "https://github.com/rails/rails/pull/56614",
    description:
      "PK check in _update_record/_delete_record — raises UnknownPrimaryKey instead of generating invalid SQL.",
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
    url: "https://www.linkedin.com/in/dan1d",
    icon: "linkedin",
  },
  { name: "Email", url: "mailto:danielfromarg@gmail.com", icon: "mail" },
];

export const siteConfig = {
  name: "Daniel Alejandro Dominguez Diaz",
  handle: "dan1d",
  title: "Senior Full-Stack Engineer",
  description:
    "Senior Full-Stack Engineer with 12+ years building scalable web & mobile apps. Ruby on Rails, React, AWS. Creator of VulnSentry & CobroYa.",
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
