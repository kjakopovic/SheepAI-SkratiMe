import React from 'react'
import { Category } from '../../types/'

interface TopicFilterProps {
  categories: Category[]
  selectedCategories: Category[]
  onToggleCategory: (category: Category) => void
}
export function TopicFilter({
  categories,
  selectedCategories,
  onToggleCategory,
}: TopicFilterProps) {
  return (
    <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[var(--border-subtle)] md:h-full flex-shrink-0">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Topics
          </h2>
          {selectedCategories.length > 0 && (
            <button
              onClick={() =>
                selectedCategories.forEach((cat) => onToggleCategory(cat))
              }
              className="text-xs md:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-thin">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <button
                key={category}
                onClick={() => onToggleCategory(category)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-left text-sm transition-colors whitespace-nowrap ${isSelected
                  ? 'bg-[var(--accent-blue)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
