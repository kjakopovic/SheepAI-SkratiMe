import React from 'react'
import {
  Bug,
  Fish,
  Bot,
  Database,
  ShieldAlert,
  Users,
  Cloud,
  Code,
  Lock,
  FileWarning,
  Hash,
} from 'lucide-react'
import { Category } from '../../types'
import { cn } from '../../lib/utils'

interface TopicFilterProps {
  categories: Category[]
  selectedCategories: Category[]
  onToggleCategory: (category: Category) => void
}

const categoryIcons: Record<string, React.ElementType> = {
  Malware: Bug,
  Phishing: Fish,
  'AI Agents': Bot,
  'Data Breach': Database,
  Vulnerability: ShieldAlert,
  'Social Engineering': Users,
  'Cloud Security': Cloud,
  DevSecOps: Code,
  'Zero Trust': Lock,
  Ransomware: FileWarning,
}

export const TopicFilter = ({
  categories,
  selectedCategories,
  onToggleCategory,
}: TopicFilterProps) => {
  const [activeTab, setActiveTab] = React.useState<'personal' | 'trending'>(
    'personal',
  )

  const personalTopics = categories.slice(0, Math.ceil(categories.length / 2))
  const trendingTopics = categories.slice(Math.ceil(categories.length / 2))
  const currentTopics =
    activeTab === 'personal' ? personalTopics : trendingTopics

  return (
    <div className="w-full md:w-72 bg-card/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-border md:h-screen flex-shrink-0">
      <div className="p-4 md:p-6 h-full flex flex-col">
        <div className="space-y-4 mb-6">
          <div className="flex p-1 bg-muted/50 rounded-xl w-full">
            <button
              onClick={() => setActiveTab('personal')}
              className={cn(
                'flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all',
                activeTab === 'personal'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Personal
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={cn(
                'flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all',
                activeTab === 'trending'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Trending
            </button>
          </div>

          {selectedCategories.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() =>
                  selectedCategories.forEach((cat) => onToggleCategory(cat))
                }
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 md:overflow-y-auto pb-4 md:pb-0 scrollbar-thin content-start">
          {currentTopics.map((category) => {
            const isSelected = selectedCategories.includes(category)
            const Icon = categoryIcons[category] || Hash
            return (
              <button
                key={category}
                onClick={() => onToggleCategory(category)}
                className={cn(
                  'group flex items-center justify-center px-4 py-4 rounded-lg text-xs font-medium transition-all duration-200 border border-transparent text-center h-10 md:h-24 md:flex-col md:gap-2',
                  isSelected
                    ? 'bg-blue-500 text-primary-foreground shadow-md shadow-primary/20 border-primary/10'
                    : 'bg-card hover:bg-accent hover:text-accent-foreground border-border/50 hover:border-border',
                )}
              >
                <div
                  className={cn(
                    'hidden md:block p-2 rounded-lg transition-colors',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-muted text-muted-foreground group-hover:bg-background group-hover:text-primary',
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="line-clamp-1 leading-tight text-xs ">
                  {category}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
