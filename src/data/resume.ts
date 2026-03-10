// ─── Centralized Resume Data ─────────────────────────────────────────────────
// This file is the SINGLE SOURCE OF TRUTH for all resume data.
// Used by: PDF generation, website sections, LinkedIn sync script.
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  nationality: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
}

export interface WorkExperience {
  company: string;
  companyUrl?: string;
  title: string;
  startDate: string; // "YYYY-MM" or "YYYY"
  endDate: string | null; // null = Present
  location: string;
  companyOverview?: string;
  summary?: string;
  highlights: string[];
  technologies?: string[];
}

export interface Volunteering {
  organization: string;
  role: string;
  startDate: string;
  endDate: string | null;
  location: string;
  description: string;
  highlights: string[];
  technologies?: string[];
  links?: { label: string; url: string }[];
}

export interface ResumeData {
  personal: PersonalInfo;
  profile: string;
  coreStrengths: { area: string; description: string }[];
  experience: WorkExperience[];
  volunteering: Volunteering[];
  skills: string[];
  languages: { language: string; level: string }[];
}

export const resumeData: ResumeData = {
  personal: {
    fullName: "Daniel Alejandro Dominguez Diaz",
    title: "Senior Full-Stack Engineer",
    email: "danielfromarg@gmail.com",
    nationality: "Argentina",
    location: "Argentina",
    website: "https://dan1d.dev",
    github: "https://github.com/dan1d",
    linkedin: "https://linkedin.com/in/dan1d",
  },

  profile:
    "Senior Full-Stack Engineer with 12+ years of experience designing, building, and operating scalable web and mobile applications. Strong background in Ruby on Rails and modern JavaScript frameworks, with deep expertise across backend systems, frontend architecture, APIs, and cloud deployments. Extensive experience owning features end-to-end: from system design and API architecture to AWS-based deployments, CI/CD pipelines, and production monitoring.",

  coreStrengths: [
    {
      area: "Backend Engineering",
      description:
        "12+ years with Ruby & Ruby on Rails, building APIs, background jobs, service-oriented architectures, and data-intensive systems. Strong experience with PostgreSQL, performance optimization, and domain-driven design.",
    },
    {
      area: "Frontend Engineering",
      description:
        "Advanced experience with React, React Native, Vue, and Angular, building complex, user-focused interfaces and maintaining large-scale frontend codebases.",
    },
    {
      area: "API Design & Integrations",
      description:
        "Design and implementation of RESTful APIs, third-party integrations, and internal services. API documentation using Swagger / OpenAPI, and contract-driven development.",
    },
    {
      area: "Cloud & DevOps",
      description:
        "Hands-on experience deploying and operating applications on AWS (EC2, ECS/EKS, S3, RDS, CloudWatch), containerization with Docker, and CI/CD pipelines using GitHub Actions / Jenkins.",
    },
    {
      area: "Quality-Driven Engineering",
      description:
        "Strong testing mindset with RSpec, Jest, Cypress, Selenium, and end-to-end automation. Testing is treated as a core engineering practice.",
    },
  ],

  experience: [
    {
      company: "BioBridge",
      companyUrl: "https://biobridge.com",
      title: "Sr Full-Stack Engineer",
      startDate: "2024-01",
      endDate: null,
      location: "Remote, US",
      companyOverview:
        "Cardiac remote monitoring platform for clinicians and healthcare providers.",
      highlights: [
        "Led development of cardiac remote monitoring platform for clinicians and healthcare providers",
        "Designed health status and incident reporting system for real-time patient monitoring",
        "Built real-time device data ingestion and patient monitoring workflows",
        "Developed clinician dashboards for actionable health insights",
      ],
      technologies: [
        "Ruby on Rails",
        "React",
        "Vue",
        "AWS",
        "PostgreSQL",
        "Docker",
      ],
    },
    {
      company: "Acima Credit",
      companyUrl: "https://acima.com",
      title: "Sr Software Engineer",
      startDate: "2021-07",
      endDate: "2024-01",
      location: "Remote, US",
      companyOverview:
        "Fintech company focused on lease-to-own and flexible credit solutions, operating at high scale with multiple merchant platform integrations.",
      summary:
        "Worked across backend services, APIs, and cloud infrastructure in a distributed microservices environment. Contributed to the design, development, and operation of production systems used by merchants, internal teams, and external partners.",
      highlights: [
        "Designed and implemented RESTful APIs consumed by multiple frontend applications and partner systems",
        "Built and maintained background processing workflows using Sidekiq for financial operations",
        "Optimized database queries and service performance in a high-traffic production environment",
        "Deployed and operated services on AWS EKS using Docker and Helm",
        "Contributed to CI/CD pipelines enabling automated builds, testing, and deployments",
        "Implemented and maintained third-party integrations using secure API communication",
        "Authored and maintained API documentation using OpenAPI/Swagger",
        "Implemented automated testing strategies at unit, integration, and API levels",
      ],
      technologies: [
        "Ruby on Rails",
        "PostgreSQL",
        "Sidekiq",
        "REST APIs",
        "Docker",
        "Kubernetes (EKS)",
        "AWS",
        "Helm",
        "React",
        "Vue",
        "RSpec",
        "Cypress",
        "Jest",
      ],
    },
    {
      company: "2U",
      companyUrl: "https://2u.com",
      title: "Sr Software Engineer",
      startDate: "2019-07",
      endDate: "2021-07",
      location: "Remote, US",
      companyOverview:
        "Publicly traded leader in education technology, recognized for expansive and innovative online learning platforms.",
      summary:
        "Joined as a Ruby Developer and quickly adapted to various roles, expanding skill set to include Python, DevOps, and Node.js across multiple projects.",
      highlights: [
        "Built reporting tool connecting Zoom and Canvas for student and teacher participation statistics",
        "Developed QA automation scripts for grading, notes, and assessments with Cypress and Nightwatch",
        "Deployed CSV reporting tool to AWS Lambda triggered by events, output to Google Drive",
        "Created Ruby on Rails API for content summarization using OpenAI integration",
        "Developed Python API for TEDx organization automating subtitle translation across multiple languages",
      ],
      technologies: [
        "Ruby on Rails",
        "Python",
        "Django",
        "Node.js",
        "Go",
        "AWS",
        "Kubernetes",
        "Docker",
        "Helm",
        "Cypress",
        "Nightwatch",
        "Buildkite",
        "OpenAI",
        "Redis",
        "RSpec",
      ],
    },
    {
      company: "HP",
      companyUrl: "https://hp.com",
      title: "Full Stack Developer",
      startDate: "2020-11",
      endDate: "2021-07",
      location: "Remote, US",
      highlights: [
        "Worked on backend development of HP's online shop CMS to manage and update web pages",
        "Built and maintained features using Ruby on Rails with robust RSpec testing",
        "Managed user permissions with CanCanCan and database operations with PostgreSQL",
        "Integrated Rails Admin for streamlined content management",
      ],
      technologies: [
        "Ruby on Rails",
        "RSpec",
        "PostgreSQL",
        "CanCanCan",
        "Rails Admin",
      ],
    },
    {
      company: "Admios (for Anaplan)",
      companyUrl: "https://admios.com",
      title: "Front-End Web Developer",
      startDate: "2020-04",
      endDate: "2020-11",
      location: "Remote, US",
      highlights: [
        "Led frontend development for Anaplan.com with pixel-perfect, responsive UI across web, mobile, and tablets",
        "Built web components with React and mobile apps with React Native for Android and iOS",
        "Implemented rigorous testing with Jest and Karma, developed UI components with Storybook",
        "Deployed mobile apps using Expo ensuring cross-platform consistency",
      ],
      technologies: [
        "React",
        "React Native",
        "Jest",
        "Karma",
        "Storybook",
        "Expo",
      ],
    },
    {
      company: "Digitas",
      companyUrl: "https://digitas.com",
      title: "Full Stack Engineer",
      startDate: "2019-03",
      endDate: "2020-03",
      location: "Buenos Aires, Argentina",
      highlights: [
        "Led development of web application generating KPIs and marketing segmentation for clients like P&G",
        "Built application using Ruby on Rails and Angular 6 with microservices architecture on AWS",
        "Managed backend processes with PostgreSQL and ensured code quality with RSpec and Jest",
        "Employed Docker for containerization in microservices deployment",
      ],
      technologies: [
        "Ruby on Rails",
        "Angular 6",
        "TypeScript",
        "PostgreSQL",
        "AWS",
        "Docker",
        "RSpec",
        "Jest",
      ],
    },
    {
      company: "GlobalLogic (for Everfi)",
      companyUrl: "https://globallogic.com",
      title: "Sr Ruby Engineer",
      startDate: "2018-11",
      endDate: "2019-03",
      location: "Buenos Aires, Argentina",
      highlights: [
        "Worked on Everfi.com account focusing on backend development and system architecture",
        "Leveraged Ruby on Rails with comprehensive RSpec testing and Swagger for API documentation",
        "Integrated AWS services, Apache Kafka for messaging, PostgreSQL and Elasticsearch",
        "Employed Docker for containerization in Agile development environment",
      ],
      technologies: [
        "Ruby on Rails",
        "RSpec",
        "Swagger",
        "AWS",
        "Apache Kafka",
        "PostgreSQL",
        "Elasticsearch",
        "Docker",
      ],
    },
    {
      company: "Globant (for Salesforce)",
      companyUrl: "https://globant.com",
      title: "Full Stack Developer",
      startDate: "2018-07",
      endDate: "2018-11",
      location: "Tucuman, Argentina",
      highlights: [
        "Contributed to development of internal reporting tool for the Salesforce.com account",
        "Built responsive user interfaces with React and integrated Express.js backend services",
      ],
      technologies: ["React", "Express.js", "Node.js"],
    },
    {
      company: "BillSync",
      companyUrl: "https://billsync.com",
      title: "SSR Fullstack Developer",
      startDate: "2014-07",
      endDate: "2018-07",
      location: "Remote",
      highlights: [
        "Developed comprehensive web application for accounting startup using Angular.js and Ruby on Rails",
        "Integrated API services from QuickBooks, Xero, and Clover accounting platforms",
        "Built robust and scalable application streamlining accounting processes",
        "Delivered high-performance solution improving financial operations automation",
      ],
      technologies: [
        "Ruby on Rails",
        "Angular.js",
        "QuickBooks API",
        "Xero API",
        "Clover API",
      ],
    },
    {
      company: "Insignia4u",
      companyUrl: "https://insignia4u.com",
      title: "Jr Fullstack Developer",
      startDate: "2012-02",
      endDate: "2014-06",
      location: "San Miguel de Tucuman, Argentina",
      highlights: [
        "Developed and maintained responsive web applications using HTML, CSS, JavaScript, jQuery, Ruby on Rails, Angular 1",
        "Collaborated with cross-functional teams to design and implement new features",
      ],
      technologies: [
        "Ruby on Rails",
        "JavaScript",
        "jQuery",
        "Angular 1",
        "HTML",
        "CSS",
      ],
    },
  ],

  volunteering: [
    {
      organization: "LBRY Protocol",
      role: "Open Source Contributor",
      startDate: "2018-08",
      endDate: "2020-08",
      location: "Remote, US",
      description:
        "Developed and maintained an official Ruby API wrapper for the LBRY blockchain protocol, enabling developers to interact programmatically with the LBRY network.",
      highlights: [
        "Designed clean, idiomatic Ruby SDK to abstract low-level LBRY API calls",
        "Implemented request handling, response parsing, and error management",
        "Contributed production code via merged PRs across desktop (Electron/React), mobile (React Native), and shared Redux modules",
        "Collaborated through code reviews in distributed open-source environment",
      ],
      technologies: [
        "Ruby",
        "REST APIs",
        "JSON-RPC",
        "React",
        "React Native",
        "Redux",
      ],
      links: [
        {
          label: "LBRY API Wrappers",
          url: "https://lbry.tech/resources/api-wrappers",
        },
        {
          label: "Merged PRs",
          url: "https://github.com/search?q=org%3Albryio+dan1d&type=pullrequests",
        },
      ],
    },
  ],

  skills: [
    "Ruby on Rails",
    "React",
    "React Native",
    "Vue",
    "Angular",
    "Node.js",
    "TypeScript",
    "Python",
    "Go",
    "PostgreSQL",
    "Redis",
    "Elasticsearch",
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "REST APIs",
    "GraphQL",
    "RSpec",
    "Jest",
    "Cypress",
    "Sidekiq",
    "Apache Kafka",
  ],

  languages: [
    { language: "Spanish", level: "Native" },
    { language: "English", level: "Professional" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatDateRange(
  startDate: string,
  endDate: string | null
): string {
  const fmt = (d: string) => {
    const [year, month] = d.split("-");
    if (!month) return year;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };
  return `${fmt(startDate)} – ${endDate ? fmt(endDate) : "Present"}`;
}

export function getYearsOfExperience(): number {
  const start = new Date(2012, 1); // Feb 2012
  const now = new Date();
  return Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
}
