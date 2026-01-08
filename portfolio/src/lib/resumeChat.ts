import type { Resume } from "../data/resume";
import {
  getEmbedding,
  getEmbeddings,
  cosineSimilarityEmbeddings,
  type EmbeddingVector,
} from "./embeddings";

type CorpusChunk = {
  id: string;
  title: string;
  text: string;
  embedding?: EmbeddingVector | null; // Cached embedding
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "he",
  "her",
  "hers",
  "him",
  "his",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "ours",
  "she",
  "so",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "too",
  "us",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const tokens = normalize(text).split(" ").filter(Boolean);
  return tokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Build corpus from structured resume data
 * Creates comprehensive chunks for RAG retrieval
 */
function buildCorpus(resume: Resume): CorpusChunk[] {
  const chunks: CorpusChunk[] = [];

  // Basics - comprehensive chunk
  chunks.push({
    id: "basics",
    title: "Basics",
    text: [
      `${resume.basics.name} — ${resume.basics.title}`,
      resume.basics.location,
      resume.basics.summary,
      resume.basics.availability,
      `Email: ${resume.basics.email}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  // Highlights as separate chunk
  if (resume.highlights && resume.highlights.length > 0) {
    chunks.push({
      id: "highlights",
      title: "Highlights",
      text: resume.highlights.join("\n"),
    });
  }

  // About section - split into more granular chunks
  if (resume.about.tagline) {
    chunks.push({
      id: "about-tagline",
      title: "About",
      text: resume.about.tagline,
    });
  }

  chunks.push({
    id: "about-bio",
    title: "About",
    text: resume.about.bio,
  });

  if (resume.about.goals) {
    chunks.push({
      id: "about-goals",
      title: "Career Goals",
      text: resume.about.goals,
    });
  }

  // Skills - overall chunk
  chunks.push({
    id: "skills-overview",
    title: "Skills Overview",
    text: resume.skills
      .map((g) => `${g.category}: ${g.items.join(", ")}`)
      .join("\n"),
  });

  // Individual skill category chunks for better matching
  resume.skills.forEach((skillGroup, idx) => {
    chunks.push({
      id: `skills-${idx}`,
      title: `Skills: ${skillGroup.category}`,
      text: `${skillGroup.category}: ${skillGroup.items.join(", ")}`,
    });

    // Individual skill items for very specific queries
    skillGroup.items.forEach((item, itemIdx) => {
      chunks.push({
        id: `skill-item-${idx}-${itemIdx}`,
        title: `Skill: ${item}`,
        text: `${item} is part of ${skillGroup.category} skills.`,
      });
    });
  });

  // Projects - comprehensive chunks
  resume.projects.forEach((p, idx) => {
    // Full project chunk
    chunks.push({
      id: `project-${idx}`,
      title: `Project: ${p.name}`,
      text: [
        `Project: ${p.name}`,
        p.description,
        `Technologies used: ${p.tech.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    // Individual tech stack items for better matching
    p.tech.forEach((tech, techIdx) => {
      chunks.push({
        id: `project-${idx}-tech-${techIdx}`,
        title: `Project: ${p.name}`,
        text: `${p.name} uses ${tech}. ${p.description}`,
      });
    });
  });

  // Experience - very granular chunks
  resume.experience.forEach((j, idx) => {
    // Full job chunk
    chunks.push({
      id: `job-${idx}`,
      title: `Experience: ${j.role} @ ${j.company}`,
      text: [
        `${j.company} — ${j.role}`,
        `Location: ${j.location}`,
        `Dates: ${j.dates}`,
        ...j.highlights,
        `Technologies: ${j.tech.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    // Individual highlight chunks for better matching
    j.highlights.forEach((highlight, hIdx) => {
      chunks.push({
        id: `job-${idx}-highlight-${hIdx}`,
        title: `Experience: ${j.role} @ ${j.company}`,
        text: [
          `${j.company} — ${j.role} (${j.dates})`,
          highlight,
          `Technologies: ${j.tech.join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    });

    // Individual tech items for each job
    j.tech.forEach((tech, techIdx) => {
      chunks.push({
        id: `job-${idx}-tech-${techIdx}`,
        title: `Experience: ${j.role} @ ${j.company}`,
        text: `At ${j.company} as ${j.role}, used ${tech}. ${j.highlights.join(
          " "
        )}`,
      });
    });
  });

  return chunks;
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let a2 = 0;
  let b2 = 0;
  for (const v of a.values()) a2 += v * v;
  for (const v of b.values()) b2 += v * v;
  if (a2 === 0 || b2 === 0) return 0;
  // iterate smaller map
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const [k, v] of small) dot += v * (big.get(k) ?? 0);
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  const n = tokens.length || 1;
  for (const [k, v] of m) m.set(k, v / n);
  return m;
}

function buildIdf(docs: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const docTokens of docs) {
    const seen = new Set(docTokens);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = docs.length || 1;
  const idf = new Map<string, number>();
  for (const [t, dft] of df) {
    idf.set(t, Math.log(1 + N / (1 + dft)));
  }
  return idf;
}

function tfidf(
  tfMap: Map<string, number>,
  idf: Map<string, number>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [t, v] of tfMap) out.set(t, v * (idf.get(t) ?? 0));
  return out;
}

function extractRelevantSentences(
  chunkText: string,
  queryTokens: string[],
  maxSentences = 3
): string[] {
  if (queryTokens.length === 0) {
    // If no query tokens, return first few sentences
    return chunkText
      .split(/\n+/)
      .flatMap((line) => line.split(/(?<=[.!?])\s+/))
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, maxSentences);
  }

  const sentences = chunkText
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const q = new Set(queryTokens);
  const scored = sentences
    .map((s) => {
      const toks = tokenize(s);
      let score = 0;
      for (const t of toks) if (q.has(t)) score += 1;
      // Also boost score if sentence is longer (more informative)
      const lengthBonus = Math.min(toks.length / 10, 0.5);
      return { s, score: score + lengthBonus };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, maxSentences).map((x) => x.s);
}

/**
 * Filter out unwanted content from snippets (contact info, etc.)
 */
function cleanSnippet(snippet: string): string {
  let cleaned = snippet;

  // Remove special characters that cause display issues first
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u0080-\u009F]/g, "");
  cleaned = cleaned.replace(/[•§#\u2022\u25CF]/g, " ");

  // Remove phone numbers
  cleaned = cleaned.replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, " ");
  cleaned = cleaned.replace(/\d{3}-\d{3}-\d{4}/g, " ");

  // Remove email addresses
  cleaned = cleaned.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    " "
  );

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, " ");

  // Remove LinkedIn/GitHub text artifacts
  cleaned = cleaned.replace(/(LinkedIn|GitHub)\s*[§#•]/gi, " ");
  cleaned = cleaned.replace(/\b(LinkedIn|GitHub)\b/gi, " ");

  // Remove name artifacts from header
  cleaned = cleaned.replace(/AVANEESH\s+MADARAM/gi, " ");

  // Fix broken words (space between letters)
  cleaned = cleaned.replace(/\s+([a-z])\s+([a-z])/gi, " $1$2");

  // Fix spacing around punctuation
  cleaned = cleaned.replace(/\s*([.,;:!?])\s*/g, "$1 ");

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Generate a concise answer for role/company-specific questions
 */
function generateConciseRoleAnswer(
  sources: Array<{ title: string; snippet: string }>
): string {
  // Filter out career goals and goal-related content
  const goalPatterns = [
    /looking for a role/i,
    /looking for/i,
    /leverage.*engineering.*data science/i,
    /leverage.*skills.*expertise/i,
    /build impactful/i,
    /data-driven products/i,
    /career goals/i,
    /goals/i,
    /seeking/i,
    /interested in/i,
  ];

  // Also filter out contact info patterns
  const contactPatterns = [
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // Phone numbers
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Emails
    /416-\d{3}-\d{4}/, // Specific phone pattern
    /madaramavaneesh@gmail\.com/i, // Email
  ];

  const filteredSources = sources
    .map((s) => ({
      ...s,
      snippet: cleanSnippet(s.snippet), // Clean snippets first
    }))
    .filter((s) => {
      const snippetLower = s.snippet.toLowerCase();
      // Exclude if empty after cleaning
      if (s.snippet.trim().length < 10) {
        return false;
      }
      // Exclude if title contains "Goals" or snippet contains goal patterns
      if (
        s.title.toLowerCase().includes("goal") ||
        goalPatterns.some((pattern) => pattern.test(snippetLower))
      ) {
        return false;
      }
      // Exclude if contains contact info
      if (
        contactPatterns.some((pattern) => pattern.test(s.snippet)) ||
        snippetLower.includes("416-294-1863") ||
        snippetLower.includes("madaramavaneesh@gmail.com") ||
        snippetLower.includes("linkedin") ||
        snippetLower.includes("github")
      ) {
        return false;
      }
      return true;
    });

  // Use filtered sources, or fall back to all sources if filtering removed everything
  const sourcesToUse = filteredSources.length > 0 ? filteredSources : sources;

  // Extract key information: role, company, dates, key highlights
  const allText = sourcesToUse.map((s) => s.snippet).join(" ");

  // Remove goal-related sentences from allText
  let cleanedText = allText;
  goalPatterns.forEach((pattern) => {
    cleanedText = cleanedText
      .split(/[.!?]+\s+/)
      .filter((sentence) => !pattern.test(sentence.toLowerCase()))
      .join(". ");
  });

  // Try to extract role and company
  const roleMatch = cleanedText.match(
    /(?:Data Scientist|Full Stack Developer|Full-Stack Developer|Data Analyst|Programmer Analyst|Software Engineer|Project Manager)[^.]*/i
  );
  const companyMatch = cleanedText.match(
    /(Propel Holdings|VectorSolv|Statistics Canada|Software for Love|SoftwareForLove)[^.]*/i
  );
  const dateMatch = cleanedText.match(
    /(\w+ \d{4} - \w+ \d{4}|\w+ \d{4} — \w+ \d{4})/
  );

  const parts: string[] = [];

  if (roleMatch && companyMatch) {
    parts.push(`${roleMatch[0]} at ${companyMatch[0]}`);
  }

  if (dateMatch) {
    parts.push(dateMatch[1]);
  }

  // Extract and summarize key accomplishments instead of raw bullets
  const sentences = cleanedText.split(/[.!?]+\s+/).filter((s) => {
    const trimmed = s.trim();
    const hasGoalContent = goalPatterns.some((pattern) =>
      pattern.test(trimmed.toLowerCase())
    );
    return trimmed.length > 20 && trimmed.length < 300 && !hasGoalContent;
  });

  // Look for accomplishment patterns
  const accomplishmentPatterns = [
    /(?:increased|improved|achieved|reduced|developed|built|created|led|optimized|automated|applied|updated)/i,
    /(?:using|via|through|with).*(?:XGBoost|machine learning|model|algorithm|system|tool|framework)/i,
  ];

  const keyAccomplishments = sentences
    .filter((s) => accomplishmentPatterns.some((pattern) => pattern.test(s)))
    .slice(0, 3)
    .map((s) => {
      let cleaned = s.trim().replace(/^[-•]\s*/, "");
      if (!cleaned.endsWith(".")) {
        cleaned += ".";
      }
      return cleaned;
    });

  if (keyAccomplishments.length > 0) {
    // Create a natural summary
    if (parts.length > 0) {
      parts.push("");
    }
    parts.push(
      `Key accomplishments included: ${keyAccomplishments
        .slice(0, 2)
        .join(" ")}`
    );
  } else {
    // Fallback: summarize key responsibilities
    const keyResponsibilities = sentences
      .filter((s) => {
        const lower = s.toLowerCase();
        return (
          lower.includes("worked") ||
          lower.includes("developed") ||
          lower.includes("implemented") ||
          lower.includes("designed") ||
          lower.includes("created") ||
          lower.includes("built") ||
          lower.includes("optimized") ||
          lower.includes("automated")
        );
      })
      .slice(0, 4) // Include more responsibilities for comprehensive answer
      .map((s) => {
        let cleaned = s.trim().replace(/^[-•]\s*/, "");
        if (!cleaned.endsWith(".")) {
          cleaned += ".";
        }
        return cleaned;
      });

    if (keyResponsibilities.length > 0) {
      if (parts.length > 0) {
        parts.push("");
      }
      // Format as a comprehensive numbered list
      const responsibilitiesText = keyResponsibilities
        .slice(0, 4)
        .map((resp, idx) => `${idx + 1}. ${resp}`)
        .join("\n");
      parts.push(`Key responsibilities included:\n${responsibilitiesText}`);
    }
  }

  // If we have a good summary, return it
  if (parts.length > 1) {
    return parts.join("\n");
  }

  // Fallback: create a simple summary from snippets
  const cleanedSnippets = sourcesToUse
    .map((s) => cleanSnippet(s.snippet.trim()))
    .filter((snippet) => {
      const hasGoalContent = goalPatterns.some((pattern) =>
        pattern.test(snippet.toLowerCase())
      );
      return !hasGoalContent && snippet.length > 20;
    });

  if (cleanedSnippets.length > 0) {
    // Create a comprehensive summary from multiple snippets
    // Combine multiple snippets for a more detailed answer
    const combinedSnippets = cleanedSnippets
      .slice(0, 5) // Use up to 5 snippets for comprehensive answers
      .map((snippet) => {
        const words = snippet.split(/\s+/);
        // Keep more content for comprehensive answers (don't truncate as aggressively)
        if (words.length > 100) {
          return words.slice(0, 100).join(" ") + "...";
        }
        return snippet;
      })
      .filter((s) => s.length > 20);

    if (combinedSnippets.length > 1) {
      return combinedSnippets.join("\n\n");
    }
    return (
      combinedSnippets[0] ||
      "I found information about this role, but couldn't extract specific details."
    );
  }

  return "I found information about this role, but couldn't extract specific details.";
}

/**
 * Generate answer specifically for skills/languages questions
 */
function generateSkillsAnswer(
  sources: Array<{ title: string; snippet: string }>
): string {
  // Clean all snippets first
  const cleanedSources = sources
    .map((s) => ({
      title: s.title,
      snippet: cleanSnippet(s.snippet),
    }))
    .filter((s) => {
      // Filter out contact info and irrelevant content
      const snippetLower = s.snippet.toLowerCase();
      return (
        s.snippet.length > 10 &&
        !snippetLower.includes("@") &&
        !snippetLower.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) &&
        !snippetLower.includes("university of") &&
        !snippetLower.includes("education") &&
        !snippetLower.includes("master") &&
        !snippetLower.includes("bachelor")
      );
    });

  if (cleanedSources.length === 0) {
    return "I couldn't find specific information about programming languages in the resume.";
  }

  const allText = cleanedSources.map((s) => s.snippet).join(" ");

  // Extract languages from common patterns
  const languages = [
    "Python",
    "SQL",
    "R",
    "SAS",
    "TypeScript",
    "JavaScript",
    "Java",
    "C++",
    "C#",
    ".NET",
    "MATLAB",
  ];

  const foundLanguages = languages.filter((lang) =>
    allText.toLowerCase().includes(lang.toLowerCase())
  );

  // Also try to extract from "Languages:" pattern
  const languagesMatch = allText.match(
    /Languages:\s*([^:]+?)(?:\n|$|Frameworks|Technologies|Tools)/i
  );
  if (languagesMatch) {
    const langText = languagesMatch[1];
    const extractedLangs = langText
      .split(/[,•\n]/)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.length > 1 && l.length < 20 && !l.includes("@") && !l.match(/\d/)
      )
      .filter(
        (l) =>
          !l.toLowerCase().includes("university") &&
          !l.toLowerCase().includes("education")
      );

    // Combine found languages
    const allFoundLangs = [...new Set([...foundLanguages, ...extractedLangs])];

    if (allFoundLangs.length > 0) {
      return `Programming languages include: ${allFoundLangs.join(", ")}.`;
    }
  }

  if (foundLanguages.length > 0) {
    return `Programming languages include: ${foundLanguages.join(", ")}.`;
  }

  // Fallback: return cleaned summary
  const summary = cleanedSources[0].snippet;
  if (summary.length > 200) {
    return summary.substring(0, 200) + "...";
  }
  return summary;
}

/**
 * Generate a natural, summarized answer from retrieved sources
 * Creates conversational summaries instead of raw snippets
 */
function generateAnswer(
  sources: Array<{ title: string; snippet: string }>,
  resume: Resume
): string {
  const nameTitleRegex = new RegExp(
    `^${resume.basics.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}\\s*—\\s*[^\\n]+`,
    "i"
  );

  // Clean and prepare snippets
  const cleanedSnippets = sources
    .map((s) => {
      let snippet = cleanSnippet(s.snippet.trim());
      // Remove name/title prefix if present
      snippet = snippet.replace(nameTitleRegex, "").trim();
      // Remove leading/trailing separators
      snippet = snippet.replace(/^[—\-\s]+/, "").trim();
      return { title: s.title, snippet };
    })
    .filter((s) => s.snippet.length > 15);

  if (cleanedSnippets.length === 0) {
    return "I couldn't find specific information about that topic in the resume.";
  }

  // Group by section type
  const grouped = new Map<string, string[]>();
  cleanedSnippets.forEach((s) => {
    const key = s.title.toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(s.snippet);
  });

  // Generate summaries based on section types
  const summaries: string[] = [];

  // Education summary
  const educationSnippets = Array.from(grouped.entries())
    .filter(([key]) => key.includes("education") || key.includes("university"))
    .flatMap(([, snippets]) => snippets);

  if (educationSnippets.length > 0) {
    const eduText = educationSnippets.join(" ");
    const universities = [
      ...new Set(eduText.match(/University of (Waterloo|Ottawa)/gi) || []),
    ];
    const degrees = [
      ...new Set(
        eduText.match(
          /(Master'?s?|Bachelor'?s?|Bachelor of [^,]+|Master'?s? in [^,]+)/gi
        ) || []
      ),
    ];

    if (universities.length > 0 || degrees.length > 0) {
      let eduSummary = "Education background includes ";
      if (degrees.length > 0) {
        eduSummary += degrees.join(" and ");
      }
      if (universities.length > 0) {
        eduSummary += ` from ${universities.join(" and ")}`;
      }
      eduSummary +=
        ". This educational foundation combines advanced data science and artificial intelligence training with a strong software engineering background, enabling a unique blend of analytical and technical skills.";
      summaries.push(eduSummary);
    }
  }

  // Skills summary - handle languages and skills questions specifically
  const skillsSnippets = Array.from(grouped.entries())
    .filter(
      ([key]) =>
        key.includes("skill") ||
        key.includes("language") ||
        key.includes("framework") ||
        key.includes("tool")
    )
    .flatMap(([, snippets]) => snippets);

  if (skillsSnippets.length > 0) {
    const skillsText = skillsSnippets.join(" ");

    // Extract all programming languages mentioned
    const allLanguages = [
      "Python",
      "SQL",
      "R",
      "SAS",
      "TypeScript",
      "JavaScript",
      "Java",
      "C++",
      "C#",
      ".NET",
      "MATLAB",
      "React",
      "Node.js",
      "NestJS",
      "Angular",
      "TensorFlow",
      "PyTorch",
      "Scikit-Learn",
      "Pandas",
      "NumPy",
      "Hadoop",
      "Spark",
      "GGPlot",
      "Matplotlib",
      "Seaborn",
      "Tailwind CSS",
      "RxJS",
      "OpenAI API",
      "Lang Chain",
      "Git",
      "Tableau",
      "PowerBI",
      "Docker",
      "Jira",
      "Confluence",
      "Figma",
    ];

    const mentionedLanguages = allLanguages.filter((lang) =>
      skillsText.toLowerCase().includes(lang.toLowerCase())
    );

    if (mentionedLanguages.length > 0) {
      // Check if question is specifically about languages

      // Group languages by category
      const programmingLanguages = mentionedLanguages.filter((lang) =>
        [
          "Python",
          "SQL",
          "R",
          "SAS",
          "TypeScript",
          "JavaScript",
          "Java",
          "C++",
          "C#",
          ".NET",
          "MATLAB",
        ].includes(lang)
      );

      if (programmingLanguages.length > 0) {
        const langList = programmingLanguages.join(", ");
        summaries.push(
          `Programming languages include ${langList}. These skills demonstrate expertise across data science (Python, R, SQL), statistical computing (SAS, MATLAB), and software development (TypeScript, JavaScript, Java, C++, C#), showcasing versatility in both analytical and engineering domains.`
        );
      } else {
        // Fallback to all mentioned tech
        const techList =
          mentionedLanguages.length > 8
            ? `${mentionedLanguages.slice(0, 8).join(", ")}, and more`
            : mentionedLanguages.join(", ");
        summaries.push(`Technical skills include ${techList}.`);
      }
    } else {
      // Try to extract from "Languages:" pattern in text
      const languagesMatch = skillsText.match(
        /Languages:\s*([^:]+?)(?:\n|$|Languages|Frameworks|Technologies)/i
      );
      if (languagesMatch) {
        const langText = languagesMatch[1];
        const extractedLangs = langText
          .split(/[,•\n]/)
          .map((l) => l.trim())
          .filter((l) => l.length > 1 && l.length < 20)
          .slice(0, 10);
        if (extractedLangs.length > 0) {
          summaries.push(
            `Programming languages include ${extractedLangs.join(", ")}.`
          );
        }
      }
    }
  }

  // Experience summary
  const experienceSnippets = Array.from(grouped.entries())
    .filter(
      ([key]) =>
        key.includes("experience") ||
        key.includes("work") ||
        key.includes("job")
    )
    .flatMap(([, snippets]) => snippets);

  if (experienceSnippets.length > 0) {
    const expText = experienceSnippets.join(" ");
    // Extract companies and roles
    const companies = [
      ...new Set(
        (expText.match(
          /(Propel Holdings|VectorSolv|Statistics Canada|Software for Love)/gi
        ) || []) as string[]
      ),
    ];
    const roles = [
      ...new Set(
        (expText.match(
          /(Data Scientist|Full Stack Developer|Data Analyst|Programmer Analyst|Software Engineer|Project Manager)/gi
        ) || []) as string[]
      ),
    ];

    if (companies.length > 0 || roles.length > 0) {
      let expSummary = "Work experience includes ";
      if (roles.length > 0) {
        const rolesList =
          roles.length > 3
            ? `${roles.slice(0, 3).join(", ")}, and more`
            : roles.join(", ");
        expSummary += `roles as ${rolesList}`;
      }
      if (companies.length > 0) {
        const companiesList =
          companies.length > 3
            ? `${companies.slice(0, 3).join(", ")}, and more`
            : companies.join(", ");
        expSummary += ` at ${companiesList}`;
      }
      expSummary +=
        ". This experience spans data science, software development, and analytics roles across various industries.";
      summaries.push(expSummary);
    }
  }

  // Projects summary
  const projectSnippets = Array.from(grouped.entries())
    .filter(([key]) => key.includes("project"))
    .flatMap(([, snippets]) => snippets);

  if (projectSnippets.length > 0) {
    const projText = projectSnippets.join(" ");
    // Extract project names or descriptions
    const projectKeywords = [
      "LLM",
      "Sentiment Analysis",
      "March Madness",
      "Database",
      "Patient Management",
    ];
    const mentionedProjects = projectKeywords.filter((keyword) =>
      projText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (mentionedProjects.length > 0) {
      const projectList = mentionedProjects.join(", ");
      summaries.push(
        `Notable projects include work on ${projectList}. These projects span machine learning applications, data analysis, and full-stack development, demonstrating hands-on experience building end-to-end solutions.`
      );
    }
  }

  // If we have summaries, use them; otherwise create a general summary
  if (summaries.length > 0) {
    return summaries.join(" ");
  }

  // Fallback: create a comprehensive summary from key snippets
  const keySnippets = cleanedSnippets.slice(0, 5).map((s) => {
    // Keep more comprehensive snippets for detailed answers
    const words = s.snippet.split(/\s+/);
    if (words.length > 60) {
      return words.slice(0, 60).join(" ") + "...";
    }
    return s.snippet;
  });

  // Combine snippets into a comprehensive answer
  if (keySnippets.length > 1) {
    return keySnippets.join("\n\n");
  }
  return (
    keySnippets[0] || "I couldn't find specific information about that topic."
  );
}

/**
 * Generate suggested questions based on resume content
 */
function generateSuggestedQuestions(resume: Resume): string[] {
  const allTechForSuggestions = [
    ...resume.experience.flatMap((e) => e.tech),
    ...resume.projects.flatMap((p) => p.tech),
  ];
  const techCounts = new Map<string, number>();
  allTechForSuggestions.forEach((tech) => {
    techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
  });
  const topTech = Array.from(techCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tech]) => tech);

  const recentJob = resume.experience[0];
  return [
    `What is ${resume.basics.name}'s background and experience?`,
    topTech[0]
      ? `What experience does ${resume.basics.name} have with ${topTech[0]}?`
      : "What technologies has the candidate worked with?",
    recentJob
      ? `Tell me about the role at ${recentJob.company}`
      : "What is the most recent work experience?",
    `What are ${resume.basics.name}'s key skills and strengths?`,
  ];
}

export type ChatAnswer = {
  answer: string;
  sources: Array<{ title: string; snippet: string }>;
  suggestedQuestions: string[];
};

/**
 * RAG-based answer generation using semantic embeddings
 * Uses structured resume data for clean, reliable information
 * Falls back to TF-IDF if embeddings are unavailable
 */
export async function answerFromResumeRAG(
  question: string,
  resume: Resume
): Promise<ChatAnswer> {
  // Check if this is a skills/languages question
  const isSkillsQuestion =
    /(?:what.*language|what.*skill|which.*language|which.*skill|languages.*know|skills.*have|programming.*language)/i.test(
      question
    );

  // Check if this is a role/company-specific question
  const isRoleQuestion =
    /(?:tell me about|what.*at|role at|work at|experience at|job at|position at|about.*role)/i.test(
      question
    );

  // Always use structured resume data - it's cleaner, more reliable, and properly formatted
  const corpus = buildCorpus(resume);

  // Try to get embeddings for question and corpus
  const questionEmbedding = await getEmbedding(question);

  if (questionEmbedding) {
    // Use semantic embeddings for retrieval
    const corpusTexts = corpus.map((c) => c.text);
    const corpusEmbeddings = await getEmbeddings(corpusTexts);

    // Score chunks using cosine similarity
    const scored = corpus
      .map((chunk, idx) => {
        const embedding = corpusEmbeddings[idx];
        if (!embedding) {
          return { chunk, score: 0 };
        }
        const score = cosineSimilarityEmbeddings(questionEmbedding, embedding);
        return { chunk, score };
      })
      .sort((a, b) => b.score - a.score);

    // For role questions, use fewer chunks and higher threshold for conciseness
    // For other questions, use more chunks but still filter by relevance
    const topCount = isRoleQuestion ? 3 : 10; // Get more candidates for non-role questions
    const threshold = isRoleQuestion ? 0.15 : 0.12; // Slightly higher threshold for better quality
    let top = scored
      .slice(0, topCount * 2) // Look at more candidates first
      .filter((x) => x.score > threshold)
      .slice(0, topCount); // Then take top N

    // For role questions, filter out goal-related chunks
    if (isRoleQuestion) {
      const goalKeywords = [
        "looking for",
        "leverage",
        "career goals",
        "goals",
        "seeking",
        "interested in",
        "build impactful",
      ];
      top = top.filter((item) => {
        const textLower = item.chunk.text.toLowerCase();
        const titleLower = item.chunk.title.toLowerCase();
        return (
          !titleLower.includes("goal") &&
          !goalKeywords.some((keyword) => textLower.includes(keyword))
        );
      });
    }

    if (top.length > 0) {
      const questionTokens = tokenize(question);
      const sources = top
        .map((t) => {
          // Clean chunk text first
          let chunkText = cleanSnippet(t.chunk.text);

          // Skip chunks that are mostly contact info or header material
          const chunkLower = chunkText.toLowerCase();
          const isContactInfo =
            /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(chunkText) ||
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(chunkText) ||
            chunkLower.includes("416-294-1863") ||
            chunkLower.includes("madaramavaneesh@gmail.com") ||
            (chunkLower.includes("linkedin") && chunkText.length < 50) ||
            (chunkLower.includes("github") && chunkText.length < 50) ||
            (chunkText.length < 30 && /^[\w\s]+$/.test(chunkText)); // Short all-text chunks are likely headers

          if (isContactInfo) {
            return null;
          }

          // For role questions, extract fewer sentences
          const maxSentences = isRoleQuestion ? 2 : 4; // More sentences for better context
          const sents = extractRelevantSentences(
            chunkText,
            questionTokens,
            maxSentences
          );

          // If we have relevant sentences, use them
          if (sents.length > 0) {
            const snippet = cleanSnippet(sents.join(" "));
            // Double-check snippet isn't contact info
            if (
              snippet.length > 10 &&
              !snippet.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) &&
              !snippet.includes("@")
            ) {
              return {
                title: t.chunk.title,
                snippet: snippet,
              };
            }
          }

          // Otherwise, prioritize content with question keywords
          const lines = chunkText.split("\n").filter(Boolean);
          const relevantLines = lines.filter((line) => {
            const cleaned = cleanSnippet(line);
            // Skip contact info lines
            if (
              cleaned.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) ||
              cleaned.includes("@") ||
              cleaned.toLowerCase().includes("linkedin") ||
              cleaned.toLowerCase().includes("github") ||
              cleaned.length < 10
            ) {
              return false;
            }
            const lineLower = cleaned.toLowerCase();
            return questionTokens.some((token) =>
              lineLower.includes(token.toLowerCase())
            );
          });

          // Use relevant lines if found, otherwise first few lines (but exclude contact info)
          const allFilteredLines = lines.filter((line) => {
            const cleaned = cleanSnippet(line);
            return (
              cleaned.length > 15 && // Minimum meaningful length
              !cleaned.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) && // No phone
              !cleaned.includes("@") && // No email
              !cleaned.toLowerCase().includes("linkedin") && // No LinkedIn
              !cleaned.toLowerCase().includes("github") // No GitHub
            );
          });

          const snippetLines =
            relevantLines.length > 0
              ? relevantLines.slice(0, isRoleQuestion ? 2 : 3)
              : allFilteredLines.slice(0, isRoleQuestion ? 2 : 4);

          if (snippetLines.length === 0) {
            return null;
          }

          const snippet = cleanSnippet(snippetLines.join(" "));
          if (snippet.length < 15) {
            return null;
          }

          return {
            title: t.chunk.title,
            snippet: snippet,
          };
        })
        .filter(
          (s): s is { title: string; snippet: string } =>
            s !== null &&
            s.snippet.trim().length > 15 &&
            !s.snippet.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) &&
            !s.snippet.includes("@")
        );

      const uniqueSources = sources.filter(
        (s, idx, arr) =>
          arr.findIndex((other) => other.snippet === s.snippet) === idx
      );

      if (uniqueSources.length > 0) {
        // Generate comprehensive answers based on question type
        let answer: string;
        if (isRoleQuestion) {
          answer = generateConciseRoleAnswer(uniqueSources);
        } else if (isSkillsQuestion) {
          // Special handling for skills/languages questions
          answer = generateSkillsAnswer(uniqueSources);
        } else {
          // Use generateAnswer for comprehensive, well-formatted responses
          try {
            answer = generateAnswer(uniqueSources, resume);
          } catch {
            // Fallback: create comprehensive answer from sources
            const cleanedSnippets = uniqueSources
              .map((s) => cleanSnippet(s.snippet))
              .filter(
                (s) =>
                  s.length > 20 &&
                  !s.includes("@") &&
                  !s.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)
              );

            if (cleanedSnippets.length > 0) {
              // Combine snippets into a comprehensive answer
              answer = cleanedSnippets
                .slice(0, 5) // Use up to 5 snippets for comprehensive answers
                .map((s) => {
                  // Make each snippet a paragraph - keep more content for comprehensive answers
                  const words = s.split(/\s+/);
                  const truncated =
                    words.length > 80
                      ? words.slice(0, 80).join(" ") + "..."
                      : s;
                  return truncated;
                })
                .join("\n\n");
            } else {
              answer =
                "I couldn't find specific information about that topic in the resume.";
            }
          }
        }

        const suggestedQuestions = generateSuggestedQuestions(resume);
        return { answer, sources: uniqueSources, suggestedQuestions };
      }
    }
  }

  // Fallback to TF-IDF if embeddings failed or no good matches
  return answerFromResumeTFIDF(question, resume, corpus);
}

