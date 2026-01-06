/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
import mockData from "./mockData.json";

// OpenAI client (DEMO ONLY — do not use for PHI/labs in production)
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  // ✅ DEMO SETTINGS
  const DEMO_MODE_CENTERED = true; // centered, large, always visible
  const PASSWORD_ENABLED = false; // demo: off

  // If you ever re-enable password:
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const correctPassword = "KENKO2026!";

  // Chat states
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m the Kenko Practitioner AI. I can help you think through symptoms, labs, and next-step protocols. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Lab upload (inline, inside chat)
  const [labFile, setLabFile] = useState(null);
  const [labBusy, setLabBusy] = useState(false);

  const chatWindowRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // (kept for compatibility; not used in centered mode)
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, labBusy]);

  // ------------------------------
  //  SYSTEM PROMPT (Kenko Practitioner)
  // ------------------------------
  const systemPrompt = `
You are the *Kenko Practitioner AI*, a clinician-facing decision-support assistant powered by TruBiome.AI.

Your role:
• Help practitioners think through symptom patterns, potential contributors, and next-step options.
• Suggest reasonable lab categories and common functional-medicine style considerations.
• Be careful and compliant: do not diagnose, do not claim to treat/cure/prevent any disease.
• Use cautious language: “may”, “can be associated with”, “could consider”, “discuss with a licensed clinician”.
• Keep responses concise: 4–8 short bullet points by default.

Rules:
1) Ask ONE clarifying question when needed (only one).
2) If user asks “what should I do first?” → give a prioritized 3-step plan.
3) Supplements: categories only unless the user explicitly asks for brand examples; even then, keep it non-medical.
4) Labs: suggest categories and what they can help clarify; do not state results or diagnoses.
5) If the user input is vague, reflect back and ask for the missing detail (duration, severity, triggers, meds, key history).

Tone:
• Professional, clear, practitioner-friendly.
• Confident but cautious.
• No fluff.

Opening message (only once):
“Hi — what are you working on today? You can share symptoms, existing labs, or a case question.”
`;

  // ------------------------------
  //  QUICK SUGGESTION HANDLER
  // ------------------------------
  const handleSuggestion = (text) => {
    setShowSuggestions(false);
    setInput(text);
  };

  // ------------------------------
  //  LAB UPLOAD HANDLER (calls /api/labs/summarize)
  // ------------------------------
  const handleLabUpload = async () => {
    if (!labFile || labBusy) return;

    setLabBusy(true);
    setShowSuggestions(false);

    // Chat-native status message
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Got it — analyzing the uploaded labs now (demo). This takes a few seconds.",
      },
    ]);

    try {
      // ✅ formData defined in-scope
      const formData = new FormData();
      formData.append("labFile", labFile);

      const res = await fetch("/api/labs/summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const summary = data?.summary || "No summary returned.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Here’s a high-level lab summary (decision-support only):\n\n" +
            summary +
            "\n\nIf you want, share the primary symptom focus + timeframe and I’ll suggest next-step options.",
        },
      ]);
    } catch (err) {
      console.error("Lab upload error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Lab analysis failed: ${err?.message || "Unknown error"}`,
        },
      ]);
    } finally {
      setLabBusy(false);
      setLabFile(null);
    }
  };

  // ------------------------------
  //  SEND MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "system",
            content:
              "Here is the user's demo data (for context only): " +
              JSON.stringify(mockData),
          },
          ...newMessages,
        ],
        temperature: 0.65,
      });

      const botMessage = response.choices?.[0]?.message?.content || "";
      setMessages([...newMessages, { role: "assistant", content: botMessage }]);
    } catch (err) {
      console.error("OpenAI Error:", err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Something went wrong on my end. Please try again (or refresh the page).",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ------------------------------
  // 🔐 PASSWORD SCREEN (DISABLED BY DEFAULT)
  // ------------------------------
  if (PASSWORD_ENABLED && !authorized) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
          padding: "24px",
        }}
      >
        <div
          style={{
            background: "#111",
            padding: "40px",
            borderRadius: "20px",
            width: "340px",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(31, 138, 87, 0.25)",
          }}
        >
          <img
            src="/kenko-logo.png"
            alt="Kenko"
            style={{
              width: "180px",
              marginBottom: "18px",
              opacity: 0.98,
            }}
          />

          <h2
            style={{
              color: "white",
              marginBottom: "10px",
              fontWeight: "600",
              fontSize: "1.4rem",
            }}
          >
            Enter Password
          </h2>

          <p
            style={{ color: "#bbb", fontSize: "0.9rem", marginBottom: "20px" }}
          >
            This demo is private and requires a password to view.
          </p>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #333",
              background: "#222",
              color: "white",
              marginBottom: "20px",
            }}
          />

          <button
            onClick={() => {
              if (password === correctPassword) setAuthorized(true);
              else alert("Incorrect password");
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: "linear-gradient(120deg, #1f8a57, #d6b04c)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none",
              marginTop: "6px",
            }}
          >
            Unlock Demo
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------
  //          MAIN UI (CENTERED DEMO)
  // ------------------------------
  if (DEMO_MODE_CENTERED) {
    return (
      <div className="demo-chat-shell">
        <div className="demo-chat-card">
          <div className="demo-chat-header">
            <div className="practitioner-disclaimer">
  Educational decision-support only. This tool does not diagnose, treat, or replace clinical judgment.
</div>
            <div className="demo-chat-title">Kenko Practitioner AI</div>
            <div className="demo-chat-subtitle">
              Decision-support chat for symptom patterns, labs, and next steps.
            </div>
          </div>

          <div className="demo-chat-container">
            <AnimatePresence>
              <motion.div
                className="chat-window demo-chat-window"
                ref={chatWindowRef}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 70, damping: 14 }}
              >
                <div className="chat-header">Kenko Practitioner AI</div>

                <div className="messages-container">
                  {/* Inline lab upload INSIDE chat */}
                  <motion.div
                    className="message assistant lab-upload-message"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="lab-upload-inline">
                      <div className="lab-upload-inline-title">
                        Optional: Upload labs for quick analysis
                      </div>
                      <div className="lab-upload-inline-subtitle">
                        Demo guidance only. Upload de-identified labs when
                        possible (remove name/DOB/MRN). Files are processed
                        temporarily and not stored.
                      </div>

                      <div className="lab-upload-inline-row">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={(e) =>
                            setLabFile(e.target.files?.[0] || null)
                          }
                        />
                        <button
                          disabled={!labFile || labBusy}
                          onClick={handleLabUpload}
                        >
                          {labBusy ? "Analyzing…" : "Analyze labs"}
                        </button>
                      </div>

                      {labFile && (
                        <div className="lab-upload-inline-file">
                          Selected: <b>{labFile.name}</b>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Conversation */}
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`message ${msg.role}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: (msg.content || "").replace(/\n/g, "<br/>"),
                        }}
                      />
                    </motion.div>
                  ))}

                  {loading && (
                    <div className="message assistant typing-dots">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {showSuggestions && (
                  <div className="suggestions">
                    <button
                      onClick={() =>
                        handleSuggestion(
                          "Here are the symptoms + timeline. What are the top 3 things you’d consider and 1 key clarifying question?"
                        )
                      }
                    >
                      Case reasoning
                    </button>
                    <button
                      onClick={() =>
                        handleSuggestion(
                          "What labs would you consider next, and what would each help clarify?"
                        )
                      }
                    >
                      Suggested labs
                    </button>
                    <button
                      onClick={() =>
                        handleSuggestion(
                          "Give a prioritized first-week plan: diet/lifestyle focus + what to track."
                        )
                      }
                    >
                      First-week plan
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="input-area">
                  <input
                    type="text"
                    placeholder="Type a practitioner question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={sendMessage} disabled={loading}>
                    {loading ? "..." : "Send"}
                  </button>
                </div>

                {/* Footer */}
                <div className="trubiome-footer">
                  Powered by <span>TruBiome.AI</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="app">
      <div style={{ padding: 24 }}>
        Centered demo mode is off. Turn <b>DEMO_MODE_CENTERED</b> on.
      </div>
    </div>
  );
}

export default App;
