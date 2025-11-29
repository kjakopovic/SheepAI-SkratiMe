import React, { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '../../lib/utils'

// --- PROMPT VARIABLES ---
// Update these prompts to change the personality/output of the modes
const PROMPT_TEMPLATES = {
  'flashpoint-10s': `
    You are in Flashpoint Mode.

    Your task is to read the article content provided (including title, body text, and any summarization the user gives) and produce a very short, instantly scannable news digest.

    Return the output in the following exact format:

    1. A single-sentence headline capturing the core of the story.
    2. Three bullet points highlighting the most important facts, developments, or data points.

    Rules:
    - The headline must be concise, neutral, and impactful.
    - Each bullet point must be one sentence.
    - No extra commentary, no introduction, no conclusion.
    - Do not exceed three bullet points.
    Text to summarize:
  `,
  'executive-brief-60s': `
    You are in Executive Brief Mode.

    Your job is to read the provided news article (including title, text, and optional summary) and produce a concise, business-focused executive brief.

    Return the output in the following exact structure:

    1. A 5-sentence summary of the article.  
    2. An Impact Analysis section: a short paragraph describing the broader implications, risks, or opportunities created by the news.  
    3. A Custom Category Impact section: a short paragraph analyzing how this news affects the user's specific category. The list of all possible user categories will be provided in the input.
    Rules:
    - Maintain a professional, analytical tone.
    - Prioritize clarity and actionable insight.
    - Do not exceed 5 sentences in the summary.
    - Each section must be clearly labeled.
    - No extra commentary outside the structure.
    Text to summarize:
  `,
  'balance-check-90s': `
    You are in Balance Check Mode.
    Your job is to read the provided news article (including title, text, and optional summary) and extract the core arguments from all major perspectives on the issue.

    Return the output in the following exact structure:

    1. PRO Perspective: A concise list of the strongest arguments supporting the news, decision, or development.  
    2. CON Perspective: A concise list of the strongest arguments opposing or criticizing the news, decision, or development.  
    3. NEUTRAL Perspective: A concise list of context-setting or fact-based points that do not take sides but clarify the situation.

    Rules:
    - Each perspective should contain 3–6 bullet points.
    - Arguments must be factual, balanced, and free of personal opinions.
    - Do not fabricate arguments not supported by the article or widely documented context.
    - Do not provide analysis outside the three structured sections.
    - No introductions or conclusions—only the three labeled blocks.
    Text to summarize:
  `
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatbotProps {
  articleContext?: string; // The content of the article to summarize
}

export const Chatbot = ({ articleContext }: ChatbotProps) => {
  const [viewState, setViewState] = useState<'closed' | 'options' | 'chat'>('closed')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I can help you navigate the news or answer questions about articles. Select a mode below to analyze the current article.',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (viewState === 'chat') {
      scrollToBottom()
    }
  }, [messages, viewState, isLoading])

  type Option = { id: keyof typeof PROMPT_TEMPLATES; label: string }

  const options: Option[] = [
    { id: 'flashpoint-10s', label: 'Flashpoint (10 sec)' },
    { id: 'executive-brief-60s', label: 'Executive brief (60 sec)' },
    { id: 'balance-check-90s', label: 'Balance check (90 sec)' },
  ]

  const callGeminiApi = async (promptType: keyof typeof PROMPT_TEMPLATES, context: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return "Error: Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.";
    }

    const fullPrompt = `${PROMPT_TEMPLATES[promptType]}\n\n"${context}"`;

    try {
      // Using gemini-1.5-flash for faster, lower-latency responses
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error("Gemini API Error:", data);
        return "I couldn't generate a summary at this time. Please try again.";
      }
    } catch (error) {
      console.error("Network Error:", error);
      return "Connection error. Please check your internet connection.";
    }
  };

  const handleOptionClick = async (opt: Option) => {
    setViewState('chat')
    
    // Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: opt.label,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newUserMsg])

    if (!articleContext) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          text: "I don't see an open article to summarize right now. Please open an article first!",
          isUser: false,
          timestamp: new Date(),
        }])
      }, 500);
      return;
    }

    setIsLoading(true);

    // Call API
    const aiResponseText = await callGeminiApi(opt.id, articleContext);

    setIsLoading(false);

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: aiResponseText,
      isUser: false,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, botResponse])
  }

  const toggleChat = () => {
    setViewState((prev) => (prev === 'closed' ? 'options' : 'closed'))
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence mode="wait">
        {viewState === 'chat' && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-card border border-border shadow-2xl rounded-2xl w-[90vw] sm:w-96 overflow-hidden flex flex-col h-[500px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewState('closed')}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    'flex w-full',
                    msg.isUser ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap',
                      msg.isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border border-border text-card-foreground rounded-bl-none',
                    )}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full justify-start"
                >
                  <div className="bg-card border border-border text-card-foreground rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Analyzing content...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Options Area */}
            <div className="p-3 border-t border-border bg-background">
              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {viewState === 'options' && (
          <div className="flex flex-col items-end gap-2 mb-2">
            {options.map((opt, i) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleOptionClick(opt)}
                className="bg-card border border-border shadow-lg px-4 py-2 rounded-2xl rounded-br-none text-sm font-medium hover:bg-accent hover:scale-105 transition-all cursor-pointer"
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 cursor-pointer",
          viewState !== 'closed' ? "bg-muted text-foreground rotate-90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {viewState !== 'closed' ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </motion.button>
    </div>
  )
}
