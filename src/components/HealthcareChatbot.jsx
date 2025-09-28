// // src/components/HealthcareChatbot.jsx
// import React, { useState, useRef, useEffect } from 'react';

// /**
//  * FRONTEND-ONLY chatbot (for local testing / prototype).
//  * - Pass your API key via prop geminiApiKey (in App.jsx).
//  * - Security: anyone can see the key in network requests -> don't use in production.
//  */

// const HealthcareChatbot = ({ geminiApiKey }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [inputText, setInputText] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [welcomeShown, setWelcomeShown] = useState(false);
//   const [showNotification, setShowNotification] = useState(false);
//   const [notificationDismissed, setNotificationDismissed] = useState(false);

//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);

//   // Speech recognition init (optional)
//   useEffect(() => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (SpeechRecognition) {
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = false;
//       recognitionRef.current.lang = 'en-US';

//       recognitionRef.current.onresult = (event) => {
//         const transcript = event.results[0][0].transcript;
//         setInputText(transcript);
//         setIsListening(false);
//       };

//       recognitionRef.current.onerror = () => setIsListening(false);
//       recognitionRef.current.onend = () => setIsListening(false);
//     }

//     return () => {
//       if (recognitionRef.current) {
//         try { recognitionRef.current.stop(); } catch (e) {}
//       }
//     };
//   }, []);

//   // Welcome message
//   useEffect(() => {
//     const t = setTimeout(() => {
//       if (!welcomeShown && messages.length === 0 && !notificationDismissed) {
//         setMessages([{
//           text: "Hi, I'm your Healthcare Assistant! I'm here to help you with any health-related questions. How can I assist you today?",
//           sender: 'bot',
//           timestamp: new Date(),
//           isWelcome: true
//         }]);
//         setWelcomeShown(true);
//         setIsOpen(true);
//       }
//     }, 8000);
//     return () => clearTimeout(t);
//   }, [welcomeShown, messages.length, notificationDismissed]);

//   // Periodic notification
//   useEffect(() => {
//     if (isOpen || notificationDismissed) return;
//     const t1 = setTimeout(() => {
//       setShowNotification(true);
//       setTimeout(() => setShowNotification(false), 5000);
//     }, 20000);
//     const interval = setInterval(() => {
//       if (!isOpen && !notificationDismissed) {
//         setShowNotification(true);
//         setTimeout(() => setShowNotification(false), 5000);
//       }
//     }, 10000);
//     return () => { clearTimeout(t1); clearInterval(interval); };
//   }, [isOpen, notificationDismissed]);

//   // Scroll to bottom on message change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, isLoading]);

//   const toggleChat = () => {
//     setIsOpen((s) => !s);
//     if (!isOpen) setShowNotification(false);
//   };

//   const handleNotificationClick = () => {
//     setIsOpen(true);
//     setShowNotification(false);
//     setNotificationDismissed(true);
//   };

//   const handleInputChange = (e) => setInputText(e.target.value);

//   // Parse various possible google responses
//   function extractTextFromGeminiResponse(json) {
//     try {
//       // common shapes
//       const cands = json?.candidates;
//       if (Array.isArray(cands) && cands[0]) {
//         const parts = cands[0]?.content?.[0]?.parts;
//         if (parts && parts[0]?.text) return parts[0].text;
//         // fallback nested
//         const parts2 = cands[0]?.content?.parts?.[0]?.text;
//         if (parts2) return parts2;
//       }

//       const outputs = json?.outputs || json?.output;
//       if (Array.isArray(outputs) && outputs[0]) {
//         const out = outputs[0]?.content?.[0]?.text || outputs[0]?.content?.text;
//         if (out) return out;
//       }

//       // generic fallback: try to find "text" values in JSON
//       const s = JSON.stringify(json);
//       return s.slice(0, 2000);
//     } catch (e) {
//       console.warn('parse error', e);
//       return null;
//     }
//   }

//   // Send to Google Generative Language REST API (browser)
//   const handleSendMessage = async () => {
//     if (!inputText.trim()) return;

