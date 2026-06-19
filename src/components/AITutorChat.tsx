import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, ShieldAlert } from "lucide-react";

interface ChatMessage {
  role: "user" | "sparky";
  text: string;
}

interface AITutorChatProps {
  lessonTitle: string;
  subject: string;
  gradeLevel: string;
  childName: string;
}

export default function AITutorChat({ lessonTitle, subject, gradeLevel, childName }: AITutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize helper start message
  useEffect(() => {
    setMessages([
      {
        role: "sparky",
        text: `BEEP BOOP! Hello ${childName || "friend"}! 👋 I'm **Sparky**, your homeschool AI tutor! Let's explore **"${lessonTitle}"** together. Ask me any question, or tap a magic helper below!`
      }
    ]);
  }, [lessonTitle, childName]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const newMessages = [...messages, { role: "user", text } as ChatMessage];
    setMessages(newMessages);
    setInputVal("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ask-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle,
          subject,
          gradeLevel,
          question: text,
          childName,
          chatHistory: newMessages.slice(-5) // Pass recent conversations for context
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Sparky");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "sparky", text: data.reply }]);
    } catch (error) {
      console.error("Tutor communication error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "sparky",
          text: "Oops! My antennas are a bit static-y right now. 📻 Can you try typing that again?"
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePresetClick = (presetText: string) => {
    sendMessage(presetText);
  };

  const currentPresets = [
    { text: "Explain this like I am 5! 🦕", label: "ELi5" },
    { text: "Give me a funny riddle about this! 🧠", label: "Riddle" },
    { text: "How is this related to active real life? 🚀", label: "Real Life" }
  ];

  return (
    <div className="bg-indigo-900 text-white rounded-3xl p-5 shadow-xl flex flex-col h-[520px] border-4 border-indigo-780">
      {/* Header with Sparky Avatar */}
      <div className="flex items-center space-x-3 border-b border-indigo-800 pb-3 mb-3">
        <div className="relative">
          <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center font-extrabold text-indigo-900 border-2 border-white animate-pulse">
            🤖
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-indigo-950 rounded-full" />
        </div>
        <div>
          <div className="flex items-center space-x-1">
            <h4 className="font-extrabold text-sm tracking-wider">SPARKY</h4>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          </div>
          <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">AI School Tutor</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                m.role === "user" ? "bg-amber-400 text-indigo-900 font-bold" : "bg-indigo-700 text-amber-300"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : "🤖"}
            </div>
            <div
              className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-400 text-indigo-950 rounded-tr-none font-medium"
                  : "bg-indigo-850 border border-indigo-800 rounded-tl-none text-indigo-50"
              }`}
            >
              {m.role === "sparky" ? (
                // Super simple custom rendering of bold block text **word**
                m.text.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-amber-300 font-extrabold">{part}</strong> : part))
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start space-x-2.5 max-w-[85%] mr-auto animate-pulse">
            <div className="w-7 h-7 rounded-full bg-indigo-700 font-bold flex items-center justify-center text-xs">
              🤖
            </div>
            <div className="bg-indigo-850 p-3.5 rounded-2xl rounded-tl-none font-medium text-xs flex space-x-1 items-center">
              <span className="text-indigo-300">Sparky is thinking...</span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Starters */}
      <div className="mt-2.5 pb-2">
        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1.5">
          👉 Tap a Sparky Prompt Helper
        </span>
        <div className="flex flex-wrap gap-1.5">
          {currentPresets.map((preset, idx) => (
            <button
              key={idx}
              disabled={isTyping}
              onClick={() => handlePresetClick(preset.text)}
              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-800 hover:bg-amber-400 hover:text-indigo-950 transition duration-150 rounded-full border border-indigo-700/60"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Inputs */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputVal);
        }}
        className="flex items-center space-x-2 pt-2 border-t border-indigo-800"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask Sparky anything..."
          className="flex-1 bg-indigo-950 border border-indigo-750 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className="bg-amber-400 text-indigo-900 border-2 border-white p-2 rounded-xl hover:bg-amber-300 active:scale-95 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