/**
 * Main entry point - tries RAG first, falls back to TF-IDF
 * This function is async to support RAG, but can be called synchronously
 * (it will use TF-IDF fallback immediately)
 */
export async function answerFromResumeAsync(
  question: string,
  resume: Resume
): Promise<ChatAnswer> {
  try {
    return await answerFromResumeRAG(question, resume);
  } catch (error) {
    console.warn("RAG failed, using TF-IDF fallback:", error);
    // Build corpus from structured resume data
    const corpus = buildCorpus(resume);
    return await answerFromResumeTFIDF(question, resume, corpus);
  }
}

/**
 * Synchronous TF-IDF based answer generation (fallback)
 * Uses structured resume data (synchronous)
 */
export function answerFromResume(question: string, resume: Resume): ChatAnswer {
  // For backward compatibility, use structured resume data synchronously
  const corpus = buildCorpus(resume);
  return answerFromResumeTFIDFSync(question, corpus, resume);
}

/**
 * TF-IDF based answer generation (fallback when RAG embeddings unavailable)
 * Pure corpus-based approach - same as RAG but uses keyword matching instead of embeddings
 * Always uses structured resume data
 */
async function answerFromResumeTFIDF(
  question: string,
  resume: Resume,
  corpus?: CorpusChunk[]
): Promise<ChatAnswer> {
  // Build corpus from structured resume data if not provided
  if (!corpus) {
    corpus = buildCorpus(resume);
  }

  return answerFromResumeTFIDFSync(question, corpus, resume);
}

