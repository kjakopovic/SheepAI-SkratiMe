import React from 'react'
import { SettingsIcon } from 'lucide-react'
import { motion } from 'framer-motion'
interface SimpleHeaderProps {
  onSettingsClick?: () => void
  showSettings?: boolean
}
export function SimpleHeader({
  onSettingsClick,
  showSettings = true,
}: SimpleHeaderProps) {
  return (
    <header className="bg-white border-b border-[var(--border-subtle)] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          NewsHub
        </h1>

        {showSettings && onSettingsClick && (
          <motion.button
            onClick={onSettingsClick}
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-[var(--text-secondary)]" />
          </motion.button>
        )}
      </div>
    </header>
  )
}
