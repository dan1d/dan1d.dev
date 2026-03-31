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
    id: "salestobooks",
    title: "SalesToBooks",
    description:
      "Automated restaurant bookkeeping — syncs daily POS sales into accounting software. Integrates with Clover, Square, Toast, QuickBooks, Xero, and 12,000+ banks via Plaid. Multi-location support with auto category mapping.",
    url: "https://salestobooks.com",
    tags: ["Rails", "Hotwire", "Plaid", "POS Integrations", "Accounting"],
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
      "This portfolio — an open-source 3D portfolio built with Next.js and React Three Fiber.",
    url: "https://dan1d.dev",
    github: "https://github.com/dan1d/dan1d.dev",
    tags: ["Next.js", "Three.js", "React Three Fiber"],
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
  {
    id: "dolar-mcp",
    title: "@dan1d/dolar-mcp",
    description:
      "MCP server for Argentine exchange rates — real-time dollar blue, oficial, MEP, CCL, crypto rates via DolarAPI. Currency conversion and spread calculator for AI agents. No API key required.",
    url: "https://www.npmjs.com/package/@dan1d/dolar-mcp",
    github: "https://github.com/dan1d/dolar-mcp",
    tags: ["TypeScript", "MCP", "AI Agents", "Finance"],
    featured: false,
  },
  {
    id: "mercadolibre-mcp",
    title: "@dan1d/mercadolibre-mcp",
    description:
      "MCP server for MercadoLibre marketplace — search products, browse categories, trends across 18 LATAM countries. No API key required for public endpoints.",
    url: "https://www.npmjs.com/package/@dan1d/mercadolibre-mcp",
    github: "https://github.com/dan1d/mercadolibre-mcp",
    tags: ["TypeScript", "MCP", "AI Agents", "E-Commerce"],
    featured: false,
  },
  {
    id: "hacktheinterview",
    title: "HackTheInterview",
    description:
      "AI-powered real-time interview assistant — transcribes interviewer questions and generates suggested answers in real-time.",
    url: "https://github.com/dan1d/hacktheinterview",
    github: "https://github.com/dan1d/hacktheinterview",
    tags: ["TypeScript", "AI", "Real-Time"],
    featured: false,
  },
  {
    id: "codeprism-cli",
    title: "codeprism-cli",
    description:
      "CLI for indexing codebases and pushing knowledge cards to a CodePrism engine.",
    url: "https://github.com/dan1d/codeprism-cli",
    github: "https://github.com/dan1d/codeprism-cli",
    tags: ["TypeScript", "CLI", "Dev Tools"],
    featured: false,
  },
  {
    id: "epos-now-client",
    title: "epos_now_client",
    description:
      "Ruby client for the Epos Now POS API (V4). Basic Auth, pagination, 10 resources, 100% test coverage.",
    url: "https://github.com/dan1d/epos_now_client",
    github: "https://github.com/dan1d/epos_now_client",
    tags: ["Ruby", "API Client", "POS"],
    featured: false,
  },
  {
    id: "lbry-api-ruby",
    title: "lbry-api-ruby",
    description:
      "Ruby wrapper for LBRY and LBRYcrd APIs.",
    url: "https://github.com/dan1d/lbry-api-ruby",
    github: "https://github.com/dan1d/lbry-api-ruby",
    tags: ["Ruby", "Crypto", "API Client"],
    featured: false,
  },
  {
    id: "omniauth-doordash",
    title: "omniauth-doordash-oauth2",
    description:
      "OmniAuth strategy for DoorDash using JWT authentication.",
    url: "https://github.com/dan1d/omniauth-doordash-oauth2",
    github: "https://github.com/dan1d/omniauth-doordash-oauth2",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "omniauth-gusto",
    title: "omniauth-gusto-oauth2",
    description:
      "OmniAuth OAuth2 strategy for Gusto payroll.",
    url: "https://github.com/dan1d/omniauth-gusto-oauth2",
    github: "https://github.com/dan1d/omniauth-gusto-oauth2",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "omniauth-lightspeed",
    title: "omniauth-lightspeed-oauth2",
    description:
      "OmniAuth OAuth2 strategy for Lightspeed Restaurant (K-Series).",
    url: "https://github.com/dan1d/omniauth-lightspeed-oauth2",
    github: "https://github.com/dan1d/omniauth-lightspeed-oauth2",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "omniauth-uber-eats",
    title: "omniauth-uber-eats-oauth2",
    description:
      "OmniAuth OAuth2 strategy for Uber Eats.",
    url: "https://github.com/dan1d/omniauth-uber-eats-oauth2",
    github: "https://github.com/dan1d/omniauth-uber-eats-oauth2",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "omniauth-wave",
    title: "omniauth-wave-oauth2",
    description:
      "OmniAuth OAuth2 strategy for Wave (by H&R Block).",
    url: "https://github.com/dan1d/omniauth-wave-oauth2",
    github: "https://github.com/dan1d/omniauth-wave-oauth2",
    tags: ["Ruby", "OmniAuth", "OAuth2"],
    featured: false,
  },
  {
    id: "epos-now-sandbox",
    title: "epos_now_sandbox_simulator",
    description:
      "Ruby gem for simulating POS operations against the Epos Now V4 API. Generates realistic orders, payments, and transactions for sandbox testing.",
    url: "https://github.com/dan1d/epos_now_sandbox_simulator",
    github: "https://github.com/dan1d/epos_now_sandbox_simulator",
    tags: ["Ruby", "Testing", "POS"],
    featured: false,
  },
  {
    id: "heartland-sandbox",
    title: "heartland_sandbox_simulator",
    description:
      "Heartland Genius Restaurant POS sandbox simulator for SalesToBooks integration testing.",
    url: "https://github.com/dan1d/heartland_sandbox_simulator",
    github: "https://github.com/dan1d/heartland_sandbox_simulator",
    tags: ["Ruby", "Testing", "POS"],
    featured: false,
  },
  {
    id: "lightspeed-sandbox",
    title: "lightspeed_sandbox_simulator",
    description:
      "Lightspeed K-Series POS sandbox data simulator for development and testing.",
    url: "https://github.com/dan1d/lightspeed_sandbox_simulator",
    github: "https://github.com/dan1d/lightspeed_sandbox_simulator",
    tags: ["Ruby", "Testing", "POS"],
    featured: false,
  },
  {
    id: "skytab-sandbox",
    title: "skytab_sandbox_simulator",
    description:
      "SkyTab (Shift4) POS sandbox simulator for SalesToBooks integration testing.",
    url: "https://github.com/dan1d/skytab_sandbox_simulator",
    github: "https://github.com/dan1d/skytab_sandbox_simulator",
    tags: ["Ruby", "Testing", "POS"],
    featured: false,
  },
  {
    id: "square-sandbox",
    title: "square_sandbox_simulator",
    description:
      "Generate realistic POS data in Square sandbox — orders, payments, catalog, customers, refunds. Ruby gem with CLI + programmatic API.",
    url: "https://github.com/dan1d/square_sandbox_simulator",
    github: "https://github.com/dan1d/square_sandbox_simulator",
    tags: ["Ruby", "Testing", "POS"],
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
    "Senior Full-Stack Engineer with 14+ years building scalable web & mobile apps. Ruby on Rails, React, AWS. Open Source contributor.",
  url: "https://dan1d.dev",
  resumeUrl: "/api/resume",
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
