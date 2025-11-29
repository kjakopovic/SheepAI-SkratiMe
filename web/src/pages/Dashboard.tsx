import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SimpleHeader } from '../components/ui/simple-header'
import { TopicFilter } from '../components/ui/topic-filter'
import { ArticleCard } from '../components/ui/article-card'
import { ArticleDetail } from '../components/ui/article-detail'
import { Chatbot } from '../components/ui/chatbot'
import { mockArticles, categories } from '../data/mock-data'
import { Article, Category } from '../types'
import { sortArticlesByRelevance, trackArticleClick } from '../lib/relevance-alorithm'

interface DashboardProps {
  onSettingsClick: () => void
}
// eslint-disable-next-line react/function-component-definition
export function Dashboard({ onSettingsClick }: DashboardProps) {
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showPodcastModal, setShowPodcastModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('idToken')
    if (!token) {
      navigate('/login')
    }
  }, [])

  useEffect(() => {
    const now = new Date()
    const hours = now.getHours()
    // Check if time is between 7:00 and 7:59
    if (hours === 7) {
      setShowPodcastModal(true)
    }
  }, [])

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }

  // Filter articles first
  const filteredArticles = mockArticles.filter((article) => {
    if (selectedCategories.length === 0) return true
    return article.category.some((cat) =>
      selectedCategories.includes(cat as Category),
    )
  })

  // Then sort them by relevance score
  const sortedArticles = sortArticlesByRelevance(filteredArticles)

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

        <main className="flex-1 overflow-y-auto scrollbar-thin md:mt-14">
          <div className="max-w-4xl mx-auto py-6 px-4 md:py-12 md:px-6">
            {sortedArticles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 md:p-16 text-center">
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                  No articles found
                </p>
                <p className="text-sm text-morplo-gray-500">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {sortedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => {
                      trackArticleClick(article)
                      setSelectedArticle(article)
                    }}
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

      {showPodcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPodcastModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-morplo-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Good Morning! ☀️
              </h2>
              <p className="text-gray-600 mt-2">
                Here is an overview of what happened while you were away.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4 border border-gray-100">
              <button className="w-12 h-12 bg-morplo-blue-100 hover:opacity-90 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 pl-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
              <div className="flex-1">
                <div className="h-1 bg-gray-200 rounded-full w-full mb-2">
                  <div className="h-1 bg-morplo-blue-100 rounded-full w-1/3"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>01:23</span>
                  <span>05:00</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPodcastModal(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
