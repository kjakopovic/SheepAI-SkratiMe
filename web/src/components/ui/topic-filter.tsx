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
    <div className="w-64 bg-white border-r border-[var(--border-subtle)] h-full overflow-y-auto scrollbar-thin">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Topics
        </h2>

        {selectedCategories.length > 0 && (
          <button
            onClick={() =>
              selectedCategories.forEach((cat) => onToggleCategory(cat))
            }
            className="w-full mb-4 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear all
          </button>
        )}

        <div className="space-y-1">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <button
                key={category}
                onClick={() => onToggleCategory(category)}
                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${isSelected ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
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
