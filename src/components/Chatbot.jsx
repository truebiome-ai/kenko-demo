import React, { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your CeraThrive guide." }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "This is a widget preview response." }
      ]);
    }, 500);
  };

  return (
    <div className="chatbot-widget-window">
      <div className="chatbot-widget-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chatbot-widget-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="chatbot-widget-input">
        <input
          value={input}
          placeholder="Type here..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