//     const userText = inputText.trim();
//     const userMessage = { text: userText, sender: 'user', timestamp: new Date() };
//     setMessages(prev => [...prev, userMessage]);
//     setInputText('');
//     setIsLoading(true);

//     if (!geminiApiKey) {
//       const errorMsg = "API Key is missing. Please provide VITE_GEMINI_API_KEY in the .env file.";
//       console.error(errorMsg);
//       setMessages(prev => [...prev, { text: errorMsg, sender: 'bot', timestamp: new Date() }]);
//       setIsLoading(false);
//       return;
//     }

//     try {
//       // short point-based system prompt + rule for non-medical questions
//       const systemPrompt = `
// You are a professional healthcare assistant chatbot.
// Rules:
// - Answer ONLY healthcare/medical/wellness questions.
// - If the user's question is NOT about health/medical/wellness, reply exactly: "Sorry, I can't help you regarding this."
// - For health questions: respond in 4 short bullet points (possible cause, quick remedy, when to see doctor, short safety note).
// - Also suggest the type of doctor (e.g., General Physician, Gastroenterologist, Gynecologist, etc.) for appointment if needed.
// - Keep answers brief and simple.
// IMPORTANT: Always respond in the user's language. The user's language is detected from their question.
// `.trim();

//       const modelId = 'gemini-1.5-flash'; // or 'gemini-1.5-pro' if available to you
      
//       // Construct the URL: API key is passed as a query parameter 'key'
//       const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`;
//       const urlWithKey = endpoint + `?key=${encodeURIComponent(geminiApiKey)}`;
      
//       // Combine system + user into a single user-role content (browser-friendly)
//       const body = {
//         contents: [
//           {
//             role: 'user',
//             parts: [{ text: systemPrompt + '\n\nUser question: ' + userText }]
//           }
//         ],
//         generationConfig: { temperature: 0.2, maxOutputTokens: 400 }
//       };

//       const res = await fetch(urlWithKey, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           // REMOVED: {'x-goog-api-key': geminiApiKey} -- Key should only be in the URL query for 404 fix.
//         },
//         body: JSON.stringify(body)
//       });

//       if (!res.ok) {
//         let txt = '';
//         try { txt = await res.text(); } catch (e) {}
//         console.error('API error', res.status, txt);
//         const userFriendly = res.status === 401 || res.status === 403
//           ? `API key error (${res.status}). Check key & referrer restrictions in Google AI Studio or Google Cloud Console.`
//           : res.status === 404
//           ? `API returned ${res.status} (Not Found). Check the model name and API endpoint URL.`
//           : `API returned ${res.status}. See console for details.`;
//         throw new Error(userFriendly);
//       }

//       const json = await res.json();
//       const modelText = extractTextFromGeminiResponse(json);

//       if (!modelText) throw new Error('No usable text from model response.');

