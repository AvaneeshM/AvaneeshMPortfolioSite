import type { Resume } from "../data/resume";

type CorpusChunk = {
  id: string;
  title: string;
  text: string;
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

export type ChatAnswer = {
  answer: string;
  sources: Array<{ title: string; snippet: string }>;
  suggestedQuestions: string[];
};

export function answerFromResume(question: string, resume: Resume): ChatAnswer {
  // First check for technology-specific queries (before background check)
  // Check for direct technology mentions in the question
  const allTech = [
    ...resume.experience.flatMap((e) => e.tech),
    ...resume.projects.flatMap((p) => p.tech),
    ...resume.skills.flatMap((s) => s.items),
  ];

  // Normalize tech names for matching (case-insensitive, handle variations)
  const techMap = new Map<string, string>();
  allTech.forEach((tech) => {
    const normalized = tech.toLowerCase().trim();
    if (!techMap.has(normalized)) {
      techMap.set(normalized, tech);
    }
  });

  // Try to find matching technology
  let matchedTech: string | null = null;
  const qLower = question.toLowerCase();
  const qWords = qLower.split(/\s+/).filter((w) => w.length > 2); // Filter out short words

  // Check if any tech name appears in the question
  // Use word boundaries to avoid partial matches
  for (const [normalized, original] of techMap.entries()) {
    const techWords = normalized.split(/\s+/);
    // Check if all words of the tech name appear in the question
    const allWordsMatch = techWords.every(
      (word) =>
        qLower.includes(word) ||
        qWords.some((qw) => qw.includes(word) || word.includes(qw))
    );

    if (allWordsMatch && normalized.length > 2) {
      matchedTech = original;
      break;
    }
  }

  // Check if the question is clearly technology-focused (has tech keywords like "with Python", "using React")
  const techQuestionPattern =
    /(?:experience|worked|used|projects?|jobs?|roles?)\s+(?:with|using|in|on|at)/i;
  const hasTechnologyFocus =
    matchedTech !== null &&
    (techQuestionPattern.test(question) ||
      /(?:what|which|where|list).*(?:experience|projects?|jobs?|roles?).*\s+(?:with|using)/i.test(
        question
      ));

  // If we found a technology match and the question is asking about experience/projects

  if (hasTechnologyFocus) {
    const relevantJobs = resume.experience.filter((job) =>
      job.tech.some((t) => t.toLowerCase() === matchedTech!.toLowerCase())
    );
    const relevantProjects = resume.projects.filter((project) =>
      project.tech.some((t) => t.toLowerCase() === matchedTech!.toLowerCase())
    );

    if (relevantJobs.length > 0 || relevantProjects.length > 0) {
      const answerParts: string[] = [];

      if (relevantJobs.length > 0) {
        answerParts.push("Experience:");
        relevantJobs.forEach((job) => {
          answerParts.push(`• ${job.role} at ${job.company} (${job.dates})`);
        });
      }

      if (relevantProjects.length > 0) {
        if (answerParts.length > 0) answerParts.push("");
        answerParts.push("Projects:");
        relevantProjects.forEach((project) => {
          answerParts.push(`• ${project.name}`);
        });
      }

      const answer = answerParts.join("\n");
      const sources = [
        ...relevantJobs.map((job) => ({
          title: `Experience: ${job.role} @ ${job.company}`,
          snippet: `${job.role} at ${job.company} (${job.dates})`,
        })),
        ...relevantProjects.map((project) => ({
          title: `Project: ${project.name}`,
          snippet: `${project.name}: ${project.description}`,
        })),
      ];

      const suggestedQuestions = [
        `What is ${resume.basics.name}'s background and experience?`,
        "What projects are most relevant to React?",
        "Summarize recent experience and impact.",
        "What tech stack has been used most?",
      ];

      return { answer, sources, suggestedQuestions };
    }
  }

  // Check if this is a background/experience summary question (but NOT technology-specific)
  const backgroundKeywords =
    /(?:background|experience|summary|overview|tell me about|who is|what is)/i;
  const nameInQuestion = question
    .toLowerCase()
    .includes(resume.basics.name.toLowerCase());

  if (
    backgroundKeywords.test(question) &&
    (nameInQuestion || question.toLowerCase().includes("avaneesh")) &&
    !hasTechnologyFocus // Exclude if it's a technology-specific query
  ) {
    const answerParts: string[] = [];

    // Education summary
    if (resume.highlights && resume.highlights.length > 0) {
      answerParts.push("Education:");
      resume.highlights.forEach((edu) => {
        answerParts.push(`• ${edu}`);
      });
    }

    // Co-op/Work Experience summary
    if (resume.experience && resume.experience.length > 0) {
      if (answerParts.length > 0) answerParts.push("");
      answerParts.push("Work Experience:");
      resume.experience.forEach((job) => {
        answerParts.push(`• ${job.role} at ${job.company} (${job.dates})`);
      });
    }

    const answer = answerParts.join("\n");
    const sources = [
      ...(resume.highlights?.map((edu) => ({
        title: "Education",
        snippet: edu,
      })) || []),
      ...resume.experience.map((job) => ({
        title: `Experience: ${job.role} @ ${job.company}`,
        snippet: `${job.role} at ${job.company} (${job.dates})`,
      })),
    ];

    const suggestedQuestions = [
      "What technologies has the candidate worked with?",
      "What projects are most relevant to React?",
      "Summarize recent experience and impact.",
      "What tech stack has been used most?",
    ];

    return { answer, sources, suggestedQuestions };
  }

  // Check if this is a company/role-specific question
  const companyRoleKeywords =
    /(?:tell me about|what.*at|role at|work at|experience at|job at|position at)/i;
  if (companyRoleKeywords.test(question)) {
    // Try to match company names from the resume
    const qLower = question.toLowerCase();
    const matchedJob = resume.experience.find((job) => {
      const companyLower = job.company.toLowerCase();
      // Check if company name appears in question
      return (
        qLower.includes(companyLower) ||
        companyLower
          .split(/\s+/)
          .some((word) => word.length > 3 && qLower.includes(word))
      );
    });

    if (matchedJob) {
      const answerParts: string[] = [];

      // Role and company header
      answerParts.push(`${matchedJob.role} at ${matchedJob.company}`);
      answerParts.push(`${matchedJob.dates} • ${matchedJob.location}`);
      answerParts.push("");

      // Work summary/highlights
      if (matchedJob.highlights && matchedJob.highlights.length > 0) {
        answerParts.push("Summary:");
        matchedJob.highlights.forEach((highlight) => {
          answerParts.push(highlight);
        });
      }

      // Technical skills
      if (matchedJob.tech && matchedJob.tech.length > 0) {
        answerParts.push("");
        answerParts.push("Technical Skills:");
        answerParts.push(matchedJob.tech.join(", "));
      }

      const answer = answerParts.join("\n");
      const sources = [
        {
          title: `Experience: ${matchedJob.role} @ ${matchedJob.company}`,
          snippet: matchedJob.highlights.join(" "),
        },
      ];

      const suggestedQuestions = [
        `What experience does ${resume.basics.name} have with ${
          matchedJob.tech[0] || "Python"
        }?`,
        "What projects are most relevant to React?",
        "Summarize recent experience and impact.",
        "What tech stack has been used most?",
      ];

      return { answer, sources, suggestedQuestions };
    }
  }

  // General corpus-based search for other questions
  const corpus = buildCorpus(resume);
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

  // Generate dynamic suggested questions based on resume content
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
  const suggestedQuestions = [
    `What is ${resume.basics.name}'s background and experience?`,
    topTech[0]
      ? `What experience does ${resume.basics.name} have with ${topTech[0]}?`
      : "What technologies has the candidate worked with?",
    recentJob
      ? `Tell me about the role at ${recentJob.company}`
      : "What is the most recent work experience?",
    `What are ${resume.basics.name}'s key skills and strengths?`,
  ];

  if (uniqueSources.length === 0) {
    return {
      answer:
        "I couldn't find that information in the resume. Try asking about skills, projects, experience, technologies, or background.",
      sources: [],
      suggestedQuestions,
    };
  }

  // Generate a more natural, conversational response
  // Filter out name/title prefix from snippets
  const nameTitleRegex = new RegExp(
    `^${resume.basics.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}\\s*—\\s*[^\\n]+`,
    "i"
  );
  const snippets = uniqueSources
    .map((s) => {
      let snippet = s.snippet.trim();
      // Remove name/title prefix if present
      snippet = snippet.replace(nameTitleRegex, "").trim();
      // Remove leading/trailing separators that might be left
      snippet = snippet.replace(/^[—\-\s]+/, "").trim();
      return snippet;
    })
    .filter((s) => s.length > 0);

  // Combine snippets naturally
  let answer = "";
  if (snippets.length === 1) {
    answer = snippets[0];
  } else if (snippets.length === 2) {
    // For two snippets, join with a connector
    answer = `${snippets[0]}\n\n${snippets[1]}`;
  } else {
    // For multiple snippets, combine intelligently
    // Group by source title to avoid repetition
    const groupedByTitle = new Map<string, string[]>();
    uniqueSources.forEach((s) => {
      if (!groupedByTitle.has(s.title)) {
        groupedByTitle.set(s.title, []);
      }
      groupedByTitle.get(s.title)!.push(s.snippet);
    });

    const combinedSnippets: string[] = [];
    groupedByTitle.forEach((snippets) => {
      const combined = snippets.join(" ");
      combinedSnippets.push(combined);
    });

    answer = combinedSnippets.join("\n\n");
  }

  // Remove name and title prefix if it still appears at the start (fallback)
  const nameTitlePattern = new RegExp(
    `^${resume.basics.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}\\s*—\\s*[^\\n]+\\n?`,
    "i"
  );
  answer = answer.replace(nameTitlePattern, "").trim();

  // Clean up any awkward formatting
  answer = answer
    .replace(/\s+/g, " ") // Normalize whitespace within sentences
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
    .replace(/\s+([.!?])/g, "$1") // Remove spaces before punctuation
    .replace(/([.!?])\s*([A-Z])/g, "$1 $2") // Ensure space after punctuation
    .trim();

  return { answer, sources: uniqueSources, suggestedQuestions };
}
