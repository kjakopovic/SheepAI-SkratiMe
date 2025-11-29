import React, { useState } from 'react'
import { SimpleHeader } from '../components/ui/simple-header'
import { TopicFilter } from '../components/ui/topic-filter'
import { ArticleCard } from '../components/ui/article-card'
import { ArticleDetail } from '../components/ui/article-detail'
import { Chatbot } from '../components/ui/chatbot'
import { mockArticles, categories } from '../data/mock-data'
import { Article, Category } from '../types'
interface DashboardProps {
  onSettingsClick: () => void
}
export function Dashboard({ onSettingsClick }: DashboardProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const handleToggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }
  const filteredArticles = mockArticles.filter((article) => {
    if (selectedCategories.length === 0) return true
    return article.category.some((cat) =>
      selectedCategories.includes(cat as Category),
    )
  })
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col">
      <SimpleHeader onSettingsClick={onSettingsClick} />

      <div className="flex-1 flex">
        <TopicFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto py-12 px-6">
            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center">
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                  No articles found
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      <Chatbot />
    </div>
  )
}