//       setMessages(prev => [...prev, { text: modelText, sender: 'bot', timestamp: new Date() }]);
//     } catch (err) {
//       console.error('generate error', err);
//       const messageText = (err && err.message) ? err.message : "I'm sorry, I'm having trouble responding right now. Please try again later.";
//       setMessages(prev => [...prev, { text: messageText, sender: 'bot', timestamp: new Date() }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVoiceInput = () => {
//     if (!recognitionRef.current) {
//       console.warn('Speech recognition not supported here');
//       return;
//     }
//     if (isListening) {
//       recognitionRef.current.stop();
//       setIsListening(false);
//     } else {
//       try {
//         recognitionRef.current.start();
//         setIsListening(true);
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const formatTime = (date) => {
//     try { return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
//     catch { return ''; }
//   };

//   return (
//     <div className="fixed bottom-6 right-6 z-50">
//       {showNotification && !isOpen && (
//         <div className="absolute bottom-20 right-0 bg-sky-500 text-white text-sm rounded-lg px-4 py-3 shadow-lg transition-all duration-300 animate-bounce cursor-pointer max-w-xs" onClick={handleNotificationClick}>
//           <div className="flex items-start">
//             <div className="flex-shrink-0 mr-2">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div>
//               <p className="font-medium">Healthcare Assistant</p>
//               <p className="text-xs">Need help? I'm here to answer your health questions!</p>
//             </div>
//           </div>
//         </div>
//       )}

//       <button onClick={toggleChat} className={`w-16 h-16 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-sky-600 focus:outline-none ${isOpen ? 'rotate-45' : ''}`} aria-label="Toggle chat">
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//         </svg>
//       </button>

//       <div className={`absolute bottom-20 right-0 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
//         <div className="bg-sky-500 text-white p-4 flex justify-between items-center">
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-green-400 rounded-full mr-2" />
//             <h3 className="font-semibold">Healthcare Assistant</h3>
//           </div>
//           <button onClick={toggleChat} className="text-white hover:text-sky-100 focus:outline-none" aria-label="Close chat">
//             ✕
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
//           {messages.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-gray-500">
//               <div className="bg-sky-100 p-4 rounded-full mb-4">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-medium text-sky-600 mb-2">Healthcare Assistant</h3>
//               <p className="text-center px-4">Ask me anything about health, medical conditions, treatments, or wellness. I'm here to help!</p>
//             </div>
//           ) : (
//             messages.map((message, i) => (
//               <div key={i} className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
//                 <div className={`max-w-xs md:max-w-md rounded-xl px-4 py-2 ${message.sender==='user' ? 'bg-sky-500 text-white rounded-br-none' : message.isWelcome ? 'bg-sky-100 border border-sky-200 rounded-bl-none' : 'bg-white border border-gray-200 rounded-bl-none'}`}>
//                   <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
//                   <p className={`text-xs mt-1 ${message.sender==='user' ? 'text-sky-100' : message.isWelcome ? 'text-sky-600' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</p>
//                 </div>
//               </div>
//             ))
//           )}
//           {isLoading && (
//             <div className="flex justify-start mb-4">
//               <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 rounded-bl-none">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
//                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
//                 </div>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         <div className="border-t border-gray-200 p-4 bg-white">
//           <div className="flex items-center">
//             <button onClick={handleVoiceInput} className={`p-2 rounded-full mr-2 ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`} aria-label={isListening ? 'Stop voice input' : 'Start voice input'}>
//               🎤
//             </button>
//             <textarea value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ask a health-related question..." className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" rows={1} disabled={isLoading} />
//             <button onClick={handleSendMessage} disabled={isLoading || !inputText.trim()} className={`ml-2 p-2 rounded-full ${inputText.trim() && !isLoading ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-gray-200 text-gray-400'}`} aria-label="Send message">
//               ➤
//             </button>
//           </div>
//           <p className="text-xs text-gray-500 mt-2 text-center">This assistant provides healthcare information only. Always consult a medical professional.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HealthcareChatbot;


// src/components/HealthcareChatbot.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * HealthcareChatbot (OpenAI) with automatic language detection.
 * - Frontend-only prototype. For production, use a backend proxy to hide the API key.
 * - Pass your OpenAI key via prop `openaiApiKey` (for testing only).
 */

const HealthcareChatbot = ({ openaiApiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- auto scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Web Speech API init ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US"; // you may modify this or detect user locale

    rec.onresult = (evt) => {
      const transcript = evt.results?.[0]?.[0]?.transcript;
      if (transcript) setInputText((t) => (t ? t + " " + transcript : transcript));
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;

    return () => {
      try { recognitionRef.current?.stop(); } catch (e) {}
      recognitionRef.current = null;
    };
  }, []);

  // --- welcome message ---
  useEffect(() => {
    const t = setTimeout(() => {
      if (!welcomeShown && messages.length === 0 && !notificationDismissed) {
        setMessages([
          {
            text: "Hi, I'm your Healthcare Assistant! Ask me about symptoms, treatments or wellness. I can't replace a doctor but I can give guidance.",
            sender: "bot",
            timestamp: new Date(),
            isWelcome: true,
          },
        ]);
        setWelcomeShown(true);
        setIsOpen(true);
      }
    }, 6000);
    return () => clearTimeout(t);
  }, [welcomeShown, messages.length, notificationDismissed]);

  // --- small notification if closed ---
  useEffect(() => {
    if (isOpen || notificationDismissed) return;
    const show = setTimeout(() => setShowNotification(true), 16000);
    const hide = setTimeout(() => setShowNotification(false), 21000);
    const interval = setInterval(() => {
      if (!isOpen && !notificationDismissed) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    }, 30000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearInterval(interval);
    };
  }, [isOpen, notificationDismissed]);

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const toggleChat = () => {
    setIsOpen((s) => !s);
    if (!isOpen) setShowNotification(false);
  };

  const handleNotificationClick = () => {
    setIsOpen(true);
    setShowNotification(false);
    setNotificationDismissed(true);
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }
    if (isListening) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    } else {
      try { recognitionRef.current.start(); setIsListening(true); } catch (e) { console.error(e); setIsListening(false); }
    }
  };

  // --- fetch with retry for transient statuses ---
  const fetchWithRetry = async (url, options = {}, retries = 3, initialDelay = 800) => {
    let attempt = 0;
    while (attempt <= retries) {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 || res.status === 503) {
        if (attempt === retries) return res;
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        attempt += 1;
        continue;
      }
      return res; // non-retriable status
    }
    throw new Error("Network error (retry attempts exhausted).");
  };

  // --- language detection using OpenAI (returns language name like "Hindi" or "English") ---
  const detectLanguage = async (text) => {
    if (!text || !openaiApiKey) return "English";

    const prompt = `You are a language detection assistant. Detect the primary language of the user's text and reply with ONLY the language name (one word or short phrase), e.g. "English", "Hindi", "मराठी", "Español". Do NOT include extra text.`;

    try {
      const body = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 10,
      };

      const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        try { const txt = await res.text(); console.error('Language detect error', res.status, txt); } catch(e){}
        return "English";
      }

      const data = await res.json();
      let lang = data?.choices?.[0]?.message?.content?.trim() || "English";

      // sanitize: take first line, remove punctuation around it
      lang = lang.split('\n')[0].replace(/[^\p{L}\s\-]/gu, "").trim();
      if (!lang) lang = "English";
      return lang;
    } catch (e) {
      console.error("detectLanguage error", e);
      return "English";
    }
  };

  // --- helper to build system prompt with chosen language ---
  const buildSystemPrompt = (language) => {
    return `You are a professional healthcare assistant.\nRules:\n- Answer ONLY healthcare/medical/wellness questions.\n- If the user's question is NOT about health/medical/wellness, reply exactly: "Sorry, I can't help you regarding this."\n- For health questions, respond in EXACTLY this format (short lines):\n  - **Possible Cause**: [5-12 words]\n  - **Immediate Care**: [5-12 words]\n  - **See Doctor If**: [5-12 words]\n  - **Prevention Tip**: [5-12 words]\n- After the bullet points, add: "Doctor: [Specialist type]"\n- Keep responses concise.\n- ALWAYS reply in the user's language: ${language}. If you cannot produce the response directly, provide a short translation into ${language}.\n- End with: "Seek professional help for emergencies."`;
  };

  // --- format bot message HTML (simple parser) ---
  const formatBotMessage = (text) => {
    const lines = text.split('\n').filter((l) => l.trim() !== "");
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          // bullet like: - **Possible Cause**: ...
          const bulletMatch = trimmed.match(/^-\s*\*\*(.*?)\*\*:\s*(.*)$/);
          if (bulletMatch) {
            const title = bulletMatch[1];
            const content = bulletMatch[2];
            return (
              <div key={i} className="flex items-start">
                <span className="text-sky-500 mr-2">•</span>
                <div>
                  <div className="font-semibold text-sky-700">{title}</div>
                  <div className="text-sm">{content}</div>
                </div>
              </div>
            );
          }

          // Doctor line
          if (/doctor\s*:/i.test(trimmed)) {
            return (
              <div key={i} className="mt-3 pt-2 border-t border-gray-200">
                <span className="font-semibold text-sky-600">{trimmed}</span>
              </div>
            );
          }

          // emergency line
          if (/emergency|seek professional|call your doctor/i.test(trimmed)) {
            return (
              <div key={i} className="mt-2 text-sm text-gray-600 italic">{trimmed}</div>
            );
          }

          return <p key={i} className="mb-1">{trimmed}</p>;
        })}
      </div>
    );
  };

  // --- main send message flow: detect language -> ask OpenAI with language enforced ---
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMessage = { text, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    if (!openaiApiKey) {
      setMessages((prev) => [...prev, { text: "OpenAI API key not configured. Pass openaiApiKey prop (testing only).", sender: "bot", timestamp: new Date() }]);
      setIsLoading(false);
      return;
    }

    try {
      // 1) detect language
      const lang = await detectLanguage(text);

      // 2) build prompt with enforced language
      const systemPrompt = buildSystemPrompt(lang);

      const body = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 260,
      };

      const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let bodyTxt = "";
        try { bodyTxt = await res.text(); } catch (e) {}
        console.error("OpenAI API error", res.status, bodyTxt);
        const friendly = res.status === 401 || res.status === 403 ? `API key error (${res.status}).` : `OpenAI API returned ${res.status}.`;
        throw new Error(friendly);
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";

      setMessages((prev) => [...prev, { text: reply, sender: "bot", timestamp: new Date() }]);
    } catch (err) {
      console.error("generate error", err);
      setMessages((prev) => [...prev, { text: err?.message || "Temporary problem connecting to AI service.", sender: "bot", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {showNotification && !isOpen && (
        <div className="absolute bottom-20 right-0 bg-sky-500 text-white text-sm rounded-lg px-4 py-3 shadow-lg transition-all duration-300 animate-bounce cursor-pointer max-w-xs" onClick={handleNotificationClick}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Healthcare Assistant</p>
              <p className="text-xs">Need help? I'm here to answer your health questions!</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={toggleChat} aria-label="Toggle chat" className={`w-16 h-16 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-sky-600 focus:outline-none ${isOpen ? "rotate-45" : ""}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <div className={`absolute bottom-20 right-0 w-80 md:w-96 h-[520px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="bg-sky-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2" />
            <h3 className="font-semibold">Healthcare Assistant</h3>
          </div>
          <button onClick={toggleChat} className="text-white hover:text-sky-100 focus:outline-none" aria-label="Close chat">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="bg-sky-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-sky-600 mb-2">Healthcare Assistant</h3>
              <p className="text-center px-4">Ask me anything about health, medical conditions, treatments, or wellness. I support multiple languages!</p>
            </div>
          ) : (
            messages.map((message, i) => (
              <div key={i} className={`mb-4 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs md:max-w-md rounded-xl px-4 py-2 ${message.sender === "user" ? "bg-sky-500 text-white rounded-br-none" : message.isWelcome ? "bg-sky-100 border border-sky-200 rounded-bl-none" : "bg-white border border-gray-200 rounded-bl-none"}`}>
                  {message.sender === "bot" ? (
                    <div className="text-sm">
                      {formatBotMessage(message.text)}
                      <p className={`text-xs mt-1 ${message.isWelcome ? "text-sky-600" : "text-gray-500"}`}>{formatTime(message.timestamp)}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                      <p className="text-xs mt-1 text-sky-100">{formatTime(message.timestamp)}</p>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center">
            <button onClick={handleVoiceToggle} className={`p-2 rounded-full mr-2 ${isListening ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`} aria-label={isListening ? "Stop voice input" : "Start voice input"}>🎤</button>

            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a health-related question... (Supported in all languages)" className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" rows={1} disabled={isLoading} />

            <button onClick={handleSendMessage} disabled={isLoading || !inputText.trim()} className={`ml-2 p-2 rounded-full ${inputText.trim() && !isLoading ? "bg-sky-500 text-white hover:bg-sky-600" : "bg-gray-200 text-gray-400"}`} aria-label="Send message">➤</button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">This assistant provides healthcare information only. Always consult a medical professional for diagnosis and emergencies.</p>
        </div>
      </div>
    </div>
  );
};

export default HealthcareChatbot;
