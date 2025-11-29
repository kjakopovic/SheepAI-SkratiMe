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
    <div className="w-64 bg-white border-r border-morplo-gray-200 h-full overflow-y-auto scrollbar-thin">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-morplo-gray-900 mb-4">
          Topics
        </h2>

        {selectedCategories.length > 0 && (
          <button
            onClick={() =>
              selectedCategories.forEach((cat) => onToggleCategory(cat))
            }
            className="w-full mb-4 px-3 py-2 text-sm text-morplo-gray-600 hover:text-morplo-gray-900 transition-colors"
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
                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${isSelected ? 'bg-morplo-blue-100 text-white' : 'text-morplo-gray-600 hover:bg-morplo-gray-130'}`}
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
