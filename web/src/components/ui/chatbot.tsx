import React, { useState, useRef, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (viewState === 'chat') {
      scrollToBottom()
    }
  }, [messages, viewState])

  type Option = { id: string; label: string }

  const options: Option[] = [
    { id: 'flashpoint-10s', label: 'Flashpoint (10 sec)' },
    { id: 'executive-brief-60s', label: 'Executive brief (60 sec)' },
    { id: 'balance-check-90s', label: 'Balance check (90 sec)' },
  ]

  const handleSendMessage = (text: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newUserMsg])

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Here is the ${text} you requested. (Backend response placeholder)`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)
  }

  const handleOptionClick = (opt: Option) => {
    setViewState('chat')
    handleSendMessage(opt.label)
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

            {/* Options Area */}
            <div className="p-3 border-t border-border bg-background">
              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt)}
                    className="w-full text-left px-4 py-2 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
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
                className="bg-card border border-border shadow-lg px-4 py-2 rounded-2xl rounded-br-none text-sm font-medium hover:bg-accent hover:scale-105 transition-all"
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
          "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50",
          viewState !== 'closed' ? "bg-muted text-foreground rotate-90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {viewState !== 'closed' ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </motion.button>
    </div>
  )
}
