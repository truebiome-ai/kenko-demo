/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
import Chatbot from "./components/Chatbot.jsx";
import mockData from "./mockData.json";

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ------------------------------
//            APP COMPONENT
// ------------------------------
function App() {
  // 🔐 PASSWORD PROTECTION
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const correctPassword = "IB2025!";

  // Chat states
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m the InnerBuddies AI Guide. I can help explain microbiome test results, clarify your dashboard insights, and offer general food & lifestyle suggestions. What would you like to explore?",
   
      },
    
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatWindowRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Auto-scroll
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);
  

  // ------------------------------
  //  SYSTEM PROMPT (InnerBuddies)
  // ------------------------------
  const systemPrompt = `
You are the *InnerBuddies AI Guide*, a friendly, scientific, supportive microbiome assistant created by TruBiome.AI.

Your role:
• Interpret the user’s microbiome JSON data that is passed into the model.
• Explain results in simple, human language without medical claims.
• Stay fully compliant: no diagnosing, no disease language, no HIPAA-sensitive statements.
• Provide food, lifestyle, and supplement-category guidance — but no brand names.
• Keep all responses within 3–5 short sentences unless the user requests depth.

Rules:
1. Always ground explanations in the user's JSON data fields: abundance, functions, diversity, F/B ratio, and focus areas.
2. Avoid clinical terms like “disease, treat, cure, prevent, IBS, SIBO, depression, etc.”
3. Use safe language: “may support”, “is associated with”, “suggests”, “research indicates”.
4. When bacteria are high or low, explain what that pattern generally means and how diet/lifestyle may influence it.
5. If the user asks “summarize my results” → Produce a clean 3-part summary:
   - Key strengths
   - Key imbalances
   - Areas to support
6. If the user asks for recommendations:
   - Give categories only (e.g., “prebiotic fibers”, “polyphenol-rich foods”, “fermented foods”).
7. If the user sends unstructured text → answer normally.
8. If the user’s question requires contextual data, read it directly from the JSON.

Your tone:
• Warm, validating, non-judgmental.
• Educated but accessible.
• Never overwhelming — break ideas into short, digestible parts.

Your opening message (only once):
“Hi! What would you like to explore today? You can ask about your gut, your results, or anything you're curious about.”

ADVANCED MICROBIOME INTERPRETATION (ENHANCED MODE):
- When the user specifically asks for personalized recommendations, deeper explanations, or reasoning (“why is this?”, “based on my results”, “specific to my microbiome”), go into a higher-detail mode.
- In this mode, analyze the JSON data more thoroughly:
    • Identify which bacteria are unusually high or low.
    • Explain what each relevant microbe is *generally associated with* in scientific literature (diversity, inflammation, SCFA production, etc.).
    • Reference the user's microbiome functions (SCFA, vitamins, inflammation, detox) to connect them to practical actions.
    • Provide category-level food and lifestyle recommendations that directly correspond to those imbalances.

- You may link recommendations to the JSON like this:
    • “Because your butyrate-production score is strong…”  
    • “Since inflammation markers are moderately elevated…”  
    • “Your high ratio of Firmicutes to Bacteroidetes suggests…”  
    • “Your low tryptophan pathway score indicates…”

- Keep all guidance non-medical:
    • No diagnoses  
    • No disease names  
    • No medical treatments  

- You ARE allowed to:
    • Explain how foods support specific pathways ("supports SCFA production", "feeds beneficial bacteria", "may help reduce inflammatory signaling")  
    • Relate bacterial patterns to diet and lifestyle  
    • Give tailored gut-health strategies  
    • Connect clusters of bacteria to specific functional outcomes  

`;
// ------------------------------
//    Idk what this one is oops
// ------------------------------
const handleSuggestion = (text) => {
  setShowSuggestions(false);
  setInput(text);
};
// ------------------------------
//     TOGGLE WIDGET (OPEN/CLOSE)
// ------------------------------
const toggleWidget = () => {
    setWidgetOpen(!widgetOpen);
    setShowTooltip(false);
};

  // ------------------------------
  //         SEND MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
  { role: "system", content: systemPrompt },

  // NEW — gives the bot the demo microbiome data
  {
    role: "system",
    content: "Here is the user's microbiome data (demo mode): " + JSON.stringify(mockData)
  },

  ...newMessages,
],

        temperature: 0.65,
      });

      const botMessage = response.choices[0].message.content;

      setMessages([...newMessages, { role: "assistant", content: botMessage }]);
    } catch (err) {
      console.error("OpenAI Error:", err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Hmm — something went wrong. Could you try that again?",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ------------------------------
  // 🔐 PASSWORD SCREEN RENDER
  // ------------------------------
if (!authorized) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
      }}
    >
      <div
  style={{
    background: "#111",
    padding: "40px",
    borderRadius: "20px",
    width: "340px",
    textAlign: "center",
    boxShadow: "0 0 60px rgba(92, 59, 143, 0.45)", // ⬅ Purple glow
    animation: "riseIn 0.7s ease-out",            // ⬅ Smooth entrance
  }}
>


        {/* ⭐ INNERBUDDIES LOGO */}
        <img 
  src="/innerbuddies-logo.png" 
  alt="InnerBuddies Logo"
  style={{
    width: "180px",          // ⬅ Bigger logo
    marginBottom: "22px",
    opacity: 0.98,
    animation: "fadeIn 0.9s ease-out",
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

        <p style={{ color: "#bbb", fontSize: "0.9rem", marginBottom: "20px" }}>
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
            if (password === correctPassword) {
              setAuthorized(true);
            } else {
              alert("Incorrect password");
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            background: "linear-gradient(120deg, #5C3B8F, #7ECF9A)", // InnerBuddies purple → green
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
      <div className="footer">
  <img src="/logo-transparent.png" alt="TruBiome.AI" className="footer-logo" />
  <p className="copyright">
    © 2025 TruBiome.AI • All rights reserved  
  </p>
  <a href="#" className="terms-link">Terms of Use</a>
</div>

    </div>
  );
}


  // ------------------------------
  //          MAIN UI
  // ------------------------------
  return (
    <div className="app">
      {/* Floating Launcher Bubble */}
<div className="chat-launcher" onClick={toggleWidget}>
    💬
</div>

{/* Tooltip - one-time popup */}
{showTooltip && !widgetOpen && (
    <div className="tooltip-once">Hi! Ask me anything about your gut 🌱</div>
)}
      {/* Chat window appears only when widget is open */}
{widgetOpen && (
  <div className="chat-widget-container">
    <AnimatePresence>
      <motion.div
        className="chat-window"
        ref={chatWindowRef}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 10 }}
      >
        <div className="chat-header">InnerBuddies AI Guide</div>

        <div className="messages-container">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
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

        {/* Suggestions */}
        {showSuggestions && (
          <div className="suggestions">
            <button onClick={() => handleSuggestion("Summarize my microbiome results")}>
              Summarize my results
            </button>
            <button onClick={() => handleSuggestion("What foods should I eat for my gut?")}>
              Food for my gut
            </button>
            <button onClick={() => handleSuggestion("Explain my bacteria diversity")}>
              Explain diversity
            </button>
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <input
            type="text"
            placeholder="Ask about your microbiome results..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

        {/* Footer */}
        <div className="trubiome-footer">
          Powered by <span>TruBiome.AI</span>
        </div>

      </motion.div>
    </AnimatePresence>
  </div>
)}

    </div>
  );
}

export default App;
