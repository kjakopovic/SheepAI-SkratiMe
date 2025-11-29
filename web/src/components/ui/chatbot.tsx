import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '../../lib/utils'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export const Chatbot = () => {
  const [viewState, setViewState] = useState<'closed' | 'options' | 'chat'>('closed')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I can help you navigate the news or answer questions about articles. What would you like to do?',
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (viewState === 'chat') {
      scrollToBottom()
    }
  }, [messages, viewState])

  const options = [
    'Explain to me like i am 5',
    'Summarize the article',
    'why is this article important',
    'Why is this article relevant?',
    'Ask me a question'
  ]

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newUserMsg])
    setInputValue('')

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I'm processing your request for: "${text}". This is a demo response.`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)
  }

  const handleOptionClick = (opt: string) => {
    setViewState('chat')
    if (opt !== 'Ask me a question') {
      handleSendMessage(opt)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
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
                    Always here to help
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
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                      msg.isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border border-border text-card-foreground rounded-bl-none',
                    )}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-background">
              <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-xl border border-border/50 focus-within:border-primary/50 focus-within:bg-muted/50 transition-all">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1 placeholder:text-muted-foreground/70"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {viewState === 'options' && (
          <div className="flex flex-col items-end gap-2 mb-2">
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleOptionClick(opt)}
                className="bg-card border border-border shadow-lg px-4 py-2 rounded-2xl rounded-br-none text-sm font-medium hover:bg-accent hover:scale-105 transition-all"
              >
                {opt}
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
          "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50",
          viewState !== 'closed' ? "bg-muted text-foreground rotate-90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {viewState !== 'closed' ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  )
}
