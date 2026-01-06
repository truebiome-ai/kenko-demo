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
  const DEMO_MODE_CENTERED = true;
  const PASSWORD_ENABLED = false;

  // Password (kept but disabled)
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

  // Lab upload (DEMO UI only)
  const [labFile, setLabFile] = useState(null);
  const [labBusy, setLabBusy] = useState(false);

  const chatWindowRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

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
You are the *Kenko Practitioner AI*, a clinician-facing decision-support assistant.

IMPORTANT SAFETY / DISCLAIMER:
- You are NOT a medical provider.
- You do not diagnose, treat, cure, or prevent disease.
- This tool is educational and decision-support only.
- The licensed practitioner remains fully responsible for clinical decisions and patient care.

Your role:
• Help practitioners think through symptom patterns, potential contributors, and next-step options.
• Suggest reasonable lab categories and common functional-medicine style considerations.
• Use cautious language: “may”, “can be associated with”, “could consider”, “discuss with a licensed clinician”.
• Keep responses concise: 4–8 short bullet points by default.

Rules:
1) Ask ONE clarifying question when needed (only one).
2) If user asks “what should I do first?” → give a prioritized 3-step plan.
3) Supplements: categories only (no dosing, no medical claims).
4) Labs: suggest categories and what they can help clarify; do not state diagnoses.
5) If input is vague, ask for missing detail (duration, severity, triggers, meds, key history).

Tone:
• Professional, clear, practitioner-friendly.
• Confident but cautious.
`;

  const handleSuggestion = (text) => {
    setShowSuggestions(false);
    setInput(text);
  };

  // ------------------------------
  //  LAB UPLOAD HANDLER (DEMO ONLY — NO BACKEND)
  // ------------------------------
  const handleLabUpload = async () => {
    if (!labFile) return;

    setLabBusy(true);
    setShowSuggestions(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Got it — lab upload received (demo). This demo build does not parse PDFs yet.\n\nFor now, paste key lab values as text (e.g., CBC/CMP, iron studies, thyroid markers, inflammatory markers) and I’ll summarize patterns + next-step considerations.",
      },
    ]);

    // Simulate short wait so it feels interactive
    setTimeout(() => {
      setLabBusy(false);
      setLabFile(null);
    }, 600);
  };

  // ------------------------------
  //  SEND MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

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
              "Demo context only (not patient data): " + JSON.stringify(mockData),
          },
          ...newMessages,
        ],
        temperature: 0.65,
      });

      const botMessage = response?.choices?.[0]?.message?.content || "";
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
  // 🔐 PASSWORD SCREEN (DISABLED)
  // ------------------------------
  if (PASSWORD_ENABLED && !authorized) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ padding: 24, borderRadius: 16, background: "#111", color: "#fff" }}>
          Password mode is enabled.
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
            <div className="demo-chat-title">Kenko Practitioner AI</div>
            <div className="demo-chat-subtitle">
              Decision-support chat for symptom patterns, labs, and next steps.
            </div>

            {/* Cover-your-ass disclaimer (visible) */}
            <div className="demo-disclaimer">
              Decision-support only. Not medical advice. No diagnosis or treatment.
              Licensed practitioner remains responsible for patient care.
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
                  {/* Inline lab upload INSIDE the chat */}
                  <motion.div
                    className="message assistant lab-upload-message"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="lab-upload-inline">
                      <div className="lab-upload-inline-title">
                        Optional: Upload labs (demo)
                      </div>
                      <div className="lab-upload-inline-subtitle">
                        For privacy, upload de-identified files only. This demo build
                        does not parse PDFs yet — paste key values as text for analysis.
                      </div>

                      <div className="lab-upload-inline-row">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={(e) => setLabFile(e.target.files?.[0] || null)}
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

                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`message ${msg.role}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(/\n/g, "<br/>"),
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

                {showSuggestions && (
                  <div className="suggestions">
                    <button
                      onClick={() =>
                        handleSuggestion(
                          "Here are the symptoms + timeline. What are the top 3 considerations and 1 key clarifying question?"
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

  return <div className="app" />;
}

export default App;
