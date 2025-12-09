/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
import { getBrandConfig } from "./brands";
import Chatbot from "./components/Chatbot.jsx";

// Load brand config
const brand = getBrandConfig("cerathrive");

// ------------------------------
//  🔍 FUZZY MATCHING UTILITIES
// ------------------------------
const isSimilar = (input, keyword) => {
  return (
    input.toLowerCase().includes(keyword.toLowerCase()) ||
    keyword.toLowerCase().includes(input.toLowerCase())
  );
};

const getProductRecommendations = (userSymptoms) => {
  return brand.products.filter((product) =>
    product.keywords.some((keyword) =>
      userSymptoms.some((symptom) => isSimilar(symptom, keyword))
    )
  );
};

const formatProductLinks = (products) =>
  products
    .map(
      (product) =>
        `- **[${product.name}](${product.link})** – ${product.description}`
    )
    .join("\n");

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ------------------------------
//            APP COMPONENT
// ------------------------------
function App() {
  // 🔐 PASSWORD PROTECTION (NEW)
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const correctPassword = "CERA2025!";

  // Chat states
  const [messages, setMessages] = useState([
    { role: "assistant", content: brand.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);

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
  //         SEND MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const productList = brand.products
      .map(
        (p) =>
          `- **${p.name}** – ${p.description}. [Buy ${p.name}](${p.link})`
      )
      .join("\n");

    const systemPrompt = `
You are the CeraThrive AI — warm, confident, functional-medicine informed.
CeraThrive sells ONE product: **The CERA System**.

RESPONSE RULES:
- Max 3–5 short sentences.
- Mention “The CERA System” ONLY once per answer, then say “the device”.
- Never write long paragraphs.
- Never say “might help.” Instead use:
  “supports”, “is designed to”, “is helpful for”, “is known to”, “can be a valuable tool”.
- Respond step-by-step, conversationally.

FOLLOW-UP BEHAVIOR:
1) First user message → acknowledge + ask ONE clarifying question.
2) After user answers → give short explanation + short device connection + ask:
   “Would you like more information?”
3) If yes → explain how device supports THEIR symptoms → ask:
   “Would you like to know your recommended routine?”
4) If yes → give simple routine (10–20 minutes, placement, frequency).

STYLE:
- Calm, confident, simple, supportive.
- No medical diagnosing.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...newMessages,
        ],
        temperature: 0.7,
      });

      const botMessage = response.choices[0].message.content;

      setMessages([...newMessages, { role: "assistant", content: botMessage }]);
      setFollowUpCount((x) => x + 1);
    } catch (err) {
      console.error("OpenAI Error:", err);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Oops — I hit a snag. Could you try again?",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ------------------------------
  // 🔐 PASSWORD SCREEN RENDER (NEW)
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
            boxShadow: "0 0 30px rgba(255, 90, 120, 0.3)",
            textAlign: "center",
          }}
        >
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
              background: "linear-gradient(90deg, #ff4f9a, #ff9a3c)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none",
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
          <div className="chat-header">CeraThrive AI Advisor</div>

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
              placeholder="I need help with..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
