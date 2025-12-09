/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
import mockData from "./mockData.json";       // <-- NEW
import Chatbot from "./components/Chatbot.jsx";

// ------------------------------
//  SYSTEM PROMPT
// ------------------------------
const systemPrompt = `
You are the InnerBuddies AI Guide, created by TruBiome.AI. 
Your job is to help users understand their microbiome results in a safe, friendly, and non-medical way.

IMPORTANT BEHAVIOR:
- Do NOT automatically analyze microbiome results unless the user asks.
- When the user requests explanation, summarization, or interpretation:
    → Read from the JSON microbiome data included in system messages.
- If the user has not asked about microbiome results, behave like a normal helpful assistant.
- Never ask the user to paste raw JSON or give lab data.
- Never give diagnostic statements or medical claims.

SAFE LANGUAGE:
Use phrases like:
- “may support”
- “is associated with”
- “research suggests”
- “is linked to”
Avoid terms like:
- “treats”
- “cures”
- “prevents”
- any disease names

RESPONSE STYLE:
- Friendly, warm, encouraging.
- 3–5 short sentences unless the user asks for deeper detail.
- Use simple, human language.

OPENING MESSAGE:
“Hi! I can help you understand your microbiome results and wellness insights. What would you like to explore?”
`;


// ------------------------------
//  OPENAI CLIENT
// ------------------------------
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});


// ------------------------------
//              APP
// ------------------------------
function App() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const correctPassword = "IB2025!";

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I can help you understand your microbiome results and wellness insights. What would you like to explore?" },
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
  //        SEND MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },

          // Inject microbiome JSON into context (but bot only uses it if asked!)
          {
            role: "system",
            content: "Here is the user's microbiome data (demo mode): " + JSON.stringify(mockData)
          },

          ...newMessages,
        ],
        temperature: 0.6,
      });

      const botMessage = response.choices[0].message.content;

      setMessages([
        ...newMessages,
        { role: "assistant", content: botMessage },
      ]);
    } catch (err) {
      console.error("OpenAI Error:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Oops — something went wrong. Can you try again?" },
      ]);
    }

    setLoading(false);
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };


  // ------------------------------
  //     PASSWORD SCREEN
  // ------------------------------
  if (!authorized) {
    return (
      <div className="password-screen">
        <div className="password-card">

          {/* Logo */}
          <img
            src="/innerbuddies-logo.png"
            alt="InnerBuddies"
            className="password-logo"
          />

          <h2>Enter Password</h2>
          <p>This demo is private and requires a password to view.</p>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={() => {
              if (password === correctPassword) {
                setAuthorized(true);
              } else {
                alert("Incorrect password");
              }
            }}
            className="password-button"
          >
            Unlock Demo
          </button>
        </div>
      </div>
    );
  }


  // ------------------------------
  //            MAIN UI
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
