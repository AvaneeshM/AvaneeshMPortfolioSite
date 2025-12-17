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

  chunks.push({
    id: "about",
    title: "About",
    text: [resume.about.tagline, resume.about.bio, resume.about.goals]
      .filter(Boolean)
      .join("\n"),
  });

  chunks.push({
    id: "skills",
    title: "Skills",
    text: resume.skills
      .map((g) => `${g.category}: ${g.items.join(", ")}`)
      .join("\n"),
  });

  resume.projects.forEach((p, idx) => {
    chunks.push({
      id: `project-${idx}`,
      title: `Project: ${p.name}`,
      text: [p.description, `Tech: ${p.tech.join(", ")}`]
        .filter(Boolean)
        .join("\n"),
    });
  });

  resume.experience.forEach((j, idx) => {
    chunks.push({
      id: `job-${idx}`,
      title: `Experience: ${j.role} @ ${j.company}`,
      text: [
        `${j.company} — ${j.role} (${j.dates})`,
        j.location,
        ...j.highlights,
        `Tech: ${j.tech.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
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
  maxSentences = 2
): string[] {
  if (queryTokens.length === 0) return [];
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
      return { s, score };
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

  const top = scored.slice(0, 3).filter((x) => x.score > 0.05);
  const sources = top
    .map((t) => {
      const sents = extractRelevantSentences(t.chunk.text, qTokens, 2);
      return {
        title: t.chunk.title,
        snippet: sents.length
          ? sents.join(" ")
          : t.chunk.text.split("\n").slice(0, 2).join(" "),
      };
    })
    .filter((s) => s.snippet.trim().length > 0);

  const suggestedQuestions = [
    `What is ${resume.basics.name}'s strongest skill area?`,
    "What projects are most relevant to React?",
    "Summarize recent experience and impact.",
    "What tech stack has been used most?",
  ];

  if (sources.length === 0) {
    return {
      answer:
        "I couldn't find that information. Try asking about skills, projects, experience, impact metrics, or specific technologies.",
      sources: [],
      suggestedQuestions,
    };
  }

  // Generate a more natural, conversational response
  const snippets = sources.map((s) => s.snippet.trim()).filter(Boolean);

  // Combine snippets naturally - if they're short, join with periods; if longer, separate with line breaks
  let answer = "";
  if (snippets.length === 1) {
    answer = snippets[0];
  } else {
    // Join multiple snippets naturally
    answer = snippets.join("\n\n");
  }

  // Clean up any awkward formatting that might have been introduced
  answer = answer
    .replace(/\s+/g, " ") // Normalize whitespace within sentences
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
    .trim();

  return { answer, sources, suggestedQuestions };
}
