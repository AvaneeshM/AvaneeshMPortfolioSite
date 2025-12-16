export type Resume = {
  basics: {
    name: string
    title: string
    location: string
    email: string
    availability: string
    summary: string
    links: {
      website?: string
      github?: string
      linkedin?: string
      resumeUrl: string
    }
  }
  highlights: string[]
  about: {
    tagline: string
    bio: string
    goals: string
  }
  skills: Array<{ category: string; items: string[] }>
  projects: Array<{
    name: string
    description: string
    tech: string[]
    links: { demo?: string; repo?: string }
  }>
  experience: Array<{
    company: string
    role: string
    location: string
    dates: string
    highlights: string[]
    tech: string[]
  }>
}

/**
 * Replace the placeholder content below with your real resume.
 * The chatbot reads from THIS file.
 */
export const resume: Resume = {
  basics: {
    name: 'Your Name',
    title: 'Software Engineer • Frontend / Full‑Stack',
    location: 'City, Country',
    email: 'you@example.com',
    availability: 'Open to opportunities',
    summary:
      'I build fast, accessible web apps and ship features end-to-end. I care about product quality, clean architecture, and measurable impact.',
    links: {
      website: 'https://your-site.com',
      github: 'https://github.com/your-handle',
      linkedin: 'https://linkedin.com/in/your-handle',
      resumeUrl: 'https://example.com/your-resume.pdf',
    },
  },
  highlights: [
    '5+ years building production web apps',
    'React + TypeScript specialist',
    'Performance, accessibility, and design systems',
    'API integration + backend fundamentals',
  ],
  about: {
    tagline: 'A product-minded engineer who likes shipping.',
    bio: `I enjoy turning ambiguous problems into simple, delightful experiences. I’ve worked across frontend, backend, and infrastructure enough to move quickly and collaborate well.`,
    goals: `I’m looking for a team where I can own features, mentor/learn, and build products that customers love.`,
  },
  skills: [
    { category: 'Frontend', items: ['React', 'TypeScript', 'Vite', 'Next.js', 'HTML', 'CSS', 'Accessibility'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'REST APIs', 'PostgreSQL', 'Prisma', 'Auth'] },
    { category: 'Tooling', items: ['Git', 'CI/CD', 'Testing', 'Playwright', 'Jest', 'Docker'] },
  ],
  projects: [
    {
      name: 'Project Alpha',
      description: 'A responsive SaaS dashboard with role-based access, charts, and an activity feed.',
      tech: ['React', 'TypeScript', 'Charting', 'REST'],
      links: { demo: 'https://example.com', repo: 'https://github.com/your-handle/project-alpha' },
    },
    {
      name: 'Project Beta',
      description: 'A lightweight knowledge base app with fast search and offline-first reading mode.',
      tech: ['React', 'IndexedDB', 'Search'],
      links: { repo: 'https://github.com/your-handle/project-beta' },
    },
    {
      name: 'Project Gamma',
      description: 'An internal tool that automated reporting and reduced manual ops work.',
      tech: ['Node.js', 'PostgreSQL', 'Cron'],
      links: {},
    },
  ],
  experience: [
    {
      company: 'Company Name',
      role: 'Senior Software Engineer',
      location: 'Remote',
      dates: '2022 — Present',
      highlights: [
        'Led a redesign that improved conversion and reduced support tickets.',
        'Built shared UI components and improved accessibility across core flows.',
        'Improved performance (LCP/TTI) by optimizing bundles and data fetching.',
      ],
      tech: ['React', 'TypeScript', 'Design Systems', 'Performance'],
    },
    {
      company: 'Previous Company',
      role: 'Software Engineer',
      location: 'City, Country',
      dates: '2019 — 2022',
      highlights: [
        'Shipped features end-to-end with product and design partners.',
        'Integrated APIs and improved reliability with better error handling and observability.',
      ],
      tech: ['React', 'Node.js', 'REST', 'Testing'],
    },
  ],
}

