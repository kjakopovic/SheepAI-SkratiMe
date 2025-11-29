import React, { useState } from 'react'
import { MessageCircleIcon, XIcon, SendIcon } from 'lucide-react'
export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--accent-blue)] hover:bg-opacity-90 transition-all flex items-center justify-center shadow-lg z-50"
        >
          <MessageCircleIcon className="w-6 h-6 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-6 md:right-6 md:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-[var(--border-subtle)]">
          <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center">
                <MessageCircleIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-[var(--text-primary)]">
                Assistant
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <XIcon className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Hi! I can help you with:
              </p>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                <li>• Finding specific articles</li>
                <li>• Updating your preferences</li>
                <li>• Explaining credibility scores</li>
                <li>• Managing your feed</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setMessage('')
                  }
                }}
              />
              <button
                onClick={() => setMessage('')}
                className="px-4 py-2 bg-[var(--accent-blue)] hover:bg-opacity-90 rounded-lg transition-colors flex items-center justify-center"
              >
                <SendIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
