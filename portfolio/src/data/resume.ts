export type Resume = {
  basics: {
    name: string;
    title: string;
    location: string;
    email: string;
    availability: string;
    summary: string;
    links: {
      website?: string;
      github?: string;
      linkedin?: string;
      resumeUrl: string;
    };
  };
  highlights: string[];
  about: {
    tagline: string;
    bio: string;
    goals: string;
  };
  skills: Array<{ category: string; items: string[] }>;
  projects: Array<{
    name: string;
    description: string;
    tech: string[];
    links: { demo?: string; repo?: string };
  }>;
  experience: Array<{
    company: string;
    role: string;
    location: string;
    dates: string;
    highlights: string[];
    tech: string[];
  }>;
};

/**
 * Replace the placeholder content below with your real resume.
 * The chatbot reads from THIS file.
 */
export const resume: Resume = {
  basics: {
    name: "Avaneesh Madaram",
    title: "Machine Learning Engineer • Data Scientist • Full-Stack Developer",
    location: "Toronto, Ontario",
    email: "madaramavaneesh@gmail.com",
    availability: "Open to opportunities",
    summary:
      "Master’s candidate in Data Science & AI with strong foundations in full-stack development. Experienced in building predictive models, optimizing data pipelines, and shipping scalable web apps.",
    links: {
      github: "https://github.com/avaneesh-madaram",
      linkedin: "https://linkedin.com/in/avaneesh-madaram",
      resumeUrl: "https://example.com/AvaneeshResume.pdf",
    },
  },
  highlights: [
    "Masters in Data Science and AI (University of Waterloo)",
    "Bachelor of Science in Software Engineering (University of Ottawa)",
  ],
  about: {
    tagline: "",
    bio: `I am a software engineer and data scientist passionate about building intelligent systems. With a background in Applied Science and currently pursuing a Master's in Data Science at UWaterloo, I enjoy solving complex problems—whether it's optimizing underwriting models or building accessible front-end interfaces.`,
    goals: `I’m looking for a role where I can leverage both my engineering skills and data science expertise to build impactful, data-driven products.`,
  },
  skills: [
    {
      category: "Languages",
      items: [
        "Python",
        "SQL",
        "TypeScript",
        "JavaScript",
        "Java",
        "C++",
        "C#",
        "R",
        "SAS",
        "MATLAB",
      ],
    },
    {
      category: "Frameworks & Libraries",
      items: [
        "React",
        "Node.js",
        "NestJS",
        "Angular",
        "TensorFlow",
        "PyTorch",
        "Scikit-Learn",
        "Pandas",
        "Tailwind CSS",
      ],
    },
    {
      category: "Tools & Platforms",
      items: [
        "Git",
        "Docker",
        "AWS/GCP",
        "HuggingFace",
        "Tableau",
        "PowerBI",
        "Jira",
        "Figma",
      ],
    },
  ],
  projects: [
    {
      name: "LLM Normative Reasoning",
      description:
        "Built a multi-agent LLM pipeline with role-based prompts for debate and consensus, evaluating model performance on normative tasks.",
      tech: ["Python", "Llama 3.1/3.2", "Perplexity API"],
      links: {},
    },
    {
      name: "Twitter Sentiment Analysis",
      description:
        "Developed a sentiment analysis model for live social media data using Hugging Face transformers and a Streamlit dashboard.",
      tech: ["Python", "Hugging Face", "Streamlit", "Matplotlib"],
      links: {},
    },
    {
      name: "March Madness Prediction",
      description:
        "Evaluated Neural Network Models (MLP, GRU) to predict tournament outcomes with up to 89% accuracy.",
      tech: ["Python", "SciKit-Learn", "Pandas", "NumPy"],
      links: {},
    },
    {
      name: "Patient Management System",
      description:
        "Constructed a scalable database system for dentists, reducing appointment booking time by 75%.",
      tech: ["Node.js", "PostgreSQL", "Selenium", "GCP"],
      links: {},
    },
  ],
  experience: [
    {
      company: "Propel Holdings",
      role: "Data Scientist",
      location: "Toronto, Ontario",
      dates: "May 2025 — Aug 2025",
      highlights: [
        "Updated predictive underwriting models using XGBoost, increasing accuracy by 5%.",
        "Automated hyperparameter tuning via Optuna and reduced multicollinearity through feature pruning.",
        "Engineered a robust feature pipeline with optimal binning and outlier handling for production data.",
      ],
      tech: ["Python", "Scikit-Learn", "XGBoost", "Java"],
    },
    {
      company: "VectorSolv",
      role: "Full Stack Developer",
      location: "Gatineau, Quebec",
      dates: "May 2023 — Aug 2023",
      highlights: [
        "Developed a customer warranty page using Angular and NestJS, streamlining the claims process.",
        "Expanded email compatibility to broader devices, achieving a 50% increase in accessibility.",
        "Utilized RxJS observables to manage asynchronous operations and API calls.",
      ],
      tech: ["Angular", "NestJS", "RxJS", "Firebase"],
    },
    {
      company: "Statistics Canada (CHSP)",
      role: "Data Analyst",
      location: "Ottawa, Ontario",
      dates: "Sep 2022 — Dec 2022",
      highlights: [
        "Optimized SAS and SQL programs to eliminate over 10 months of data processing time.",
        "Integrated raw provincial housing data into a tool enabling remote execution of SAS processes.",
        "Contributed to the Standardization Team for high-priority data projects.",
      ],
      tech: ["SAS", "SQL", "Python"],
    },
    {
      company: "Statistics Canada (Electronic Questionnaire)",
      role: "Programmer Analyst",
      location: "Ottawa, Ontario",
      dates: "Jan 2021 — Aug 2021",
      highlights: [
        "Engineered and tested Electronic Questionnaire software for government clients using C# and JavaScript.",
        "Created a Python script to develop test cases, leading to a 50% decrease in testing time.",
        "Tested software using data pulled from SQL queries to validate employment rate calculations.",
        "Redesigned and tested software while working in an Agile environment.",
      ],
      tech: ["C#", "SQL", "jQuery", "Python"],
    },
    {
      company: "Software for Love",
      role: "Project Manager / Software Engineer",
      location: "Ottawa, Ontario",
      dates: "Apr 2020 — Mar 2023",
      highlights: [
        "Led the website redesign using Figma and Gatsby; initiated Agile practices for an 8-person team.",
        "Ensured >80% code coverage and implemented a donation page using Stripe.",
      ],
      tech: ["Gatsby", "React", "PostgreSQL", "Jira"],
    },
  ],
};