/**
 * Synchronous TF-IDF answer generation (internal helper)
 */
function answerFromResumeTFIDFSync(
  question: string,
  corpus: CorpusChunk[],
  resume: Resume
): ChatAnswer {
  const docsTokens = corpus.map((c) => tokenize(c.text));
  const idf = buildIdf(docsTokens);

  const qTokens = tokenize(question);
  const qVec = tfidf(tf(qTokens), idf);

  const scored = corpus
    .map((c, idx) => {
      const dVec = tfidf(tf(docsTokens[idx] ?? []), idf);
      return { chunk: c, score: cosineSimilarity(qVec, dVec) };
    })
    .sort((a, b) => b.score - a.score);

  // Lower threshold and get more results for better coverage
  const top = scored.slice(0, 5).filter((x) => x.score > 0.02);
  const sources = top
    .map((t) => {
      const sents = extractRelevantSentences(t.chunk.text, qTokens, 3);
      return {
        title: t.chunk.title,
        snippet: sents.length
          ? sents.join(" ")
          : t.chunk.text.split("\n").slice(0, 3).join(" "),
      };
    })
    .filter((s) => s.snippet.trim().length > 0);

  // Remove duplicate snippets (same content from different chunks)
  const uniqueSources = sources.filter(
    (s, idx, arr) =>
      arr.findIndex((other) => other.snippet === s.snippet) === idx
  );

  const suggestedQuestions = generateSuggestedQuestions(resume);

  if (uniqueSources.length === 0) {
    return {
      answer:
        "I couldn't find that information in the resume. Try asking about skills, projects, experience, technologies, or background.",
      sources: [],
      suggestedQuestions,
    };
  }

  // For PDF-based corpus, generate answer directly from sources
  // For structured resume, use generateAnswer helper
  let answer: string;
  try {
    answer = generateAnswer(uniqueSources, resume);
  } catch {
    // Fallback if generateAnswer fails (e.g., PDF corpus)
    answer = uniqueSources
      .map((s) => s.snippet)
      .filter(Boolean)
      .join("\n\n");
  }

  return { answer, sources: uniqueSources, suggestedQuestions };
}
