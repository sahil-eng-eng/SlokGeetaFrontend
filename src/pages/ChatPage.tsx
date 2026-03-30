import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const welcomeSuggestions = [
  "Explain the meaning of Chapter 2, Verse 47",
  "What is Karma Yoga?",
  "Summarize the Bhagavad Gita",
  "Compare Yoga Sutras with Bhagavad Gita",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a simulated response to: "${text.trim()}"\n\nIn a production environment, this would connect to an AI backend to provide meaningful interpretations and discussions about the sacred texts in your library.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-display text-foreground mb-1">Ask anything</h2>
            <p className="text-body text-muted-foreground mb-6 max-w-sm">
              Explore meanings, compare interpretations, and deepen your understanding of sacred texts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {welcomeSuggestions.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  onClick={() => sendMessage(s)}
                  className="p-3 rounded-lg border border-border text-left text-[13px] text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-muted/50 transition-all"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-sm"
                    : "surface border border-border rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="surface border border-border rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 surface rounded-xl border border-border p-2 focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any sloka or text..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none px-2 py-1.5 max-h-32"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-lg btn-gradient disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          AI responses are simulated. Connect a backend for real conversations.
        </p>
      </div>
    </div>
  );
}
