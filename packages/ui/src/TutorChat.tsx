import * as React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { emitEvent } from "./emitEvent";

export interface ChatMessage {
  role: "user" | "assistant" | "ai";
  content: string;
}

export interface TutorChatProps {
  topic: string;
  subject: string;
  board?: string;
  tier?: "primary" | "middle" | "high_school" | "university";
  apiBaseUrl?: string;
  token?: string | null;
  initialMessage?: string;
  /** module_id forwarded to session_events (optional; omit if not inside a known module). */
  moduleId?: string;
}

/**
 * Basic custom Markdown parser that converts headers, bold text, lists, and inline code.
 */
function renderBasicMarkdown(text: string) {
  // Split into lines for paragraph, heading, and list detection
  const lines = text.split("\n");
  let inList = false;
  const renderedElements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      if (inList) { inList = false; }
      renderedElements.push(<h4 key={`h3-${index}`} className="tutor-chat-h4">{trimmed.slice(4)}</h4>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) { inList = false; }
      renderedElements.push(<h3 key={`h2-${index}`} className="tutor-chat-h3">{trimmed.slice(3)}</h3>);
      return;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) { inList = false; }
      renderedElements.push(<h2 key={`h1-${index}`} className="tutor-chat-h2">{trimmed.slice(2)}</h2>);
      return;
    }

    // List items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      inList = true;
      renderedElements.push(
        <li key={`li-${index}`} className="tutor-chat-li">
          {parseInlineFormatting(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // Code block detection
    if (trimmed.startsWith("```")) {
      if (inList) { inList = false; }
      return; // Skip backticks line
    }

    // Empty lines
    if (trimmed === "") {
      if (inList) { inList = false; }
      renderedElements.push(<div key={`empty-${index}`} className="h-2" />);
      return;
    }

    // Standard paragraph
    if (inList) { inList = false; }
    renderedElements.push(
      <p key={`p-${index}`} className="tutor-chat-p">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  return <>{renderedElements}</>;
}

/**
 * Parses bold text and inline code within a line.
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match **bold** or `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="tutor-chat-inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function TutorChat({
  topic,
  subject,
  board = "CBSE",
  tier = "high_school",
  apiBaseUrl = "",
  token = null,
  initialMessage = "",
  moduleId,
}: TutorChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sessionIdRef = React.useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  );

  const chatEndRef = React.useRef<HTMLDivElement | null>(null);
  const isHighSchoolOrUniversity = tier === "high_school" || tier === "university";

  // Auto-scroll to bottom of conversation
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Set initial welcome prompt
  React.useEffect(() => {
    if (messages.length === 0) {
      const welcome = initialMessage || `I see you're working on ${topic} — what's tripping you up?`;
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }, [initialMessage, topic]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // 'asked_tutor' — student sent a message to the AI tutor
    emitEvent("asked_tutor", {
      moduleId,
      token,
      apiBaseUrl,
      payload: { topic, subject, tier, messageLength: userMessage.length },
    });

    // Save user message in local conversation state
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsStreaming(true);

    // Prepare history to send to api
    const historyPayload = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" : m.role,
      content: m.content,
    }));

    try {
      // Endpoint resolved from API base url
      const path = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}/api/tutor/chat` : "/api/tutor/chat";
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(path, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage,
          topic,
          subject,
          board,
          history: historyPayload,
          session_id: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorJson = await response.json().catch(() => ({}));
          if (errorJson.error === "daily_limit_reached") {
            const ageAppropriateMessage = tier === "primary"
              ? "Atom needs a rest! Come back tomorrow."
              : "You've used all your questions for today.";
            throw new Error(ageAppropriateMessage);
          }
        }
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Tutor streaming response has no readable body.");
      }

      // Initialize placeholders for the AI assistant stream reply
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;

          // Update the last assistant message in state with the new streamed content chunk
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                role: "assistant",
                content: accumulatedText,
              };
            }
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error("[Tutor Chat Error]", err);
      setError(err?.message || "An error occurred while communicating with the AI Tutor.");
    } finally {
      setIsStreaming(false);
    }
  };

  /**
   * High-fidelity LaTeX (KaTeX) and markdown parser.
   */
  const renderMessageContent = (content: string) => {
    if (!isHighSchoolOrUniversity) {
      return <div className="tutor-chat-plain-text">{content}</div>;
    }

    // Split block math $$...$$
    const parts = content.split(/(\$\$.*?\$\$)/gs);

    return (
      <div className="tutor-chat-rendered-content">
        {parts.map((part, index) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            const math = part.slice(2, -2).trim();
            try {
              const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
              return (
                <div 
                  key={index} 
                  className="tutor-chat-block-math overflow-x-auto py-2" 
                  dangerouslySetInnerHTML={{ __html: html }} 
                />
              );
            } catch {
              return <pre key={index} className="bg-red-50 text-red-600 p-2 rounded text-xs">{math}</pre>;
            }
          }

          // Parse inline math $...$
          const inlineParts = part.split(/(\$.*?\$)/g);

          return (
            <span key={index}>
              {inlineParts.map((subPart, subIndex) => {
                if (subPart.startsWith("$") && subPart.endsWith("$")) {
                  const math = subPart.slice(1, -1).trim();
                  try {
                    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
                    return (
                      <span 
                        key={subIndex} 
                        className="tutor-chat-inline-math" 
                        dangerouslySetInnerHTML={{ __html: html }} 
                      />
                    );
                  } catch {
                    return <code key={subIndex} className="bg-red-50 text-red-600 px-1 rounded">{math}</code>;
                  }
                }

                // Render standard markdown headers, bold, and list elements
                return renderBasicMarkdown(subPart);
              })}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tutor-chat-container">
      {/* Header Panel */}
      <div className="tutor-chat-header">
        <div className="flex items-center gap-2">
          <div className="tutor-chat-header-icon">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="tutor-chat-header-title">AI Tutor Assistant</h3>
            <p className="tutor-chat-header-subtitle">
              Socratic guidance for {topic} • {subject} ({tier.replace("_", " ")})
            </p>
          </div>
        </div>
      </div>

      {/* Messages Pane */}
      <div className="tutor-chat-messages-pane">
        {messages.length === 0 && (
          <div className="tutor-chat-empty-state">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
            <p className="font-semibold text-slate-700">Ask a Question!</p>
            <p className="text-xs text-slate-500 max-w-xs text-center mt-1">
              Need help understanding formulas or physics concepts? Ask me below.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`tutor-chat-bubble-wrapper ${isUser ? "tutor-chat-user-row" : "tutor-chat-ai-row"}`}
            >
              <div
                className={`tutor-chat-bubble ${isUser ? "tutor-chat-bubble-user" : "tutor-chat-bubble-ai"}`}
              >
                {renderMessageContent(msg.content)}
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="tutor-chat-bubble-wrapper tutor-chat-ai-row">
            <div className="tutor-chat-bubble tutor-chat-bubble-ai tutor-chat-typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="tutor-chat-error-card">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-xs text-rose-700 font-medium">{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSend} className="tutor-chat-input-form">
        <div className="tutor-chat-input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={`Ask a question about ${topic}...`}
            className="tutor-chat-input-text"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="tutor-chat-submit-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Styled tokens matching the design specifications */}
      <style>{`
        .tutor-chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          background: #F8FAFC;
          border: 1px solid #ECECF4;
          border-radius: 16px;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .tutor-chat-header {
          padding: 14px 20px;
          background: #FFFFFF;
          border-bottom: 1px solid #ECECF4;
        }
        .tutor-chat-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #EEF2FF;
          border-radius: 8px;
        }
        .tutor-chat-header-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
        }
        .tutor-chat-header-subtitle {
          margin: 2px 0 0 0;
          font-size: 11px;
          font-weight: 500;
          color: #64748B;
        }
        .tutor-chat-messages-pane {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
        }
        .tutor-chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: auto;
          color: #94A3B8;
        }
        .tutor-chat-bubble-wrapper {
          display: flex;
          width: 100%;
        }
        .tutor-chat-user-row {
          justify-content: flex-end;
        }
        .tutor-chat-ai-row {
          justify-content: flex-start;
        }
        .tutor-chat-bubble {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        .tutor-chat-bubble-user {
          background: #4F46E5;
          color: #FFFFFF;
          border-bottom-right-radius: 2px;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
        }
        .tutor-chat-bubble-ai {
          background: #FFFFFF;
          color: #334155;
          border: 1px solid #E2E8F0;
          border-bottom-left-radius: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .tutor-chat-p {
          margin: 0 0 8px 0;
        }
        .tutor-chat-p:last-child {
          margin-bottom: 0;
        }
        .tutor-chat-h2 {
          font-size: 16px;
          font-weight: 700;
          margin: 12px 0 6px 0;
          color: #1E293B;
        }
        .tutor-chat-h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 10px 0 6px 0;
          color: #334155;
        }
        .tutor-chat-h4 {
          font-size: 14px;
          font-weight: 700;
          margin: 8px 0 4px 0;
          color: #475569;
        }
        .tutor-chat-li {
          margin-left: 14px;
          margin-bottom: 4px;
          list-style-type: disc;
        }
        .tutor-chat-inline-code {
          background: #F1F5F9;
          color: #0F172A;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }
        .tutor-chat-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
        }
        .tutor-chat-typing .dot {
          width: 6px;
          height: 6px;
          background: #94A3B8;
          border-radius: 50%;
          animation: tutor-pulse 1.4s infinite ease-in-out both;
        }
        .tutor-chat-typing .dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        .tutor-chat-typing .dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        @keyframes tutor-pulse {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        .tutor-chat-error-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #FFF1F2;
          border: 1px solid #FFE4E6;
          border-radius: 8px;
          margin-top: 4px;
        }
        .tutor-chat-input-form {
          padding: 16px 20px;
          background: #FFFFFF;
          border-top: 1px solid #ECECF4;
        }
        .tutor-chat-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 4px 6px 4px 14px;
          transition: border-color 0.2s;
        }
        .tutor-chat-input-wrapper:focus-within {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .tutor-chat-input-text {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: #334155;
          padding: 8px 0;
        }
        .tutor-chat-input-text::placeholder {
          color: #94A3B8;
        }
        .tutor-chat-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #4F46E5;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .tutor-chat-submit-btn:hover:not(:disabled) {
          background: #4338CA;
        }
        .tutor-chat-submit-btn:disabled {
          background: #CBD5E1;
          color: #94A3B8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
