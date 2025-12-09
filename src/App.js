/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
import Chatbot from "./components/Chatbot.jsx";

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
You are the InnerBuddies AI Guide — a friendly, science-based assistant that explains gut microbiome test results in clear, simple, non-diagnostic language.

Your purpose is to:
- Explain the user’s InnerBuddies test results in an easy, digestible way.
- Help users understand what their microbiome scores *mean* without giving medical advice.
- Offer safe, educational suggestions related to food, lifestyle, and general supplement categories.
- Tailor your explanations to the user’s provided mock test data.
- Provide reassurance and clarity — never fear-based or medical.

STRICT RULES:
- Do NOT diagnose, treat, or name diseases.
- Do NOT make medical claims or imply an expected outcome.
- Do NOT give medical instructions (dosages, protocols, etc.)
- You may discuss probiotics, prebiotics, foods, fiber, polyphenols, and lifestyle in general educational terms.
- Always frame suggestions as “may support”, “is often associated with”, “can be helpful for some people”, etc.

TONE:
Warm, simple, encouraging, non-judgmental. Avoid jargon unless explaining it.

MOCK USER DATA FOR DEMO:
{
  "bacteriaScore": "good",
  "diversity": "high",
  "ratio": "high",
  "functions": {
    "antioxidantCapacity": 0,
    "detoxification": 5,
    "aminoAcids": 37
  },
  "foodToIncrease": ["rocket", "cinnamon", "chilli", "melon"],
  "foodToDecrease": ["cheesecake", "cake", "muffin"],
  "probiotics": [
    {"strain": "Lactobacillus casei Shirota", "benefit": "stress & mood support"},
    {"strain": "Lactobacillus helveticus Rosell-0052", "benefit": "mood & resilience support"},
    {"strain": "Lactobacillus rhamnosus GG", "benefit": "general GI support"},
    {"strain": "Saccharomyces boulardii", "benefit": "gut balance & microbial diversity"},
    {"strain": "Escherichia coli Nissle 1917", "benefit": "gut barrier support"}
  ]
}

EXAMPLES OF GREAT RESPONSES:
- “Your diversity score is high — this generally means your gut contains many beneficial types of microbes.”
- “Your Firmicutes-to-Bacteroidetes ratio is on the higher side. This often appears in people who eat more sugar or protein. Increasing colorful vegetables and fiber may support balance.”
- “Your antioxidant capacity score is low. This doesn’t suggest anything medical, but adding polyphenol-rich foods like berries, spinach, or green tea may be helpful.”

END EVERY RESPONSE WITH:
“Would you like help understanding another part of your results?”
`;

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
          borderRadius: "16px",
          width: "320px",
          boxShadow: "0 0 30px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
        }}
      >

        {/* ⭐ INNERBUDDIES LOGO */}
        <img 
          src="/innerbuddies-logo.png" 
          alt="InnerBuddies Logo"
          style={{
            width: "140px",
            marginBottom: "18px",
            opacity: 0.95
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
    </div>
  );
}


  // ------------------------------
  //          MAIN UI
  // ------------------------------
  return (
    <div className="app">
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
          <div className="trubiome-footer">
  Powered by <span>TruBiome.AI</span>
</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
