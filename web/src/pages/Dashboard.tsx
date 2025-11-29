import React, { useState } from 'react'
import { LayoutGrid, LayoutList } from 'lucide-react'
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
// eslint-disable-next-line react/function-component-definition
export function Dashboard({ onSettingsClick }: DashboardProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

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
    <div className="min-h-screen bg-morplo-gray-130 flex flex-col">

      <div className='md:fixed top-0 left-0 right-0'>
        <SimpleHeader onSettingsClick={onSettingsClick} />
      </div>


      <div className="flex-1 flex flex-col md:flex-row overflow-hidden ">
        <div className='md:h-screen md:fixed top-18'>
          <TopicFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
          />
        </div>

        <main className="flex-1 overflow-y-auto scrollbar-thin md:mt-14 md:ml-72">
          <div className="w-full py-6 px-4 md:py-12 md:px-6">
            <div className="flex justify-end mb-6">
              <div className="bg-white p-1 rounded-lg border border-gray-200 flex gap-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list'
                      ? 'bg-gray-100 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="List view"
                >
                  <LayoutList size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                      ? 'bg-gray-100 text-blue-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Grid view"
                >
                  <LayoutGrid size={20} />
                </button>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 md:p-16 text-center">
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                  No articles found
                </p>
                <p className="text-sm text-morplo-gray-500">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'list'
                    ? 'space-y-4 md:space-y-6'
                    : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
                }
              >
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                    viewMode={viewMode}
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


    </div>
  )
}
