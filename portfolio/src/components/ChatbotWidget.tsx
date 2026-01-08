import { useEffect, useMemo, useRef, useState } from "react";
import type { Resume } from "../data/resume";
import { answerFromResume, answerFromResumeAsync } from "../lib/resumeChat";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ChatbotWidget({ resume }: { resume: Resume }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      content: `Hi! I’m the resume bot for ${resume.basics.name}. Ask me anything about skills, projects, or experience.`,
    },
  ]);

  const { suggestedQuestions } = useMemo(
    () => answerFromResume("overview", resume),
    [resume]
  );

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  async function respond(question: string) {
    setTyping(true);
    // tiny delay so the UI feels responsive/real-time
    await new Promise((r) => setTimeout(r, 250));
    // Use RAG (async) for better semantic understanding
    const result = await answerFromResumeAsync(question, resume);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "assistant", content: result.answer },
    ]);
    setTyping(false);
  }

  async function onSend(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setInput("");
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: q }]);
    await respond(q);
  }

  return (
    <>
      <button
        type="button"
        className="chatFab"
        aria-label={open ? "Close resume chatbot" : "Open resume chatbot"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "Chat"}
      </button>

      {open && (
        <section className="chatPanel" aria-label="Resume chatbot">
          <header className="chatHeader">
            <div>
              <div className="chatTitle">AI Resume Chatbot</div>
              <div className="chatSubtitle">
                Trained on {resume.basics.name}'s resume (local).
              </div>
            </div>
            <button
              type="button"
              className="chatClose"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div className="chatList" ref={listRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chatMsg ${
                  m.role === "user" ? "chatUser" : "chatAssistant"
                }`}
              >
                <div className="chatBubble">
                  {m.content.split("\n").map((line, idx) => (
                    <p key={idx} className="chatLine">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {typing && (
              <div className="chatMsg chatAssistant">
                <div className="chatBubble">
                  <p className="chatLine muted">Thinking…</p>
                </div>
              </div>
            )}
          </div>

          <div className="chatQuick">
            {suggestedQuestions.slice(0, 4).map((q) => (
              <button
                type="button"
                key={q}
                className="chatChip"
                onClick={() => onSend(q)}
                disabled={typing}
                title={q}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="chatForm"
            onSubmit={(e) => {
              e.preventDefault();
              void onSend(input);
            }}
          >
            <input
              ref={inputRef}
              className="chatInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about skills, projects, experience…"
              aria-label="Chat input"
            />
            <button
              className="chatSend"
              type="submit"
              disabled={!input.trim() || typing}
            >
              Send
            </button>
          </form>
        </section>
      )}
    </>
  );
}
