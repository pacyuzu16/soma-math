"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Level = "general" | "o-level" | "a-level";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TOPIC_SUGGESTIONS: Record<Level, { label: string; prompt: string }[]> = {
  general: [
    { label: "Quadratic equations", prompt: "Solve x² - 5x + 6 = 0 step by step" },
    { label: "Pythagoras theorem", prompt: "Explain Pythagoras theorem with an example" },
    { label: "Circle area", prompt: "Find the area of a circle with radius 7 cm" },
    { label: "Mean & median", prompt: "Find the mean and median of: 4, 7, 9, 12, 3, 8" },
    { label: "Linear equations", prompt: "Solve 3x + 7 = 22" },
    { label: "Factorisation", prompt: "Factorise x² + 7x + 12" },
  ],
  "o-level": [
    { label: "Linear equations", prompt: "Solve 4x - 3 = 2x + 9 step by step" },
    { label: "Pythagoras", prompt: "A right triangle has legs 6 cm and 8 cm. Find the hypotenuse." },
    { label: "Venn diagrams", prompt: "Explain union and intersection of sets using a Venn diagram" },
    { label: "Percentages", prompt: "A phone costs 45,000 RWF. It is discounted by 15%. What is the new price?" },
    { label: "Factorisation", prompt: "Factorise completely: 2x² + 7x + 3" },
    { label: "Simultaneous equations", prompt: "Solve: 2x + y = 7 and x - y = 2" },
    { label: "Trigonometry", prompt: "Find sin, cos and tan of 30°. Explain where these come from." },
    { label: "Volume of a cylinder", prompt: "Find the volume of a cylinder with radius 5 cm and height 12 cm" },
  ],
  "a-level": [
    { label: "Differentiation", prompt: "Differentiate f(x) = 3x³ - 2x² + 5x - 1 from first principles" },
    { label: "Integration", prompt: "Evaluate ∫(2x + 3)dx with limits 1 to 4" },
    { label: "Trigonometric identities", prompt: "Prove that sin²θ + cos²θ = 1 and derive tan²θ + 1 = sec²θ" },
    { label: "Matrices", prompt: "Find the inverse of the matrix [[2, 1], [5, 3]]" },
    { label: "Binomial theorem", prompt: "Expand (1 + x)⁵ using the binomial theorem" },
    { label: "Normal distribution", prompt: "Explain the normal distribution and the 68-95-99.7 rule" },
    { label: "Vectors", prompt: "Find the angle between vectors a = (2, 3, -1) and b = (1, -1, 4)" },
    { label: "Complex numbers", prompt: "Express z = 3 + 4i in modulus-argument form" },
  ],
};

const STORAGE_KEY = "soma-math-history";
const MAX_STORED = 50;

function loadHistory(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_STORED))
    );
  } catch {}
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [level, setLevel] = useState<Level>("general");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage after hydration
  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
  }, []);

  // Persist messages
  useEffect(() => {
    if (hydrated) saveHistory(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: text.trim() };
      const updated = [...messages, userMessage];
      setMessages(updated);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);

      const placeholder: Message = { role: "assistant", content: "" };
      setMessages([...updated, placeholder]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated, level }),
        });

        if (!response.ok) throw new Error("Request failed");

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setMessages([...updated, { role: "assistant", content: fullText }]);
        }
      } catch {
        setMessages([
          ...updated,
          { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, level]
  );

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const copyMessage = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = TOPIC_SUGGESTIONS[level];

  return (
    <div className="chat-wrapper">
      {/* Level selector bar */}
      <div className="level-bar">
        <span className="level-label">Level:</span>
        {(["general", "o-level", "a-level"] as Level[]).map((l) => (
          <button
            key={l}
            className={`level-btn ${level === l ? "active" : ""}`}
            onClick={() => setLevel(l)}
          >
            {l === "general" ? "All Levels" : l === "o-level" ? "O-Level (S1–S3)" : "A-Level (S4–S6)"}
          </button>
        ))}
        {messages.length > 0 && (
          <button className="clear-btn" onClick={clearChat} title="Clear conversation">
            🗑 Clear
          </button>
        )}
      </div>

      {/* Messages or welcome */}
      {messages.length === 0 ? (
        <div className="welcome">
          <div className="welcome-icon">📐</div>
          <h2>Muraho! I&apos;m Soma</h2>
          <p>
            Your AI Math tutor for Rwanda secondary school.
            <br />
            Select your level above, then ask me anything — I&apos;ll explain step by step.
          </p>
          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s.label}
                className="suggestion-chip"
                onClick={() => sendMessage(s.prompt)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">{msg.role === "user" ? "👤" : "📐"}</div>
              <div className="bubble-wrap">
                <div className="bubble">
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content || "▋"}
                    </ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === "assistant" && msg.content && (
                  <button
                    className="copy-btn"
                    onClick={() => copyMessage(msg.content, i)}
                    title="Copy response"
                  >
                    {copiedIndex === i ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              Soma is thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Quick topics (shown below messages) */}
      {messages.length > 0 && (
        <div className="quick-topics">
          {suggestions.slice(0, 4).map((s) => (
            <button
              key={s.label}
              className="suggestion-chip small"
              onClick={() => sendMessage(s.prompt)}
              disabled={isLoading}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="input-area">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask a math question... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="send-btn"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
