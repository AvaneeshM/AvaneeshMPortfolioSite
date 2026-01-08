import type { Resume } from "../data/resume";
import {
  getEmbedding,
  getEmbeddings,
  cosineSimilarityEmbeddings,
  type EmbeddingVector,
} from "./embeddings";
import { extractTextFromPDF } from "./pdfParser";

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
 * Build corpus from PDF text instead of structured resume
 * This provides more complete information from the actual resume document
 */
function buildCorpusFromPDF(pdfText: string): CorpusChunk[] {
  const chunks: CorpusChunk[] = [];

  // Split PDF text into meaningful sections
  const sections = splitPDFIntoSections(pdfText);

  sections.forEach((section, idx) => {
    chunks.push({
      id: `pdf-section-${idx}`,
      title: section.title || "Resume Content",
      text: section.content,
    });

    // Also create smaller chunks for better matching
    const sentences = section.content.split(/[.!?]+\s+/).filter(Boolean);
    sentences.forEach((sentence, sIdx) => {
      if (sentence.trim().length > 20) {
        // Only create chunks for substantial sentences
        chunks.push({
          id: `pdf-section-${idx}-sentence-${sIdx}`,
          title: section.title || "Resume Content",
          text: sentence.trim(),
        });
      }
    });
  });

  return chunks;
}

/**
 * Split PDF text into meaningful sections based on headings
 */
function splitPDFIntoSections(
  pdfText: string
): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = [];

  let currentSection: { title: string; content: string } | null = null;
  const lines = pdfText.split("\n");

  for (const line of lines) {
    // Check if this line is a section header
    const isHeader =
      /^(Education|Skills|Work Experience|Experience|Projects|Summary|About|AVANEESH|Contact|Languages|Frameworks|Technologies)/i.test(
        line.trim()
      );

    if (isHeader && line.trim().length < 100) {
      // Save previous section
      if (currentSection && currentSection.content.trim().length > 0) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: line.trim().replace(/^#\s*/, ""),
        content: "",
      };
    } else if (currentSection) {
      currentSection.content += line + "\n";
    } else {
      // Content before first section header
      if (!currentSection) {
        currentSection = { title: "Resume Header", content: "" };
      }
      currentSection.content += line + "\n";
    }
  }

  // Add last section
  if (currentSection && currentSection.content.trim().length > 0) {
    sections.push(currentSection);
  }

  // If no sections found, create one big chunk
  if (sections.length === 0) {
    sections.push({
      title: "Resume",
      content: pdfText,
    });
  }

  return sections;
}

/**
 * Build corpus from structured resume data (legacy, for portfolio display)
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

  const filteredSources = sources.filter((s) => {
    const snippetLower = s.snippet.toLowerCase();
    // Exclude if title contains "Goals" or snippet contains goal patterns
    if (
      s.title.toLowerCase().includes("goal") ||
      goalPatterns.some((pattern) => pattern.test(snippetLower))
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

  // Extract key bullet points (usually start with - or •)
  const bullets = cleanedText
    .split(/\n|\./)
    .filter((line) => {
      const trimmed = line.trim();
      // Exclude goal-related content from bullets
      const hasGoalContent = goalPatterns.some((pattern) =>
        pattern.test(trimmed.toLowerCase())
      );
      return (
        (trimmed.startsWith("-") || trimmed.startsWith("•")) &&
        trimmed.length > 20 &&
        trimmed.length < 200 &&
        !hasGoalContent
      );
    })
    .map((b) => b.trim().replace(/^[-•]\s*/, ""))
    .slice(0, 3); // Limit to top 3 most relevant

  if (bullets.length > 0) {
    parts.push("");
    parts.push(...bullets.map((b) => `• ${b}`));
  } else {
    // Fallback: extract first 2-3 sentences that aren't too long and don't contain goals
    const sentences = cleanedText
      .split(/[.!?]+\s+/)
      .filter((s) => {
        const trimmed = s.trim();
        const hasGoalContent = goalPatterns.some((pattern) =>
          pattern.test(trimmed.toLowerCase())
        );
        return trimmed.length > 30 && trimmed.length < 200 && !hasGoalContent;
      })
      .slice(0, 2)
      .map((s) => s.trim());

    if (sentences.length > 0) {
      parts.push("");
      parts.push(...sentences);
    }
  }

  // If we have structured info, return it; otherwise return cleaned up version
  if (parts.length > 1) {
    return parts.join("\n");
  }

  // Fallback to cleaned snippets (excluding goals)
  return sourcesToUse
    .map((s) => s.snippet.trim())
    .filter((snippet) => {
      const hasGoalContent = goalPatterns.some((pattern) =>
        pattern.test(snippet.toLowerCase())
      );
      return !hasGoalContent && snippet.length > 0;
    })
    .slice(0, 2)
    .join("\n");
}

