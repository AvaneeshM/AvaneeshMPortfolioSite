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
      "Master's in Data Science and AI Student with a background in Software Engineering. Experienced in building predictive models, optimizing data pipelines, and shipping scalable web apps.",
    links: {
      github: "https://github.com/avaneesh-madaram",
      linkedin: "https://linkedin.com/in/avaneesh-madaram",
      resumeUrl: "https://example.com/AvaneeshResume.pdf",
    },
  },
  highlights: [
    "Master's in Data Science and AI (University of Waterloo)",
    "Bachelor's of Applied Science in Software Engineering (University of Ottawa)",
  ],
  about: {
    tagline: "",
    bio: `As a recent Master's graduate in Data Science & AI, I work at the intersection of engineering and analytics. I enjoy leveraging my background in software engineering to build robust data products. Whether it's crafting intuitive front-end interfaces or optimizing backend data logic, I am eager to apply my skills in Python, web development, and AI to tackle challenging real-world problems.`,
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
        "Built a multi-agent LLM system with specialized roles for reasoning and decision-making. Focused on prompt engineering, model evaluation, and ethical AI applications.",
      tech: ["Python", "Llama 3.1/3.2", "Perplexity API"],
      links: {},
    },
    {
      name: "Twitter Sentiment Analysis",
      description:
        "Developed an end-to-end NLP project from data collection to visualization. Fine-tuned transformer models and created an interactive dashboard for real-time sentiment tracking.",
      tech: ["Python", "Hugging Face", "Streamlit", "Matplotlib"],
      links: {},
    },
    {
      name: "March Madness Prediction",
      description:
        "Engineered a machine learning model to predict tournament outcomes using historical sports data. Experimented with different neural network architectures and evaluated model performance",
      tech: ["Python", "SciKit-Learn", "Pandas", "NumPy"],
      links: {},
    },
    {
      name: "Patient Management System",
      description:
        "Designed and built a full-stack database application for healthcare workflow optimization. Demonstrated expertise in backend logic, database design, and cloud deployment.",
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
        "Applied machine learning and statistical techniques to improve predictive modeling. Worked with feature engineering, model optimization, and interpretation tools to enhance model performance and drive data-driven business decisions.",
      ],
      tech: ["Python", "Scikit-Learn", "XGBoost", "Java"],
    },
    {
      company: "VectorSolv",
      role: "Full Stack Developer",
      location: "Gatineau, Quebec",
      dates: "May 2023 — Aug 2023",
      highlights: [
        "Developed user-facing web applications using modern frontend and backend frameworks. Focused on creating accessible, responsive interfaces and maintaining clean, testable code across the stack.",
      ],
      tech: ["Angular", "NestJS", "RxJS", "Firebase"],
    },
    {
      company: "Statistics Canada (CHSP)",
      role: "Data Analyst",
      location: "Ottawa, Ontario",
      dates: "Sep 2022 — Dec 2022",
      highlights: [
        "Optimized data processing workflows and pipelines. Integrated and transformed large datasets, collaborated with cross-functional teams, and contributed to critical data standardization initiatives.",
      ],
      tech: ["SAS", "SQL", "Python"],
    },
    {
      company: "Statistics Canada (Electronic Questionnaire)",
      role: "Programmer Analyst",
      location: "Ottawa, Ontario",
      dates: "Jan 2021 — Aug 2021",
      highlights: [
        "Built and tested software applications for government systems. Created automation tools to improve development efficiency and worked in agile environments to deliver robust solutions.",
      ],
      tech: ["C#", "SQL", "jQuery", "Python"],
    },
    {
      company: "Software for Love",
      role: "Project Manager / Software Engineer",
      location: "Ottawa, Ontario",
      dates: "Apr 2020 — Mar 2023",
      highlights: [
        "Led product redesigns and managed a team in an agile setting. Implemented features end-to-end using modern web technologies, ensuring high code quality and reliability.",
      ],
      tech: ["Gatsby", "React", "PostgreSQL", "Jira"],
    },
  ],
};