/**
 * Generate a natural answer from retrieved sources
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
  const snippets = sources
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
    sources.forEach((s) => {
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

  return answer;
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

// Cache for PDF text to avoid re-parsing
let pdfTextCache: string | null = null;
let pdfLoadingPromise: Promise<string> | null = null;

/**
 * Load PDF text (cached)
 */
async function loadPDFText(): Promise<string> {
  if (pdfTextCache) {
    return pdfTextCache;
  }

  if (pdfLoadingPromise) {
    return pdfLoadingPromise;
  }

  pdfLoadingPromise = (async () => {
    try {
      // Import PDF URL - Vite will handle the path resolution
      // Use ?url suffix to get the URL string
      const pdfUrl = new URL(
        "../assets/AvaneeshResumeAllData.pdf",
        import.meta.url
      ).href;

      // For Vite dev server and production, we might need to adjust the path
      // Try direct import first (with ?url), then fall back to manual URL
      let finalPdfUrl: string;
      try {
        const pdfModule = await import(
          "../assets/AvaneeshResumeAllData.pdf?url"
        );
        finalPdfUrl =
          typeof pdfModule === "string" ? pdfModule : pdfModule.default;
      } catch {
        // Fallback to manual URL construction
        finalPdfUrl = pdfUrl;
      }

      const text = await extractTextFromPDF(finalPdfUrl);
      pdfTextCache = text;
      return text;
    } catch (error) {
      console.error(
        "Failed to load PDF, falling back to structured resume:",
        error
      );
      throw error;
    } finally {
      pdfLoadingPromise = null;
    }
  })();

  return pdfLoadingPromise;
}

/**
 * RAG-based answer generation using semantic embeddings
 * Uses PDF resume text for better accuracy and completeness
 * Falls back to structured resume data if PDF fails
 * Falls back to TF-IDF if embeddings are unavailable
 */
export async function answerFromResumeRAG(
  question: string,
  resume: Resume
): Promise<ChatAnswer> {
  // Check if this is a role/company-specific question
  const isRoleQuestion =
    /(?:tell me about|what.*at|role at|work at|experience at|job at|position at|about.*role)/i.test(
      question
    );

  // Try to build corpus from PDF first
  let corpus: CorpusChunk[];
  try {
    const pdfText = await loadPDFText();
    corpus = buildCorpusFromPDF(pdfText);
  } catch (error) {
    // Fallback to structured resume data
    console.warn("Using structured resume data instead of PDF");
    corpus = buildCorpus(resume);
  }

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
    const topCount = isRoleQuestion ? 3 : 7;
    const threshold = isRoleQuestion ? 0.15 : 0.1;
    let top = scored.slice(0, topCount).filter((x) => x.score > threshold);

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
      const sources = top
        .map((t) => {
          // For role questions, extract fewer sentences
          const maxSentences = isRoleQuestion ? 2 : 3;
          const sents = extractRelevantSentences(
            t.chunk.text,
            tokenize(question),
            maxSentences
          );
          return {
            title: t.chunk.title,
            snippet: sents.length
              ? sents.join(" ")
              : t.chunk.text
                  .split("\n")
                  .slice(0, isRoleQuestion ? 2 : 3)
                  .join(" "),
          };
        })
        .filter((s) => s.snippet.trim().length > 0);

      const uniqueSources = sources.filter(
        (s, idx, arr) =>
          arr.findIndex((other) => other.snippet === s.snippet) === idx
      );

      if (uniqueSources.length > 0) {
        // For role questions, create a more concise, structured answer
        let answer: string;
        if (isRoleQuestion) {
          answer = generateConciseRoleAnswer(uniqueSources);
        } else {
          // For PDF-based corpus, generate answer directly from sources
          answer = uniqueSources
            .map((s) => s.snippet)
            .filter(Boolean)
            .join("\n\n");
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
    // Build corpus for TF-IDF fallback
    let corpus: CorpusChunk[];
    try {
      const pdfText = await loadPDFText();
      corpus = buildCorpusFromPDF(pdfText);
    } catch (pdfError) {
      corpus = buildCorpus(resume);
    }
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
 * Async version that can load PDF
 */
async function answerFromResumeTFIDF(
  question: string,
  resume: Resume,
  corpus?: CorpusChunk[]
): Promise<ChatAnswer> {
  // Build corpus if not provided
  if (!corpus) {
    try {
      const pdfText = await loadPDFText();
      corpus = buildCorpusFromPDF(pdfText);
    } catch (error) {
      // Fallback to structured resume data
      corpus = buildCorpus(resume);
    }
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
